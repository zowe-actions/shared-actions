/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2022
 */

const core = require('@actions/core')
const actionsGithub = require('@actions/github')
const { utils, github } = require('zowe-common')
const fs = require('fs')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:workflow-remote-call-wait')
const context = actionsGithub.context

// gets inputs
var githubToken = core.getInput('github-token')
var owner = core.getInput('owner')
var repo = core.getInput('repo')
var workflowFileName = core.getInput('workflow-filename')
var branchName = core.getInput('branch-name')
var pollFrequency = core.getInput('poll-frequency')
var inputsJsonString = core.getInput('inputs-json-string') //this will be a valid json format

// mandatory checks
utils.mandatoryInputCheck(githubToken,'github-token')
utils.mandatoryInputCheck(owner,'owner')
utils.mandatoryInputCheck(repo,'repo')
utils.mandatoryInputCheck(workflowFileName,'workflow-filename')
utils.mandatoryInputCheck(branchName,'branch-name')
utils.mandatoryInputCheck(pollFrequency,'poll-frequency')

// defaults
const acceptHeader = `-H "Accept: application/vnd.github.v3+json"`
const authHeader = `-H "Authorization: Bearer ${githubToken}"`
const httpGet = `-X GET`
const httpPost = `-X POST`
const randomIDJobName= 'display-dispatch-event-id'
const randomIDStepNamePartial = 'RANDOM_DISPATCH_EVENT_ID is'

// redact from log
core.setSecret(authHeader)

// ===== main =====
var sentRandomID = sendWorkflowDispatchEvent() 
var runNumberURLArr = continouslySearchWorkflowRun(sentRandomID)
waitForJobToFinish(runNumberURLArr[1], pollFrequency)
core.setOutput('workflow-run-conclusion',run['conclusion'])
core.setOutput('workflow-run-num',runNumberURLArr[0])
// ===== main ends =====


// returns an array with [run number, url]
async function continouslySearchWorkflowRun(sentRandomID) {
    var counter = 0
    var runNumber
    var runURL
    while (runURL == '' && runNumber == '' && counter < 20) {
        await utils.sleep(5 * 1000) // sleep for 5 seconds to give enough time to have the new job show up
        var result = searchWorkflowRun(sentRandomID) // returns an array with [run number, url]
        if (result) {
            runNumber= result[0]
            runURL = result[1]
        }
        counter++
    }
    if (runURL == '' || runNumber == '') {
        console.error('Unable to find triggered workflow run, something bad likely occured on the github side.')
        console.log(`-- run number: ${runNumber}`)
        console.log(`-- runURL is ${runURL}`)
        throw new Error(`Please check why it is unable to trigger ${workflowFileName} on branch ${branchName} of ${owner}/${repo}`)
    }
    return result
}

function sendWorkflowDispatchEvent() {
    // insert a random dispatch event id into the json inputs
    var inputsJsonObject = JSON.parse(inputsJsonString)
    inputsJsonObject['RANDOM_DISPATCH_EVENT_ID'] = Math.random().toString(36).substring(2) // craft a random alphanumeric ID
    var inputsJsonStringFinal = JSON.stringify(inputsJsonObject)

    // first send workflow_dispatch event
    var cmd = new Array()
    cmd.push(`curl ${acceptHeader} ${authHeader}`)
    cmd.push(httpPost)
    cmd.push(`"https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches"`)
    cmd.push(`-d '{"ref":"${branchName}","inputs":${inputsJsonStringFinal}}'`)

    debug(cmd.join(' '))
    var out = utils.sh(cmd.join(' '))
    // this POST request does not have anything returned upon success
    if (out != '') {
        console.error(out)
        throw new Error('Workflow dispatch event POST request failed')
    }
    return inputsJsonObject['RANDOM_DISPATCH_EVENT_ID']
}

// returns an array with [run number, url]
function searchWorkflowRun(sentRandomID) {
    var cmd = new Array()
    cmd.push(`curl ${acceptHeader} ${authHeader}`)
    cmd.push(httpGet)
    cmd.push(`"https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs"`)
    cmd.push(`| jq -r ".workflow_runs[:20]"`) // only get the first 20 workflow runs returned

    debug(cmd.join(' '))
    var out = utils.sh(cmd.join(' ')) // expect a json array coming out
    var workflowRunListJsonObject = JSON.parse(out)

    // this forEach loop searches for the workflow that is triggered by this action
    // will iterate 20 times max
    workflowRunListJsonObject.forEach(function (eachWFRun) {
        debug(`Looking at ${workflowFileName} run_number: ${eachWFRun['run_number']}`)
        // When the job status is 'queued', meaning this job is still waiting for an allocation of a github VM,
        //   in this case, no job information is available.
        // Therefore, we must wait until the job status becomes either 'in_progress' or 'completed'
        //   also ignore anything that is not workflow_dispatch because apparently that is not triggered by this action
        if (eachWFRun['event'] == 'workflow_dispatch' && eachWFRun['status'] != 'queued') {
            // get the jobsURL and look at job details to search for step containing RANDOM_DISPATCH_EVENT_ID
            if (lookForMatchingRandomID(eachWFRun['jobs_url'], sentRandomID)) {
                // found the matching workflow run, now we need to save the run_number
                // also need to save the runID for later to check its completions status
                if (eachWFRun['run_number'] != '' && eachWFRun['url'] != '') { // null check
                    var result = new Array()
                    result.push(eachWFRun['run_number'])
                    result.push(eachWFRun['url'])
                    console.log(`Found the job triggered from this action, now waiting for it to be complete`)
                    console.log(`-- run number is ${runNumber}`)  
                    return result
                } 
                else {
                    throw new Error(`I can't find the run_number or the url of this run, please click ${eachWFRun['html_url']} and manually check.`)
                }
            }
        }
        else {
            debug(`Current run is triggered by ${eachWFRun['event']}`)
            debug(`Current run status is ${eachWFRun['status']}`)
            debug('Not the job we are looking for, looping...')
        }
    })
}

function lookForMatchingRandomID(jobsURL, sentRandomID) {
    var cmd = new Array()
    cmd.push(`curl ${acceptHeader} ${authHeader}`)
    cmd.push(httpGet)
    cmd.push(`"${jobsURL}"`)
    cmd.push(`| jq '.jobs'`)
    
    debug(cmd.join(' '))
    var out = utils.sh(cmd.join(' ')) // expect a json array coming out
    var jobListJsonArray = JSON.parse(out)
    jobListJsonArray.forEach(function (eachJob) {
        // in some cases, the job is not triggered by this action, so no job containing randomID will be found
        if (eachJob['name'] == randomIDJobName) {
            // now go into steps (json array) and look for the step name contains randomID
            eachJob['steps'].forEach(function (eachStep) { 
                // this loop should only run twice, as randomID step usually appears at the second
                if (eachStep['name'].includes(randomIDStepNamePartial)) {
                    // we have a hit! now parse the random ID out and compare with sent random ID
                    if (sentRandomID == eachStep['name'].split(' ').pop()) {
                        // if matched then we have found this job
                        return true
                    }
                    else {
                        debug(`Found a random ID ${eachStep['name'].split(' ').pop()} but not matched with sent random ID by this action: ${sentRandomID}`)
                        return false // there is no point to keep iterating because this step only appears once within the whole job
                    }
                }
            })
        }
    })
    return false
}

async function waitForJobToFinish(runURL, pollFrequency) {
    var pollFreqMills = Math.floor(pollFrequency)*60*1000     // convert from string to int then to milliseconds
    var status
    while (status != 'completed') {
        await utils.sleep(pollFreqMills)
        var cmd = new Array()
        cmd.push(`curl ${acceptHeader} ${authHeader}`)
        cmd.push(httpGet)
        cmd.push(`"${runURL}"`)

        debug(cmd.join(' '))
        var out = utils.sh(cmd.join(' ')) // expect a json object coming out

        var run = JSON.parse(out)
        status = run['status']
        
        if (status != 'completed') {
            console.log(`Job is not completed yet, you can also manually check at ${run['html_url']}`)
            console.log(`  waiting ${pollFrequency} mins before checking again...`)
        }
    }
}

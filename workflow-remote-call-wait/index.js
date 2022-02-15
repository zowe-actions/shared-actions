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

// ======= send dispatch POST event =========

// insert a random dispatch event id into the json inputs
var inputsJsonObject = JSON.parse(inputsJsonString)
inputsJsonObject['RANDOM_DISPATCH_EVENT_ID'] = Math.random().toString(36).substring(2) //get a random alphanumeric ID
inputsJsonStringFinal = JSON.stringify(inputsJsonObject)

// first send workflow_dispatch event
var cmdDispatchEvent = new Array()
cmdDispatchEvent.push(`curl`)
cmdDispatchEvent.push(`-H "Accept: application/vnd.github.v3+json"`)
cmdDispatchEvent.push(`-H "Authorization: Bearer ${githubToken}"`)
cmdDispatchEvent.push(`-X POST`)
cmdDispatchEvent.push(`"https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches"`)
cmdDispatchEvent.push(`-d '{"ref":"${branchName}","inputs":${inputsJsonStringFinal}}'`)

var out = utils.sh(cmdDispatchEvent.join(' '))
// this POST request does not have anything returned upon success
if (out != '') {
    console.error(out)
    throw new Error('Workflow dispatch event POST request failed')
} 

await utils.sleep(2*1000) // sleep for 2 seconds to give enough time to have the new job show up

// ====== get back a list of workflow runs ======

var cmdGetWorkflowRun = new Array()
cmdGetWorkflowRun.push(`curl`)
cmdGetWorkflowRun.push(`-H "Accept: application/vnd.github.v3+json"`)
cmdGetWorkflowRun.push(`-H "Authorization: Bearer ${githubToken}"`)
cmdGetWorkflowRun.push(`-X GET`)
cmdGetWorkflowRun.push(`"https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs"`)
cmdGetWorkflowRun.push(`| jq -r ".workflow_runs[:10]"`)  // only get the first ten workflow runs returned

var getWFRunOut = utils.sh(cmdGetWorkflowRun.join(' ')) //expect a json array coming out
var workflowRunListJsonObject = JSON.parse(getWFRunOut)
var runNumber

// this grand loop searches for the workflow that is triggered by this action
workflowRunListJsonObject.forEach(function(eachWFRun) { 
    // when the job status is 'queued', no job information is available
    // thus we must wait until the job status becomes either 'in_progress' or 'completed'
    // also ignore anything that is not workflow_dispatch because apparently that is not triggered by this action
    if (eachWFRun['event'] == 'workflow_dispatch' && eachWFRun['status'] != 'queued') {

    }
    var jobsURL = eachWFRun['jobs_url']
    var status = 
    runNumber = eachWFRun['run_number']


});


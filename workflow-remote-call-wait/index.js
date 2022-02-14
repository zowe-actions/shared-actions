/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2021
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
if (out != '') {
    console.error(out)
    throw new Error('Workflow dispatch event POST request failed')
} //this POST request does not have anything returned upon success

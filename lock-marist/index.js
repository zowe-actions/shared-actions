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
const { utils } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:lock-marist')
const fs = require('fs');

// Gets inputs
var lockID = core.getInput('lock-id')
var environment = core.getInput('environment')
var repositoryId = core.getInput('repository-id')
var githubToken = core.getInput('github-token')

utils.mandatoryInputCheck(lockID,'lock-id')
utils.mandatoryInputCheck(environment,'environment')
utils.mandatoryInputCheck(repositoryId,'repository-id')
utils.mandatoryInputCheck(githubToken,'github-token')

// main
isLockAcquired()

function isLockAcquired() {
    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-H 'Authorization: Bearer ${githubToken}'`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-X GET`)
    cmds.push(`"https://api.github.com/repositories/${repositoryId}/environments/${environment}/secrets/TEST_RUN_LOCK"`)
    var output = utils.sh(cmds.join(' '))
    var outputJson = JSON.parse(output)
    if (outputJson.message && outputJson.message == 'Not Found') {
        console.log('Lock not found')
    }
    else if (outputJson.name && outputJson.name == 'TEST_RUN_LOCK') {
        console.log('Lock found')
    }
}



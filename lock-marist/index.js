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
var maristServer = core.getInput('marist-server')
// var repositoryId = core.getInput('repository-id')
// var githubToken = core.getInput('github-token')
var whatToDo = core.getInput('what-to-do')

utils.mandatoryInputCheck(lockID,'lock-id')
utils.mandatoryInputCheck(maristServer,'marist-server')
// utils.mandatoryInputCheck(repositoryId,'repository-id')
// utils.mandatoryInputCheck(githubToken,'github-token')
utils.mandatoryInputCheck(whatToDo,'what-to-do')

if (whatToDo != 'lock' && whatToDo != 'unlock') {
    throw new Error('input "what-to-do" must be either "lock" or "unlock"')
}

// main
if (whatToDo == 'lock') {
    lock()
}
else if (whatToDo == 'unlock') {
    //TODO
}

async function lock() {
    // each test job enters here should wait for random number of seconds to avoid acquiring the first lock at the same time
}



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
const { utils, github } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:lock-marist')
const fs = require('fs');

// Gets inputs
var lockID = core.getInput('lock-id')
var maristServer = core.getInput('marist-server')
var repository = core.getInput('repository')
var githubToken = core.getInput('github-token')
var whatToDo = core.getInput('what-to-do')

utils.mandatoryInputCheck(lockID,'lock-id')
utils.mandatoryInputCheck(maristServer,'marist-server')
utils.mandatoryInputCheck(repository,'repository')
utils.mandatoryInputCheck(githubToken,'github-token')
utils.mandatoryInputCheck(whatToDo,'what-to-do')

if (whatToDo != 'lock' && whatToDo != 'unlock') {
    throw new Error('input "what-to-do" must be either "lock" or "unlock"')
}

// main
github.shallowClone(repository,`${process.env.RUNNER_TEMP}/locks`,'marist-lock')
var lockRoot = `${process.env.RUNNER_TEMP}/locks/zowe-install-packaging/marist-${maristServer}`

if (whatToDo == 'lock') {
    lock()
}
else if (whatToDo == 'unlock') {
    //TODO
    releaseLock()
}

async function lock() {
    var lockFileContent = getLockFileContent()
    var needLineUpandWait = false
    if (!lockFileContent || lockFileContent == '' || lockFileContent == lockID) {
        // why == lockID ?
        // could be possible that another job already unlocked server by modifying the LOCK file and assigned the lock to me
        // in this case, we consider lock is free.
        console.log(`${maristServer} lock is free!`)
        needLineUpandWait = tryToAcquireLock()
    }
    else {
        console.log(`${maristServer} lock is occupied, line up and wait!`)
        needLineUpandWait = true
    }

    while (needLineUpandWait) {
        //TODO  Add a queue file and commit push
        while (lockFileContent != '' && lockFileContent != lockID) {
            utils.sleep(1*60*1000)   //wait for 5 mins to check lock status
            github.fetch(lockRoot)
            github.pull(lockRoot)
            lockFileContent = getLockFileContent()
        }
        needLineUpandWait = tryToAcquireLock()
    }

    //TODO: remove queue file and commit push
}

function acquireLock() {
    console.log('It\'s my turn to acquire lock now...')
    fs.writeFileSync(`${lockRoot}/LOCK`,lockID)
    var cmds = new Array()
    cmds.push(`cd ${lockRoot}`)
    cmds.push('git add LOCK')
    cmds.push(`git commit -m "lock acquired by ${lockID}"`)
    try {
        utils.sh(cmds.join(' && '))
    }
    catch (e) {
        console.warn(e)
    }

    try {
        github.push('marist-lock',lockRoot,'zowe-marist-lock-manager',githubToken, repository)
        console.log('Acquire lock success!')
        return true
    }
    catch(e) {
        if (e) {
            if (e.stderr.toString().includes('[rejected]') || e.stderr.toString().includes('error: failed to push some refs to')) {
                console.warn('Somebody else got the lock ahead of you, I am afraid you will have to wait for a bit...')
                return false
            }
        }
    }
}

function releaseLock() {
    console.log('I am done. Release the lock now...')
    fs.writeFileSync(`${lockRoot}/LOCK`,' ')
    var cmds = new Array()
    cmds.push(`cd ${lockRoot}`)
    cmds.push('git add LOCK')
    cmds.push(`git commit -m "Lock acquired by ${lockID}"`)
    try {
        utils.sh(cmds.join(' && '))
        github.push('marist-lock',lockRoot,'zowe-marist-lock-manager',githubToken, repository)
    }
    catch (e) {
        throw e
    }
    console.log('Release lock success!')
}

function getLockFileContent() {
    if (!utils.fileExists(`${lockRoot}/LOCK`)) {
        throw new Error('Lock file not exist! Unable to acquire lock! Failing workflow...')
    }
    return fs.readFileSync(`${lockRoot}/LOCK`)
}

// returns needToLineUpandWait
function tryToAcquireLock() {
    if (acquireLock()) {
        return false
    } 
    else { //this is the result of a race condition of acquireLock() - somebody else acquired the lock ahead of you, so unfortunately you have to wait
        github.fetch(lockRoot)
        github.hardReset('origin/marist-lock',lockRoot)
        lockFileContent = getLockFileContent()
        return true
    }
}
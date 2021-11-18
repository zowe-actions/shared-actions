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
const lockRoot = `${process.env.RUNNER_TEMP}/resource-locks`
const context = actionsGithub.context

// Gets inputs
var lockRepository = core.getInput('lock-repository')
var lockBranch = core.getInput('lock-branch')
var lockResourceName = core.getInput('lock-resource-name')
var lockAvgRetryIntervalString = core.getInput('lock-avg-retry-interval')
var githubToken = core.getInput('github-token')

utils.mandatoryInputCheck(lockResourceName,'lock-resource-name')
utils.mandatoryInputCheck(lockAvgRetryIntervalString,'lock-avg-retry-interval')
utils.mandatoryInputCheck(githubToken,'github-token')
if (!lockRepository || lockRepository == '') {
    lockRepository = context.repo
}

// generate a random wait timer for each job, this is to prevent jobs are acquiring the lock at the same time to prevent racing.
var lockAvgRetryInterval = parseInt(lockAvgRetryIntervalString)
var lockRetryIntervalMax = lockAvgRetryInterval + 10
var lockRetryIntervalMin = lockAvgRetryInterval - 10
const lockRetryInterval = Math.floor(Math.random() * (lockRetryIntervalMax - lockRetryIntervalMin + 1)) + lockRetryIntervalMin

// main
if (!core.getState('isLockPost')) {
    var currentTimeInNano =  utils.sh('date +%s%N')
    var myLockJson = {}
    myLockJson.lockAcquiredTime = new Date().toString()
    myLockJson.uid = currentTimeInNano
    myLockJson.repository = context.repo
    myLockJson.branch = process.env.CURRENT_BRANCH
    myLockJson.workflow = context.workflow
    myLockJson.job = context.job
    myLockJson.actor = context.actor
    myLockJson.runId = context.runId
    myLockJson.runNumber = context.runNumber
    
    github.shallowClone(lockRepository,lockRoot,lockBranch,true)
    lock(myLockJson)
    core.saveState('isLockPost',true)
    core.exportVariable('MY_LOCK_UID',myLockJson.uid)
}
else {
    unlock()
}

async function lock(myLockJson) {
    while (!acquireLock(myLockJson)) { //return if lock is successfully acquired
        console.log(`Acquiring lock failed, wait for ${lockRetryInterval} seconds to try again`)
        await utils.sleep(lockRetryInterval*1000)
    }
    console.log('Acquired the lock successfully!')
}

async function unlock() {
    while (!releaseLock()) { } //iterate until lock is released successfully
    console.log('Released the lock successfully!')
}

function acquireLock(myLockJson) {
    console.log('Trying to acquire the lock...')
    var content = getLockFileContent()
    if (!content || content == '') { // free of lock
        console.log('Lock is free!')
        writeLockFile(myLockJson)     // only one job can successfully get the lock (by pushing changes)
    }
    //since getLockFileContent has sync() which will do a hard reset, 
    // if the content (latest) is my current job lock uid, meaning lock is successfully acquired
    return getLockFileContent().uid == myLockJson.uid
}

function releaseLock() {
    console.log('Trying to release the lock...')
    var content = getLockFileContent()
    if (content && content.uid && content.uid == process.env.MY_LOCK_UID) { // it is my lock, to prevent I unlock somebody else
        writeLockFile('')     // only one job can successfully get the lock (by pushing changes)
    }
    //since getLockFileContent has sync() which will do a hard reset, 
    // if the content (latest) is empty, meaning lock is successfully released
    return getLockFileContent() == ''
}

function getLockFileContent() {
    sync()
    if (!utils.fileExists(`${lockRoot}/${lockResourceName}`, true)) {
        throw new Error('Lock file not exist! Unable to acquire lock! Failing workflow...')
    }
    var content = fs.readFileSync(`${lockRoot}/${lockResourceName}`)
    return content != '' ? JSON.parse(content) : ''
}

function writeLockFile(lockFileContentJson) {
    console.log('Writing to lock file...')
    fs.writeFileSync(`${lockRoot}/${lockResourceName}`,JSON.stringify(lockFileContentJson, null, 2))
    var commitMessage = `Lock is ${lockFileContentJson == '' ? 'released' : 'acquired'} by ${context.actor} running ${context.workflow}/${context.job}/${context.runNumber}`
    var cmds = new Array()
    cmds.push(`cd ${lockRoot}`)
    cmds.push(`git add ${lockResourceName}`)
    cmds.push(`git commit -m "${commitMessage}"`)
    try {
        utils.sh(cmds.join(' && '))
    }
    catch (e) {
        console.warn(e)
    }

    try {
        github.push(lockBranch, lockRoot, 'dummyname', githubToken, lockRepository, true)
        console.log('Write to lock file success!')
    }
    catch(e) {
        if (e.stderr.toString().includes('[rejected]') || e.stderr.toString().includes('error: failed to push some refs to')) {
            console.warn('=======================================================')
            console.warn('Somebody wrote to the lock file ahead of you,')
            console.warn('I am afraid you will have to wait for the next interval...')
            console.warn('=======================================================')
        }
    }
}

function sync() {
    github.fetch(lockRoot, true)
    github.hardReset(`origin/${lockBranch}`,lockRoot, true)
}
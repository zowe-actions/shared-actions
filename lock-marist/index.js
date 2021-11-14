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
const sodium = require('tweetsodium');


// Gets inputs
var lockID = core.getInput('lock-id')
var environment = core.getInput('environment')
var repositoryId = core.getInput('repository-id')
var githubToken = core.getInput('github-token')

utils.mandatoryInputCheck(lockID,'lock-id')
utils.mandatoryInputCheck(environment,'environment')
utils.mandatoryInputCheck(repositoryId,'repository-id')
utils.mandatoryInputCheck(githubToken,'github-token')

const publicKeyJson = getEnvPubKey() //contains key and key_id

// main
if (!isLockAcquired()) {
    acquireLock()
}

function getEnvPubKey() {
    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-sS`)
    cmds.push(`-H "Authorization: Bearer ${githubToken}"`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-X GET`)
    cmds.push(`"https://api.github.com/repositories/${repositoryId}/environments/${environment}/secrets/public-key"`)
    var output = utils.sh(cmds.join(' '))
    var outputJson = JSON.parse(output)
    
    if (outputJson.key && outputJson.key_id) {
        return outputJson
    }
    else {
        console.log(output)
        throw new Error('something wrong with get environment public key API')
    }
}

function acquireLock() {
    // Convert the message and key to Uint8Array's (Buffer implements that interface)
    const messageBytes = Buffer.from(lockID);
    const keyBytes = Buffer.from(publicKeyJson.key, 'base64');

    // Encrypt using LibSodium.
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);

    // Base64 the encrypted secret
    const encrypted = Buffer.from(encryptedBytes).toString('base64');

    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-sS`)
    cmds.push(`-H "Authorization: Bearer ${githubToken}"`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-X PUT`)
    cmds.push(`"https://api.github.com/repositories/${repositoryId}/environments/${environment}/secrets/TEST_RUN_LOCK_${lockID}"`)
    cmds.push(`-d '{"encrypted_value":"${encrypted}","key_id":"${publicKeyJson.key_id}"}'`)
    utils.sh(cmds.join(' '))

    isLockCreatedSuccessfully()
}


function isLockAcquired() {
    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-sS`)
    cmds.push(`-H "Authorization: Bearer ${githubToken}"`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-X GET`)
    cmds.push(`"https://api.github.com/repositories/${repositoryId}/environments/${environment}/secrets"`)
    var output = utils.sh(cmds.join(' '))
    var outputJson = JSON.parse(output)
    if (outputJson.secrets) {
        var lockAcquired = false
        outputJson.secrets.forEach((eachSecret) => {
            if (eachSecret.name && eachSecret.name.includes('TEST_RUN_LOCK')) {
                console.log(`${environment} lock is acquired`)
                lockAcquired = true
            }
        })
        if (!lockAcquired) {
            console.log(`${environment} lock is free`)
        }
    }
    return lockAcquired
}

function isLockCreatedSuccessfully() {
    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-sS`)
    cmds.push(`-H "Authorization: Bearer ${githubToken}"`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-X GET`)
    cmds.push(`"https://api.github.com/repositories/${repositoryId}/environments/${environment}/secrets/TEST_RUN_LOCK_${lockID}"`)
    var output = utils.sh(cmds.join(' '))
    var outputJson = JSON.parse(output)
    if (outputJson.name && outputJson.name == `TEST_RUN_LOCK_${lockID}`) {
        console.log(`TEST_RUN_LOCK_${lockID} created successfully`)
        return true
    }
    else {
        throw new Error(`Failed to create TEST_RUN_LOCK_${lockID}`)
    }
}



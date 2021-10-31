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
const { utils , pax } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:packaging')

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const paxSSHHost = core.getInput('pax-ssh-host')
const paxSSHPort = core.getInput('pax-ssh-port')
const paxSSHUsername = core.getInput('pax-ssh-username')
const paxSSHPassword = core.getInput('pax-ssh-password')
const paxOptions = core.getInput('pax-options')
const paxCompress = core.getInput('pax-compress')
var paxLocalWorkspace = core.getInput('pax-local-workspace')
var paxRemoteWorkspace = core.getInput('pax-remote-workspace')
var paxName = core.getInput('pax-name')
const paxCompressOptions = core.getInput('pax-compress-options')
const extraFiles = core.getInput('extra-files')
const keepTempFolder = core.getInput('keep-temp-folders')
const extraEnvironmentVars = core.getMultilineInput('extra-environment-vars')

paxLocalWorkspace = `${projectRootPath}/${paxLocalWorkspace}`

core.setSecret(paxSSHUsername.toUpperCase())  //this is to prevent uppercased username to be showing in the log

if (!paxRemoteWorkspace){
    paxRemoteWorkspace = DEFAULT_REMOTE_WORKSPACE
}

// get package name from manifest file if not entered through this action
if (!paxName) {
    var manifestInfo = JSON.parse(process.env.MANIFEST_INFO)
    paxName = manifestInfo['name']
}
if (!paxName) {
    core.setFailed('Package name is not provided through shared-actions/make-pax or through manifest file')
} 
else {
    // set to default path if not passing through this action
    if (!utils.fileExists(paxLocalWorkspace)) {
        console.warn('pax local workspace path does not exist, packaging step skipped')
    } 
    else {
        // normalize pax name to only contains letters, numbers or dashes
        paxName = utils.sanitizeBranchName(paxName)
        var environmentText = ''
        if (extraEnvironmentVars && extraEnvironmentVars.length > 0) {
            extraEnvironmentVars.forEach( eachLine => {
                if (!eachLine.match(/^.+=.+$/)) {
                    throw new Error(`Environment provided ${eachLine} is not valid. Must be in the form KEY=VALUE`)
                }
                environmentText += `${eachLine} `
            })
            console.log(`Extra environments: ${environmentText}`)
        }
        // Real work starts now
        console.log(`Prepare to package ${paxName}`)
        console.log(`Creating pax file "${paxName}" from workspace...`)
        var paxNameFull = paxCompress ? `${paxName}.pax.Z` : `${paxName}.pax`

        var args = new Map()
        args.set('job',`pax-packaging-${paxName}`)
        args.set('paxSSHHost',paxSSHHost)
        args.set('paxSSHPort',paxSSHPort)
        args.set('paxSSHUsername',paxSSHUsername)
        args.set('paxSSHPassword',paxSSHPassword)
        args.set('filename',paxNameFull)
        args.set('paxOptions',paxOptions)
        args.set('extraFiles',extraFiles)
        args.set('environments',environmentText)
        args.set('compress',paxCompress)
        args.set('compressOptions',paxCompressOptions)
        args.set('keepTempFolder',keepTempFolder)
        args.set('paxLocalWorkspace',paxLocalWorkspace)
        args.set('paxRemoteWorkspace',paxRemoteWorkspace)

        pax.pack(args)

        if (utils.fileExists(`${paxLocalWorkspace}/${paxNameFull}`)) {
            console.log(`Packaging result ${paxNameFull} is in place.`)
        } 
        else {
            console.log(utils.sh(`ls -la ${paxLocalWorkspace}`))
            core.setFailed(`Failed to find packaging result ${paxNameFull}`)
        }
    }
}

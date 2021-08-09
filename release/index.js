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
const { InvalidArgumentException , utils , pax, github } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:release')
var glob = require("glob")
var fs = require('fs')

// get inputs
var githubTagPrefix = core.getInput('github-tag-prefix')
var genericBumpVersion = core.getInput('generic-bump-version')

// main
tagBranch()

// only bump version on formal release without pre-release string
if (process.env.IS_FORMAL_RELEASE_BRANCH == 'true' && process.env.PRE_RELEASE_STRING == '' && genericBumpVersion) {
    bumpVersion()
} 
else {
    console.log('No need to bump version.')
}

// send out notice
// this.sendReleaseNotice()


/* ========================================================================================================*/

/**
 * Tag branch when release.
 *
 * @Example If we are releasing {@code "1.2.3"} with pre-release string {@code "rc1"}, we will
 * creating a tag {@code "v1.2.3-rc1"}.
 */
function tagBranch() {
    var tag = `${githubTagPrefix ? githubTagPrefix + '-' : ''}v${process.env.PUBLISH_VERSION}`
    console.log(`Creating tag "${tag}" at "${process.env.GITHUB_REPOSITORY}:${process.env.CURRENT_BRANCH}`)

    github.tag(tag)
}

// Generic bumpversion function, npm or gradle bumpversion uses different techniques
function bumpVersion() {
    //TODO
}
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
const { InvalidArgumentException , utils , pax } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:publish')

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const defaultBranchesJsonText = process.env.DEFAULT_BRANCHES_JSON_TEXT
const artifacts = core.getInput('artifacts')
const performRelease = core.getInput('perform-release')
const currentBranch = core.getInput('current-branch')

var _isReleaseBranch = false
var _isFormalReleaseBranch = false
var _isPerformingRelease = `${ performRelease ? true : false }`
var defaultBranchesJsonObject = JSON.parse(defaultBranchesJsonText)

var match = false
for (var i=0; i < defaultBranchesJsonObject.length; i++) {
    var branch = defaultBranchesJsonObject[i]
    if (currentBranch === branch.name || currentBranch.match(branch.name)) {
        match = true
        if (branch.hasOwnProperty('allowRelease')) {
            _isReleaseBranch = branch.allowRelease
        }
        if (branch.hasOwnProperty('allowFormalRelease')) {
            _isFormalReleaseBranch = branch.allowFormalRelease
        }
        break;
    }
}
console.log('aaa '+_isReleaseBranch)
console.log('bbb '+_isFormalReleaseBranch)



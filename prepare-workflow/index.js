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
const debug = Debug('zowe-actions:shared-actions:prepare-workflow')
const yaml = require('js-yaml')
const fs = require('fs')

var manifest = core.getInput('manifest')
var extraInit = core.getInput('extra-init')
var projectRootPath = process.env.GITHUB_WORKSPACE
const currentBranch = process.env.CURRENT_BRANCH
var _manifestFormat
var _manifestObject
var manifestInfo

// run extra init code first
utils.sh(`echo "${extraInit}" > extra-init.js`)
debug(`extra-init.js content will be: ${console.log(utils.sh('cat extra-init.js'))}`)
console.log(utils.sh('node extra-init.js && rm extra-init.js'))

var mjson = `${projectRootPath}/manifest.json`
var myaml = `${projectRootPath}/manifest.yaml`
var myml = `${projectRootPath}/manifest.yml`

// find and check manifest file
if (manifest) {
    if (!utils.fileExists(`${projectRootPath}/${manifest}`)) {
        throw new Error(`Provided manifest file ${manifest} doesn't exist`)
    }
} else if (utils.fileExists(mjson)) {
    manifest = mjson
} else if (utils.fileExists(myaml)) {
    manifest = myaml
} else if (utils.fileExists(myml)) {
    manifest = myml
}

if (!manifest) {
    console.warn(`Can't find "${projectRootPath}/manifest.json" 
or "${projectRootPath}/manifest.yaml" 
or "${projectRootPath}/manifest.yml"
Manifest processing skipped.
`)} 
else {
    console.log(`manifest file: ${manifest}`)

    // determine manifest format
    if (manifest.endsWith('.json')) {
        _manifestFormat = 'json'
    } else if (manifest.endsWith('.yaml') || manifest.endsWith('.yml')) {
        _manifestFormat = 'yaml'
    } else {
        throw new Error(`Unknown manifest format ${manifest}`)
    }

    // read file
    if (_manifestFormat == 'json') {
        _manifestObject = JSON.parse(fs.readFileSync(manifest))
    } else if (_manifestFormat == 'yaml') {
        _manifestObject = yaml.load(fs.readFileSync(manifest))
    }

    // import information we need
    if (_manifestObject) {
        var manifestInfo = {}
        var properties = [ 'name','id','title','description','version' ]

        properties.forEach((x, i) => {
            if (_manifestObject[x]) {
                manifestInfo[x]=_manifestObject[x]
            }
        });

        if (_manifestObject['version']) {
            core.exportVariable("P_VERSION", _manifestObject['version'])
            manifestInfo['versionTrunks'] = utils.parseSemanticVersion(_manifestObject['version'])
        }
    }

    debug(JSON.stringify(manifestInfo, null, 2))
    var manifestInfoText = JSON.stringify(manifestInfo, null, 2)
    core.exportVariable("MANIFEST_INFO", manifestInfoText)
}



// determine branch information
var isReleaseBranch = false
var isFormalReleaseBranch = false
var matchedBranch = searchDefaultBranches()
if (matchedBranch) {
    if (matchedBranch.hasOwnProperty('allowRelease')) {
        isReleaseBranch = matchedBranch.allowRelease
    }
    if (matchedBranch.hasOwnProperty('allowFormalRelease')) {
        isFormalReleaseBranch = matchedBranch.allowFormalRelease
    }
}
console.log(`Current branch ${currentBranch} is release branch? ${isReleaseBranch}`)
console.log(`Current branch ${currentBranch} is formal release branch? ${isFormalReleaseBranch}`)
core.exportVariable('IS_RELEASE_BRANCH', isReleaseBranch)
core.exportVariable('IS_FORMAL_RELEASE_BRANCH', isFormalReleaseBranch)


function searchDefaultBranches() {
    var defaultBranchesJsonObject = JSON.parse(process.env.DEFAULT_BRANCHES_JSON_TEXT)
    for (var i=0; i < defaultBranchesJsonObject.length; i++) {
        var branch = defaultBranchesJsonObject[i]
        if (currentBranch === branch.name || currentBranch.match(branch.name)) {
            return branch
        }
    }
}
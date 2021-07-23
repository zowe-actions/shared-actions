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
const debug = Debug('zowe-actions:shared-actions:generic-setup')
const yaml = require('js-yaml')
const fs = require('fs')

var manifest = core.getInput('manifest')
var extraInit = core.getMultilineInput('extra-init')
var projectRootPath = process.env.GITHUB_WORKSPACE
var _manifestFormat
var _manifestObject
var packageInfo

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
    console.err('something wrong with manifest file')
}
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
    _manifestObject = JSON.parse(fs.readFileSync(manifest));
} else if (_manifestFormat == 'yaml') {
    _manifestObject = yaml.load(fs.readFileSync(manifest));
}

// import information we need
if (_manifestObject) {
    packageInfo = new Map()

    var properties = [ 'name','id','title','description','version' ]

    properties.forEach((x, i) => {
        if (_manifestObject[x]) {
            packageInfo.set(x,_manifestObject[x])
        }
    });

    if (_manifestObject['version']) {
        packageInfo.set('versionTrunks', utils.parseSemanticVersion(_manifestObject['version']))
    }
}

debug(packageInfo)
var packageInfoJsonText = JSON.stringify(Array.from(packageInfo.entries()));
core.setOutput("packageInfoJsonText", packageInfoJsonText);

// run extra init code
utils.sh(`echo "${extraInit}" > extra-init.js`)
console.log(utils.sh('node extra-init.js && rm extra-init.js'))


// read branches.json data into jsonObject and pass it around
console.log(utils.sh(`pwd`))
var branchesJsonText = fs.readFileSync('branches.json')
console.log('aaaaaaaaa'+branchesJsonText)
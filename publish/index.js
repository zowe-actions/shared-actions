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
const debug = Debug('zowe-actions:shared-actions:publish')
var glob = require("glob")
var fs = require('fs');

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE
const REPOSITORY_SNAPSHOT = 'libs-snapshot-local'
const REPOSITORY_RELEASE = 'libs-release-local'
const DEFAULT_BRANCH_RELEASE_TAG = 'snapshot'
const publishTargetVersion = '{version}{prerelease}{branchtag}{buildnumber}{timestamp}'
const defaultPublishTargetPath = '{repository}/{package}{subproject}/{version}{branchtag-uc}/'
const artifactoryUploadTargetFile = '{filename}-{publishversion}{fileext}'
const temporaryUploadSpecName = '.tmp-pipeline-publish-spec.json'

// Gets inputs
const defaultBranchesJsonText = process.env.DEFAULT_BRANCHES_JSON_TEXT
const artifacts = core.getMultilineInput('artifacts') //array form
const performRelease = core.getInput('perform-release')
const currentBranch = core.getInput('current-branch')
const preReleaseString = core.getInput('pre-release-string')
const packageInfo = JSON.parse(core.getInput('package-info-json-text'))
var publishTargetPath = core.getInput('publish-target-path')

var isReleaseBranch = false
var isFormalReleaseBranch = false
var isPerformingRelease = `${ performRelease ? true : false }`
var defaultBranchesJsonObject = JSON.parse(defaultBranchesJsonText)

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
console.log(`Are we performing a release? ${isPerformingRelease}`)

var macros = new Map()
macros = getBuildStringMacros()

if (isPerformingRelease) {
    var tag = 'v' + macros.get('publishversion')     // when doing release, macros.get('publishversion') will just return a version number 
    if (github.tagExistsRemote(tag)) {
        throw new Error(`Github tag ${tag} already exists, publish abandoned.`)
    }
}

// upload artifacts if provided
if (artifacts && artifacts.length > 0) {
    uploadArtifacts()
} else {
    console.warn ('No artifacts to publish.')
}


/* ========================================================================================================*/

/**
 * Upload artifacts.
 *
 * <p>This is a part of publish stage default behavior. If {@link PublishStageArguments#artifacts}
 * is defined, those artifacts will be uploaded to artifactory with this method.</p>
 */
function uploadArtifacts() {
    if (!publishTargetPath) {
        publishTargetPath = defaultPublishTargetPath
    }
    if (!publishTargetPath.endsWith('/')) {
        publishTargetPath += '/'
    }

    console.log(`Uploading artifacts ${artifacts} to ${publishTargetPath}`)

    var uploadSpec = JSON.parse('{"files":[]}')
    artifacts.forEach( eachArtifact => {
        console.log(`- pattern ${eachArtifact}`)
        glob(`${projectRootPath}/${eachArtifact}`, function (er, files) {
            files.forEach( file => {
                var targetFileFull = publishTargetPath + artifactoryUploadTargetFile
                extractArtifactoryUploadTargetFileMacros(file)
                var t = parseString(targetFileFull, macros)
                log.fine("- + found ${file} -> ${t}")
                uploadSpec['files'].push(`["pattern": ${file}, "target": ${t}]`)
            })
        })
    })

    console.log(`Spec of uploading artifact: ${uploadSpec}`)
    var json = JSON.stringify(uploadSpec)
    fs.writeFileSync(temporaryUploadSpecName, json)
    //artifactory.upload(temporaryUploadSpecName) ???????
}


/**
 * Return map of build string macros. Those macros will be used to parse build string.
 *
 * @param  macros        default value of macros.
 * @return               updated macro list.
 */
function getBuildStringMacros() {
    var release = isReleaseBranch && isPerformingRelease

    if (!macros.has('repository')) {
        macros.set('repository', release ? REPOSITORY_RELEASE : REPOSITORY_SNAPSHOT)
    }
    if (!macros.has('package')) {
        macros.set('package', (packageInfo['name'] ? packageInfo['name'] : '').replace('.', '/'))
    }
    if (!macros.has('subproject')) {
        macros.set('subproject', '')
    }
    if (!macros.has('version')) {
        macros.set('version', packageInfo['version'] ? packageInfo['version'] : '')
    }
    if (!macros.has('prerelease')) {
        macros.set('prerelease', release ? preReleaseString : '')
    }
    if (!macros.has('branchtag')) {
        var tag = getBranchTag()
        if (!tag) {
            tag = ''
        }
        macros.set('branchtag', release ? '' : tag)
    }
    if (!macros.has('timestamp')) {
        macros.set('timestamp', release ? '' : utils.dateTimeNow())
    }
    if (!macros.has('buildnumber')) {
        var buildNumber = process.env.JFROG_CLI_BUILD_NUMBER
        if (!buildNumber) {
            buildNumber = ''
        }
        macros.set('buildnumber', release ? '' : buildNumber)
    }

    // some mandatory field checks
    if (!macros.get('package') || !macros.get('version')) {
        throw new Error(`Package name and version must be set: package:${macros.get('package') ? macros.get('package') : '>>MISSING<<'}; version:${macros.get('version') ? macros.get('version') : '>>MISSING<<'}`)
    }

    // normalize some values
    if (macros.has('subproject') && !macros.get('subproject').startsWith('/')) {
        macros.set('subproject','/'+macros.get('subproject'))
    }
    var fields = ['prerelease', 'branchtag', 'timestamp', 'buildnumber']
    for (field in fields) {
        if (macros.get(field) && !macros.get(field).startsWith('-')) {
            macros.set(field,'-'+macros.get(field))
        }
    }

    if (!macros.has('publishversion')) {
        macros.set('publishversion', parseString(publishTargetVersion, macros))
    }

    macros.set('branchtag-uc', macros['branchtag'] ? macros['branchtag'].toUpperCase() : '')

    debug(`getBuildStringMacros macros: ${macros}`)

    return macros
}


/**
 * Parse a string using macros Map.
 *
 * <p>Macros wrap with curly brackets will be replace in the string. For example, all occurence
 * of {@code &#123;repository&#125;} in the string will be replaced with value of macro key
 * {@code repository}.</p>
 *
 * @param  str        string to parse
 * @param  macros     map of macros to replace
 * @return            parsed string
 */
function parseString(str, macros) {
    macros.forEach( (value, key) => {
        str = str.replace(`{${key}}`, value)
    })
    return str
}


/**
 * Get branch tag
 *
 * @param  branch     the branch name to check. By default, empty string will check current branch
 * @return            tag of the branch
 */
function getBranchTag(branch) {
    if (!branch) {
        branch = currentBranch
    }
    var finalTag = branch ? branch : DEFAULT_BRANCH_RELEASE_TAG
    if (branch && matchedBranch) {
        var tag = matchedBranch.releaseTag
        if (tag) { // has release tag defined
            // eg. branch=master, matchedBranch = master, tag=snapshot
            // replacedTag = 'master'.replaceAll('master','snapshot') => 'snapshot'
            // finalTag = 'snapshot'
            var replacedTag = branch.replaceAll(matchedBranch.name, tag)
            if (branch != replacedTag) { // check to see if tag is really replaced
                finalTag = replacedTag
            }
        }
    }
    return utils.sanitizeBranchName(finalTag)
}


/**
 * Extract macro of "filename" and "fileext" for artifactory upload file.
 *
 * @Note The {@code filename} and {@code fileext} extracted from the file path does not include
 * path to the file and version information.
 *
 * <p>For example, if we have a local artifact {@code "./path/to/my-artifact-1.2.3-snapshot.zip"}, then
 * the expected macros extracted are: {@code [filename: "my-artifact", fileext: "zip"]}</p>
 *
 * @param  file     original file name
 * @return          macro map (global)
 */
 function extractArtifactoryUploadTargetFileMacros(file) {
    var fileNameExt = utils.parseFileExtension(file)
    macros.set('filename', fileNameExt.get('name'))
    macros.set('fileext', fileNameExt.get('ext'))

    // Does file name looks like my-project-1.2.3-snapshot? If so, we remove the version information.
    var matches = macros.get('filename').match(/^(.+)-([0-9]+\.[0-9]+\.[0-9]+)(-[0-9a-zA-Z-+\.]+)?$/)
    if (matches && matches[0] && matches.size() == 4) {
        if (packageInfo && packageInfo['versionTrunks']) {
            var semver = `${packageInfo['versionTrunks']['major']}.${packageInfo['versionTrunks']['minor']}.${packageInfo['versionTrunks']['patch']}`
            if (matches[2] == semver) {
                // the artifact file name has version infromation
                console.log(`Version in artifact "${macros.get('filename')}" name is extracted as "${matches[1]}".`)
                macros.set('filename',matches[1])
            }
        }
    }
}


function searchDefaultBranches() {
    for (var i=0; i < defaultBranchesJsonObject.length; i++) {
        var branch = defaultBranchesJsonObject[i]
        if (currentBranch === branch.name || currentBranch.match(branch.name)) {
            return branch
        }
    }
}
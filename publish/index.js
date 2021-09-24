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
const { utils , github } = require('zowe-common')
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
const temporaryUploadSpecName = '.tmp-pipeline-publish-spec.json'
const defaultPublishTargetPathPattern = '{repository}/{package}{subproject}/{version}{branchtag-uc}/'
const defaultPublishTargetFilePattern = '{filename}-{publishversion}{fileext}'

// Gets inputs
const artifacts = core.getMultilineInput('artifacts') //array form
const performRelease = core.getInput('perform-release')
const currentBranch = process.env.CURRENT_BRANCH
const preReleaseString = core.getInput('pre-release-string')
const packageInfo = process.env.PACKAGE_INFO ? JSON.parse(process.env.PACKAGE_INFO) : ''
const manifestInfo = process.env.MANIFEST_INFO ? JSON.parse(process.env.MANIFEST_INFO) : ''
var publishTargetPathPattern = core.getInput('publish-target-path-pattern')
var publishTargetFilePattern = core.getInput('publish-target-file-pattern')

customUpload = false
if (publishTargetPathPattern != defaultPublishTargetPathPattern || publishTargetFilePattern != defaultPublishTargetFilePattern) {
    customUpload = true
}

// main
var isReleaseBranch = `${ process.env.IS_RELEASE_BRANCH == 'true' ? true : false }`
var isPerformingRelease = `${ performRelease == 'true' ? true : false }`
var notStandardProject = false
if (manifestInfo == '') {
    notStandardProject = true //meaning this project is node or gradle project exclusively, which can bypass some mandatory check later
}
var matchedBranch = utils.searchDefaultBranches()
console.log(`Are we performing a release? ${isPerformingRelease}`)

var macros = new Map()
macros = getBuildStringMacros()
debug('Macros is built as follows:')
if (process.env.DEBUG) {
    utils.printMap(macros)
}

if (isPerformingRelease) {
    var tag = 'v' + macros.get('publishversion')     // when doing release, macros.get('publishversion') will just return a version number 
    if (github.tagExistsRemote(tag)) {
        throw new Error(`Github tag ${tag} already exists, publish abandoned.`)
    }
}

// upload artifacts if provided
if (artifacts && artifacts.length > 0) {
    uploadArtifacts()
    console.log(utils.sh(`jfrog rt upload --spec ${temporaryUploadSpecName}`))
} else {
    console.warn ('No artifacts to upload to jfrog, normal publish skipped.')
}
core.exportVariable('PUBLISH_VERSION', macros.get('publishversion'))
core.exportVariable('PRE_RELEASE_STRING',preReleaseString)
/* ========================================================================================================*/

/**
 * Upload artifacts.
 *
 * <p>This is a part of publish stage default behavior. If {@link PublishStageArguments#artifacts}
 * is defined, those artifacts will be uploaded to artifactory with this method.</p>
 */
function uploadArtifacts() {
    if (!publishTargetPathPattern.endsWith('/')) {
        publishTargetPathPattern += '/'
    }

    var uploadSpec = {"files":[]}
    artifacts.forEach( eachArtifact => {
        console.log(`- pattern ${eachArtifact}`)
        var fullFilePath = `${projectRootPath}/${eachArtifact}`
        utils.fileExists(fullFilePath)
        var files = glob.sync(fullFilePath)
        files.forEach( file => {
            var targetFileFull = publishTargetPathPattern + publishTargetFilePattern
            var newMacros = extractArtifactoryUploadTargetFileMacros(file)
            debug('After extractArtifactoryUploadTargetFileMacros():')
            if (process.env.DEBUG) {
                utils.printMap(newMacros)
            }
            var mergedMacros = new Map([...macros, ...newMacros])
            var t = parseString(targetFileFull, mergedMacros)
            console.log(`- + found ${file} -> ${t}`)
            var arr = [{"pattern": file, "target": t}]
            uploadSpec['files'] = uploadSpec['files'].concat(arr)
        })
    })

    var json = JSON.stringify(uploadSpec)
    console.log(`Spec of uploading artifact: ${JSON.stringify(uploadSpec, null, 2)}`)
    fs.writeFileSync(temporaryUploadSpecName, json)
    return temporaryUploadSpecName
}


/**
 * Return map of build string macros. Those macros will be used to parse build string.
 *
 * @param  macros        default value of macros.
 * @return               updated macro list.
 */
function getBuildStringMacros() {
    var release = false
    if (isReleaseBranch == true && isPerformingRelease == true) {
        release = true
    }
    debug(`If we are doing a release? ${release}`)

    if (!macros.has('repository')) {
        if (release) {
            macros.set('repository', REPOSITORY_RELEASE)
        } else {
            macros.set('repository', REPOSITORY_SNAPSHOT)
        }
    }
    debug(`macros.repository is ${macros.get('repository')}`)
    if (!macros.has('package')) {
        var package = manifestInfo['id'] ? manifestInfo['id'] : ''
        if (package) {
            package = package.replace(/\./g,'/')
        }
        macros.set('package', package)
    }
    if (!macros.has('subproject')) {
        macros.set('subproject', '')
    }
    if (!macros.has('version')) {
        macros.set('version', packageInfo['version'] ? packageInfo['version'] : '')
    }
    if (!macros.has('prerelease')) {
        if (release) {
            macros.set('prerelease', preReleaseString)
        } else {
            macros.set('prerelease', '')
        }
    }
    if (!macros.has('branchtag')) {
        var tag = getBranchTag()
        if (!tag) {
            tag = ''
        }
        if (release) {
            macros.set('branchtag', '')
        } else {
            macros.set('branchtag', tag)
        }
    }
    if (!macros.has('timestamp')) {
        if (release) {
            macros.set('timestamp', '' )
        } else {
            macros.set('timestamp', utils.dateTimeNow())
        }
    }
    if (!macros.has('buildnumber')) {
        var buildNumber = process.env.JFROG_CLI_BUILD_NUMBER
        if (!buildNumber) {
            buildNumber = ''
        }
        if (release) {
            macros.set('buildnumber', '' )
        } else {
            macros.set('buildnumber', buildNumber)
        }
    }

    // some mandatory field checks only applicable to regular zowe projects, not custom uploads
    if (!customUpload && !notStandardProject && (!macros.get('package') || !macros.get('version'))) {
        throw new Error(`Package name and version must be set: package:${macros.get('package') ? macros.get('package') : '>>MISSING<<'}; version:${macros.get('version') ? macros.get('version') : '>>MISSING<<'}`)
    }

    // normalize some values
    if (macros.get('subproject') && !macros.get('subproject').startsWith('/')) {
        macros.set('subproject','/'+macros.get('subproject'))
    }
    var fields = ['prerelease', 'branchtag', 'timestamp', 'buildnumber']
    fields.forEach( field => {
        if (macros.get(field) && !macros.get(field).startsWith('-')) {
            macros.set(field,'-'+macros.get(field))
        }
    })

    if (!macros.has('publishversion')) {
        macros.set('publishversion', parseString(publishTargetVersion, macros))
    }

    macros.set('branchtag-uc', macros.get('branchtag') ? macros.get('branchtag').toUpperCase() : '')

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
        debug(`In getBranchTag(), tag is ${tag}`)
        if (tag) { // has release tag defined
            // eg. branch=master, matchedBranch = master, tag=snapshot
            // replacedTag = 'master'.replace('master','snapshot') => 'snapshot'
            // finalTag = 'snapshot'
            var regex = new RegExp(`${matchedBranch.name}`,'g')
            var replacedTag = branch.replace(regex, tag)
            debug(`In getBranchTag(), replacedTag is ${replacedTag}`)
            if (branch != replacedTag) { // check to see if tag is really replaced
                finalTag = replacedTag
            }
            debug(`In getBranchTag(), finalTag is ${finalTag}`)
        }
    }
    finalTag = utils.sanitizeBranchName(finalTag)
    debug(`getBranchTag() returns ${finalTag}`)
    return finalTag
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
 * @return          newMarco only contrans filename and fileext
 */
 function extractArtifactoryUploadTargetFileMacros(file) {
    var fileNameExt = utils.parseFileExtension(file)
    var newMacros = new Map()
    newMacros.set('filename', fileNameExt.get('name'))
    newMacros.set('fileext', fileNameExt.get('ext'))

    // Does file name looks like my-project-1.2.3-snapshot? If so, we remove the version information.
    var matches = newMacros.get('filename').match(/^(.+)-([0-9]+\.[0-9]+\.[0-9]+)(-[0-9a-zA-Z-+\.]+)?$/)
    if (matches && matches[0] && matches.size() == 4) {
        if (packageInfo && packageInfo['versionTrunks']) {
            var semver = `${packageInfo['versionTrunks']['major']}.${packageInfo['versionTrunks']['minor']}.${packageInfo['versionTrunks']['patch']}`
            if (matches[2] == semver) {
                // the artifact file name has version infromation
                console.log(`Version in artifact "${newMacros.get('filename')}" name is extracted as "${matches[1]}".`)
                newMacros.set('filename',matches[1])
            }
        }
    }
    return newMacros
}
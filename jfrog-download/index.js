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
const { utils , InvalidArgumentException } = require('zowe-common')
const Debug = require('debug')
const debug = Debug('zowe-actions:shared-actions:jfrog-download')
const fs = require('fs');

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE
const REPOSITORY_SNAPSHOT = 'libs-snapshot-local'
const REPOSITORY_RELEASE = 'libs-release-local'

// Gets inputs
var manifestFilePath = core.getInput('manifest-file-path')
var defaultTargetPath = core.getInput('default-target-path')
var sourcePathorPattern = core.getInput('source-path-or-pattern')
var defaultRepository = core.getInput('default-repository')
var extraOptions = core.getInput('extra-options')
var expectedCount = core.getInput('expected-count')!= '' ? parseInt(core.getInput('expected-count')) : -1


// mandatory check
if (!defaultTargetPath || defaultTargetPath == '') {
    throw new InvalidArgumentException('default-target-path')
}
if (sourcePathorPattern != '' && (!manifestFilePath || manifestFilePath == '')) {
    console.log('Simple download!')
    console.log(`Download source is ${sourcePathorPattern}, target is ${defaultTargetPath}`)
    // meaning just a simple jfrog cli command download
    simpleDownload()
}
else if (manifestFilePath != '' && (!sourcePathorPattern || sourcePathorPattern == '')) {
    console.log('Need to process manifest and generate download spec then download!')
    console.log(`Manifest file is at ${manifestFilePath}, target is ${defaultTargetPath}`)
    // meaning we need to convert manifest to download spec then download
    manifest2DownloadSpecDownload()
}
else if (manifestFilePath != '' && sourcePathorPattern != '') {
    throw new Error (```I see both sourcePathorPattern: ${sourcePathorPattern} and manifestFilePath: ${manifestFilePath} are provided.
Do you want to simply download the ${sourcePathorPattern} or you want me to process manifest? I am confused.
Please just have one of them - don't include both, then try again. Thanks!
```)
}
else { 
    throw new Error ('I see neither of sourcePathorPattern or manifestFilePath is provided. You must provide one of them, then try again.') 
}

function simpleDownload() {
    var commandString = 'jfrog rt download '
    if (extraOptions != '') {
        commandString += `\"${extraOptions}\"`
    }
    commandString += `\"${sourcePathorPattern}\"`
    commandString += `\"${defaultTargetPath}\"`
    jfrogDownload(commandString)
}


function manifest2DownloadSpecDownload() {
    var downloadSpec = {"files":[]}
    const manifestJsonObject = JSON.parse(fs.readFileSync(manifestFilePath))
    const binaryDependenciesObject = manifestJsonObject['binaryDependencies']
    // check to make sure binaryDependencies are present
    if (binaryDependenciesObject == '') {
        throw new Error (`There is no binaryDependencies present in your specified manifest file: ${manifestFilePath}, this is mandatory. Try again.`)
    }
    for (const [packageName, definitions] of Object.entries(binaryDependenciesObject)) {
        downloadSpec.files.push(processEachPackageInManifest(packageName,definitions))
    }
    var jfrogDownloadSpecJsonFilePath=`${process.env.RUNNER_TEMP}/jfrog-download-spec-${utils.dateTimeNow()}.json`
    var downloadSpecString=JSON.stringify(downloadSpec, null, 2)
    debug('================ download spec ================')
    debug(downloadSpecString)
    fs.writeFileSync(jfrogDownloadSpecJsonFilePath, downloadSpecString);
    var commandString = `jfrog rt download --spec ${jfrogDownloadSpecJsonFilePath}`
    jfrogDownload(commandString)
}


function jfrogDownload(commandString) {
    debug(`Command to execute: ${commandString}`)
    var responseInJsonText = utils.sh(commandString)
    debug('================ download response ================')
    debug(responseInJsonText)
    var responseInJsonObject = JSON.parse(responseInJsonText)
    if (responseInJsonObject) {
        validate(responseInJsonObject)
    } 
    else {
        throw new Error(`jfrog rt download no response received`)
    }
}


function validate(response) {
    var status = response.status
    var totalSuccess = response.totals.success
    var totalFailure = response.totals.failure
    if (status == '' || totalSuccess == '' || !totalFailure == '') {
        throw new Error(`jfrog rt download response changed, or something else went wrong`)
    }
    console.log(`****************************\nDownload result: ${status}\nTotal Success:   ${totalSuccess}\nTotal Failure:   ${totalFailure}\n****************************`)

    // validate download result
    if (status != 'success' || parseInt(totalFailure) > 0) {
        throw new Error('Artifact downloading has failure(s) or not successful.')
    }

    if (expectedCount > 0 && parseInt(totalSuccess) != expectedCount) {
        throw new Error(`Expected ${expectedCount} artifact(s) to be downloaded but only got ${totalSuccess}.`)
    }

    console.log('Artifact downloading is successful.')
}

function processEachPackageInManifest(packageName,definitions) {
    debug(`Processing ${packageName}:`)
    debug(definitions)

    var resultJsonObject = JSON.parse('{}')
    var packagePath = packageName.replace(/\./g, '/')
    var repository = ''

    // if package definition has target, we will use it;
    // if not, we will use the defaultTargetPath passed in
    if (definitions.hasOwnProperty('target')) {
        resultJsonObject.target = definitions.target
    } else if (defaultTargetPath != '') {
        resultJsonObject.target = defaultTargetPath
    }

    // if package definition has repository, we will use it;
    //   if not, we will use the defaultRepository passed in
    if (definitions.hasOwnProperty('repository')) {
        repository = definitions.repository
    } else if (defaultRepository != '') {
        repository = defaultRepository
    }

    if (definitions.hasOwnProperty('explode')) {
        resultJsonObject.explode = definitions.explode
    }
    if (definitions.hasOwnProperty('excludePatterns')) {
        resultJsonObject.excludePatterns = definitions.excludePatterns
    }
    // jfrog cli shows warning of deprecation:
    // [Warn] The --exclude-patterns command option and the 'excludePatterns' File Spec property are deprecated.
    //         Please use the --exclusions command option or the 'exclusions' File Spec property instead.
    //         Unlike exclude-patterns, exclusions take into account the repository as part of the pattern.
    //         For example:
    //         "excludePatterns": ["a.zip"]
    //         can be translated to
    //         "exclusions": ["repo-name/a.zip"]
    //         or
    //         "exclusions": ["*/a.zip"]
    if (definitions.hasOwnProperty('exclusions')) {
        resultJsonObject.exclusions = definitions.exclusions
    }

    // always flat
    resultJsonObject.flat = 'true'

    // now start to process pattern
    resultJsonObject.pattern = ''
    if (definitions.hasOwnProperty('artifact') && definitions.artifact.includes('/')) {
        // assume this is a full path to the artifact
        resultJsonObject.pattern = definitions.artifact
    }

    debug(`resultJsonObject (before parsing version): ${JSON.stringify(resultJsonObject, null, 2)}`)

    if (!resultJsonObject.pattern && definitions.hasOwnProperty('version')) {
        var m1 = definitions.version.match(/^~([0-9]+)\.([0-9]+)\.([0-9]+)(-.+)?$/)
        var m2 = definitions.version.match(/^\^([0-9]+)\.([0-9]+)\.([0-9]+)(-.+)?$/)
        if (m1) {
            if (!repository) {
                repository = m1[4] ? REPOSITORY_SNAPSHOT : REPOSITORY_RELEASE
            }
            resultJsonObject.pattern = `${repository}/${packagePath}/${m1[1]}.${m1[2]}.*${m1[4] ? m1[4] : ''}/`
        } else if (m2) {
            if (!repository) {
                repository = m2[4] ? REPOSITORY_SNAPSHOT : REPOSITORY_RELEASE
            }
            resultJsonObject.pattern = `${repository}/${packagePath}/${m2[1]}.*${m2[4] ? m2[4] : ''}/`
        } else {
            // parse semantic version, this may throw exception if version is invalid
            var semanticVersionMap = utils.parseSemanticVersion(definitions.version)
            if (semanticVersionMap.has('prerelease') && semanticVersionMap.get('prerelease')!= '') {
                resultJsonObject.pattern = `${repository ? repository : REPOSITORY_SNAPSHOT}/${packagePath}/${semanticVersionMap.get('major')}.${semanticVersionMap.get('minor')}.${semanticVersionMap.get('patch')}-${semanticVersionMap.get('prerelease')}/`
            }
            else {
                // this is formal release
                resultJsonObject.pattern = `${repository ? repository : REPOSITORY_RELEASE}/${packagePath}/${definitions.version}/`
            }
        }

        if (resultJsonObject.pattern) {
            if (definitions.hasOwnProperty('artifact')) {
                resultJsonObject.pattern += definitions.artifact
            } else {
                resultJsonObject.pattern += '*'
            }
        }
    }

    if (!resultJsonObject.pattern) {
        throw new InvalidArgumentException('definitions', 'Invalid artifact definitions, either artifact nor version is provided.')
    }

    if (resultJsonObject.pattern.match(/\*.*\/[^\/]+$/)) {
        // if we have * in the path, we only pick the most recent artifact
        // if we only have * in the artifact name, we may want to pick more than one
        resultJsonObject.sortBy = ["created"]
        resultJsonObject.sortOrder = "desc"
        resultJsonObject.limit = 1
    }

    debug(`resultJsonObject (after parsing version): ${JSON.stringify(resultJsonObject, null, 2)}`)

    return resultJsonObject
}
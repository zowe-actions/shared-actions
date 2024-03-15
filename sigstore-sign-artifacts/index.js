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
const path = require('path');

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const artifacts = core.getMultilineInput('artifacts') //array form
const outputDir = core.getInput('output-path')

for (const eachArtifact of artifacts) {
    const fullFilePath = `${projectRootPath}/${eachArtifact}`
    const files = glob.sync(fullFilePath)
    for (const file of files) {
        console.log(`Signing ${file} using sigstore's cosign utility.`)
        utils.sh(`cosign sign-blob ${file} --bundle ${outputDir}/${path.basename(file)}.bundle --yes`)
    }
}

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
const debug = Debug('zowe-actions:shared-actions:tech-preview-build-zlinux-docker')
var glob = require("glob")
var fs = require('fs');

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const currentBranch = process.env.CURRENT_BRANCH
const buildNumber = core.getInput('run-number')
const zowePaxJfrogUploadTarget = core.getInput('zowe-pax-jfrog-upload-target')
const buildDockerSources = core.getBooleanInput('build-docker-sources')
const dockerhubUser = core.getInput('dockerhub-user')
const dockerhubPassword = core.getInput('dockerhub-password')
const zlinuxHost = core.getInput('zlinux-host')
const zlinuxSSHKey= core.getInput('zlinux-ssh-key')
const zlinuxSSHUser= core.getInput('zlinux-ssh-user')
const zlinuxSSHPassphrase= core.getInput('zlinux-ssh-passphrase')
const zlinuxSSHPort = 22


var cmd = `mkdir -p zowe-build/${currentBranch}_${buildNumber}`
ssh(cmd)

var cmd2 = `put containers zowe-build/${currentBranch}_${buildNumber}`
sftp(cmd2)

var cmd3 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
wget "https://zowe.jfrog.io/zowe/${zowePaxJfrogUploadTarget}" -O zowe.pax
mkdir -p utils && cp -r ../utils/* ./utils
chmod +x ./utils/*.sh ./utils/*/bin/*
sudo docker login -u \"${dockerhubUser}\" -p \"${dockerhubPassword}\"
sudo docker build -t ompzowe/server-bundle:s390x .
sudo docker save -o server-bundle.s390x.tar ompzowe/server-bundle:s390x`
ssh(cmd3)

if (buildDockerSources) {
    var cmd4 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
sudo docker build -f Dockerfile.sources --build-arg BUILD_PLATFORM=s390x -t ompzowe/server-bundle:s390x-sources .
sudo docker save -o server-bundle.s390x-sources.tar ompzowe/server-bundle:s390x-sources`
    ssh(cmd4)
}

var cmd5 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
sudo chmod 777 *
echo ">>>>>>>>>>>>>>>>>> docker tar: " && pwd && ls -ltr server-bundle.*`
ssh(cmd5)

if (buildDockerSources) {
    var cmd6 = `get zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle/server-bundle.s390x.tar server-bundle.s390x.tar`
    sftp(cmd6)   
}

var cmd7 = `rm -rf zowe-build/${currentBranch}_${buildNumber}
sudo docker system prune -f`
ssh(cmd7)


function ssh(cmd) {
    utils.sshKeyFile(zlinuxHost, zlinuxSSHPort, zlinuxSSHUser, zlinuxSSHPassphrase, zlinuxSSHKey, cmd)
}

function sftp(cmd) {
    utils.sftpKeyFile(zlinuxHost, zlinuxSSHPort, zlinuxSSHUser, zlinuxSSHPassphrase, zlinuxSSHKey, cmd)
}
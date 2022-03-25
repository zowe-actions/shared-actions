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
const { utils, InvalidArgumentException } = require('zowe-common')

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const currentBranch = process.env.CURRENT_BRANCH
const buildNumber = core.getInput('run-number')
const buildDockerSources = core.getInput('build-docker-sources') == 'true' ? true : false
const dockerhubUser = core.getInput('dockerhub-user')
const dockerhubPassword = core.getInput('dockerhub-password')
const zlinuxSSHServer = core.getInput('zlinux-ssh-server')
const zlinuxSSHKeyPassphrase= core.getInput('zlinux-ssh-key-passphrase')

// null check
utils.mandatoryInputCheck(buildNumber, 'run-number')
utils.mandatoryInputCheck(dockerhubUser, 'dockerhub-user')
utils.mandatoryInputCheck(dockerhubPassword, 'dockerhub-password')
utils.mandatoryInputCheck(zlinuxSSHServer, 'zlinux-ssh-server')
utils.mandatoryInputCheck(zlinuxSSHKeyPassphrase, 'zlinux-ssh-key-passphrase')

// main
printLogDivider(`make directory of zowe-build/${currentBranch}_${buildNumber}`)
var cmd = `mkdir -p zowe-build/${currentBranch}_${buildNumber}`
ssh(cmd)

printLogDivider(`send relevant files - from: ${projectRootPath}/containers - to:zowe-build/${currentBranch}_${buildNumber}`)
var cmd2 = `put -r ${projectRootPath}/containers zowe-build/${currentBranch}_${buildNumber}`
sftp(cmd2)

printLogDivider(`docker build server-bundle.s390x.tar`)
var cmd3 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
cp ${projectRootPath}/.pax/zowe.pax zowe.pax
mkdir -p utils && cp -r ../utils/* ./utils
chmod +x ./utils/*.sh ./utils/*/bin/*
sudo docker login -u \"${dockerhubUser}\" -p \"${dockerhubPassword}\"
sudo docker build -t ompzowe/server-bundle:s390x .
sudo docker save -o server-bundle.s390x.tar ompzowe/server-bundle:s390x`
ssh(cmd3)

if (buildDockerSources) {
    printLogDivider(`docker build server-bundle.s390x-sources.tar`)
    var cmd4 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
sudo docker build -f Dockerfile.sources --build-arg BUILD_PLATFORM=s390x -t ompzowe/server-bundle:s390x-sources .
sudo docker save -o server-bundle.s390x-sources.tar ompzowe/server-bundle:s390x-sources`
    ssh(cmd4)
}

printLogDivider(`ls stuff matching server-bundle`)
var cmd5 = `cd zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle
sudo chmod 777 *
echo ">>>>>>>>>>>>>>>>>> docker tar: " && pwd && ls -ltr server-bundle.*`
ssh(cmd5)

printLogDivider(`Get server-bundle.s390x.tar back`)
var cmd6 = `get zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle/server-bundle.s390x.tar ${projectRootPath}/server-bundle.s390x.tar`
sftp(cmd6)

if (buildDockerSources) {
    printLogDivider(`Get server-bundle.s390x-sources.tar back`)
    var cmd7 = `get zowe-build/${currentBranch}_${buildNumber}/containers/server-bundle/server-bundle.s390x-sources.tar ${projectRootPath}/server-bundle.sources.s390x.tar`
    sftp(cmd7)   
}

printLogDivider(`Docker system cleanup`)
var cmd8 = `rm -rf zowe-build/${currentBranch}_${buildNumber}
sudo docker system prune -f`
ssh(cmd8)



function ssh(cmd) {
    utils.sshKeyFile(zlinuxSSHServer, zlinuxSSHKeyPassphrase, cmd)
}

function sftp(cmd) {
    utils.sftpKeyFile(zlinuxSSHServer, zlinuxSSHKeyPassphrase, cmd)
}
function printLogDivider(msg) {
    console.log(`

********************************************
${msg}
********************************************


`)
}
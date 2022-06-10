/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 334:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 756:
/***/ ((module) => {

module.exports = eval("require")("debug");


/***/ }),

/***/ 476:
/***/ ((module) => {

module.exports = eval("require")("zowe-common");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2021
 */

const core = __nccwpck_require__(334)
const { utils , pax } = __nccwpck_require__(476)
const Debug = __nccwpck_require__(756)
const debug = Debug('zowe-actions:shared-actions:packaging')

// Defaults
const projectRootPath = process.env.GITHUB_WORKSPACE

// Gets inputs
const paxSSHHost = core.getInput('pax-ssh-host')
const paxSSHPort = core.getInput('pax-ssh-port')
const paxSSHUsername = core.getInput('pax-ssh-username')
const paxSSHPassword = core.getInput('pax-ssh-password')
const paxOptions = core.getInput('pax-options')
const paxCompress = core.getBooleanInput('pax-compress')
var paxLocalWorkspace = core.getInput('pax-local-workspace')
var paxRemoteWorkspace = core.getInput('pax-remote-workspace')
var paxName = core.getInput('pax-name')
const paxCompressOptions = core.getInput('pax-compress-options')
const extraFiles = core.getInput('extra-files')
const keepTempFolder = core.getInput('keep-temp-folders') == 'true' ? true : false
const extraEnvironmentVars = core.getMultilineInput('extra-environment-vars')

paxLocalWorkspace = `${projectRootPath}/${paxLocalWorkspace}`

// null check
utils.mandatoryInputCheck(paxSSHUsername, 'pax-ssh-username')
utils.mandatoryInputCheck(paxSSHPassword, 'pax-ssh-password')

core.setSecret(paxSSHUsername.toUpperCase())  //this is to prevent uppercased username to be showing in the log

var environmentText = ''
if (extraEnvironmentVars && extraEnvironmentVars.length > 0) {
    extraEnvironmentVars.forEach( eachLine => {
        if (!eachLine.match(/^.+=.*$/)) {
            throw new Error(`Environment provided ${eachLine} is not valid. Must be in the form KEY=VALUE`)
        }
        environmentText += `${eachLine} `
    })
    console.log(`Extra environments: ${environmentText}`)
}

if (!core.getState('isMakePaxPost')) {

    // get package name from manifest file if not entered through this action
    if (!paxName) {
        var manifestInfo = JSON.parse(process.env.MANIFEST_INFO)
        paxName = manifestInfo['name']
    }
    if (!paxName) {
        core.setFailed('Package name is not provided through shared-actions/make-pax or through manifest file')
    } 
    else {
        // set to default path if not passing through this action
        if (!utils.fileExists(paxLocalWorkspace)) {
            console.warn('pax local workspace path does not exist, packaging step skipped')
        } 
        else {
            // normalize pax name to only contains letters, numbers or dashes
            paxName = utils.sanitizeBranchName(paxName)
            
            // Real work starts now
            console.log(`Prepare to package ${paxName}`)
            console.log(`Creating pax file "${paxName}" from workspace...`)
            var paxNameFull = paxCompress ? `${paxName}.pax.Z` : `${paxName}.pax`

            var args = new Map()
            
            args.set('job',`pax-packaging-${paxName}`)
            args.set('paxSSHHost',paxSSHHost)
            args.set('paxSSHPort',paxSSHPort)
            args.set('paxSSHUsername',paxSSHUsername)
            args.set('paxSSHPassword',paxSSHPassword)
            args.set('filename',paxNameFull)
            args.set('paxOptions',paxOptions)
            args.set('extraFiles',extraFiles)
            args.set('environments',environmentText)
            args.set('compress',paxCompress)
            args.set('compressOptions',paxCompressOptions)
            args.set('keepTempFolder',keepTempFolder)
            args.set('paxLocalWorkspace',paxLocalWorkspace)
            args.set('paxRemoteWorkspace',paxRemoteWorkspace)

            var processUid = `${args.get('job')}-${Date.now()}`
            args.set('processUid',processUid)
            
            core.saveState('isMakePaxPost', true)
            core.exportVariable('PAX_REMOTE_PATH_FULL',`${paxRemoteWorkspace}/${processUid}`)
            
            pax.pack(args)

            if (utils.fileExists(`${paxLocalWorkspace}/${paxNameFull}`)) {
                console.log(`Packaging result ${paxNameFull} is in place.`)
            } 
            else {
                console.log(utils.sh(`ls -la ${paxLocalWorkspace}`))
                core.setFailed(`Failed to find packaging result ${paxNameFull}`)
            }
        }
    }
}
else {
    //remote pax workspace cleanup
    var remoteWorkspaceFullPath = process.env.PAX_REMOTE_PATH_FULL
    var args = new Map()
    args.set('paxSSHHost',paxSSHHost)
    args.set('paxSSHPort',paxSSHPort)
    args.set('paxSSHUsername',paxSSHUsername)
    args.set('paxSSHPassword',paxSSHPassword)
    args.set('remoteWorkspaceFullPath',remoteWorkspaceFullPath)
    args.set('keepTempFolder',keepTempFolder)
    args.set('environments',environmentText)
    pax.paxCleanup(args)
}

})();

module.exports = __webpack_exports__;
/******/ })()
;
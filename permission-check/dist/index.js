/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 806:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 946:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 726:
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

const core = __nccwpck_require__(806)
const github = __nccwpck_require__(946)
const { utils } = __nccwpck_require__(726)

var context = github.context
var repo = context.repo.owner + '/' + context.repo.repo
var g_token = core.getInput('github-token')

utils.mandatoryInputCheck(g_token,'github-token')

if (context.actor == 'dependabot[bot]'){
    console.log(`${context.actor} is running this workflow now, manually approved - Bypassing permission check`)
}
else {
    var cmds = new Array()
    cmds.push(`curl`)
    cmds.push(`-H "Accept: application/vnd.github.v3+json"`)
    cmds.push(`-H "Authorization: Bearer ${g_token}"`)
    cmds.push(`-X GET`)
    cmds.push(`"https://api.github.com/repos/${repo}/collaborators/${context.actor}/permission"`)
    cmds.push(`| jq -r .permission`)
    var returnedPermission = utils.sh(cmds.join(' '))
    console.log(`Returned permission is ${returnedPermission}`)
    if (!returnedPermission || (returnedPermission != 'admin' && returnedPermission != 'write' && returnedPermission != 'maintain')) {
        core.setFailed(`Permission check failure, user ${context.actor} is not authorized to run workflow on ${repo}, permission is ${returnedPermission}`)
    }
    core.setOutput('user-permission', returnedPermission)
}
})();

module.exports = __webpack_exports__;
/******/ })()
;
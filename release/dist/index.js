/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 334:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 232:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


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
const actionsGithub = __nccwpck_require__(232)
const { github } = __nccwpck_require__(476)
const Debug = __nccwpck_require__(756)
const debug = Debug('zowe-actions:shared-actions:release')

// get inputs
var githubTagPrefix = core.getInput('github-tag-prefix')
var genericBumpVersion = core.getBooleanInput('generic-bump-version')

// main
tagBranch()

// only bump version on formal release without pre-release string
if (process.env.IS_FORMAL_RELEASE_BRANCH == 'true' && process.env.PRE_RELEASE_STRING == '') {
    if (genericBumpVersion) {
        bumpVersion()
    } else {
        console.log('Generic version bump skipped, it will be performed later in project specific version bump code')
    }
} 
else {
    console.log('No need to bump version.')
    core.exportVariable("NO_NEED_BUMP_VERSION", true)
}

// send out notice
// this.sendReleaseNotice()


/* ========================================================================================================*/

/**
 * Tag branch when release.
 *
 * @Example If we are releasing {@code "1.2.3"} with pre-release string {@code "rc1"}, we will
 * creating a tag {@code "v1.2.3-rc1"}.
 */
function tagBranch() {
    var tag = `${githubTagPrefix ? githubTagPrefix + '-' : ''}v${process.env.P_VERSION}${process.env.PRE_RELEASE_STRING != '' ? '-' + process.env.PRE_RELEASE_STRING : '' }`
    var repo = actionsGithub.context.repo.owner + '/' + actionsGithub.context.repo.repo
    console.log(`Creating tag "${tag}" at "${repo}:${process.env.CURRENT_BRANCH}`)

    github.tag(tag)
}

// Generic bumpversion function, npm or gradle bumpversion uses different techniques
function bumpVersion() {
    //TODO
}
})();

module.exports = __webpack_exports__;
/******/ })()
;
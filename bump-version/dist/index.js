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
const core = __nccwpck_require__(334)
const actionsGithub = __nccwpck_require__(232)
const { github, utils } = __nccwpck_require__(476)
const Debug = __nccwpck_require__(756)
const debug = Debug('zowe-actions:shared-actions:bump-version')
var noNeedBumpVersion = core.getInput('NO_NEED_BUMP_VERSION') ? true : false
if (noNeedBumpVersion) {
    // do nothing, skip this action
    console.warn(```You may have accidentally triggered this bump-version action. 
According to the result from shared-actions/release, conditions are not satisfied to bump version.
Condition to run bump-version are IS_FORMAL_RELEASE_BRANCH == 'true' AND PRE_RELEASE_STRING == ''
Thus, skip this action run.
```)
} 
else {
    var branch = process.env.CURRENT_BRANCH
    var repo = actionsGithub.context.repo.owner + '/' + actionsGithub.context.repo.repo
    var baseDirectory = core.getInput('base-directory')
    var version = core.getInput('version')
    if (version == '') {
        version = 'PATCH'
    }

    // get temp folder for cloning
    var tempFolder = `${process.env.RUNNER_TEMP}/.tmp-npm-registry-${utils.dateTimeNow()}`

    console.log(`Cloning ${branch} into ${tempFolder} ...`)
    // clone to temp folder
    github.clone(repo,tempFolder,branch)

    // run npm version
    console.log(`Making a "${version}" version bump ...`)

    var newVersion
    var workdir = tempFolder;
    if (baseDirectory != '' && baseDirectory != '.') {
        workdir += `/${baseDirectory}`
    }
    if (utils.fileExists(workdir + '/manifest.yaml')) {
        newVersion = utils.bumpManifestVersion(workdir + '/manifest.yaml', version)
    } else if (utils.fileExists(workdir + '/manifest.yml')) {
        newVersion = utils.bumpManifestVersion(workdir + '/manifest.yml', version)
    } else if (utils.fileExists(workdir + '/manifest.json')) {
        throw new Error('Bump version on manifest.json is not supported yet.')
    } else {
        throw new Error('No manifest found.')
    }
    res = github.add(tempFolder, '.')
    console.log('git add', res)
    res = github.commit(newVersion)
    console.log('git commit', res)
    if (res.includes('Git working directory not clean.')) {
        throw new Error('Working directory is not clean')
    } else if (!res.match(/^v[0-9]+\.[0-9]+\.[0-9]+$/)) {
        throw new Error(`Bump version failed: ${res}`)
    }

    utils.sh('git status', {cwd: tempFolder});
    throw new Error('Pause');

    console.log(utils.sh(`cd ${tempFolder} && git rebase HEAD~1 --signoff`))

    // push version changes
    console.log(`Pushing ${branch} to remote ...`)
    github.push(branch, tempFolder, actionsGithub.context.actor, process.env.GITHUB_TOKEN, repo)
    if (!github.isSync(branch, tempFolder)) {
        throw new Error('Branch is not synced with remote after npm version.')
    }

    // No need to clean up tempFolder, Github VM will get disposed
}
})();

module.exports = __webpack_exports__;
/******/ })()
;
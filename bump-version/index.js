const core = require('@actions/core')
const actionsGithub = require('@actions/github')
const { github, utils } = require('zowe-common')
const Debug = require('debug')
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
    var res
    var workdir = tempFolder;
    if (baseDirectory != '' && baseDirectory != '.') {
        workdir += `/${baseDirectory}`
    }
    var manifest
    if (utils.fileExists(workdir + '/manifest.yaml')) {
        manifest = 'manifest.yaml'
    } else if (utils.fileExists(workdir + '/manifest.yml')) {
        manifest = 'manifest.yml'
    } else if (utils.fileExists(workdir + '/manifest.json')) {
        throw new Error('Bump version on manifest.json is not supported yet.')
    } else {
        throw new Error('No manifest found.')
    }
    newVersion = utils.bumpManifestVersion(`${workdir}/${manifest}`, version)
    console.log('New version:', newVersion)
    github._cmd(tempFolder, 'status');
    github._cmd(tempFolder, 'diff');
    github.add(workdir, 'manifest.yaml')

    res = github.commit(tempFolder, newVersion)

    if (res.includes('Git working directory not clean.')) {
        throw new Error('Working directory is not clean')
    } else if (!newVersion.match(/^v[0-9]+\.[0-9]+\.[0-9]+$/)) {
        throw new Error(`Bump version failed: ${newVersion}`)
    }

    // push version changes
    console.log(`Pushing ${branch} to remote ...`)
    github.push(branch, tempFolder, actionsGithub.context.actor, process.env.GITHUB_TOKEN, repo)
    if (!github.isSync(branch, tempFolder)) {
        throw new Error('Branch is not synced with remote after npm version.')
    }

    // No need to clean up tempFolder, Github VM will get disposed
}
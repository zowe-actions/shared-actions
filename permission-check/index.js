import core from '@actions/core';
import * as utils from '../common/utils.js';
var debug = false

var user = core.getInput('user')
var repo = core.getInput('github_repo')
var g_user = core.getInput('github_user')
var g_passwd = core.getInput('github_passwd')

var cmds = new Array()
cmds.push('curl -u')
cmds.push('"'+g_user+':'+g_passwd+'"')
cmds.push('-sS')
cmds.push('-H \"Accept: application/vnd.github.v3+json\"')
cmds.push('-X GET')
cmds.push('\"https://api.github.com/repos/'+repo+'/collaborators/'+user+'/permission\"')
cmds.push('| jq -r .permission')
var returnedPermission = utils.sh(cmds.join(' '), debug)
returnedPermission = returnedPermission.toString().trim()

if (!returnedPermission || (returnedPermission != 'admin' && returnedPermission != 'write' && returnedPermission != 'maintain')) {
    core.setFailed('Permission check failure, user '+user+' is not authorized to run workflow')
}
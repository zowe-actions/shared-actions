import core from '@actions/core'
import * as utils from '../common/utils.js';
import yaml from 'js-yaml'
import fs from 'fs'

var debug = false
var manifest = core.getInput('manifest')
var projectRootPath = process.env.GITHUB_WORKSPACE + '/'
var _manifestFormat
var _manifestObject
var packageInfo

//TODO: defineDefaultBranches()

// Manifest processing
readPackageManifest()

function readPackageManifest() {
    // find and check manifest file
    if (manifest) {
        if (!utils.fileExists(projectRootPath+manifest)) {
            throw new Error('Provided manifest file '+manifest+' doesn\'t exist')
        }
    } else if (utils.fileExists(projectRootPath+'manifest.json')) {
        manifest = projectRootPath+'manifest.json'
    } else if (utils.fileExists(projectRootPath+'manifest.yaml')) {
        manifest = projectRootPath+'manifest.yaml'
    } else if (utils.fileExists(projectRootPath+'manifest.yml')) {
        manifest = projectRootPath+'manifest.yml'
    }

    if (!manifest) {
        return
    }
    console.log('manifest file: '+manifest)

    // determine manifest format
    if (manifest.endsWith('.json')) {
        _manifestFormat = 'json'
    } else if (manifest.endsWith('.yaml') || manifest.endsWith('.yml')) {
        _manifestFormat = 'yaml'
    } else {
        throw new Error('Unknown manifest format '+manifest)
    }

    // read file
    if (_manifestFormat == 'json') {
        _manifestObject = JSON.parse(fs.readFileSync(manifest));
    } else if (_manifestFormat == 'yaml') {
        _manifestObject = yaml.load(fs.readFileSync(manifest));
    }

    // import information we need
    if (_manifestObject) {
        packageInfo = new Map()

        var properties = [ 'name','id','title','description','version' ]

        properties.forEach((x, i) => {
            if (_manifestObject[x]) {
                packageInfo.set(x,_manifestObject[x])
            }
        });

        if (_manifestObject['version']) {
            packageInfo.set('versionTrunks', utils.parseSemanticVersion(_manifestObject['version']))
        }
    }
}
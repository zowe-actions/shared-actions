const core = require('@actions/core');
const fs = require('fs');
const YAML = require('js-yaml');
const _ = require('lodash');
const {github} = require('zowe-common');

const targetFile = core.getInput('target-file');
const createIfMissing = core.getInput('create-if-missing');
const metadataFormat = core.getInput('metadata-format').toUpperCase();

if (!fs.existsSync(targetFile)) { 
    if (createIfMissing === 'true') {
        fs.writeFileSync(targetFile, '');
    } else {
        core.setFailed(`Target file '${targetFile}' does not exist and 'create-if-missing' is false.`);
        process.exit();
    }
}

const commitHash = github._cmd(process.cwd(), 'rev-parse HEAD');
const currentBranch = github._cmd(process.cwd(), 'rev-parse --abbrev-ref HEAD');
const timestamp = Date.now();


const buildInfo = {
    'build': {
        'branch': currentBranch,
        'timestamp': timestamp,
        'commit': commitHash, 
    }
}

const fileContent = fs.readFileSync(targetFile, 'utf8');
// this reads both YAML and JSON content
let parsedContent = YAML.load(fileContent);
if (parsedContent == null) {
    parsedContent = {};
}
if (metadataFormat === 'YAML') {
    _.merge(parsedContent, buildInfo);
    fs.writeFileSync(targetFile, YAML.dump(parsedContent));

} else if (metadataFormat === 'JSON') {
    _.merge(parsedContent, buildInfo);
    fs.writeFileSync(targetFile, JSON.stringify(parsedContent, null, 2));
} else {
    core.setFailed(`Invalid metadata format. Supported formats are 'JSON' and 'YAML'.`);
}


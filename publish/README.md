# Publishing Zowe projects

This action does publishing step for Zowe projects.\
It determines if current branch is a release branch, or formal release branch, then based on if current workflow is doing a 'PERFORM RELEASE', make decisions and finally produce a JSON file (in root project directory) that contains upload specs for jFrog Artifactory. \
Later steps in your workflow can use this JSON file for jFrog to consume that does the upload.
#### Note:
The properties of a branch (eg. if it is a release branch or formal release branch) can be found at [defaultBranches.json](https://github.com/zowe-actions/shared-actions/blob/main/envvars-global/defaultBranches.json)
<br />

## Inputs

#### `artifacts`
**Required** - Artifacts to be sent over jFrog Artifactory. Can have multiple line inputs here.
#### `perform-release`
**Required** - The flag to indicate if doing performing release
#### `pre-release-string`
**Optional** - pre-release string
#### `publish-target-path`
**Optional** - Artifact publishing file pattern. Default `{repository}/{package}{subproject}/{version}{branchtag-uc}/`
<br /><br />

## Outputs
None
<br /><br />

## Exported environment variables 
#### `JFROG_UPLOAD_SPEC_JSON`
The filename of jfrog upload spec json file. It is designed to be placed under project root directory.\
Note: If there is no artifacts to upload, value of this environment variable will be empty.
#### `PUBLISH_VERSION`
The version pattern of the artifact on Artifactory. Will follow this pattern `{version}{prerelease}{branchtag}{buildnumber}{timestamp}`\
Example: `PUBLISH_VERSION: 1.0.2-my-dev-branch-210-20210810194022`
#### `IS_RELEASE_BRANCH`
Flag to indicate if current branch is a release branch, value will be either `true` or `false`.\
#### `IS_FORMAL_RELEASE_BRANCH`
Flag to indicate if current branch is a formal release branch, value will be either `true` or `false`.
#### `PRE_RELEASE_STRING`
This will be the same as input `pre-release-string`. If pre-release string input is not provided, value here will be empty.
<br /><br />

## Example usage
(this is a minimal set of inputs you need to provide)
```
uses: zowe-actions/shared-actions/publish@main
with:
  artifacts: path/to/artifact
  perform-release: false
```
To have multiline input for artifacts:
```
with:
  artifacts: |
    path/to/artifact1
    path/to/artifact2
```
To enable debug mode, append
```
env:
  DEBUG: 'zowe-actions:shared-actions:publish'
```

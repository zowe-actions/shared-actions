# Publishing Zowe projects

This action does publishing step for Zowe projects.\
Based on if current branch is a release branch, or formal release branch, if current workflow is doing a 'PERFORM RELEASE', this action make decisions and finally produce a JSON file (in root project directory) that contains upload specs for jFrog Artifactory. \
Then utilize this newly created JSON file for jFrog to consume, finally does uploading.
<br />

## Inputs
#### `artifacts`
**Optional** - Artifacts to be sent over jFrog Artifactory. Can have multiple line inputs here.
#### `perform-release`
**Optional** - The flag to indicate if doing performing release
#### `pre-release-string`
**Optional** - pre-release string
#### `publish-target-path`
**Optional** - Artifact publishing file pattern. Default `{repository}/{package}{subproject}/{version}{branchtag-uc}/`
<br /><br />

## Outputs
None
<br /><br />

## Exported environment variables 
#### `PUBLISH_VERSION`
The version pattern of the artifact on Artifactory. Will follow this pattern `{version}{prerelease}{branchtag}{buildnumber}{timestamp}`\
Example: `PUBLISH_VERSION: 1.0.2-my-dev-branch-210-20210810194022`
#### `PRE_RELEASE_STRING`
This will be the same as input `pre-release-string`. If pre-release string input is not provided, value here will be empty.
<br /><br />

## Example usage
(this is a minimal set of inputs you need to provide)
```
uses: zowe-actions/shared-actions/publish@main
with:
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

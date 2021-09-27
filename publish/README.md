# Publishing Zowe projects

This action does publishing step for Zowe projects.  

Based on if current branch is a release branch, or formal release branch, and if current workflow is doing a 'PERFORM RELEASE', this action makes decisions and finally produce a JSON file (in root project directory) that contains upload specs for jFrog Artifactory.  

Then utilize this newly created JSON file for jFrog to consume, finally does uploading. Also supports upload customization to zowe artifactory.
<br />

## Inputs

### `artifacts`

**Optional** - Artifacts to be sent over jFrog Artifactory. Can have multiple line inputs here (see example below). If you don't provide any artifacts, uploading to artifactory will be skipped.

### `perform-release`

**Required** - The flag to indicate if doing performing release.

### `pre-release-string`

**Optional** - pre-release string

### `publish-target-path-pattern`

**Optional** - Artifact publishing file pattern. Default `{repository}/{package}{subproject}/{version}{branchtag-uc}/`. This parameter can be customized to any format

### `publish-target-file-pattern`

**Optional** - Format for the file name published to artifactory. Default format for zowe artifacts: `{filename}-{publishversion}{fileext}`. This parameter can be customized to any format
<br /><br />

## Outputs

None
<br /><br />

## Exported environment variables

### `PUBLISH_VERSION`

The version pattern of the artifact on Artifactory. Will follow this pattern `{version}{prerelease}{branchtag}{buildnumber}{timestamp}`\
Example: `PUBLISH_VERSION: 1.0.2-my-dev-branch-210-20210810194022`

### `PRE_RELEASE_STRING`

This will be the same as input `pre-release-string`. If pre-release string input is not provided, value here will be empty.
<br /><br />

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/publish@main
```

To have multiline input for artifacts:

```yaml
with:
  artifacts: |
    path/to/artifact1
    path/to/artifact2
```

You can also customize artifactory upload target path and file, as an example:

```yaml
uses: zowe-actions/shared-actions/publish@main
  with:
    artifacts: |
      path/to/file1
      path/to/file2.json
      another/path/file3.txt
    publish-target-path-pattern: 'com/example/my/dir/'
    publish-target-file-pattern: '{filename}{fileext}'
```

To enable debug mode, append

```yaml
env:
  DEBUG: 'zowe-actions:shared-actions:publish'
```

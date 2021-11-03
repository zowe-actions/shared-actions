# Publishing Zowe projects

This action does publishing step for Zowe projects.  

Based on if current branch is a release branch, or formal release branch, and if current workflow is doing a 'PERFORM RELEASE', this action makes decisions and finally produce a JSON file (in root project directory) that contains upload specs for jFrog Artifactory.  

Then utilize this newly created JSON file for jFrog to consume, finally does uploading. Also supports upload customization to zowe artifactory.
<br />

## Inputs

### `artifacts`

**Optional** - Artifacts to be sent over jFrog Artifactory. Can have multiple line inputs here (see example below). If you don't provide any artifacts, uploading to artifactory will be skipped.

### `perform-release`

**Optional** - The flag to indicate if doing performing release. Input has to be either `true` or `false`. Default is `false`.

### `pre-release-string`

**Optional** - pre-release string

### `publish-target-path-pattern`

**Optional** - Artifact publishing file pattern. Default `{repository}/{package}{subproject}/{version}{branchtag-uc}/`. This parameter can be customized to any format

### `publish-target-file-pattern`

**Optional** - Format for the file name published to artifactory. Default format for zowe artifacts: `{filename}-{publishversion}{fileext}`. This parameter can be customized to any format

### `skip-upload`

**Optional** - Always skip actual upload. Doesn't matter if `artifacts` is provided or not. Input has to be either `true` or `false`. Default is `false`.
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

### `PUBLISH_TARGET_PATH`

This is the publish target path for the project.  

### `ZOWE_PAX_JFROG_UPLOAD_TARGET`

This is the full path of zowe.pax upload destination

<br />  

## Pre-requisite

- Before you call this action, make sure you call [shared-actions/prepare-workflow](https://github.com/zowe-actions/shared-actions/tree/main/prepare-workflow) and [jfrog/setup-jfrog-cli](https://github.com/jfrog/setup-jfrog-cli) . Sample usage would be:

    ```yaml
    uses: jfrog/setup-jfrog-cli@v2
    env:
        JF_ARTIFACTORY_1:

    uses: zowe-actions/shared-actions/prepare-workflow@main
    ```

- If you are implementing workflow for NodeJS project, be sure to also call [nodejs-actions/setup](https://github.com/zowe-actions/nodejs-actions/tree/main/setup). Sample usage would be:

    ```yaml
    uses: zowe-actions/nodejs-actions/setup@main
    with:
        package-name: 'org.zowe.mycomponent'
    ```

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/publish@main
with:
  perform-release:
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

# jfrog download action

This action overall does jfrog download work. It has two modes:

1. Simple download mode - by providing `source-path-or-pattern` and `default-target-path` (as source and target) with optional `extra-options`;

2. manifest file to file spec mode - by providing `manifest-file-path` and `default-target-path`, this action processes and converts the manifest file specified to a jfrog file spec (.json), then initiate the download process.

<br />

## Inputs

### `manifest-file-path`

**Mandatory on condition** - The location of the manifest file. This becomes mandatory if `source-path-or-pattern` is not provided.

### `source-path-or-pattern`

**Mandatory on condition** - The download source path of pattern (remote). This becomes mandatory if `manifest-file-path` is not provided.

### `default-target-path`

**Required** - The default download target path (local). Can be overwritten by "target" property in any package in manifest file.

### `extra-options`

**Optional** - jfrog rt command extra options.

### `default-repository`

**Optional** - The default repository. Usually either `libs-snapshot-local` or `libs-release-local`

### `expected-count`

**Optional** - The expected number of downloaded artifacts

<br />

## Outputs

None
<br /><br />

## Exported environment variables

None
<br /><br />

## Pre-requisite

Before you call this action, make sure you call [shared-actions/prepare-workflow](https://github.com/zowe-actions/shared-actions/tree/main/prepare-workflow) and [jfrog/setup-jfrog-cli](https://github.com/jfrog/setup-jfrog-cli) . Sample usage would be:

```yaml
uses: jfrog/setup-jfrog-cli@v2
env:
    JF_ARTIFACTORY_1: ${{ secrets.JF_ARTIFACTORY_TOKEN }}

uses: zowe-actions/shared-actions/prepare-workflow@main
```

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/jfrog-download@main
with:
  default-target-path:
  manifest-file-path:
```

or

```yaml
uses: zowe-actions/shared-actions/jfrog-download@main
with:
  default-target-path:
  source-path-or-pattern:
```

To enable debug mode, append

```yaml
env:
  DEBUG: 'zowe-actions:shared-actions:jfrog-download'
```

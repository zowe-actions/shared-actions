# Bump version

This action will bump Zowe component manifest to newer version.
<br />

## Inputs

### `base-directory`

**Optional** - The directory of where `npm version` command will be run. Only needed if command is NOT run in the root directory of the project

### `version`

**Optional** - The argument for command `npm version`. Default `patch`
<br /><br />

## Outputs

None
<br /><br />

## Exported environment variables

None

<br />  

## Pre-requisite

None

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/bump-version@main
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

You can also customize target version, as an example:

```yaml
uses: zowe-actions/shared-actions/bump-version@main
  with:
    version: minor
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

To enable debug mode, append

```yaml
env:
  DEBUG: 'zowe-actions:shared-actions:bump-version'
```

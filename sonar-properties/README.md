# Sonar Properties

This action updates Sonar scan properties with branch context and coverage info. For an example of how to use it, see the [Zowe CLI repo](https://github.com/zowe/zowe-cli/blob/master/.github/workflows/sonar.yml).

<br />

## Inputs

### `coverage-artifact`

**Optional** - Name of artifact containing coverage info.

### `extract-dir`

**Optional** - Directory to extract the coverage artifact to.

### `github-token`

**Required** - GitHub token with access to post PR comments. Defaults to `github.token`.

<br />

## Outputs

None

<br />

## Exported environment variables

None

<br />

## Pre-requisite

None

<br />

## Example usage

(this is the standard set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/sonar-properties@main
with:
  coverage-artifact:
  extract-dir:
```

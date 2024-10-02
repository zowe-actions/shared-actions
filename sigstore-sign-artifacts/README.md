# Signing Artifacts for Zowe

This uses sigstore to sign artifacts submitted via input.

## Inputs

### `artifacts`

Artifacts to be signed using sigstore. Can have multiple line inputs here, and the path of each artifact is relative to project root directory. Artifacts support glob syntax, i.e. `my-artifact-v*.zip` will expand the wildcard when matching against files.

### `output_path`

**Optional** - Write the signed artifact bundles to the supplied output directory. Defaults to the current working directory of the action.
<br /><br />

## Outputs

Signature files created based on the user-inputted artifact files.
<br /><br />

## Pre-requisite

This action installs the pre-requisites required, which are `cosign` and `Node 20`.

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/sigstore-sign-artifacts@main
with:
  artifacts: 'my-output.zip'
```

To have multiline input for artifacts:

```yaml
with:
  artifacts: |
    path/to/artifact1
    path/to/artifact2
```
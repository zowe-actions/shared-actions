# Permission check

This action does permission checks for the running user on caller repository. If permission returned does not have write permission (not from one of 'admin', 'write', or 'maintain'), the workflow job invoking this action will set to fail.\
<br />
This action is created to prevent protected workflow jobs running from unauthorized user.
<br />

## Inputs

### `github-token`

**Required** - token associated to authenticate GITHUB API
<br />

## Outputs

### `user-permission`

Returning the user permission for further more processing if needed

<br />

## Exported environment variables

None
<br />

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/permission-check@main
with:
  github-token: example-token-here
```

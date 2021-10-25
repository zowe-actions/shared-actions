# Permission check

This action does permission checks for a specified user on a given repository. If permission returned does not have write permission (not from one of 'admin', 'write', or 'maintain'), the workflow job invoking this action will set to fail.\
<br />
This action is created to prevent protected workflow jobs running from unauthorized user.
<br />

## Inputs

### `user`

**Required** - User whose permission will be checked

### `github-repo`

**Required** - github repository

### `github-user`

**Required** - github user to be used for authentication to run github API

### `github-passwd`

**Required** - password associated to the user above
<br />

## Outputs

None
<br />

## Exported environment variables

None
<br />

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/permission-check@main
with:
  user: random-userid
  github-repo: user/project
  github-user: myuserid
  github-passwd: mypassword
```

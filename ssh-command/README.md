# SSH GA Workflow

This action runs a script, passed as an argument, on a system that's connected to via parameters also passed to the workflow.

## Inputs

### `Host`

**Required** - The hostname of the system to connect to.

### `User`

**Required** - The user name of the account to connect to the system with.

### `Password`

**Required** - The password of the account to connect to the system with.

## Example Usage

```
uses: ./custom-workflow
with:
  host: host.domain.com
  user: myUsername
  password: myPassword
  script: "echo This Workflow is Awesome!"
```

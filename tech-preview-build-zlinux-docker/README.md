# Build zlinux docker technical preview

This action does building for zowe zlinux docker tech preview.

<br />

## Inputs

### `run-number`

**Required** - Current workflow run number

### `zowe-pax-jfrog-upload-target`

**Required** - Full path of jfrog upload target for zowe.pax

### `build-docker-sources`

**Required** - Flag to enable build docker sources. Input has to be either `true` or `false`. Default is `false`.

### `dockerhub-user`

**Required** - username to login to dockerhub

### `dockerhub-password`

**Required** - password associated with above user

### `zlinux-ssh-server`

**Required** - ssh server name configured

### `zlinux-ssh-key-passphrase`

**Required** - ssh server key passphrase

<br /><br />

## Outputs

None
<br /><br />

## Exported environment variables

None
<br />

## Pre-requisite

Before you call this action, make sure you call (in order)

1. [jfrog/setup-jfrog-cli](https://github.com/jfrog/setup-jfrog-cli)
2. [shared-actions/prepare-workflow](https://github.com/zowe-actions/shared-actions/tree/main/prepare-workflow)
3. A custom step to configure SSH server

Sample usage would be:

```yaml
uses: jfrog/setup-jfrog-cli@v2
env:
    JF_ARTIFACTORY_1:

uses: zowe-actions/shared-actions/prepare-workflow@main

run: |
    cat >>~/.ssh/config <<END
    Host ${server-name}
    HostName ${YOUR_SSH_HOSTNAME}
    User ${YOUR_SSH_USER}
    IdentityFile ${YOUR_SSH_KEY_PATH}
    StrictHostKeyChecking no
    LogLevel QUIET
    END
shell: bash
```

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/tech-preview-build-zlinux-docker@main
with:
  run-number:
  zowe-pax-jfrog-upload-target:
  build-docker-sources:
  dockerhub-user:
  dockerhub-password:
  zlinux-ssh-server: ${server-name}
  zlinux-ssh-key-passphrase:
```

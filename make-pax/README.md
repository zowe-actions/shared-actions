# Make pax for Zowe projects

This action does packaging step for Zowe projects. It transfers files over to a zOS machine to do pax then transfer files back. For more detailed process, please refer to the utility function [zowe-actions/zowe-common/lib/pax.js](https://github.com/zowe-actions/zowe-common/blob/main/lib/pax.js)
<br />

## Inputs

#### `pax-name`
**Optional** - The name of the pax to be made. If not provided, default will be pulled from PACKAGE_INFO. Refer [here](https://github.com/zowe-actions/shared-actions/tree/main/prepare-workflow#manifest_info) for more information
#### `pax-ssh-host`
**Optional** - The ssh zOS host for doing packaging. Default `zzow01.zowe.marist.cloud`
#### `pax-ssh-port`
**Optional** - The ssh zOS port. Default `22`
#### `pax-ssh-username`
**Required** - The ssh zOS login username
#### `pax-ssh-password`
**Required** - The ssh zOS login password
#### `pax-local-workspace`
**Optional** - The path to `.pax` folder that contains scripts required to do packaging. Default `./.pax`
#### `pax-remote-workspace`
**Optional** - Remote directory on zOS server to be used for packaging. Default `/ZOWE/tmp`
#### `pax-options`
**Optional** - Extra options for `pax` command
#### `pax-compress`
**Optional** - Flag to enable pax compression
#### `pax-compress-options`
**Optional** - Compress command options for pax
#### `extra-files`
**Optional** - Extra artifacts will be generated and will be transferred back. For multiple items, put them on a single line with comma separation.
#### `keep-temp-folders`
**Optional** - Flag to if we want to keep the temporary packaging folder on the remote machine for debugging purpose. Default is `FALSE`
#### `extra-environment-vars`
**Optional** - Extra environment variables to be parsed
<br /><br />

## Outputs
None
<br /><br />

## Exported environment variables 
None
<br /><br />

## Pre-requisite

Before you call this action, make sure you call [shared-actions/prepare-workflow](https://github.com/zowe-actions/shared-actions/tree/main/prepare-workflow). Sample usage would be:

```yaml
uses: zowe-actions/shared-actions/prepare-workflow@main
```

## Example usage
(this is a minimal set of inputs you need to provide)
```
uses: zowe-actions/shared-actions/make-pax@main
with:
  pax-ssh-username: user
  pax-ssh-password: mypassword
```
To enable debug mode, append
```
env:
  DEBUG: 'zowe-actions:zowe-common:pax'
  DEBUG: 'zowe-actions:shared-actions:packaging'
```

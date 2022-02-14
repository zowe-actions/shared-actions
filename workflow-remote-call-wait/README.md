# Action for remotely calling a workflow and wait for its status

This action calls a remote workflow in another repository, then poll its status and wait until it completes.

Process:

1. Fire the event request by constructing a wrapper of [Create a workflow dispatch event](https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event) using curl;
2. Parse the returned complete workflow list and pinpoint the triggered workflow called by this action with a matched random ID generated. The random ID will appear as one of the step names;
3. Remember this workflow run id, wait and poll its status
4. Finish this action upon triggered workflow being completed (success, failed, or cancelled)

<br />

## Inputs

### `github-token`

**Required** - The github token to authenticate and do Git push. You need to make sure the token can access on `${owner}/${repo}`

### `owner`

**Required** - The repository owner which is associated with the remote workflow you are going to call.

### `repo`

**Required** - The repository name which is associated with the remote workflow you are going to call.

### `workflow-filename`

**Required** - The workflow file name

### `branch-name`

**Required** - The branch where the remote workflow lives

### `poll-frequency`

**Required** - Polling frequency to check called workflow completion status

### `inputs-json-string`

**Optional** - Extra workflow_dispatch inputs to be passed in

<br />

## Outputs

### `zowe-build-workflow-run-num`

Returns the zowe build workflow run number for further steps to consume

<br />

## Exported environment variables

None
<br />

## Pre-requisite

Your remote to-be-called workflow must contain the `workflow_dispatch` trigger and has the input named `RANDOM_DISPATCH_EVENT_ID`. Then the first job in your workflow must be named `display-dispatch-event-id`, which shall only contain one single step named `RANDOM_DISPATCH_EVENT_ID is ${{ github.event.inputs.RANDOM_DISPATCH_EVENT_ID }}` which will be used to find the event id in the code.

For simplicity and your convenience, please copy the follow code to your workflow:

```yaml
workflow_dispatch:
    inputs:
        RANDOM_DISPATCH_EVENT_ID:
        description: 'random dispatch event id'
        required: false
        type: string
=======================
job:
    display-dispatch-event-id:
        if: github.event.inputs.RANDOM_DISPATCH_EVENT_ID != ''
        runs-on: ubuntu-latest
        steps:
        - name: RANDOM_DISPATCH_EVENT_ID is ${{ github.event.inputs.RANDOM_DISPATCH_EVENT_ID }}
            run: echo "prints random dispatch event id sent from workflow dispatch event"

```

<br />

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/workflow-remote-call-wait@main
with:
  github-token: 
  owner:
  repo:
  workflow-filename:
  poll-frequency: 
  branch-name:
```

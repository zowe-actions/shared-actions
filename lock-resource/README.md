# Action for locking a resource

Github Actions has a natively supported feature to ensure only one workflow can be run at a time, called `concurrency`. However as of the time I am writing this readme doc, `concurrency` currently only supports queueing up **only one** additional workflow run, that subsequent workflows executing the same `concurrency` group will be cancelled. This is troublesome for some projects which may have multiple workflows running at the same time and need to queue them up.  
  
Therefore, this action `lock-resource` is closing the gap to have multiple workflows queueing up and ensure only one workflow can acquire a resource lock at a time.  

The lock files are stored on any specified repository branch. Whenever a workflow needs to lock a resource, it will write to that lock file and commit push to that branch. This action takes the advantage of Git push command to ensure atomic instruction; if one workflow already pushes changes, subsequent workflow (on a separate checkout branch) will not be able to push changes unless syncing up with remote. Failure to acquire the lock (pushing changes to lock file) will result in a wait; as wait timer passes it will check the lock status again until the lock is free to acquire.

The wait timer can be configured from `lock-avg-retry-interval`. Note that this is only an average wait timer, exact number will be randomly generated from the range of +/- 10 seconds of your input to reduce the chance of race condition.

There is also a post action, which is intended to run at the end of the workflow automatically. The purpose is to unlock the resource no matter if any step in between passed or failed.  

Lock file content will be your workflow information so you are able to know which workflow (which job) currently holds the lock, example will be:

```JSON
{
  "lockAcquiredTime": "Thu Nov 18 2021 16:28:12 GMT+0000 (Coordinated Universal Time)",
  "uid": "1637252892487011391",
  "repository": {
    "owner": "example-user",
    "repo": "example-repo"
  },
  "branch": "development",
  "workflow": "Project Integration tests",
  "job": "integration-test",
  "actor": "example-user",
  "runId": 1755456789,
  "runNumber": 51
}
```

You can also manually locks a resource by writing any data to the lock file. This action will treat the resource being occupied if seeing content in the lock file. Don't forget to release the lock by erasing lock file content to let other workflows continue doing their job :D

<br />

## Inputs

### `lock-repository`

**Optional** - The repository of where your lock files resides. If you don't specify, default will be set to the repository where you run your workflow that calls this action.

### `lock-branch`

**Optional** - The branch of where your lock files resides. This branch should be in the repository specified above. Default branch name is `github-actions-resource-locks` if you don't specify.

### `lock-resource-name`

**Required** - The lock file name

### `lock-avg-retry-interval`

**Required** - Average wait timer to check lock status (in seconds). The value specified here will be to used to created a range (+/-10 seconds), then a random number will be generated from this range and be used for the actual wait timer. The purpose is to have concurrent workflows wait and check lock status in different intervals to avoid them check at the same time - to prevent racing.

### `github-token`

**Required** - The github token to authenticate and do Git push. You need to make sure the token can access on `${lock-repository}/${lock-branch}`

<br />

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

```yaml
uses: zowe-actions/shared-actions/lock-resource@main
with:
  lock-repository: 
  github-token: 
  lock-resource-name: 
  lock-avg-retry-interval: 
```

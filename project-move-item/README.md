# Move Project Item

This action updates the Status field of an issue or pull request in a GitHub v2 project. It is designed to be used in workflows triggered by `issue` or `pull_request_target` events.

<br />

## Inputs

### `project-owner`

**Optional** - The organization that owns the GitHub project. Defaults to `zowe` if not specified.

### `project-number`

**Required** - The GitHub project number. This is the last part of the project URL.

### `project-token`

**Required** - GitHub token with access to read and write projects. We can use `ZOWE_ROBOT_TOKEN`.

### `item-status`

**Required** - The column name (aka Status field) to assign to the project item (e.g., "In Progress").

## `issue-url`

**Optional** - The GitHub issue or pull request URL. Defaults to the `issue.html_url` or `pull_request.html_url` property on GitHub event payload.

### `assign-author`

**Optional** - For pull requests, set to `true` to assign author to the PR so that the project can be viewed in "Group By: Assignee" mode. Assignee is only added if they are a team member (with write access) and no one else is assigned. Defaults to `false`.

<br />

## Outputs

### `itemId`

Item ID of the GitHub project card linked to the issue or pull request.

<br />

## Exported environment variables

None

<br />

## Pre-requisite

None

<br />

## Example usage

(this is a minimal set of inputs you need to provide)

```yaml
uses: zowe-actions/shared-actions/project-move-item@main
with:
  item-status:
  project-number:
  project-token:
```

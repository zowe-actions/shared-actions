# Releasing Zowe projects

This action does releasing step for Zowe projects. It tags the branch and creates a new tag, then for generic projects only, doing a version bump.
#### Note:
- If you are doing a release for a special project like nodejs or gradle, you should NOT set input `generic-bump-version`, because nodejs and gradle project has different mechanisms of bumping versions, which you have to add the version bump action for nodejs or gradle project.
- If you are doing a release for generic project, you must set `generic-bump-version` to `true`. 

## Inputs
#### `github-tag-prefix`
**Optional** - github tag prefix
#### `generic-bump-version`
**Optional** - Indicate if we are doing a generic version bump. Do not set this input if you are doing a nodejs or gradle version bump.
<br />

## Outputs
None
<br />

## Exported environment variables 
None
<br />

## Example usage
(this is a minimal set of inputs you need to provide)
```
uses: zowe-actions/shared-actions/release@main
```
To enable debug mode, append
```
env:
  DEBUG: 'zowe-actions:shared-actions:release'
```

# Prepare workflow

This action does several things including exports certain environment variables for the whole workflow to be used. It is suggested to be run at the very top of the workflow.

## Inputs

### `package-name`

**Optional** - package name. This will be utilized if there is no `id` in manifest file of your project. Will get ignored if `id` is present in your manifest file.

### `github-user`

**Optional** - github user used to do authentication. Will be exported to env vars if provided.

### `github-email`

**Optional** - github email used to record pushes.

### `manifest`

**Optional** - Custom manifest file name (in project root directory) to overwrite default manifest exists in project

### `extra-init`

**Optional** - Extra initialization code to run (javascript)

## Outputs

None

## Exported environment variables

(global env vars - for subsequent workflow steps to consume)

### `envvars.env`

Environment variables as defined in [envvars.env](./envvars.env)

### `DEFAULT_BRANCHES_JSON_TEXT`

defaultBranches.json transformed to String then exported as environment variable

### `CURRENT_BRANCH`

the branch where workflow is triggered

### `JFROG_CLI_BUILD_NAME`

this is to overwrite jfrog build name while doing jfrog cli commands

### `GITHUB_REPOSITORY`

the repository where workflow is triggered

### `MANIFEST_INFO`

Selected infomation in manifest file in JSON string format. Only available when manifest is provided or found. <br />
Example:

```yaml
MANIFEST_INFO: {
  "name": "my-component",
  "id": "org.zowe.my-component",
  "title": "My component",
  "description": "This is my newly created component"
}
```

### `P_VERSION`

Project/package version number. Only available when manifest is provided or found.

### `IS_RELEASE_BRANCH`

Flag to indicate if current branch is a release branch, value will be either `true` or `false`.

### `IS_FORMAL_RELEASE_BRANCH`

Flag to indicate if current branch is a formal release branch, value will be either `true` or `false`.
<br /><br />

## Example usage

```yaml
uses: zowe-actions/shared-actions/prepare-workflow@main
```

Formating on `extra-init`:

```yaml
with:
  extra-init: |
    (your javascript code here)
    //Example:
    console.log('1234')
    console.log('5678') 
```

### Note

- If you wish to add more global environment variables, please add them in [envvars.env](./envvars.env)\
  Comments starting with `#` and blank lines are allowed for easy reading, they will be sanitized during processing.
- If you wish to export more JSON file, add the file in current directory, then in [action.yml](./action.yml), do

  ```yaml
  echo '{VARIABLE_NAME}<<EOF' >> $GITHUB_ENV
  cat {filename}.json >> $GITHUB_ENV
  echo 'EOF' >> $GITHUB_ENV
  ```

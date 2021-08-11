# Generic Setup

This action processes manifest file then export as an environment variable for future use
<br /><br />

## Inputs
#### `manifest`
**Optional** - Custom manifest file name (in project root directory) to overwrite default manifest exists in project
#### `extra-init`
**Optional** - Extra initialization code to run (javascript)
<br /><br />

## Outputs
None
<br /><br />

## Exported environment variables 
(global env vars - for subsequent workflow steps to consume)
#### `MANIFEST_INFO` 
Selected infomation in manifest file in JSON string format <br />
Example:
```
MANIFEST_INFO: {
  "name": "my-component",
  "id": "org.zowe.my-component",
  "title": "My component",
  "description": "This is my newly created component"
}
```
<br /><br />

## Example usage
(this is a minimal set of inputs you need to provide)
```
uses: zowe-actions/shared-actions/generic-setup@main
```
Formating on `extra-init`:
```
with:
  extra-init: |
    (your javascript code here)
    //Example:
    console.log('1234')
    console.log('5678') 
```

To enable debug mode, append
```
env:
  DEBUG: 'zowe-actions:shared-actions:generic-setup'
```

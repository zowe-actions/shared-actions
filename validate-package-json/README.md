# Validate package.json

This action will help you to validate if package.json used in your project is following Zowe project security standard.

## Validation criteria

Currently these checks are performed:

- Must have one matching `package-lock.json`, `yarn.lock` or `package-shrinkwrap.json` along with `package.json`.
- Dependencies listed in `package.json` must be using static versions, without dynamic indicators like `~` or `^`.
- Dependency version must be released over a week.

Along with these checks, we suggest to use `npm ci` instead of `npm install`.

## Integrate into your Github Actions workflow

It's recommended to add this validation into your main build/test workflows after checkout and before execute `npm ci`. If the validation fails, the workflow should exit without running `npm ci` command. This is to protect our build environment from getting infected by malicious npm dependencies releases.

Example integration code:

```yaml
name: My build workflow
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps: 
      - name: Checkout
        uses: actions/checkout@v2

      - name: Validate package.json
        uses: zowe-actions/shared-actions/validate-package-json@main

      - name: Install dependencies
        run: npm ci
```

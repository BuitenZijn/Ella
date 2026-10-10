# @ella/prettier-config

Shared Prettier configuration for xplorer projects.

## Usage

### In package.json

```json
{
  "prettier": "@ella/prettier-config"
}
```

### In .prettierrc

```json
"@ella/prettier-config"
```

### In prettier.config.js

```js
module.exports = require("@ella/prettier-config");
```

## Configuration

This config includes:

- No semicolons
- Single quotes
- Trailing commas
- 2-space indentation
- 80 character line width
- LF line endings
- Avoid arrow function parentheses when possible

## Ignore Patterns

Use the included ignore patterns by copying from the `ignore` file:

```bash
cp node_modules/@ella/prettier-config/ignore .prettierignore
```

Or manually add the patterns to your `.prettierignore` file.

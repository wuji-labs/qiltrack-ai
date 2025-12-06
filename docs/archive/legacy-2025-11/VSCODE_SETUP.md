# VS Code Configuration Setup

The `.vscode` directory is excluded from git in the main repository's exclude file.

However, for **G4 Phase 1**, we have created VS Code configurations that improve developer experience.

## Manual Setup Required

Since `.vscode` is git-ignored, you need to manually copy these files from this document.

## Files to Create

### 1. `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-vscode",
    "ms-vscode.vscode-typescript-next",
    "GitHub.copilot",
    "GitHub.vscode-pull-request-github",
    "eamodio.gitlens",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ],
  "unwantedRecommendations": []
}
```

### 2. `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.rulers": [80, 120],
  "editor.wordWrap": "on",
  "editor.minimap.enabled": true,
  "editor.suggestSelection": "first",
  "editor.quickSuggestions": {
    "strings": true
  },
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/.git": true,
    "**/.next": true,
    "**/node_modules": true,
    "**/out": true,
    "**/dist": true,
    "**/.claude": true,
    "**/backups": true
  },
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/backups/**": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.updateImportsOnFileMove.enabled": "always",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [{ "mode": "auto" }],
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^'\"`]*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^'\"`]*)(?:'|\"|`)"]
  ],
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/backups": true,
    "**/.git": true
  },
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.defaultProfile.linux": "bash",
  "cSpell.words": [
    "supabase",
    "finnhub",
    "helicone",
    "openrouter",
    "langfuse",
    "refinedev",
    "nextjs",
    "tailwindcss",
    "AAPL",
    "TSLA",
    "MSFT"
  ]
}
```

### 3. `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3004",
      "webRoot": "${workspaceFolder}"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Run Tests",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm test"
    },
    {
      "name": "Run Single Test File",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm test -- ${relativeFile}"
    }
  ]
}
```

### 4. `.vscode/typescript.code-snippets`

See `docs/DEVELOPER_EXPERIENCE.md` for the full code snippets configuration.

## Quick Setup Script

You can also use this command to setup VS Code configs:

```bash
# Create .vscode directory
mkdir -p .vscode

# Copy the JSON configs above into the respective files
# Or download from the PR description
```

## Why is .vscode excluded?

The `.vscode` directory is often excluded from git because:
1. Different developers may have different preferences
2. Personal settings might conflict
3. Workspace-specific configs vary

However, for a team project, sharing these configs ensures consistency.

## Recommendation for HQ

Consider updating `.git/info/exclude` to allow `.vscode` configs:

```bash
# Remove this line from .git/info/exclude:
# .vscode/

# Or selectively include:
# !.vscode/extensions.json
# !.vscode/settings.json
```

This will allow these developer experience improvements to be shared across the team.

---

**Note**: For now, developers should manually create these files based on the templates above.

# Developer Experience Tools

This document describes the development tools and configurations available in this project.

## Quick Start

### One-Command Development Setup

```bash
bash scripts/dev-start.sh
```

This script will:
1. ✅ Check environment variables
2. ✅ Install dependencies if needed
3. ✅ Check port availability
4. ✅ Show git status
5. ✅ Optionally pull latest changes
6. ✅ Start development server

## Available Scripts

### Development

```bash
npm run dev              # Start development server on port 3004
npm run build            # Build for production
npm run start            # Start production server
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm test                 # Run tests with Vitest
npm run test:ci          # Run tests in CI mode
npm run pr:ready         # Check if code is ready for PR (lint + test)
```

### Environment

```bash
npm run env:check        # Check development environment setup
```

### Database

```bash
npm run backup:db        # Backup database (Windows PowerShell)
npm run backup:db:bash   # Backup database (Linux/Mac)
npm run test:backup      # Test backup scripts
```

### Utilities

```bash
npm run helicone:sync-models    # Sync Helicone models
npm run worktree:setup-port     # Setup worktree port
```

## VS Code Integration

### Recommended Extensions

When you open this project in VS Code, you'll be prompted to install recommended extensions:

| Extension | Purpose |
|-----------|---------|
| **ESLint** | JavaScript/TypeScript linting |
| **Prettier** | Code formatting |
| **Tailwind CSS IntelliSense** | Tailwind class completion |
| **Supabase** | Supabase integration |
| **TypeScript** | Enhanced TypeScript support |
| **GitHub Copilot** | AI pair programmer |
| **GitLens** | Git supercharged |
| **Error Lens** | Inline error display |
| **Code Spell Checker** | Spell checking |

### Auto-Format on Save

The project is configured to automatically:
- Format with Prettier on save
- Fix ESLint issues on save
- Trim trailing whitespace
- Insert final newline

### Code Snippets

Type these prefixes and press `Tab` to insert code templates:

| Prefix | Description |
|--------|-------------|
| `rfc` | React functional component with TypeScript |
| `apiget` | Next.js API GET route handler |
| `apipost` | Next.js API POST route handler |
| `sbquery` | Supabase query pattern |
| `tryc` | Try-catch block |
| `clo` | Console.log with JSON.stringify |
| `ust` | React useState hook |
| `uef` | React useEffect hook |
| `afn` | Async function with error handling |
| `desc` | Vitest test describe block |

### Debugging

Press `F5` or go to Run & Debug panel to:

1. **Debug Server-Side** - Debug Next.js server code
2. **Debug Client-Side** - Debug in Chrome browser
3. **Debug Full Stack** - Debug both client and server
4. **Run Tests** - Run all tests in debug mode
5. **Run Single Test File** - Debug current test file

## Environment Variables

### Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FINNHUB_API_KEY=
NEXTAUTH_SECRET=
```

### Optional Variables

```bash
# LLM Providers (at least one required)
HELICONE_API_KEY=
HELICONE_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Observability
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=

# Cache (Phase 2)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Validation

Run this to check if all required variables are set:

```bash
npm run env:check
```

## Git Workflow

### Branch Naming

```bash
# Feature branches
git checkout -b feature/add-user-authentication

# Bug fixes
git checkout -b fix/report-generation-timeout

# Phase work (worktrees)
git checkout -b g4/phase1-infrastructure-tooling
```

### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat: add database backup scripts"
git commit -m "fix: resolve type mismatch in API response"
git commit -m "docs: update developer experience guide"
git commit -m "chore: remove legacy prisma dependencies"
git commit -m "test: add unit tests for credit manager"
```

### Pre-PR Checklist

Before creating a PR, run:

```bash
npm run pr:ready
```

This will:
1. Run ESLint to check code quality
2. Run tests to ensure nothing breaks
3. Display success message if ready

## Troubleshooting

### Port Already in Use

If you see "Port 3004 is already in use":

**Windows:**
```powershell
netstat -ano | findstr :3004
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3004 | xargs kill -9
```

Or use the `dev-start.sh` script which automatically handles this.

### Environment Variable Not Found

1. Check if `.env.local` exists
2. Copy from `.env.example` if needed:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in the required values
4. Restart the dev server

### TypeScript Errors

If you see type errors:

```bash
# Regenerate database types
npx supabase gen types typescript --linked --schema public > types/database.ts

# Clear TypeScript cache
rm -rf .next node_modules/.cache

# Reinstall dependencies
npm ci
```

### Tests Failing

```bash
# Run tests in watch mode
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Performance Tips

### Faster Development

1. **Use Turbopack** (experimental):
   ```bash
   npm run dev -- --turbo
   ```

2. **Disable source maps** in development (add to `.env.local`):
   ```bash
   NEXT_PUBLIC_DISABLE_SOURCE_MAPS=true
   ```

3. **Clear cache** regularly:
   ```bash
   rm -rf .next node_modules/.cache
   ```

### Faster Testing

1. **Run tests in parallel**:
   ```bash
   npm test -- --threads
   ```

2. **Run only changed tests**:
   ```bash
   npm test -- --changed
   ```

3. **Use test filters**:
   ```bash
   npm test -- --grep "CreditManager"
   ```

## Code Quality Standards

### File Size Limits

- ❌ Files > 500 lines should be refactored
- ✅ Components should be < 300 lines
- ✅ Functions should be < 50 lines

### Test Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| `lib/core/` | >80% | 40% |
| `lib/services/` | >70% | 20% |
| `app/api/` | >60% | 30% |

### Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Total Bundle Size | < 250KB |

## Additional Resources

- [Architecture Documentation](../docs/architecture/ARCHITECTURE.md)
- [Collaboration Guide](../../CODEX_CLAUDE_COLLAB.md)
- [Backup Scripts](../backups/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For questions or issues:

- **Team**: G4 Infrastructure Team
- **Project**: Investor AI
- **Last Updated**: 2025-12-02

---

**Pro Tip**: Add this to your shell profile for quick access:

```bash
# ~/.bashrc or ~/.zshrc
alias ii-dev='cd /path/to/qiltrack-ai && bash scripts/dev-start.sh'
alias ii-test='cd /path/to/qiltrack-ai && npm test'
alias ii-check='cd /path/to/qiltrack-ai && npm run env:check'
```

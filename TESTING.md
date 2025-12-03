# Testing Setup

This project has comprehensive test coverage with both unit and integration tests.

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Files
```bash
# Unit tests only
npm test src/lib/conservationStatus.test.ts

# Integration tests only
npm test src/lib/conservationStatus.integration.test.ts
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Pre-commit Hook

A pre-commit hook has been installed that automatically runs all tests before each commit. This ensures that:
- All tests pass before code is committed
- Breaking changes are caught early
- Code quality is maintained

### Bypassing the Hook (Not Recommended)
If you absolutely need to commit without running tests:
```bash
git commit --no-verify -m "your message"
```

**Note:** This should only be used in exceptional circumstances.

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/test.yml`) that:
- Runs on pushes to `main` branch
- Runs on all pull requests to `main`
- Tests against Node.js versions 18.x and 20.x
- Runs linter
- Runs unit tests
- Runs integration tests (with graceful failure)
- Generates coverage reports
- Uploads coverage to Codecov (if configured)

### Setting Up Secrets

For full CI functionality, add these secrets to your GitHub repository:

1. **CODECOV_TOKEN** (optional): For coverage reporting
   - Get from https://codecov.io
   - Add to: Settings → Secrets and variables → Actions

2. **GOOGLE_MAPS_API_KEY** (optional): For integration tests
   - Uncomment the relevant line in `.github/workflows/test.yml`
   - Add to: Settings → Secrets and variables → Actions

## Test Structure

```
src/
├── lib/
│   ├── conservationStatus.ts
│   ├── conservationStatus.test.ts          # Unit tests
│   ├── conservationStatus.integration.test.ts  # Integration tests
│   ├── vernalPoolStatus.ts
│   └── vernalPoolStatus.test.ts
├── services/
│   ├── server-geocoding.ts
│   ├── server-geocoding.test.ts
│   └── server-geocoding.integration.test.ts
└── utils/
    ├── coordinate-conversion.test.ts
    ├── dateFormat.test.ts
    └── distance.test.ts
```

## Test Coverage Status

- ✅ `src/lib/conservationStatus.ts` - Unit + Integration
- ✅ `src/lib/vernalPoolStatus.ts` - Unit
- ✅ `src/services/server-geocoding.ts` - Unit + Integration
- ✅ `src/utils/coordinate-conversion.ts` - Unit
- ✅ `src/utils/dateFormat.ts` - Unit
- ✅ `src/utils/distance.ts` - Unit

## Writing New Tests

### Unit Tests
Place unit tests next to the source file with `.test.ts` extension:
```typescript
// myModule.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Integration Tests
Place integration tests with `.integration.test.ts` extension:
```typescript
// myModule.integration.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction - Integration', () => {
  it('should work with real data', async () => {
    const result = await myFunction();
    expect(result).toBeDefined();
  }, 30000); // 30 second timeout for API calls
});
```

## Troubleshooting

### Pre-commit Hook Not Running
```bash
# Make sure the hook is executable
chmod +x .git/hooks/pre-commit

# Verify it exists
ls -la .git/hooks/pre-commit
```

### Tests Failing in CI but Passing Locally
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Check for environment-specific issues
- Review the GitHub Actions logs

### Slow Tests
Integration tests can be slow due to API calls. Consider:
- Running only unit tests during development: `npm test -- --exclude integration`
- Using test timeouts appropriately
- Mocking external services in unit tests

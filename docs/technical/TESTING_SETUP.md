# Setup Instructions - Testing & Alignment System

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

Ini akan menginstall:
- `vitest` - Testing framework
- `@vitest/ui` - Test UI dashboard
- `@vitest/coverage-v8` - Coverage reporting

### 2. Verify Installation

```bash
npm test -- --version
```

Expected output: `Vitest v2.1.8`

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run specific test file
npm test hydrologyMath.test.ts

# Run with UI dashboard
npm run test:ui
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
# Open: coverage/index.html
```

## 🔧 Configuration

### Vitest Config
File: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Path Aliases
Ensure `vitest.config.ts` aliases match `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/lib': path.resolve(__dirname, './src/lib'),
    '@/types': path.resolve(__dirname, './src/types'),
  },
}
```

## 📝 Writing Tests

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { calculateHSSNakayasu } from '@/lib/engine/flood/sni2415';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = { /* ... */ };
    
    // Act
    const result = calculateHSSNakayasu(input);
    
    // Assert
    expect(result.Qp).toBeGreaterThan(0);
  });
});
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Numeric comparisons
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);
expect(value).toBeCloseTo(89.47, 2); // 2 decimal places

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Arrays
expect(array).toHaveLength(5);
expect(array).toContain(item);

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('Error message');
```

## 🎯 Ground Truth Validation

### Step 1: Extract Values from Excel

Open your Ground Truth Excel file and extract:
- Input parameters (A, L, Ro, Tg, Tr, Alpha)
- Expected outputs (Qp, Tp, Tb)

### Step 2: Update Test File

Edit `src/lib/engine/flood/hydrologyMath.test.ts`:

```typescript
it('should match Excel ground truth for standard watershed', () => {
  const input: HSSNakayasuInput = {
    Ro: 50,        // ← From Excel
    Tg: 3.5,       // ← From Excel
    Tr: 1.75,      // ← From Excel
    Alpha: 2.0,    // ← From Excel
    A: 125.5,      // ← From Excel
    L: 18.2,       // ← From Excel
  };

  const expectedQp = 89.47;  // ← From Excel
  const expectedTp = 5.25;   // ← From Excel
  const expectedTb = 21.0;   // ← From Excel
  
  const result = calculateHSSNakayasu(input);

  expect(result.Qp).toBeCloseTo(expectedQp, 2);
  expect(result.Tp).toBeCloseTo(expectedTp, 2);
  expect(result.Tb).toBeCloseTo(expectedTb, 2);
});
```

### Step 3: Run Test

```bash
npm test hydrologyMath.test.ts
```

### Step 4: Debug Failures

If test fails:
1. Check input values match Excel exactly
2. Verify Excel formulas are correct
3. Check unit conversions (mm vs m, hours vs seconds)
4. Adjust tolerance if needed: `.toBeCloseTo(value, decimals)`

## 🔍 Debugging Tests

### Use Console Logs

```typescript
it('should calculate correctly', () => {
  const result = calculateHSSNakayasu(input);
  
  console.log('Result:', result);
  console.log('Qp:', result.Qp);
  
  expect(result.Qp).toBeCloseTo(expectedQp, 2);
});
```

### Use Vitest UI

```bash
npm run test:ui
```

Benefits:
- Visual test runner
- Interactive debugging
- Real-time updates
- Coverage visualization

### Use VS Code Debugger

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## 📊 CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --run
      - run: npm run test:coverage
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/lib/...'"

**Solution**: Check path aliases in `vitest.config.ts`

### Issue: "ReferenceError: describe is not defined"

**Solution**: Add to test file:
```typescript
import { describe, it, expect } from 'vitest';
```

Or enable globals in `vitest.config.ts`:
```typescript
test: {
  globals: true,
}
```

### Issue: Tests timeout

**Solution**: Increase timeout:
```typescript
it('long running test', async () => {
  // ...
}, 10000); // 10 seconds
```

### Issue: Coverage not generated

**Solution**: Install coverage provider:
```bash
npm install -D @vitest/coverage-v8
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [SNI 2415:2016](docs/standards/SNI_2415_QUICK_REFERENCE.md)

## ✅ Checklist

Before committing:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] No console errors
- [ ] Ground truth values verified
- [ ] Documentation updated

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD)
2. Implement feature
3. Verify tests pass
4. Update documentation
5. Submit PR

---

**Need Help?** Check `docs/technical/TESTING_QUICK_REF.md` for quick reference.

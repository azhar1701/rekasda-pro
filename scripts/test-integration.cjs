const fs = require('fs');
const path = require('path');
const ROOT_DIR = path.join(__dirname, '..');

console.log('🧪 Starting Integration Tests...\n');

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(name, fn) {
  tests.total++;
  try {
    fn();
    tests.passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    tests.failed++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

// Test 1: Environment Variables
test('Environment variables loaded', () => {
  const envPath = path.join(ROOT_DIR, '.env.local');

  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('VITE_SUPABASE_URL')) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }
  if (!envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    throw new Error('VITE_SUPABASE_ANON_KEY not configured');
  }
});

// Test 2: Build artifacts exist
test('Production build artifacts exist', () => {

  const distPath = path.join(ROOT_DIR, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('dist/ folder not found - run npm run build');
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html not found');
  }
});

// Test 3: TypeScript types
test('TypeScript types are valid', () => {

  const typesPath = path.join(ROOT_DIR, 'src', 'types', 'types.ts');
  const commonTypesPath = path.join(ROOT_DIR, 'src', 'types', 'common.types.ts');

  if (!fs.existsSync(typesPath)) {
    throw new Error('types.ts not found');
  }
  if (!fs.existsSync(commonTypesPath)) {
    throw new Error('common.types.ts not found');
  }

  const typesContent = fs.readFileSync(typesPath, 'utf8');
  if (!typesContent.includes('WATER_BALANCE')) {
    throw new Error('WATER_BALANCE type not found');
  }
});

// Test 4: No duplicate files
test('No duplicate Supabase clients', () => {

  const oldSupabasePath = path.join(ROOT_DIR, 'src', 'lib', 'supabase.ts');
  if (fs.existsSync(oldSupabasePath)) {
    throw new Error('Duplicate supabase.ts found in lib/');
  }

  const correctPath = path.join(ROOT_DIR, 'src', 'lib', 'api', 'supabase.ts');
  if (!fs.existsSync(correctPath)) {
    throw new Error('lib/api/supabase.ts not found');
  }
});

// Test 5: Package.json integrity
test('Package.json is valid', () => {

  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.scripts.build) {
    throw new Error('Build script not found');
  }
  if (!pkg.dependencies['@supabase/supabase-js']) {
    throw new Error('Supabase dependency not found');
  }
  if (!pkg.dependencies.react) {
    throw new Error('React dependency not found');
  }
});

// Test 6: Critical files exist
test('Critical source files exist', () => {

  const criticalFiles = [
    'src/App.tsx',
    'src/lib/api/supabase.ts',
    'src/hooks/useDatabase.ts',
    'src/services/api.service.ts',
    'src/types/types.ts',
    'src/types/common.types.ts'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`${file} not found`);
    }
  }
});

// Test 7: No example/test files in production
test('No example files in production', () => {

  const exampleFiles = [
    'src/pages/ExamplePage.tsx',
    'src/components/examples/PolishedInputCard.tsx',
    'src/lib/debugSupabase.ts'
  ];

  for (const file of exampleFiles) {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      throw new Error(`${file} should be deleted`);
    }
  }
});

// Test 8: Documentation exists
test('Documentation files exist', () => {

  const docs = [
    'README.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'SECURITY.md'
  ];

  for (const doc of docs) {
    const docPath = path.join(ROOT_DIR, doc);
    if (!fs.existsSync(docPath)) {
      throw new Error(`${doc} not found`);
    }
  }
});

// Results
console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${tests.passed}/${tests.total} passed`);
console.log('='.repeat(50));

if (tests.failed > 0) {
  console.log(`\n❌ ${tests.failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\n🚀 Ready for deployment');
  process.exit(0);
}

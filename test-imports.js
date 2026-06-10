console.log('Testing relative imports...');

console.log('1. Loading env...');
process.loadEnvFile('.env');

async function test() {
  console.log('2. Importing db...');
  const db = await import('./packages/db/src/index.ts');
  console.log('Imported db successfully');

  console.log('3. Importing scanner...');
  const scanner = await import('./packages/scanner/src/index.ts');
  console.log('Imported scanner successfully');

  console.log('4. Importing lighthouse-engine...');
  const lh = await import('./packages/lighthouse-engine/src/index.ts');
  console.log('Imported lighthouse-engine successfully');

  console.log('5. Importing dom-analyzer...');
  const dom = await import('./packages/dom-analyzer/src/index.ts');
  console.log('Imported dom-analyzer successfully');

  console.log('6. Importing root-cause-engine...');
  const rc = await import('./packages/root-cause-engine/src/index.ts');
  console.log('Imported root-cause-engine successfully');

  console.log('7. Importing priority-engine...');
  const priority = await import('./packages/priority-engine/src/index.ts');
  console.log('Imported priority-engine successfully');

  console.log('All packages imported successfully!');
}

test().catch(console.error);

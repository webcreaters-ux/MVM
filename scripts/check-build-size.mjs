import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const limitBytes = 50 * 1024 * 1024;

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) total += await directorySize(path);
    else total += (await stat(path)).size;
  }
  return total;
}

const bytes = await directorySize(root);
const megabytes = bytes / (1024 * 1024);

console.log(`MVM production build: ${megabytes.toFixed(2)} MB / 50.00 MB`);
if (bytes > limitBytes) {
  console.error('Build-size budget exceeded. Keep the deployable MVM web app at or below 50 MB.');
  process.exit(1);
}

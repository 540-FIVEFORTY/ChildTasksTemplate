/**
 * Cross-platform script to copy doc folder to dist
 */
import { cp } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const srcDir = join(rootDir, 'doc');
const destDir = join(rootDir, 'dist', 'doc');

try {
  await cp(srcDir, destDir, { recursive: true });
  console.log('✓ Copied doc/ to dist/doc/');
} catch (error) {
  console.error('Error copying doc folder:', error);
  process.exit(1);
}

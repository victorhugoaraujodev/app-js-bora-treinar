import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const requiredAppShellPaths = [
  'index.html',
  'manifest.webmanifest',
  'css/components.css',
  'css/layout.css',
  'css/reset.css',
  'css/responsive.css',
  'css/variables.css',
  'js/app.js',
  'js/data.js',
  'js/domain.js',
  'js/state.js',
  'js/storage.js',
  'js/ui.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/favicon-16.png',
];
const expectedPngDimensions = [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/icon-maskable-512.png', 512],
  ['icons/apple-touch-icon.png', 180],
  ['icons/favicon-32.png', 32],
  ['icons/favicon-16.png', 16],
];

test('defines the expected PWA manifest contract', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));

  assert.equal(manifest.start_url, './#/inicio');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.icons, [
    {
      src: './icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: './icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: './icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ]);
});

test('uses the manifest and relative asset references in index.html', () => {
  const indexHtml = read('index.html');

  assert.match(indexHtml, /href=["']\.\/manifest\.webmanifest["']/);
  assert.doesNotMatch(
    indexHtml,
    /(?:href|src)\s*=\s*["']\/(?:css|js|icons|manifest)(?:[./"'])/i,
  );
});

test('includes every app-shell file and all generated PWA icons at expected sizes', () => {
  for (const relativePath of requiredAppShellPaths) {
    assert.equal(existsSync(path.join(root, relativePath)), true, relativePath);
  }

  for (const [relativePath, expectedSize] of expectedPngDimensions) {
    const png = readFileSync(path.join(root, relativePath));
    assert.equal(png.toString('ascii', 1, 4), 'PNG', relativePath);
    assert.equal(png.readUInt32BE(16), expectedSize, `${relativePath} width`);
    assert.equal(png.readUInt32BE(20), expectedSize, `${relativePath} height`);
  }
});

test('pre-caches every required app-shell path', () => {
  const serviceWorker = read('service-worker.js');

  for (const relativePath of requiredAppShellPaths) {
    assert.match(serviceWorker, new RegExp(`['\"]\\./${relativePath.replaceAll('.', '\\.')}['\"]`));
  }
});

test('registers the service worker and preserves the storage key', () => {
  assert.match(read('js/app.js'), /serviceWorker\.register\(['"]\.\/service-worker\.js['"]\)/);
  assert.match(read('js/storage.js'), /bora_treinar_state_v1/);
});

test('defines a versioned cache and cleans up old PWA caches', () => {
  const serviceWorker = read('service-worker.js');

  assert.match(serviceWorker, /bora-treinar-v2/);
  assert.match(serviceWorker, /mode\s*===\s*['"]navigate['"]/);
  assert.match(serviceWorker, /['"]\.\/index\.html['"]/);
  assert.match(serviceWorker, /\.startsWith\(['"]bora-treinar-['"]\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('defines the expected PWA manifest contract', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));

  assert.equal(manifest.start_url, './#/inicio');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.icons, [
    {
      src: './icons/icon-192.png',
      sizes: '192x192',
      purpose: 'any',
    },
    {
      src: './icons/icon-512.png',
      sizes: '512x512',
      purpose: 'any',
    },
    {
      src: './icons/icon-maskable-512.png',
      sizes: '512x512',
      purpose: 'maskable',
    },
  ]);
});

test('uses the manifest and relative asset references in index.html', () => {
  const indexHtml = read('index.html');

  assert.match(indexHtml, /href=["']\.\/manifest\.webmanifest["']/);
  assert.doesNotMatch(
    indexHtml,
    /(?:href|src)=["']\/(?:css|js|icons|manifest)(?:[./"'])/i,
  );
});

test('includes every app-shell file and primary PWA icon', () => {
  const appShellPaths = [
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
  ];

  for (const relativePath of appShellPaths) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, relativePath);
  }
});

test('registers the service worker and preserves the storage key', () => {
  assert.match(read('js/app.js'), /serviceWorker\.register\(['"]\.\/service-worker\.js['"]\)/);
  assert.match(read('js/storage.js'), /bora_treinar_state_v1/);
});

test('defines a versioned cache and cleans up old PWA caches', () => {
  const serviceWorker = read('service-worker.js');

  assert.match(serviceWorker, /bora-treinar-v\d+/);
  assert.match(serviceWorker, /mode\s*===\s*['"]navigate['"]/);
  assert.match(serviceWorker, /['"]\.\/index\.html['"]/);
  assert.match(serviceWorker, /\.startsWith\(['"]bora-treinar-v['"]\)/);
});

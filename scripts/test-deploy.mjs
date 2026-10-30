import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const html=readFileSync('dist/index.html','utf8');
assert.ok(!html.includes('/src/main.tsx'),'deploy the built dist entry, never the source entry');
const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
assert.ok(urls.some(url=>/\.js$/.test(url)),'compiled JavaScript entry exists');
for(const pathname of ['/', '/lohas_islands/']){
 const page=new URL(pathname,'https://example.test');
 for(const url of urls){
  const asset=new URL(url,page);assert.ok(asset.pathname.startsWith(pathname),`${url} escapes deployment path ${pathname}`);
  const file=resolve('dist',decodeURIComponent(asset.pathname.slice(pathname.length)));assert.ok(existsSync(file),`missing deployment asset ${file}`);
 }
}
console.log('PASS: built HTML, favicon, JavaScript and CSS resolve at both / and /lohas_islands/.');

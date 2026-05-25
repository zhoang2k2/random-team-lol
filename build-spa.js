import app from './dist/server/server.js';
import fs from 'fs';

async function generate() {
  const req = new Request('http://localhost/');
  const res = await app.fetch(req, {}, {});
  const html = await res.text();
  fs.writeFileSync('dist/client/index.html', html);
  console.log('SPA index.html generated successfully.');
}
generate().catch(console.error);

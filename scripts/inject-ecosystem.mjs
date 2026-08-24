import fs from 'node:fs';
const src='public/index.html';
let html=fs.readFileSync(src,'utf8');
const tag='<script src="/ecosystem-bridge.js" defer></script>';
if(!html.includes(tag)) html=html.replace('</body>',`${tag}\n</body>`);
fs.writeFileSync(src,html);

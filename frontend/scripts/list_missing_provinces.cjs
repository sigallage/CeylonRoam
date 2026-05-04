const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/dataset/destinations.json');
const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
const missing = arr.filter(o => !Object.prototype.hasOwnProperty.call(o, 'province'));
console.log('Missing count:', missing.length);
for (const m of missing) console.log(m.id || m.name);

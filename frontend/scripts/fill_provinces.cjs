const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/dataset/destinations.json');
const raw = fs.readFileSync(file, 'utf8');
let arr;
try { arr = JSON.parse(raw); } catch (e) { console.error('JSON parse error:', e.message); process.exit(2); }

const mapping = new Map([
  ['colombo', 'Western Province'],
  ['galle', 'Southern Province'],
  ['matara', 'Southern Province'],
  ['hambantota', 'Southern Province'],
  ['kalutara', 'Western Province'],
  ['negombo', 'Western Province'],
  ['jaffna', 'Northern Province'],
  ['mannar', 'Northern Province'],
  ['delft', 'Northern Province'],
  ['trincomalee', 'Eastern Province'],
  ['batticaloa', 'Eastern Province'],
  ['ampara', 'Eastern Province'],
  ['kandy', 'Central Province'],
  ['nuwara_eliya', 'Central Province'],
  ['badulla', 'Uva Province'],
  ['ella', 'Uva Province'],
  ['anuradhapura', 'North Central Province'],
  ['polonnaruwa', 'North Central Province'],
  ['kurunegala', 'North Western Province'],
  ['puttalam', 'North Western Province'],
  ['kalpitiya', 'North Western Province'],
  ['ratnapura', 'Sabaragamuwa Province'],
  ['kegalle', 'Sabaragamuwa Province'],
  ['monaragala', 'Uva Province'],
  ['gampaha', 'Western Province'],
  ['mirissa', 'Southern Province'],
  ['tangalle', 'Southern Province'],
  ['yala', 'Southern Province'],
]);

let updated = 0;
let missing = 0;

for (const obj of arr) {
  if (!Object.prototype.hasOwnProperty.call(obj, 'province')) {
    const id = (obj.id || '').toLowerCase();
    let assigned = false;
    for (const [key, prov] of mapping.entries()) {
      if (id.startsWith(key) || id.includes('_' + key) || (obj.name||'').toLowerCase().includes(key)) {
        obj.province = prov;
        updated++;
        assigned = true;
        break;
      }
    }
    if (!assigned) missing++;
  }
}

fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
console.log('Updated provinces:', updated);
console.log('Remaining missing provinces:', missing);

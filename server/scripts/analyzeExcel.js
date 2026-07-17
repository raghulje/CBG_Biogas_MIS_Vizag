/**
 * Run from server dir: node scripts/analyzeExcel.js
 * Reads client/SREL MIS Jan-2026.xlsx and prints structure
 */
const path = require('path');
const XLSX = require('xlsx');

const filePath = path.join(__dirname, '../../client/SREL MIS Jan-2026.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['SREL-Plant MIS'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Print rows 15-18 with column index for every non-empty cell
  console.log('--- Header rows with column index (non-empty only) ---');
  for (let r = 15; r <= 18; r++) {
    const row = json[r] || [];
    const parts = [];
    row.forEach((c, i) => {
      const s = c != null ? String(c).trim() : '';
      if (s) parts.push(i + ':' + s.slice(0, 25));
    });
    console.log('R' + r, parts.join(' | '));
  }
  // How many data rows (date column numeric)
  let dataRowCount = 0;
  for (let r = 19; r < json.length; r++) {
    const v = json[r][0];
    if (typeof v === 'number' && v > 40000) dataRowCount++;
    else break;
  }
  console.log('\n--- Data rows (date in col 0):', dataRowCount);
  console.log('First date serial:', json[19][0], '->', excelSerialToDate(json[19][0]));
  console.log('Last date serial:', json[18 + dataRowCount] && json[18 + dataRowCount][0], '->', json[18 + dataRowCount] && excelSerialToDate(json[18 + dataRowCount][0]));
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}

function excelSerialToDate(serial) {
  if (serial == null || typeof serial !== 'number') return null;
  const utc = (serial - 25569) * 86400 * 1000;
  const d = new Date(utc);
  return d.toISOString().slice(0, 10);
}

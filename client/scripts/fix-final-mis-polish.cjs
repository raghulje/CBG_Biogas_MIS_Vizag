const fs = require('fs');
const p = 'c:/Users/Raghul JE/Downloads/Biogas_MIS_Vizag/client/src/pages/final-mis/page.tsx';
let s = fs.readFileSync(p, 'utf8');

const replacements = [
  [/borderRadius: '12px'/g, "borderRadius: '14px'"],
  [/color="#2879b6"/gi, "color={tokens.primary.main}"],
  [/color="#7dc244"/gi, "color={tokens.success.main}"],
  [/color="#ee6a31"/gi, "color={tokens.chart.sales}"],
  [/borderTop: '2px solid #2879b6'/gi, "borderTop: `1px solid ${tokens.border}`"],
  [/borderTop: '2px solid #7dc244'/gi, "borderTop: `1px solid ${tokens.border}`"],
  [/borderTop: '2px solid #ee6a31'/gi, "borderTop: `1px solid ${tokens.border}`"],
  [/border: '2px solid #2879b6'/gi, "border: `1px solid ${tokens.border}`"],
  [/🌾 Feeding Data/g, 'Feeding Data'],
  [/boxShadow: 1/g, `boxShadow: tokens.shadow.sm`],
  [/headerPrimary: '#2879b6'/gi, 'headerPrimary: tokens.primary.main'],
  [/background: 'linear-gradient\(135deg, rgba\(40, 121, 182, 0\.08\) 0%, rgba\(40, 121, 182, 0\.03\) 100%\)'/g, 'background: tokens.primary.soft'],
];

let counts = {};
for (const [re, to] of replacements) {
  const before = s;
  s = s.replace(re, to);
  counts[re.toString()] = (before.match(re) || []).length;
}
fs.writeFileSync(p, s);
console.log(JSON.stringify(counts, null, 2));

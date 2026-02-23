const { createCanvas } = require('canvas');
const fs = require('fs');

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const cities = [
  { name: 'Seattle',       lat: 47.61, data: [69,108,178,207,253,268,312,281,221,142,72,52] },
  { name: 'Chicago',       lat: 41.88, data: [135,136,187,215,281,311,318,283,226,193,113,106] },
  { name: 'New York',      lat: 40.73, data: [154,171,213,237,268,289,302,271,235,213,169,155] },
  { name: 'San Francisco', lat: 37.73, data: [165,182,251,281,314,330,300,272,267,243,189,156] },
  { name: 'Houston',       lat: 29.75, data: [144,141,193,212,266,298,294,281,238,239,181,146] },
  { name: 'Miami',         lat: 25.76, data: [222,227,266,275,280,251,267,263,216,215,212,209] },
];
cities.forEach(c => { c.annual = c.data.reduce((a, b) => a + b, 0); });

const allVals = cities.flatMap(c => c.data);
const [minV, maxV] = [Math.min(...allVals), Math.max(...allVals)];

const stops = [[30,50,100],[70,130,180],[180,200,160],[240,200,60],[210,120,20]];
function getColor(val) {
  const t = Math.max(0, Math.min(1, (val - minV) / (maxV - minV))) * (stops.length - 1);
  const i = Math.min(Math.floor(t), stops.length - 2);
  const f = t - i;
  const [r, g, b] = stops[i].map((c, j) => Math.round(c + f * (stops[i + 1][j] - c)));
  return `rgb(${r},${g},${b})`;
}
function textCol(val) {
  const t = Math.max(0, Math.min(1, (val - minV) / (maxV - minV))) * (stops.length - 1);
  const i = Math.min(Math.floor(t), stops.length - 2);
  const f = t - i;
  const [r, g, b] = stops[i].map((c, j) => Math.round(c + f * (stops[i + 1][j] - c)));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1a2e' : '#ffffff';
}

const [cellW, cellH, labelW, annualW] = [70, 55, 130, 80];
const [top, hdrH, bot, pad] = [120, 40, 120, 30];
const gridW = 12 * cellW;
const [W, H] = [pad + labelW + gridW + annualW + pad, top + hdrH + cities.length * cellH + bot];
const [gx, gy] = [pad + labelW, top + hdrH];

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const text = (str, x, y, font, color, align = 'center') => {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(str, x, y);
};

ctx.fillStyle = '#fafaf7';
ctx.fillRect(0, 0, W, H);

text('Which U.S. Cities Get the Most Sunshine, and When?', W / 2, 40, 'bold 22px Arial, Helvetica, sans-serif', '#1a1a2e');
text('Average Monthly Hours of Sunshine in Six Major Cities (1981\u20132010)', W / 2, 62, '14px Arial, Helvetica, sans-serif', '#555');
text('Cities ordered by latitude (north to south). Values show hours of sunshine per month.', W / 2, 82, '12px Arial, Helvetica, sans-serif', '#888');

months.forEach((m, i) => text(m, gx + i * cellW + cellW / 2, top + hdrH - 12, 'bold 13px Arial, Helvetica, sans-serif', '#1a1a2e'));
text('Annual', gx + gridW + annualW / 2, top + hdrH - 12, 'bold 13px Arial, Helvetica, sans-serif', '#1a1a2e');

ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gridW + annualW, gy); ctx.stroke();

cities.forEach((city, row) => {
  const y = gy + row * cellH;
  text(city.name, gx - 12, y + cellH / 2 + 1, 'bold 14px Arial, Helvetica, sans-serif', '#1a1a2e', 'right');
  text(`${city.lat.toFixed(1)}\u00b0N`, gx - 12, y + cellH / 2 + 16, '11px Arial, Helvetica, sans-serif', '#999', 'right');

  city.data.forEach((val, col) => {
    const x = gx + col * cellW;
    ctx.fillStyle = getColor(val); ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
    ctx.strokeStyle = '#fafaf7'; ctx.lineWidth = 2; ctx.strokeRect(x, y, cellW, cellH);
    text(val.toString(), x + cellW / 2, y + cellH / 2 + 5, 'bold 15px Arial, Helvetica, sans-serif', textCol(val));
  });

  const ax = gx + gridW;
  ctx.fillStyle = '#f0ede6'; ctx.fillRect(ax + 4, y + 1, annualW - 6, cellH - 2);
  text(city.annual.toLocaleString(), ax + annualW / 2, y + cellH / 2 + 1, 'bold 15px Arial, Helvetica, sans-serif', '#1a1a2e');
  text('hrs/yr', ax + annualW / 2, y + cellH / 2 + 16, '11px Arial, Helvetica, sans-serif', '#777');

  if (row < cities.length - 1) {
    ctx.strokeStyle = '#e8e5dd'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, y + cellH); ctx.lineTo(gx + gridW + annualW, y + cellH); ctx.stroke();
  }
});

const [legY, legW, legH, legX] = [gy + cities.length * cellH + 35, 320, 16, (W - 320) / 2];
text('Hours of Sunshine per Month', W / 2, legY - 8, '12px Arial, Helvetica, sans-serif', '#555');
for (let i = 0; i < legW; i++) {
  ctx.fillStyle = getColor(minV + (i / legW) * (maxV - minV));
  ctx.fillRect(legX + i, legY, 1, legH);
}
ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.strokeRect(legX, legY, legW, legH);

[50, 100, 150, 200, 250, 300, 330].forEach(val => {
  const x = legX + ((val - minV) / (maxV - minV)) * legW;
  ctx.beginPath(); ctx.moveTo(x, legY + legH); ctx.lineTo(x, legY + legH + 4); ctx.strokeStyle = '#888'; ctx.stroke();
  text(val.toString(), x, legY + legH + 16, '11px Arial, Helvetica, sans-serif', '#555');
});


fs.writeFileSync('visualization.png', canvas.toBuffer('image/png'));
console.log(`Saved visualization.png (${W}x${H})`);

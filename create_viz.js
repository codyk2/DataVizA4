const { createCanvas } = require('canvas');
const fs = require('fs');

// === DATA ===
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Cities ordered by latitude (north to south)
const cities = [
  { name: 'Seattle',        lat: 47.61, data: [69,108,178,207,253,268,312,281,221,142,72,52] },
  { name: 'Chicago',        lat: 41.88, data: [135,136,187,215,281,311,318,283,226,193,113,106] },
  { name: 'New York',       lat: 40.73, data: [154,171,213,237,268,289,302,271,235,213,169,155] },
  { name: 'San Francisco',  lat: 37.73, data: [165,182,251,281,314,330,300,272,267,243,189,156] },
  { name: 'Houston',        lat: 29.75, data: [144,141,193,212,266,298,294,281,238,239,181,146] },
  { name: 'Miami',          lat: 25.76, data: [222,227,266,275,280,251,267,263,216,215,212,209] },
];

// Compute annual totals and daily averages
const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
cities.forEach(c => {
  c.annual = c.data.reduce((a,b) => a+b, 0);
  c.dailyAvg = c.data.map((h, i) => (h / daysInMonth[i]).toFixed(1));
});

// Find min/max sunshine hours for color scale
const allValues = cities.flatMap(c => c.data);
const minVal = Math.min(...allValues); // 52
const maxVal = Math.max(...allValues); // 330

// === COLOR SCALE ===
// Sequential color scale: dark blue (low sun) -> warm yellow/orange (high sun)
function getColor(value) {
  const t = (value - minVal) / (maxVal - minVal); // 0 to 1

  // Multi-stop gradient: dark navy -> steel blue -> light yellow -> warm gold -> deep orange
  let r, g, b;
  if (t < 0.25) {
    const s = t / 0.25;
    r = Math.round(30 + s * (70 - 30));
    g = Math.round(50 + s * (130 - 50));
    b = Math.round(100 + s * (180 - 100));
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    r = Math.round(70 + s * (180 - 70));
    g = Math.round(130 + s * (200 - 130));
    b = Math.round(180 + s * (160 - 180));
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    r = Math.round(180 + s * (240 - 180));
    g = Math.round(200 + s * (200 - 200));
    b = Math.round(160 + s * (60 - 160));
  } else {
    const s = (t - 0.75) / 0.25;
    r = Math.round(240 + s * (210 - 240));
    g = Math.round(200 + s * (120 - 200));
    b = Math.round(60 + s * (20 - 60));
  }
  return { r, g, b, hex: `rgb(${r},${g},${b})` };
}

// Text color for contrast
function textColor(value) {
  const {r, g, b} = getColor(value);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.55 ? '#1a1a2e' : '#ffffff';
}

// === CANVAS SETUP ===
const cellW = 70;
const cellH = 55;
const labelW = 130;       // space for city labels on left
const annualColW = 80;    // extra column for annual total
const topMargin = 120;    // space for title + subtitle
const headerH = 40;       // month headers
const bottomMargin = 120; // legend space
const rightMargin = 30;
const leftMargin = 30;

const gridW = months.length * cellW;
const totalW = leftMargin + labelW + gridW + annualColW + rightMargin;
const totalH = topMargin + headerH + cities.length * cellH + bottomMargin;

const canvas = createCanvas(totalW, totalH);
const ctx = canvas.getContext('2d');

// === BACKGROUND ===
ctx.fillStyle = '#fafaf7';
ctx.fillRect(0, 0, totalW, totalH);

// === TITLE ===
ctx.fillStyle = '#1a1a2e';
ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Which U.S. Cities Get the Most Sunshine, and When?', totalW / 2, 40);

ctx.font = '14px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#555';
ctx.fillText('Average Monthly Hours of Sunshine in Six Major Cities (1981\u20132010)', totalW / 2, 62);

ctx.font = '12px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#888';
ctx.fillText('Cities ordered by latitude (north to south). Values show hours of sunshine per month.', totalW / 2, 82);

// === GRID ORIGIN ===
const gridX = leftMargin + labelW;
const gridY = topMargin + headerH;

// === MONTH HEADERS ===
ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#1a1a2e';
ctx.textAlign = 'center';
months.forEach((m, i) => {
  ctx.fillText(m, gridX + i * cellW + cellW / 2, topMargin + headerH - 12);
});

// Annual header
ctx.fillText('Annual', gridX + gridW + annualColW / 2, topMargin + headerH - 12);

// Thin line under headers
ctx.strokeStyle = '#ccc';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(gridX, gridY);
ctx.lineTo(gridX + gridW + annualColW, gridY);
ctx.stroke();

// === DRAW HEATMAP CELLS ===
cities.forEach((city, row) => {
  const y = gridY + row * cellH;

  // City label
  ctx.font = 'bold 14px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'right';
  ctx.fillText(city.name, gridX - 12, y + cellH / 2 + 1);

  // Latitude annotation
  ctx.font = '11px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText(`${city.lat.toFixed(1)}\u00b0N`, gridX - 12, y + cellH / 2 + 16);

  // Monthly cells
  city.data.forEach((val, col) => {
    const x = gridX + col * cellW;

    // Cell background
    ctx.fillStyle = getColor(val).hex;
    ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

    // Rounded corners effect (draw slightly rounded rect)
    ctx.strokeStyle = '#fafaf7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW, cellH);

    // Value text
    ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
    ctx.fillStyle = textColor(val);
    ctx.textAlign = 'center';
    ctx.fillText(val.toString(), x + cellW / 2, y + cellH / 2 + 5);
  });

  // Annual total cell
  const annualX = gridX + gridW;
  const annualNorm = (city.annual - 2000) / (3100 - 2000); // normalize for color
  const annualColor = getColor(minVal + annualNorm * (maxVal - minVal));

  ctx.fillStyle = '#f0ede6';
  ctx.fillRect(annualX + 4, y + 1, annualColW - 6, cellH - 2);

  ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'center';
  ctx.fillText(city.annual.toLocaleString(), annualX + annualColW / 2, y + cellH / 2 + 1);

  ctx.font = '11px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#777';
  ctx.fillText('hrs/yr', annualX + annualColW / 2, y + cellH / 2 + 16);

  // Row separator
  if (row < cities.length - 1) {
    ctx.strokeStyle = '#e8e5dd';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y + cellH);
    ctx.lineTo(gridX + gridW + annualColW, y + cellH);
    ctx.stroke();
  }
});

// === LEGEND ===
const legendY = gridY + cities.length * cellH + 35;
const legendW = 320;
const legendH = 16;
const legendX = (totalW - legendW) / 2;

// Legend title
ctx.font = '12px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#555';
ctx.textAlign = 'center';
ctx.fillText('Hours of Sunshine per Month', totalW / 2, legendY - 8);

// Draw gradient bar
for (let i = 0; i < legendW; i++) {
  const t = i / legendW;
  const val = minVal + t * (maxVal - minVal);
  ctx.fillStyle = getColor(val).hex;
  ctx.fillRect(legendX + i, legendY, 1, legendH);
}

// Legend border
ctx.strokeStyle = '#ccc';
ctx.lineWidth = 1;
ctx.strokeRect(legendX, legendY, legendW, legendH);

// Legend tick marks and labels
ctx.font = '11px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#555';
ctx.textAlign = 'center';
const ticks = [50, 100, 150, 200, 250, 300, 330];
ticks.forEach(val => {
  const x = legendX + ((val - minVal) / (maxVal - minVal)) * legendW;
  ctx.beginPath();
  ctx.moveTo(x, legendY + legendH);
  ctx.lineTo(x, legendY + legendH + 4);
  ctx.strokeStyle = '#888';
  ctx.stroke();
  ctx.fillText(val.toString(), x, legendY + legendH + 16);
});

// === KEY INSIGHT ANNOTATION ===
const annotY = legendY + 45;
ctx.font = '11px Arial, Helvetica, sans-serif';
ctx.fillStyle = '#777';
ctx.textAlign = 'center';
ctx.fillText('Data source: usclimatedata.com | Averages over 1981\u20132010', totalW / 2, annotY);

// === EXPORT ===
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('visualization.png', buffer);
console.log(`Saved visualization.png (${totalW}x${totalH})`);

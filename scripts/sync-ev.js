const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EV_DIR = path.join(ROOT, 'ev');
const INDEX_PATH = path.join(ROOT, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const ROBOTS_PATH = path.join(ROOT, 'robots.txt');

if (!fs.existsSync(EV_DIR)) {
  fs.mkdirSync(EV_DIR, { recursive: true });
}

const files = fs.readdirSync(EV_DIR).filter(f => f.endsWith('.html'));
const uploadedVehicles = [];

for (const file of files) {
  const fullPath = path.join(EV_DIR, file);
  const html = fs.readFileSync(fullPath, 'utf8');
  const match = html.match(/<script[^>]*id=["']ev-page-meta["'][^>]*>([\s\S]*?)<\/script>/i);
  if (match) {
    try {
      const data = JSON.parse(match[1].trim());
      data.filePath = '/ev/' + file;
      data.slug = 'https://evcarspec.com/ev/' + file;
      uploadedVehicles.push(data);
    } catch (e) {
      console.error('Invalid JSON in', file, e.message);
    }
  }
}

function buildStaticCardHtml(v) {
  return `
        <!-- Auto-Synced Static Card: ${v.name} -->
        <article data-ev-id="${v.id}" data-category="${v.category}" data-powertrain="${v.powertrain}" data-v2l="${Boolean(v.v2lSupported)}" data-lfp="${Boolean(v.lfpBattery)}" data-arch800="${Boolean(v.arch800v)}" class="ev-card group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/70 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div>
            <div class="relative p-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
              <div class="flex items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500 text-slate-950">${v.powertrain} · ${v.architecture || '400V'}</span>
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-cyan-300 border border-cyan-500/30">${v.category}</span>
                </div>
                <div class="flex items-center gap-1 bg-slate-950/90 border border-emerald-500/50 px-2.5 py-1 rounded-xl">
                  <span class="text-xs text-emerald-400 font-bold">★</span>
                  <span class="font-mono font-black text-sm text-white">${Number(v.scoreTotal).toFixed(1)}</span>
                  <span class="text-[10px] text-slate-400 font-mono">/10</span>
                </div>
              </div>
              <h3 class="text-lg font-extrabold tracking-tight">
                <a href="${v.slug}" onclick="openVehiclePage('${v.id}', event)" class="hover:text-emerald-400 transition">
                  ${v.name}
                </a>
              </h3>
              <p class="text-xs text-slate-300 mt-1">${v.country} · ${v.chemistry} · ${v.powerKw} kW (${v.powerHp} hp)</p>
            </div>
            <div class="p-5 space-y-4">
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="range-mode-title font-semibold text-emerald-600 dark:text-emerald-400">❄️ Real-World Highway (AC On)</span>
                  <span class="font-mono text-[11px] text-slate-400">Official: <strong class="official-range-readout text-slate-600 dark:text-slate-300" data-km="${v.claimedRangeKm}">${v.claimedRangeKm} km</strong> (${v.rangeStandard})</span>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="primary-range-readout text-2xl font-black font-mono text-slate-900 dark:text-white" data-claimed-km="${v.claimedRangeKm}" data-real-km="${v.realRangeKm}">${v.realRangeKm} km</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">Battery: <strong>${v.batteryKwh} kWh</strong></span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-bold">☕ 10–80% Chai Meter</span>
                  <strong class="font-mono text-slate-800 dark:text-slate-100">${v.chaiLabel}</strong>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800">
                  <span class="text-slate-400 block text-[10px] uppercase font-bold">🔌 V2L Home Backup</span>
                  <strong class="font-mono text-slate-800 dark:text-slate-100">${v.v2lSupported ? v.v2lKw + ' kW V2L' : 'No V2L'}</strong>
                </div>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-emerald-500/5 border-l-2 border-emerald-500 pl-3 py-1">
                <strong>Human Verdict:</strong> ${v.humanVerdict}
              </p>
            </div>
          </div>
          <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] uppercase text-slate-400 block font-bold">Est. Market Price</span>
              <span class="price-readout text-base font-black font-mono text-slate-900 dark:text-white" data-usd="${v.priceUsd}">$${Number(v.priceUsd).toLocaleString()}</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" onclick="toggleCompareItem('${v.id}')" data-compare-btn="${v.id}" class="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition">+ Compare</button>
              <a href="${v.slug}" onclick="openVehiclePage('${v.id}', event)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition">Full Specs &amp; 10 FAQs →</a>
            </div>
          </div>
        </article>`;
}

if (uploadedVehicles.length > 0 && fs.existsSync(INDEX_PATH)) {
  let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  for (const v of uploadedVehicles) {
    if (!indexHtml.includes(`data-ev-id="${v.id}"`)) {
      const cardMarkup = buildStaticCardHtml(v);
      indexHtml = indexHtml.replace('<!-- EV_STATIC_CARDS_START -->', '<!-- EV_STATIC_CARDS_START -->\n' + cardMarkup);
    }
  }
  fs.writeFileSync(INDEX_PATH, indexHtml, 'utf8');
}

// Generate clean sitemap.xml and robots.txt for Google Search Console
const today = new Date().toISOString().split('T')[0];
const urls = [
  `  <url><loc>https://evcarspec.com/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
  ...uploadedVehicles.map(v => `  <url><loc>${v.slug}</loc><lastmod>${v.updatedAt || today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`)
];

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf8');

const robotsContent = `User-agent: *\nAllow: /\nSitemap: https://evcarspec.com/sitemap.xml\n`;
fs.writeFileSync(ROBOTS_PATH, robotsContent, 'utf8');
console.log('Successfully synced', uploadedVehicles.length, 'vehicles into static index.html & sitemap.xml!');

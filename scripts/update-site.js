const fs = require("fs");
const path = require("path");

const EV_DIR = path.join(__dirname, "..", "ev");
const INDEX_FILE = path.join(__dirname, "..", "index.html");
const SITEMAP_FILE = path.join(__dirname, "..", "sitemap.xml");
const SITE_URL = "https://evcarspec.com";

function extractCarMeta(htmlContent, filename) {
  // Looks for <!-- EVCARSPEC_META: {...} --> at the top of each generated EV HTML file
  const match = htmlContent.match(/<!--\s*EVCARSPEC_META:\s*(\{[\s\S]*?\})\s*-->/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    data.slug = filename.replace(/\.html$/, "");
    return data;
  } catch (e) {
    console.error(`Invalid JSON in ${filename}:`, e.message);
    return null;
  }
}

function buildCardHtml(car) {
  return `      <article class="ev-card" data-slug="${car.slug}" data-brand="${car.brand}" data-powertrain="${car.powertrain}" data-category="${car.category}" data-range="${car.realRangeKm}" data-battery="${car.batteryKwh}" data-accel="${car.accel0to100}" data-price-us="${car.priceNumUs}">
        <div>
          <div class="card-top">
            <span class="brand-tag">${car.brand} • ${car.category}</span>
            <span class="pt-badge">${car.powertrain}</span>
          </div>
          <h3><a href="/ev/${car.slug}.html">${car.name}</a></h3>
          <div class="price-line" data-us="${car.prices.us}" data-uk="${car.prices.uk}" data-eu="${car.prices.eu}" data-in="${car.prices.in}" data-ae="${car.prices.ae}" data-cn="${car.prices.cn}">${car.prices.us}</div>
          <div class="specs-mini">
            <div class="spec-item"><span>Real-World Range</span><strong>${car.realRangeKm} km (${car.officialRange})</strong></div>
            <div class="spec-item"><span>Usable Battery</span><strong>${car.batteryKwh} kWh (${car.chemistry})</strong></div>
            <div class="spec-item"><span>DC Fast Charge</span><strong>${car.dcChargeKw} kW (${car.architecture})</strong></div>
            <div class="spec-item"><span>0–100 km/h & Power</span><strong>${car.accel0to100}s • ${car.powerHp} HP</strong></div>
          </div>
        </div>
        <div class="card-actions">
          <a href="/ev/${car.slug}.html" class="btn-primary">Full Specs & Review →</a>
          <button class="btn-outline" onclick="selectForCompare('${car.slug}')">+ Compare</button>
        </div>
      </article>`;
}

function run() {
  if (!fs.existsSync(EV_DIR)) {
    fs.mkdirSync(EV_DIR, { recursive: true });
  }

  const files = fs.readdirSync(EV_DIR).filter(f => f.endsWith(".html"));
  const cars = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(EV_DIR, file), "utf8");
    const meta = extractCarMeta(content, file);
    if (meta) cars.push(meta);
  }

  if (cars.length === 0) {
    console.log("No EV HTML files with EVCARSPEC_META found in /ev/ yet. Keeping default starter cards.");
    return;
  }

  // Sort newest first if dateAdded exists
  cars.sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));

  // 1. Update index.html static cards and JSON array
  let indexHtml = fs.readFileSync(INDEX_FILE, "utf8");

  const cardsHtml = cars.map(buildCardHtml).join("\n\n");
  indexHtml = indexHtml.replace(
    /<!-- AUTO_EV_CARDS_START -->[\s\S]*?<!-- AUTO_EV_CARDS_END -->/,
    `<!-- AUTO_EV_CARDS_START -->\n${cardsHtml}\n      <!-- AUTO_EV_CARDS_END -->`
  );

  const jsonString = cars.map(c => "      " + JSON.stringify(c)).join(",\n");
  indexHtml = indexHtml.replace(
    /\/\* AUTO_EV_JSON_START \*\/[\s\S]*?\/\* AUTO_EV_JSON_END \*\//,
    `/* AUTO_EV_JSON_START */\n${jsonString}\n      /* AUTO_EV_JSON_END */`
  );

  // Update static visible count in HTML
  indexHtml = indexHtml.replace(
    /Showing <span id="visibleCount">\d+<\/span> of <span id="totalCount">\d+<\/span>/,
    `Showing <span id="visibleCount">${cars.length}</span> of <span id="totalCount">${cars.length}</span>`
  );

  fs.writeFileSync(INDEX_FILE, indexHtml, "utf8");
  console.log(`Updated index.html with ${cars.length} EVs.`);

  // 2. Auto-Generate sitemap.xml
  const today = new Date().toISOString().split("T")[0];
  const staticPages = ["/", "/about/", "/contact/", "/privacy-policy/", "/terms/"];
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach(p => {
    sitemap += `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><priority>${p === "/" ? "1.0" : "0.5"}</priority></url>\n`;
  });

  cars.forEach(car => {
    sitemap += `  <url><loc>${SITE_URL}/ev/${car.slug}.html</loc><lastmod>${car.dateAdded || today}</lastmod><priority>0.8</priority></url>\n`;
  });

  sitemap += `</urlset>\n`;
  fs.writeFileSync(SITEMAP_FILE, sitemap, "utf8");
  console.log(`Updated sitemap.xml with ${cars.length + staticPages.length} URLs.`);
}

run();

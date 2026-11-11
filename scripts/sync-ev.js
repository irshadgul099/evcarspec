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

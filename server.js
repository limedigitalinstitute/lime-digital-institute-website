const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Admin credentials (local dev only — set via env vars, never commit real values)
const ADMIN_USER = process.env.ADMIN_USERNAME || 'paras';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@limeinstitute.org';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'change-me-set-ADMIN_PASSWORD-env-var';

function readTokens() {
  return readJSON(TOKENS_FILE, []);
}
function writeTokens(tokens) {
  writeJSON(TOKENS_FILE, tokens);
}
function pruneExpired(tokens) {
  const now = Date.now();
  return tokens.filter(t => t.expires > now);
}
function issueToken(user) {
  const token = 'lime_sec_' + crypto.randomBytes(24).toString('hex');
  const tokens = pruneExpired(readTokens());
  tokens.push({ token, user, issued: Date.now(), expires: Date.now() + TOKEN_TTL_MS });
  writeTokens(tokens);
  return token;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function readJSON(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
    return false;
  }
}

function sendJSON(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5e6) { // 5MB limit
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function checkAuth(req, query) {
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token && query && query.token) token = String(query.token);
  if (!token) return false;

  const tokens = pruneExpired(readTokens());
  writeTokens(tokens); // persist pruning
  return tokens.some(t => t.token === token);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  try { pathname = decodeURIComponent(pathname); } catch (e) { /* leave as-is on malformed encoding */ }
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API ROUTES ---

  // 1. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const user = (body.username || body.email || '').trim().toLowerCase();
    const pass = body.password || '';

    if ((user === ADMIN_USER || user === ADMIN_EMAIL) && pass === ADMIN_PASS) {
      const userInfo = { name: 'Paras Patel', email: ADMIN_EMAIL, role: 'Administrator' };
      const token = issueToken(userInfo);
      return sendJSON(res, 200, {
        success: true,
        token: token,
        user: userInfo
      });
    } else {
      return sendJSON(res, 401, { success: false, error: 'Invalid Admin ID or Password' });
    }
  }

  // 2. Auth: Verify
  if (pathname === '/api/auth/verify' && method === 'GET') {
    if (checkAuth(req, parsedUrl.query)) {
      return sendJSON(res, 200, { success: true, authenticated: true });
    }
    return sendJSON(res, 401, { success: false, authenticated: false });
  }

  // 3. Events: List all
  if (pathname === '/api/events' && method === 'GET') {
    const events = readJSON(EVENTS_FILE, []);
    return sendJSON(res, 200, { success: true, events });
  }

  // 4. Events: Get single
  if (pathname.startsWith('/api/events/') && method === 'GET') {
    const id = pathname.replace('/api/events/', '').trim();
    const events = readJSON(EVENTS_FILE, []);
    const found = events.find(e => e.id === id);
    if (found) {
      return sendJSON(res, 200, { success: true, event: found });
    }
    return sendJSON(res, 404, { success: false, error: 'Event not found' });
  }

  // 5. Events: Create new (Admin)
  if (pathname === '/api/events' && method === 'POST') {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const body = await parseBody(req);
    if (!body.title) return sendJSON(res, 400, { success: false, error: 'Title is required' });

    const events = readJSON(EVENTS_FILE, []);
    const slug = (body.id || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Math.floor(Math.random() * 1000);
    const newEvent = {
      id: slug,
      title: body.title,
      subtitle: body.subtitle || '',
      type: body.type || 'online',
      status: body.status || 'upcoming',
      badge: body.badge || (body.status === 'completed' ? 'Watch Recording' : 'New Session'),
      date: body.date || new Date().toISOString().split('T')[0],
      dateDisplay: body.dateDisplay || body.date || 'Upcoming Date',
      time: body.time || '6:00 PM - 7:30 PM IST',
      duration: body.duration || '90 Mins',
      location: body.location || (body.type === 'offline' ? 'Lime Digital Campus, Rajkot' : 'Live on Zoom'),
      thumbnail: body.thumbnail || 'assets/webinars/masterclass-ai-prompting.jpg',
      videoUrl: body.videoUrl || '',
      seatsLeft: parseInt(body.seatsLeft, 10) || 20,
      speaker: body.speaker || {
        name: 'Lime Digital Mentor',
        role: 'Industry Practitioner',
        photo: 'assets/mentors/paras-patel.webp',
        bio: 'Senior digital marketing strategist.'
      },
      takeaways: Array.isArray(body.takeaways) ? body.takeaways : (body.takeaways ? body.takeaways.split('\n').filter(Boolean) : []),
      whoIsThisFor: Array.isArray(body.whoIsThisFor) ? body.whoIsThisFor : (body.whoIsThisFor ? body.whoIsThisFor.split('\n').filter(Boolean) : [])
    };

    events.unshift(newEvent);
    writeJSON(EVENTS_FILE, events);
    return sendJSON(res, 201, { success: true, event: newEvent });
  }

  // 6. Events: Update (Admin)
  if (pathname.startsWith('/api/events/') && method === 'PUT') {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const id = pathname.replace('/api/events/', '').trim();
    const body = await parseBody(req);
    const events = readJSON(EVENTS_FILE, []);
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return sendJSON(res, 404, { success: false, error: 'Event not found' });

    events[idx] = { ...events[idx], ...body, id }; // retain id
    writeJSON(EVENTS_FILE, events);
    return sendJSON(res, 200, { success: true, event: events[idx] });
  }

  // 7. Events: Delete (Admin)
  if (pathname.startsWith('/api/events/') && method === 'DELETE') {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const id = pathname.replace('/api/events/', '').trim();
    let events = readJSON(EVENTS_FILE, []);
    const beforeLen = events.length;
    events = events.filter(e => e.id !== id);
    if (events.length === beforeLen) return sendJSON(res, 404, { success: false, error: 'Event not found' });

    writeJSON(EVENTS_FILE, events);
    return sendJSON(res, 200, { success: true, deletedId: id });
  }

  // 8. Registrations: Submit Lead (Public)
  if (pathname === '/api/register' && method === 'POST') {
    const body = await parseBody(req);
    if (!body.name || !body.phone || !body.email) {
      return sendJSON(res, 400, { success: false, error: 'Name, Phone and Email are required.' });
    }

    const registrations = readJSON(REGISTRATIONS_FILE, []);
    const registration = {
      id: 'reg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      eventId: body.eventId || 'general-masterclass',
      eventTitle: body.eventTitle || 'Lime Digital Free Masterclass',
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: (body.countryCode ? body.countryCode + ' ' : '') + body.phone.trim(),
      goal: body.goal || 'Career Growth',
      submittedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || '',
      ip: req.socket.remoteAddress || ''
    };

    registrations.unshift(registration);
    writeJSON(REGISTRATIONS_FILE, registrations);

    // Optionally decrement seatsLeft
    const events = readJSON(EVENTS_FILE, []);
    const ev = events.find(e => e.id === registration.eventId);
    if (ev && ev.seatsLeft > 0) {
      ev.seatsLeft -= 1;
      writeJSON(EVENTS_FILE, events);
    }

    return sendJSON(res, 200, {
      success: true,
      message: 'Registration successful',
      registrationId: registration.id,
      event: ev || null
    });
  }

  // 9. Leads: List (Admin)
  if (pathname === '/api/leads' && method === 'GET') {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const registrations = readJSON(REGISTRATIONS_FILE, []);
    return sendJSON(res, 200, { success: true, leads: registrations });
  }

  // 10. Leads: Export CSV (Admin)
  if (pathname === '/api/leads/export' && method === 'GET') {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const registrations = readJSON(REGISTRATIONS_FILE, []);
    const headers = ['ID', 'Event Title', 'Attendee Name', 'Email', 'Phone', 'Goal', 'Submitted At'];
    const rows = registrations.map(r => [
      `"${r.id}"`,
      `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.goal || '').replace(/"/g, '""')}"`,
      `"${r.submittedAt}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lime-masterclass-leads-${new Date().toISOString().split('T')[0]}.csv"`
    });
    return res.end(csvContent);
  }

  // 11. Content (Sections CMS): Get page content (Public)
  if (pathname === '/api/content' && method === 'GET') {
    const page = String(parsedUrl.query.page || '');
    if (!/^[a-z0-9\-]{1,64}$/.test(page)) {
      return sendJSON(res, 400, { success: false, error: 'Missing or invalid ?page= key' });
    }
    const contentFile = path.join(DATA_DIR, 'content', page + '.json');
    const content = readJSON(contentFile, {});
    return sendJSON(res, 200, { success: true, page, content });
  }

  // 12. Content (Sections CMS): Update page content (Admin)
  if (pathname === '/api/content' && (method === 'PUT' || method === 'POST')) {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const page = String(parsedUrl.query.page || '');
    if (!/^[a-z0-9\-]{1,64}$/.test(page)) {
      return sendJSON(res, 400, { success: false, error: 'Missing or invalid ?page= key' });
    }
    const body = await parseBody(req);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return sendJSON(res, 400, { success: false, error: 'Body must be a JSON object of key/value pairs' });
    }
    const contentDir = path.join(DATA_DIR, 'content');
    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
    const contentFile = path.join(contentDir, page + '.json');
    const content = readJSON(contentFile, {});
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string') content[k] = v;
      else if (v === null) delete content[k];
    }
    writeJSON(contentFile, content);
    return sendJSON(res, 200, { success: true, page, content });
  }

  // 13. Global Sections: List all (Admin panel)
  if (pathname === '/api/sections' && method === 'GET' && !parsedUrl.query.name) {
    const sectionsDir = path.join(DATA_DIR, 'sections');
    const sections = {};
    if (fs.existsSync(sectionsDir)) {
      fs.readdirSync(sectionsDir).filter(f => f.endsWith('.json')).forEach(f => {
        const key = f.replace(/\.json$/, '');
        sections[key] = readJSON(path.join(sectionsDir, f), null);
      });
    }
    return sendJSON(res, 200, { success: true, sections });
  }

  // 14. Global Sections: Get single (Public — used by section-loader.js)
  if (pathname === '/api/sections' && method === 'GET' && parsedUrl.query.name) {
    const name = String(parsedUrl.query.name);
    if (!/^[a-z0-9\-]{1,64}$/.test(name)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid section name' });
    }
    const file = path.join(DATA_DIR, 'sections', name + '.json');
    if (!fs.existsSync(file)) return sendJSON(res, 404, { success: false, error: 'Section not found' });
    const section = readJSON(file, null);
    return sendJSON(res, 200, { success: true, name, section });
  }

  // 15. Global Sections: Update (Admin)
  if (pathname === '/api/sections' && (method === 'PUT' || method === 'POST')) {
    if (!checkAuth(req, parsedUrl.query)) return sendJSON(res, 401, { success: false, error: 'Unauthorized' });
    const name = String(parsedUrl.query.name || '');
    if (!/^[a-z0-9\-]{1,64}$/.test(name)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid section name' });
    }
    const body = await parseBody(req);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return sendJSON(res, 400, { success: false, error: 'Body must be a JSON object' });
    }
    const sectionsDir = path.join(DATA_DIR, 'sections');
    if (!fs.existsSync(sectionsDir)) fs.mkdirSync(sectionsDir, { recursive: true });
    const file = path.join(sectionsDir, name + '.json');
    writeJSON(file, body);
    return sendJSON(res, 200, { success: true, name, section: body });
  }

  // --- STATIC FILE SERVING ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') safePath = '/index.html';
  if (safePath === '/lime-admin' || safePath === '/lime-admin/') safePath = '/lime-admin/index.html';

  let filePath = path.join(ROOT, safePath);

  // If path has no extension and file exists with .html, append .html (Clean URLs like Apache)
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404
      const notFoundPath = path.join(ROOT, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Lime Digital Institute Server running on http://localhost:${PORT}`);
});


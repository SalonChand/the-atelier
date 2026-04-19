// ── ATELIER VISITOR TRACKER ──────────────────────────────────────────
// Tracks page visits anonymously and syncs to Firebase
// Runs on all public pages (not admin)
(function() {
  'use strict';

  // Don't track admin/dashboard pages
  var path = window.location.pathname.toLowerCase();
  if (path.indexOf('admin') !== -1 || path.indexOf('dashboard') !== -1) return;

  // Get or create anonymous session ID (persists per device, not per visit)
  var sessionId;
  try {
    sessionId = localStorage.getItem('atelier_visitor_id');
    if (!sessionId) {
      sessionId = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('atelier_visitor_id', sessionId);
    }
  } catch (e) { sessionId = 'v-anon-' + Math.random().toString(36).substr(2, 9); }

  // Get referrer info cleanly
  var referrer = document.referrer || 'Direct';
  if (referrer !== 'Direct') {
    try {
      var refUrl = new URL(referrer);
      // If referrer is the same site, mark as internal
      if (refUrl.hostname === window.location.hostname) {
        referrer = 'Internal: ' + refUrl.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'home';
      } else {
        referrer = refUrl.hostname.replace(/^www\./, '');
      }
    } catch (e) {}
  }

  // Get device type from UA
  var ua = navigator.userAgent;
  var device = 'Desktop';
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';

  // Get browser name
  var browser = 'Other';
  if (ua.indexOf('Edg/') !== -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Safari') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

  // OS
  var os = 'Other';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  // Get timezone (gives us rough location)
  var timezone = 'Unknown';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'; } catch (e) {}

  // Get page name
  var pageName = path.replace(/^\//, '').replace('the-atelier/', '').replace(/\.html$/, '') || 'home';

  var now = new Date();
  var visit = {
    id: 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    sessionId: sessionId,
    page: pageName,
    url: window.location.pathname + window.location.search,
    referrer: referrer,
    device: device,
    browser: browser,
    os: os,
    timezone: timezone,
    language: navigator.language || 'Unknown',
    screen: window.innerWidth + 'x' + window.innerHeight,
    timestamp: now.getTime(),
    date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  };

  // Save to localStorage (firebase-sync.js will push to Firebase automatically)
  try {
    var visits = JSON.parse(localStorage.getItem('atelier_visitors') || '[]');
    visits.unshift(visit);
    // Keep only the last 1000 visits to avoid storage bloat
    if (visits.length > 1000) visits = visits.slice(0, 1000);
    localStorage.setItem('atelier_visitors', JSON.stringify(visits));
  } catch (e) {
    // If localStorage fails (quota), still try to record minimally
    console.warn('[Visitor] Storage failed:', e);
  }
})();

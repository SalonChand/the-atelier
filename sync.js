/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Cross-Device Data Sync via GitHub API
   
   Stores all shared data (orders, inquiries, customers, products, etc.)
   in a db.json file in the GitHub repo. Works across all devices.
   
   localStorage is used as a fast read-cache. Writes go to both
   localStorage (instant) and GitHub (async sync).
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────────────────
  // These will be set from localStorage (configured once via admin dashboard)
  var CONFIG_KEY = 'atelier_sync_config';

  function getConfig() {
    try {
      var cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      if (cfg.token && cfg.repo && cfg.owner) return cfg;
    } catch(e) {}
    // Fallback: check if a global config was set by sync-config.js
    if (window.ATELIER_SYNC_CONFIG) return window.ATELIER_SYNC_CONFIG;
    return {};
  }

  function isConfigured() {
    var c = getConfig();
    return c.token && c.repo && c.owner;
  }

  // ── GITHUB API HELPERS ────────────────────────────────────────────────
  var API_BASE = 'https://api.github.com';
  var DB_PATH = 'db.json'; // file in repo root
  var _fileSha = null;     // track SHA for updates
  var _syncInProgress = false;
  var _writeQueue = [];
  var _lastSyncTime = 0;
  var SYNC_COOLDOWN = 3000; // minimum ms between syncs

  function apiHeaders() {
    var c = getConfig();
    return {
      'Authorization': 'token ' + c.token,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  function repoUrl() {
    var c = getConfig();
    return API_BASE + '/repos/' + c.owner + '/' + c.repo + '/contents/' + DB_PATH;
  }

  // ── DEFAULT DB STRUCTURE ──────────────────────────────────────────────
  function defaultDB() {
    return {
      orders: [],
      customers: [],
      inquiries: [],
      custom_orders: [],
      products: [],
      inventory: [],
      collections: [],
      promotions: [],
      reviews: [],
      announcements: [],
      admins: [{ email: 'admin@theatelier.com', password: 'atelier2025', role: 'superadmin' }],
      payment_settings: {},
      _lastUpdated: new Date().toISOString()
    };
  }

  // Key mapping: localStorage key → db.json field
  var KEY_MAP = {
    'atelier_admin_orders':    'orders',
    'atelier_admin_customers': 'customers',
    'atelier_inquiries':       'inquiries',
    'atelier_custom_orders':   'custom_orders',
    'atelier_admin_products':  'products',
    'atelier_inventory':       'inventory',
    'atelier_collections':     'collections',
    'atelier_promotions':      'promotions',
    'atelier_reviews':         'reviews',
    'atelier_announcements':   'announcements',
    'atelier_admins':          'admins',
    'atelier_payment_settings':'payment_settings'
  };

  // Reverse map
  var FIELD_TO_KEY = {};
  for (var k in KEY_MAP) { FIELD_TO_KEY[KEY_MAP[k]] = k; }

  // ── READ FROM GITHUB ──────────────────────────────────────────────────
  function pullFromGitHub(callback) {
    if (!isConfigured()) { if (callback) callback(false); return; }

    fetch(repoUrl(), { headers: apiHeaders() })
      .then(function(res) {
        if (res.status === 404) {
          // db.json doesn't exist yet — create it
          console.log('[Sync] db.json not found, creating...');
          pushToGitHub(function() { if (callback) callback(true); });
          return null;
        }
        if (!res.ok) throw new Error('GitHub API error: ' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (!data) return;
        _fileSha = data.sha;
        try {
          var content = atob(data.content.replace(/\n/g, ''));
          var db = JSON.parse(content);
          
          // Write each field to localStorage
          for (var field in db) {
            if (field === '_lastUpdated') continue;
            var lsKey = FIELD_TO_KEY[field];
            if (lsKey) {
              var val = typeof db[field] === 'string' ? db[field] : JSON.stringify(db[field]);
              localStorage.setItem(lsKey, val);
            }
          }
          
          _lastSyncTime = Date.now();
          console.log('[Sync] Pulled from GitHub at', new Date().toLocaleTimeString());
          if (callback) callback(true);
        } catch(e) {
          console.error('[Sync] Parse error:', e);
          if (callback) callback(false);
        }
      })
      .catch(function(err) {
        console.error('[Sync] Pull failed:', err);
        if (callback) callback(false);
      });
  }

  // ── WRITE TO GITHUB ───────────────────────────────────────────────────
  function pushToGitHub(callback) {
    if (!isConfigured()) { if (callback) callback(false); return; }
    if (_syncInProgress) {
      _writeQueue.push(callback);
      return;
    }
    _syncInProgress = true;

    // Build db from current localStorage
    var db = defaultDB();
    for (var lsKey in KEY_MAP) {
      var field = KEY_MAP[lsKey];
      try {
        var raw = localStorage.getItem(lsKey);
        if (raw) {
          db[field] = JSON.parse(raw);
        }
      } catch(e) {
        // keep default
      }
    }
    db._lastUpdated = new Date().toISOString();

    var content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));
    var body = {
      message: 'sync: ' + new Date().toLocaleString(),
      content: content
    };
    if (_fileSha) body.sha = _fileSha;

    fetch(repoUrl(), {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(body)
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Push failed: ' + res.status);
      return res.json();
    })
    .then(function(data) {
      _fileSha = data.content.sha;
      _lastSyncTime = Date.now();
      _syncInProgress = false;
      console.log('[Sync] Pushed to GitHub at', new Date().toLocaleTimeString());
      if (callback) callback(true);

      // Process queued writes
      if (_writeQueue.length > 0) {
        var next = _writeQueue.shift();
        pushToGitHub(next);
      }
    })
    .catch(function(err) {
      console.error('[Sync] Push failed:', err);
      _syncInProgress = false;
      if (callback) callback(false);
    });
  }

  // ── DEBOUNCED SYNC ────────────────────────────────────────────────────
  var _syncTimer = null;

  function schedulePush() {
    if (!isConfigured()) return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(function() {
      pushToGitHub();
    }, 2000); // debounce 2 seconds
  }

  // ── INTERCEPT LOCALSTORAGE WRITES ─────────────────────────────────────
  // Override setItem to automatically sync shared keys to GitHub
  // Only if sync is configured — otherwise leave localStorage untouched
  if (isConfigured()) {
    var _origSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.setItem = function(key, value) {
      _origSetItem(key, value);
      
      // If this is a shared key, schedule a push to GitHub
      if (KEY_MAP[key]) {
        schedulePush();
      }
    };
  }

  // ── PERIODIC PULL (for real-time-ish cross-device updates) ────────────
  function startPeriodicSync() {
    if (!isConfigured()) return;
    
    // Pull every 15 seconds on admin dashboard, 30 seconds elsewhere
    var isAdmin = window.location.pathname.indexOf('analyticsDashboard') >= 0;
    var interval = isAdmin ? 15000 : 30000;
    
    setInterval(function() {
      pullFromGitHub();
    }, interval);
  }

  // ── INITIAL SYNC ON PAGE LOAD ─────────────────────────────────────────
  if (isConfigured()) {
    // Pull latest data from GitHub on page load
    pullFromGitHub(function(success) {
      if (success) {
        console.log('[Sync] Initial sync complete');
        // Dispatch event so page scripts can re-render
        window.dispatchEvent(new Event('atelier-synced'));
      }
      startPeriodicSync();
    });
  }

  // ── SYNC ON PAGE VISIBILITY (user returns to tab) ─────────────────────
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isConfigured()) {
      var timeSinceSync = Date.now() - _lastSyncTime;
      if (timeSinceSync > 10000) { // at least 10s since last sync
        pullFromGitHub(function() {
          window.dispatchEvent(new Event('atelier-synced'));
        });
      }
    }
  });

  // ── EXPOSE GLOBAL API ─────────────────────────────────────────────────
  window.AtelierSync = {
    pull: pullFromGitHub,
    push: pushToGitHub,
    isConfigured: isConfigured,
    configure: function(owner, repo, token) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({
        owner: owner,
        repo: repo,
        token: token
      }));
      console.log('[Sync] Configured for', owner + '/' + repo);
      // Do initial push to create db.json if it doesn't exist
      pullFromGitHub();
    },
    getConfig: getConfig,
    disconnect: function() {
      localStorage.removeItem(CONFIG_KEY);
      console.log('[Sync] Disconnected');
    },
    forcePush: function() {
      pushToGitHub(function(ok) {
        console.log('[Sync] Force push:', ok ? 'success' : 'failed');
      });
    }
  };

})();

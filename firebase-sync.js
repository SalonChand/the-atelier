/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Firebase Realtime Sync
   
   Replaces the old GitHub-based sync. Uses Firebase Realtime Database
   for instant cross-device data synchronization.
   
   How it works:
   - Shared data (orders, inquiries, customers, etc.) is stored in Firebase
   - localStorage is used as a fast local cache
   - When any page writes to localStorage with a shared key,
     the data is also pushed to Firebase
   - Firebase listeners update localStorage in real-time when
     data changes on another device
   - Cart data stays local (per-browser) — not synced
   ═══════════════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── FIREBASE CONFIG ────────────────────────────────────────────────────
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCqDm6B0JoILcHHFqO6w2El64UhVS5WgDs",
    authDomain: "the-atelier-ce832.firebaseapp.com",
    databaseURL: "https://the-atelier-ce832-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "the-atelier-ce832",
    storageBucket: "the-atelier-ce832.firebasestorage.app",
    messagingSenderId: "119477694873",
    appId: "1:119477694873:web:827bc0b07f034b47b7a308"
  };

  // ── KEY MAPPING: localStorage key → Firebase path ──────────────────────
  var SYNC_KEYS = {
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

  // Reverse map: Firebase path → localStorage key
  var PATH_TO_KEY = {};
  for (var k in SYNC_KEYS) { PATH_TO_KEY[SYNC_KEYS[k]] = k; }

  // ── STATE ──────────────────────────────────────────────────────────────
  var db = null;
  var isReady = false;
  var _suppressSync = false; // prevent write loops
  var _origSetItem = localStorage.setItem.bind(localStorage);

  // ── LOAD FIREBASE SDK (CDN — no build tools needed) ────────────────────
  function loadFirebase(callback) {
    // Firebase App
    var s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
    s1.onload = function() {
      // Firebase Realtime Database
      var s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js';
      s2.onload = function() {
        callback();
      };
      s2.onerror = function() { console.warn('[Firebase] Failed to load database SDK'); };
      document.head.appendChild(s2);
    };
    s1.onerror = function() { console.warn('[Firebase] Failed to load app SDK'); };
    document.head.appendChild(s1);
  }

  // ── INITIALIZE ─────────────────────────────────────────────────────────
  function initFirebase() {
    try {
      // Initialize Firebase
      var app = firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      isReady = true;
      console.log('[Firebase] Connected');

      // Set up real-time listeners for all synced keys
      setupListeners();

      // Do initial push of any existing localStorage data to Firebase
      // (only if Firebase paths are empty — don't overwrite existing data)
      initialSync();

      // Override localStorage.setItem to auto-sync writes
      overrideLocalStorage();

    } catch(e) {
      console.error('[Firebase] Init error:', e);
    }
  }

  // ── REAL-TIME LISTENERS ────────────────────────────────────────────────
  // When data changes in Firebase (from any device), update localStorage
  function setupListeners() {
    for (var lsKey in SYNC_KEYS) {
      (function(localKey, fbPath) {
        db.ref(fbPath).on('value', function(snapshot) {
          var val = snapshot.val();
          if (val === null || val === undefined) return;

          // Suppress the localStorage override from pushing this back to Firebase
          _suppressSync = true;
          try {
            var jsonVal = typeof val === 'string' ? val : JSON.stringify(val);
            _origSetItem(localKey, jsonVal);
          } catch(e) {
            console.warn('[Firebase] Failed to cache', localKey, e);
          }
          _suppressSync = false;

          // Notify the page that data has been updated
          window.dispatchEvent(new CustomEvent('atelier-data-updated', {
            detail: { key: localKey, path: fbPath }
          }));
        });
      })(lsKey, SYNC_KEYS[lsKey]);
    }
  }

  // ── INITIAL SYNC ───────────────────────────────────────────────────────
  // Push existing localStorage data to Firebase if Firebase is empty
  function initialSync() {
    for (var lsKey in SYNC_KEYS) {
      (function(localKey, fbPath) {
        var localData = localStorage.getItem(localKey);
        if (!localData) return;

        // Check if Firebase already has data for this path
        db.ref(fbPath).once('value', function(snapshot) {
          if (snapshot.val() === null) {
            // Firebase is empty for this path — push local data
            try {
              var parsed = JSON.parse(localData);
              db.ref(fbPath).set(parsed);
              console.log('[Firebase] Seeded:', fbPath);
            } catch(e) {
              // Not valid JSON, store as-is
              db.ref(fbPath).set(localData);
            }
          }
        });
      })(lsKey, SYNC_KEYS[lsKey]);
    }

    // Seed default admin if admins path is empty
    db.ref('admins').once('value', function(snapshot) {
      if (snapshot.val() === null) {
        db.ref('admins').set([
          { email: 'admin@theatelier.com', password: 'atelier2025', role: 'superadmin' }
        ]);
        console.log('[Firebase] Seeded default admin');
      }
    });
  }

  // ── OVERRIDE LOCALSTORAGE ──────────────────────────────────────────────
  // Intercept writes to shared keys and push to Firebase
  function overrideLocalStorage() {
    localStorage.setItem = function(key, value) {
      // Always write to localStorage first
      _origSetItem(key, value);

      // If this is a synced key and not triggered by a Firebase listener
      if (SYNC_KEYS[key] && !_suppressSync && isReady) {
        var fbPath = SYNC_KEYS[key];
        try {
          var parsed = JSON.parse(value);
          db.ref(fbPath).set(parsed);
        } catch(e) {
          // Store as string if not valid JSON
          db.ref(fbPath).set(value);
        }
      }
    };
  }

  // ── EXPOSE GLOBAL API ─────────────────────────────────────────────────
  window.AtelierSync = {
    isConfigured: function() { return isReady; },
    push: function(callback) {
      // Push all synced localStorage data to Firebase
      if (!isReady) { if (callback) callback(false); return; }
      var promises = [];
      for (var lsKey in SYNC_KEYS) {
        var raw = localStorage.getItem(lsKey);
        if (raw) {
          try {
            var parsed = JSON.parse(raw);
            db.ref(SYNC_KEYS[lsKey]).set(parsed);
          } catch(e) {
            db.ref(SYNC_KEYS[lsKey]).set(raw);
          }
        }
      }
      console.log('[Firebase] Force pushed all data');
      if (callback) callback(true);
    },
    pull: function(callback) {
      // Pull all data from Firebase to localStorage
      if (!isReady) { if (callback) callback(false); return; }
      db.ref().once('value', function(snapshot) {
        var data = snapshot.val() || {};
        _suppressSync = true;
        for (var fbPath in PATH_TO_KEY) {
          if (data[fbPath] !== undefined && data[fbPath] !== null) {
            var val = typeof data[fbPath] === 'string' ? data[fbPath] : JSON.stringify(data[fbPath]);
            _origSetItem(PATH_TO_KEY[fbPath], val);
          }
        }
        _suppressSync = false;
        console.log('[Firebase] Force pulled all data');
        window.dispatchEvent(new Event('atelier-synced'));
        if (callback) callback(true);
      });
    },
    getConfig: function() { return FIREBASE_CONFIG; },
    disconnect: function() {
      if (db) { firebase.database().goOffline(); }
      console.log('[Firebase] Disconnected');
    },
    forcePush: function() { window.AtelierSync.push(); }
  };

  // ── BOOT ───────────────────────────────────────────────────────────────
  loadFirebase(initFirebase);

})();

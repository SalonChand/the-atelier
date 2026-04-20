/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Firebase Realtime Sync
   
   Replaces the old GitHub-based sync. Uses Firebase Realtime Database
   for instant cross-device data synchronization.
   
   REQUIRES: firebase-app-compat.js and firebase-database-compat.js
   to be loaded BEFORE this script via <script> tags in the HTML.
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

  // ── KEY MAPPING ────────────────────────────────────────────────────────
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
    'atelier_payment_settings':'payment_settings',
    'atelier_stickers':'stickers',
    'atelier_sticker_purchases':'sticker_purchases',
    'atelier_stickers':        'stickers',
    'atelier_sticker_orders': 'sticker_orders',
    'atelier_brands':          'brands',
    'atelier_visitors':        'visitors',
    'atelier_pending_carts':   'pendingCarts',
    'atelier_admin_notifications': 'adminNotifications'
  };
  var PATH_TO_KEY = {};
  for (var k in SYNC_KEYS) { PATH_TO_KEY[SYNC_KEYS[k]] = k; }

  // ── STATE ──────────────────────────────────────────────────────────────
  var db = null;
  var isReady = false;
  var _suppressSync = false;
  var _origSetItem = localStorage.setItem.bind(localStorage);
  var _pendingWrites = [];

  // ── OVERRIDE LOCALSTORAGE IMMEDIATELY ──────────────────────────────────
  localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    if (SYNC_KEYS[key] && !_suppressSync) {
      if (isReady && db) {
        try { db.ref(SYNC_KEYS[key]).set(JSON.parse(value)); }
        catch(e) { db.ref(SYNC_KEYS[key]).set(value); }
      } else {
        _pendingWrites.push({ key: key, value: value });
      }
    }
  };

  function flushPendingWrites() {
    if (_pendingWrites.length === 0) return;
    for (var i = 0; i < _pendingWrites.length; i++) {
      var item = _pendingWrites[i];
      var fbPath = SYNC_KEYS[item.key];
      if (fbPath) {
        try { db.ref(fbPath).set(JSON.parse(item.value)); }
        catch(e) { db.ref(fbPath).set(item.value); }
      }
    }
    _pendingWrites = [];
  }

  // ── INIT (called when Firebase SDK is available) ───────────────────────
  function init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Firebase] SDK not loaded');
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      db = firebase.database();
      isReady = true;
      console.log('[Firebase] Connected');
      setupListeners();
      initialSync();
      flushPendingWrites();
    } catch(e) {
      console.error('[Firebase] Init error:', e);
    }
  }

  // ── REAL-TIME LISTENERS ────────────────────────────────────────────────
  function setupListeners() {
    for (var lsKey in SYNC_KEYS) {
      (function(localKey, fbPath) {
        db.ref(fbPath).on('value', function(snapshot) {
          var val = snapshot.val();
          if (val === null || val === undefined) return;
          _suppressSync = true;
          try {
            _origSetItem(localKey, typeof val === 'string' ? val : JSON.stringify(val));
          } catch(e) {}
          _suppressSync = false;
          window.dispatchEvent(new CustomEvent('atelier-data-updated', { detail: { key: localKey } }));
        });
      })(lsKey, SYNC_KEYS[lsKey]);
    }
  }

  // ── INITIAL SYNC ───────────────────────────────────────────────────────
  function initialSync() {
    for (var lsKey in SYNC_KEYS) {
      (function(localKey, fbPath) {
        var localData = localStorage.getItem(localKey);
        if (!localData) return;
        db.ref(fbPath).once('value', function(snapshot) {
          if (snapshot.val() === null) {
            try { db.ref(fbPath).set(JSON.parse(localData)); }
            catch(e) { db.ref(fbPath).set(localData); }
          }
        });
      })(lsKey, SYNC_KEYS[lsKey]);
    }
    db.ref('admins').once('value', function(snapshot) {
      if (snapshot.val() === null) {
        db.ref('admins').set([{ email:'admin@theatelier.com', password:'atelier2025', role:'superadmin' }]);
      }
    });
  }

  // ── GLOBAL API ─────────────────────────────────────────────────────────
  window.AtelierSync = {
    isConfigured: function() { return isReady; },
    push: function(cb) {
      if (!isReady) { if (cb) cb(false); return; }
      for (var k in SYNC_KEYS) {
        var raw = localStorage.getItem(k);
        if (raw) { try { db.ref(SYNC_KEYS[k]).set(JSON.parse(raw)); } catch(e) { db.ref(SYNC_KEYS[k]).set(raw); } }
      }
      if (cb) cb(true);
    },
    pull: function(cb) {
      if (!isReady) { if (cb) cb(false); return; }
      db.ref().once('value', function(snap) {
        var data = snap.val() || {};
        _suppressSync = true;
        for (var p in PATH_TO_KEY) {
          if (data[p] != null) _origSetItem(PATH_TO_KEY[p], typeof data[p] === 'string' ? data[p] : JSON.stringify(data[p]));
        }
        _suppressSync = false;
        window.dispatchEvent(new Event('atelier-synced'));
        if (cb) cb(true);
      });
    },
    getConfig: function() { return FIREBASE_CONFIG; },
    disconnect: function() { if (db) firebase.database().goOffline(); },
    forcePush: function() { window.AtelierSync.push(); }
  };

  // ── BOOT — try immediately, or wait for DOMContentLoaded ──────────────
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 100);
    });
  }

})();

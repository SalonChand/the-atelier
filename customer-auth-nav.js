/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Customer Auth Nav State
   ─────────────────────────────────────────────────────────────────────────
   On every public page that has the canonical navbar, this script:
   - Checks Firebase auth state for the current customer
   - Rewrites any element with class "customer-auth-link" to show
     "Sign In" (linking to customerLogin.html) when logged out,
     or "My Orders" (linking to myOrders.html) when logged in
   - Mobile nav links auto-update too if they have class "customer-auth-link"

   Loads Firebase compat SDK if not already loaded.
   ═══════════════════════════════════════════════════════════════════════════ */
(function() {
  // If Firebase Auth SDK isn't loaded, dynamically load it. Otherwise reuse.
  function ensureFirebase(callback) {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      initApp();
      callback();
      return;
    }
    // Inject SDK scripts
    var s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js';
    s1.onload = function() {
      var s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js';
      s2.onload = function() { initApp(); callback(); };
      s2.onerror = function() { console.warn('[CustomerAuthNav] failed to load auth SDK'); };
      document.head.appendChild(s2);
    };
    s1.onerror = function() { console.warn('[CustomerAuthNav] failed to load Firebase SDK'); };
    document.head.appendChild(s1);
  }

  function initApp() {
    if (firebase.apps && firebase.apps.length) return;
    firebase.initializeApp({
      apiKey: "AIzaSyCqDm6B0JoILcHHFqO6w2El64UhVS5WgDs",
      authDomain: "the-atelier-ce832.firebaseapp.com",
      databaseURL: "https://the-atelier-ce832-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "the-atelier-ce832",
      storageBucket: "the-atelier-ce832.firebasestorage.app",
      messagingSenderId: "119477694873",
      appId: "1:119477694873:web:827bc0b07f034b47b7a308"
    });
  }

  function updateAuthLinks(isSignedIn) {
    var links = document.querySelectorAll('.customer-auth-link');
    links.forEach(function(el) {
      if (isSignedIn) {
        el.textContent = el.dataset.signedInText || 'My Orders';
        el.setAttribute('href', 'myOrders.html');
      } else {
        el.textContent = el.dataset.signedOutText || 'Sign In';
        el.setAttribute('href', 'customerLogin.html');
      }
    });
  }

  ensureFirebase(function() {
    // Set initial state immediately (no flash) — assume logged out
    updateAuthLinks(false);
    // Then react to actual auth state
    firebase.auth().onAuthStateChanged(function(user) {
      updateAuthLinks(!!(user && user.email));
    });
  });
})();

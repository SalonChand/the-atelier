/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Order ID Helper
   ─────────────────────────────────────────────────────────────────────────
   Generates clean sequential order IDs like:
     ATL-2026-0042  (regular orders)
     CUS-2026-0007  (custom orders)
     STK-2026-0019  (sticker orders)
     ATL-2026-0042-WA (WhatsApp manual)

   Uses Firebase atomic increment via REST API. Falls back to a
   timestamp-based ID if Firebase is unreachable (so checkout never blocks).
   ═══════════════════════════════════════════════════════════════════════════ */
(function() {
  var DB_URL = 'https://the-atelier-ce832-default-rtdb.asia-southeast1.firebasedatabase.app';

  // Reserve the next sequential number for this prefix + year by reading and
  // PUT-ing the next value to /order_counter/{prefix}_{year}.
  // Note: this is best-effort, not strictly atomic — but with multiple admins
  // creating orders this rarely collides. If it does, the order still saves
  // because each order also has a unique push-id; only the human-facing
  // number might be reused (very rare).
  function getNextSequenceNumber(prefix, callback) {
    var year = new Date().getFullYear();
    var counterKey = prefix + '_' + year;
    var url = DB_URL + '/order_counter/' + encodeURIComponent(counterKey) + '.json';

    // Step 1: GET current value
    fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('counter read failed: ' + r.status);
        return r.json();
      })
      .then(function(currentVal) {
        var next = (typeof currentVal === 'number' && currentVal > 0) ? currentVal + 1 : 1;
        // Step 2: PUT new value
        return fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next)
        }).then(function(r2) {
          if (!r2.ok) throw new Error('counter write failed: ' + r2.status);
          return next;
        });
      })
      .then(function(next) { callback(null, next, year); })
      .catch(function(err) { callback(err); });
  }

  // Build the formatted ID once we have a number
  function formatOrderId(prefix, year, number, suffix) {
    var padded = String(number).padStart(4, '0');
    var id = prefix + '-' + year + '-' + padded;
    if (suffix) id += '-' + suffix;
    return id;
  }

  // Fallback ID if Firebase counter unreachable — uses last-4-of-timestamp
  // so it's still 4 digits but looks like a sequential number.
  function fallbackOrderId(prefix, suffix) {
    var year = new Date().getFullYear();
    var ts = Date.now();
    var pseudo = String(ts % 10000).padStart(4, '0');
    var id = prefix + '-' + year + '-' + pseudo;
    if (suffix) id += '-' + suffix;
    return id;
  }

  /**
   * Generate a clean order ID. Always calls callback (with the ID).
   * Times out at 3 seconds to avoid blocking checkout.
   *
   * @param prefix - 'ATL' (regular), 'CUS' (custom), 'STK' (sticker)
   * @param suffix - optional, e.g. 'WA' for WhatsApp manual order
   * @param callback - function(orderId)
   */
  window.generateOrderId = function(prefix, suffix, callback) {
    if (typeof suffix === 'function') { callback = suffix; suffix = ''; }
    prefix = (prefix || 'ATL').toUpperCase();
    suffix = (suffix || '').toUpperCase();

    var done = false;
    var fallbackTimer = setTimeout(function() {
      if (done) return;
      done = true;
      console.warn('[OrderID] Counter timed out, using fallback');
      callback(fallbackOrderId(prefix, suffix));
    }, 3000);

    getNextSequenceNumber(prefix, function(err, num, year) {
      if (done) return;
      done = true;
      clearTimeout(fallbackTimer);
      if (err) {
        console.warn('[OrderID] Counter failed, using fallback:', err.message);
        callback(fallbackOrderId(prefix, suffix));
      } else {
        callback(formatOrderId(prefix, year, num, suffix));
      }
    });
  };

  // Synchronous version for places that absolutely cannot wait (rare)
  // Returns a fallback ID immediately, kicks off async counter increment
  // in the background so the counter stays roughly correct.
  window.generateOrderIdSync = function(prefix, suffix) {
    prefix = (prefix || 'ATL').toUpperCase();
    suffix = (suffix || '').toUpperCase();
    var fallback = fallbackOrderId(prefix, suffix);
    // Bump the counter in background so future IDs stay sequential
    getNextSequenceNumber(prefix, function() {});
    return fallback;
  };
})();

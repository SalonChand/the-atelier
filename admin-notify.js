// ═══════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATION SYSTEM
// Sends order/inquiry notifications to BOTH admins automatically:
//   1. Salon:   sodarisalon26@gmail.com / +977-9742590718
//   2. Tsering: tseringdong1@gmail.com / +977-9808384686
//
// EMAIL: auto-sends via Formsubmit.co (no user interaction needed)
// WHATSAPP: opens a click-to-chat link in a new tab (browsers cannot
//           send WhatsApp messages silently — this is the standard
//           legal/secure method)
// ═══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var ADMINS = [
    {
      name: 'Salon',
      email: 'sodarisalon26@gmail.com',
      phone: '9779742590718' // country code + number, no +
    },
    {
      name: 'Tsering',
      email: 'tseringdong1@gmail.com',
      phone: '9779808384686'
    }
  ];

  // ── EMAIL via Formsubmit.co (silent, no user action) ─────────────
  function sendAdminEmail(adminEmail, subject, body, meta) {
    try {
      var fd = new FormData();
      fd.append('_subject', subject);
      fd.append('_captcha', 'false');
      fd.append('_template', 'box');
      fd.append('name', 'The Atelier Site');
      fd.append('email', 'noreply@theatelier-ta.com');
      fd.append('message', body);
      if (meta) {
        Object.keys(meta).forEach(function(k) { fd.append(k, meta[k]); });
      }

      return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(adminEmail), {
        method: 'POST',
        body: fd
      }).then(function(r) { return r.json(); })
        .then(function(d) {
          console.log('[AdminNotify] Email sent to ' + adminEmail + ':', d && d.success ? 'OK' : 'maybe pending activation');
          return d;
        })
        .catch(function(e) {
          console.warn('[AdminNotify] Email to ' + adminEmail + ' failed:', e);
        });
    } catch(e) {
      console.warn('[AdminNotify] sendAdminEmail exception:', e);
    }
  }

  // ── WHATSAPP click-to-chat URL ───────────────────────────────────
  // Browsers cannot send WhatsApp messages silently (by design, to prevent spam).
  // We open wa.me links which prompt the admin's WhatsApp with the message pre-filled.
  function buildWhatsAppUrl(phone, message) {
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  }

  // Open WhatsApp links for both admins (in new tabs). Called when admin is
  // present (e.g. an admin placed a test order) or via dashboard action.
  function openWhatsAppForBothAdmins(message) {
    ADMINS.forEach(function(a, i) {
      // Stagger windows slightly so popup blockers are less aggressive
      setTimeout(function() {
        try { window.open(buildWhatsAppUrl(a.phone, message), '_blank'); } catch(e) {}
      }, i * 300);
    });
  }

  // ── MAIN NOTIFY FUNCTIONS ────────────────────────────────────────
  // Each of these:
  //   - Silently emails BOTH admins via Formsubmit.co
  //   - Stores a "pending WhatsApp notification" in localStorage that the
  //     admin dashboard picks up and displays as actionable items
  //     (admins click to send WhatsApp with pre-filled message)

  function queueWhatsAppNotification(subject, message, type, refId) {
    try {
      var queue = JSON.parse(localStorage.getItem('atelier_admin_notifications') || '[]');
      queue.unshift({
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: type, // 'order', 'custom-order', 'sticker-order', 'inquiry'
        refId: refId,
        subject: subject,
        message: message,
        createdAt: Date.now(),
        emailSentAt: Date.now(),
        whatsappSent: false
      });
      // Keep only last 200
      if (queue.length > 200) queue = queue.slice(0, 200);
      localStorage.setItem('atelier_admin_notifications', JSON.stringify(queue));
    } catch(e) {
      console.warn('[AdminNotify] Queue save failed:', e);
    }
  }

  // ORDER PLACED (regular product order)
  window.notifyAdminsOfOrder = function(order) {
    if (!order) return;
    var subject = '🛍️ New Order: ' + (order.id || 'Unknown') + ' — NRs. ' + Math.round(order.amount || order.total || 0).toLocaleString();
    var body =
      'A new order has been placed at The Atelier.\n\n' +
      '──────── ORDER DETAILS ────────\n' +
      'Order ID: ' + (order.id || '—') + '\n' +
      'Customer: ' + (order.customer || '—') + '\n' +
      'Email: ' + (order.email || '—') + '\n' +
      'Phone: ' + (order.phone || '—') + '\n' +
      'Product: ' + (order.product || '—') + '\n' +
      'Quantity: ' + (order.qty || order.quantity || '—') + '\n' +
      'Size: ' + (order.size || '—') + '\n' +
      'Color: ' + (order.color || '—') + '\n' +
      'Amount: NRs. ' + Math.round(order.amount || order.total || 0).toLocaleString() + '\n' +
      'Payment: ' + (order.paymentMethod || '—') + '\n' +
      'Status: ' + (order.status || 'pending') + '\n' +
      (order.address ? 'Address: ' + order.address + '\n' : '') +
      (order.city ? 'City: ' + order.city + '\n' : '') +
      'Date: ' + (order.date || new Date().toLocaleDateString()) + '\n' +
      (order.time ? 'Time: ' + order.time + '\n' : '') +
      '\n──────── ACTION NEEDED ────────\n' +
      'Please review the order in the admin dashboard:\n' +
      'https://theatelier-ta.com/analyticsDashboard.html\n\n' +
      '— The Atelier Site';

    // Send email to both admins silently
    ADMINS.forEach(function(a) {
      sendAdminEmail(a.email, subject, body, {
        order_id: order.id || '',
        customer: order.customer || '',
        amount: order.amount || order.total || 0
      });
    });

    // Queue WhatsApp notification
    var waMsg = '🛍️ *New Order at The Atelier*\n\n' +
      '*ID:* ' + (order.id || '—') + '\n' +
      '*Customer:* ' + (order.customer || '—') + '\n' +
      '*Product:* ' + (order.product || '—') + '\n' +
      '*Qty:* ' + (order.qty || order.quantity || '—') + '\n' +
      '*Amount:* NRs. ' + Math.round(order.amount || order.total || 0).toLocaleString() + '\n' +
      '*Phone:* ' + (order.phone || '—') + '\n\n' +
      'Review: https://theatelier-ta.com/analyticsDashboard.html';

    queueWhatsAppNotification(subject, waMsg, 'order', order.id);
  };

  // CUSTOM ORDER (from customize page)
  window.notifyAdminsOfCustomOrder = function(order) {
    if (!order) return;
    var subject = '🎨 New Custom Order: ' + (order.id || '') + ' — ' + (order.garment || 'item');
    var body =
      'A new CUSTOM order has been placed at The Atelier.\n\n' +
      '──────── CUSTOM ORDER DETAILS ────────\n' +
      'Order ID: ' + (order.id || '—') + '\n' +
      'Customer: ' + (order.customer || '—') + '\n' +
      'Email: ' + (order.email || '—') + '\n' +
      'Phone: ' + (order.phone || '—') + '\n' +
      'Garment: ' + (order.garment || '—') + '\n' +
      'Gender: ' + (order.gender || '—') + '\n' +
      'Color: ' + (order.color || '—') + '\n' +
      'Size: ' + (order.size || '—') + '\n' +
      'Quantity: ' + (order.qty || '—') + '\n' +
      'Customization: ' + (order.ctype || '—') + '\n' +
      'Placement: ' + (order.placement || '—') + '\n' +
      (order.customText ? 'Text: ' + order.customText + '\n' : '') +
      (order.notes ? 'Special Instructions: ' + order.notes + '\n' : '') +
      'Status: ' + (order.status || 'pending-quote') + '\n' +
      'Date: ' + (order.date || new Date().toLocaleDateString()) + '\n' +
      '\n──────── ACTION NEEDED ────────\n' +
      '1. Review design uploads in the admin dashboard\n' +
      '2. Send a price quote to the customer\n' +
      '3. Confirm timeline\n\n' +
      'Dashboard: https://theatelier-ta.com/analyticsDashboard.html\n\n' +
      '— The Atelier Site';

    ADMINS.forEach(function(a) {
      sendAdminEmail(a.email, subject, body, {
        order_id: order.id || '',
        customer: order.customer || '',
        garment: order.garment || ''
      });
    });

    var waMsg = '🎨 *New Custom Order at The Atelier*\n\n' +
      '*ID:* ' + (order.id || '—') + '\n' +
      '*Customer:* ' + (order.customer || '—') + '\n' +
      '*Garment:* ' + (order.garment || '—') + '\n' +
      '*Size:* ' + (order.size || '—') + ' · *Qty:* ' + (order.qty || '—') + '\n' +
      '*Customization:* ' + (order.ctype || '—') + '\n' +
      '*Phone:* ' + (order.phone || '—') + '\n\n' +
      '⚠️ Needs price quote\n' +
      'Review: https://theatelier-ta.com/analyticsDashboard.html';

    queueWhatsAppNotification(subject, waMsg, 'custom-order', order.id);
  };

  // STICKER ORDER (buy, print, or embroidery)
  window.notifyAdminsOfStickerOrder = function(order) {
    if (!order) return;
    var subject = '🏷️ New Sticker Order: ' + (order.id || '') + ' — ' + (order.type || '');
    var body =
      'A new STICKER order has been placed at The Atelier.\n\n' +
      '──────── STICKER ORDER DETAILS ────────\n' +
      'Order ID: ' + (order.id || '—') + '\n' +
      'Type: ' + (order.type || '—') + '\n' +
      'Sticker: ' + (order.stickerName || '—') + '\n' +
      'Customer: ' + (order.customer || '—') + '\n' +
      'Email: ' + (order.email || '—') + '\n' +
      'Phone: ' + (order.phone || '—') + '\n' +
      (order.garment ? 'Garment Type: ' + order.garment + '\n' : '') +
      (order.size ? 'Size: ' + order.size + '\n' : '') +
      (order.printSize ? 'Print Size: ' + order.printSize + '\n' : '') +
      (order.placement ? 'Placement: ' + order.placement + '\n' : '') +
      'Status: ' + (order.status || 'pending') + '\n' +
      (order.paymentProof ? 'Payment proof uploaded — verify in dashboard\n' : '') +
      'Date: ' + (order.date || new Date().toLocaleDateString()) + '\n' +
      '\nDashboard: https://theatelier-ta.com/analyticsDashboard.html\n\n' +
      '— The Atelier Site';

    ADMINS.forEach(function(a) {
      sendAdminEmail(a.email, subject, body, {
        order_id: order.id || '',
        type: order.type || '',
        customer: order.customer || ''
      });
    });

    var waMsg = '🏷️ *New Sticker Order at The Atelier*\n\n' +
      '*ID:* ' + (order.id || '—') + '\n' +
      '*Type:* ' + (order.type || '—') + '\n' +
      '*Sticker:* ' + (order.stickerName || '—') + '\n' +
      '*Customer:* ' + (order.customer || '—') + '\n' +
      '*Phone:* ' + (order.phone || '—') + '\n\n' +
      'Review: https://theatelier-ta.com/analyticsDashboard.html';

    queueWhatsAppNotification(subject, waMsg, 'sticker-order', order.id);
  };

  // INQUIRY (contact form)
  window.notifyAdminsOfInquiry = function(inquiry) {
    if (!inquiry) return;
    var subject = '✉️ New Inquiry: ' + (inquiry.subject || 'General') + ' — from ' + (inquiry.name || 'customer');
    var body =
      'A new inquiry has been submitted at The Atelier.\n\n' +
      '──────── INQUIRY ────────\n' +
      'From: ' + (inquiry.name || '—') + '\n' +
      'Email: ' + (inquiry.email || '—') + '\n' +
      'Phone: ' + (inquiry.phone || '—') + '\n' +
      'Subject: ' + (inquiry.subject || '—') + '\n' +
      'Date: ' + (inquiry.date || new Date().toLocaleDateString()) + '\n' +
      '\n──────── MESSAGE ────────\n' +
      (inquiry.message || '—') + '\n\n' +
      '──────── ACTION NEEDED ────────\n' +
      'Please respond to this customer within 24 hours.\n' +
      'You can reply directly to this email (Reply-To is set to ' + (inquiry.email || 'customer email') + ')\n\n' +
      'Dashboard: https://theatelier-ta.com/analyticsDashboard.html\n\n' +
      '— The Atelier Site';

    ADMINS.forEach(function(a) {
      var fd = new FormData();
      fd.append('_subject', subject);
      fd.append('_captcha', 'false');
      fd.append('_template', 'box');
      fd.append('_replyto', inquiry.email || '');
      fd.append('name', inquiry.name || 'Customer');
      fd.append('email', inquiry.email || 'noreply@theatelier-ta.com');
      fd.append('phone', inquiry.phone || '');
      fd.append('subject_line', inquiry.subject || '');
      fd.append('message', body);

      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(a.email), {
        method: 'POST', body: fd
      }).then(function(r) { return r.json(); })
        .then(function(d) { console.log('[AdminNotify] Inquiry email to ' + a.email + ':', d && d.success ? 'OK' : 'pending'); })
        .catch(function(e) { console.warn('[AdminNotify] Inquiry email failed:', e); });
    });

    var waMsg = '✉️ *New Inquiry at The Atelier*\n\n' +
      '*From:* ' + (inquiry.name || '—') + '\n' +
      '*Email:* ' + (inquiry.email || '—') + '\n' +
      '*Phone:* ' + (inquiry.phone || '—') + '\n' +
      '*Subject:* ' + (inquiry.subject || '—') + '\n\n' +
      '*Message:*\n' + (inquiry.message || '—').substring(0, 400) +
      ((inquiry.message || '').length > 400 ? '…' : '') + '\n\n' +
      'Dashboard: https://theatelier-ta.com/analyticsDashboard.html';

    queueWhatsAppNotification(subject, waMsg, 'inquiry', inquiry.id || Date.now());
  };

  // Utility: expose admin contacts for dashboard use
  window.ATELIER_ADMINS = ADMINS;
})();

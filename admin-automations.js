// ═══════════════════════════════════════════════════════════════════
// ATELIER ADMIN AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════
// This module adds to the admin-notify pipeline:
//   1. Stock auto-deduction when orders placed
//   2. Stock auto-restoration when orders cancelled
//   3. Low-stock alerts (<3 units → email both admins)
//   4. Invoice PDF generation (jsPDF, browser-side)
//   5. Shipping label PDF generation
//   6. Weekly digest email (every Monday 9am NPT)
//   7. Auto-review request 7 days after delivery
//   8. Fulfillment checklist state persistence
// ═══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var ADMINS = [
    { name: 'Salon', email: 'sodarisalon26@gmail.com', phone: '9779742590718' },
    { name: 'Tsering', email: 'tseringdong1@gmail.com', phone: '9779808384686' }
  ];

  // ── STOCK MANAGEMENT ──────────────────────────────────────────────

  // Find a product by its cart ID (format: "productId-size")
  function findProductByCartItemId(cartItemId) {
    try {
      var products = JSON.parse(localStorage.getItem('atelier_admin_products') || '[]');
      // Cart ID format: "123-M" — the part before the last dash is the product ID
      var pid = cartItemId.replace(/-[A-Z]+$/i, '');
      return products.find(function(p) { return String(p.id) === pid; });
    } catch(e) { return null; }
  }

  // Deduct stock when an order is placed
  window.deductStockForOrder = function(cart) {
    if (!cart || !cart.length) return;
    try {
      var products = JSON.parse(localStorage.getItem('atelier_admin_products') || '[]');
      var lowStockAlerts = [];

      cart.forEach(function(item) {
        var pid = (item.id || '').replace(/-[A-Z]+$/i, '');
        var idx = products.findIndex(function(p) { return String(p.id) === pid; });
        if (idx < 0) return;

        var prev = parseInt(products[idx].stock || 0);
        var qty = parseInt(item.quantity || 1);
        var newStock = Math.max(0, prev - qty);
        products[idx].stock = newStock;

        // Auto-mark out-of-stock
        if (newStock === 0) {
          products[idx].status = 'out-of-stock';
        }

        // Record low-stock alerts (1-3 units remaining)
        if (newStock > 0 && newStock < 4 && prev >= 4) {
          lowStockAlerts.push({ name: products[idx].name, stock: newStock, sku: products[idx].sku });
        }
      });

      localStorage.setItem('atelier_admin_products', JSON.stringify(products));

      // Send low-stock alerts (silent email to both admins)
      if (lowStockAlerts.length) sendLowStockAlert(lowStockAlerts);
    } catch(e) { console.warn('[Automations] Stock deduction failed:', e); }
  };

  // Restore stock when an order is cancelled or rejected
  window.restoreStockForOrder = function(order) {
    if (!order || !order.items) return;
    try {
      var products = JSON.parse(localStorage.getItem('atelier_admin_products') || '[]');
      order.items.forEach(function(item) {
        var pid = (item.id || '').replace(/-[A-Z]+$/i, '');
        var idx = products.findIndex(function(p) { return String(p.id) === pid; });
        if (idx < 0) return;
        var prev = parseInt(products[idx].stock || 0);
        products[idx].stock = prev + parseInt(item.quantity || 1);
        // Re-activate if it was out-of-stock
        if (products[idx].status === 'out-of-stock' && products[idx].stock > 0) {
          products[idx].status = 'active';
        }
      });
      localStorage.setItem('atelier_admin_products', JSON.stringify(products));
    } catch(e) { console.warn('[Automations] Stock restore failed:', e); }
  };

  // Email admins when stock is low
  function sendLowStockAlert(items) {
    var subject = '⚠️ Low Stock Alert — ' + items.length + ' item(s)';
    var body = 'The following items are running low at The Atelier:\n\n';
    items.forEach(function(i) {
      body += '• ' + i.name + (i.sku ? ' (' + i.sku + ')' : '') + ' — only ' + i.stock + ' left\n';
    });
    body += '\nPlease restock these items soon to avoid missing sales.\n\n';
    body += 'Dashboard: https://theatelier-ta.com/analyticsDashboard.html\n\n— The Atelier Site';

    ADMINS.forEach(function(a) {
      var fd = new FormData();
      fd.append('_subject', subject);
      fd.append('_captcha', 'false');
      fd.append('_template', 'box');
      fd.append('name', 'The Atelier Site');
      fd.append('email', 'noreply@theatelier-ta.com');
      fd.append('message', body);
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(a.email), { method: 'POST', body: fd })
        .catch(function() {});
    });
  }

  // ── INVOICE PDF GENERATION ────────────────────────────────────────
  // Creates a professional invoice PDF using jsPDF
  // Returns a Promise that resolves to a Blob
  window.generateInvoicePDF = function(order) {
    return new Promise(function(resolve, reject) {
      if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        // Load jsPDF on demand
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() { buildInvoice(order, resolve, reject); };
        script.onerror = function() { reject(new Error('Could not load jsPDF')); };
        document.head.appendChild(script);
      } else {
        buildInvoice(order, resolve, reject);
      }
    });
  };

  function buildInvoice(order, resolve, reject) {
    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'mm', format: 'a4' });

      // Colors matching site aesthetic
      var ink = [14, 14, 13];
      var accent = [139, 94, 60];
      var warm = [200, 184, 154];
      var grey = [138, 127, 115];

      var pageW = 210, pageH = 297;
      var margin = 20;

      // ─── HEADER ────────────────────────────
      doc.setFont('times', 'italic');
      doc.setFontSize(28);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text('The Atelier', margin, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('LUXURY READY-TO-WEAR', margin, 36);
      doc.text('Kathmandu, Nepal', margin, 40);
      doc.text('sodarisalon26@gmail.com · +977-9742590718', margin, 44);

      // INVOICE title on right
      doc.setFont('times', 'italic');
      doc.setFontSize(20);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text('INVOICE', pageW - margin, 30, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('Order ID: ' + (order.id || '—'), pageW - margin, 36, { align: 'right' });
      doc.text('Date: ' + (order.date || new Date().toLocaleDateString('en-GB')), pageW - margin, 40, { align: 'right' });
      if (order.time) doc.text('Time: ' + order.time, pageW - margin, 44, { align: 'right' });

      // Horizontal line
      doc.setDrawColor(warm[0], warm[1], warm[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, 52, pageW - margin, 52);

      // ─── CUSTOMER INFO ────────────────────
      var y = 62;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('BILLED TO', margin, y);
      doc.text('PAYMENT', pageW / 2 + 10, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text(order.customer || '—', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(getPaymentLabel(order.paymentMethod) || '—', pageW / 2 + 10, y);

      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      if (order.email) { doc.text(order.email, margin, y); y += 4; }
      if (order.phone) { doc.text(order.phone, margin, y); y += 4; }
      if (order.address) { doc.text(order.address, margin, y); y += 4; }
      if (order.city) { doc.text((order.city || '') + (order.zip ? ', ' + order.zip : ''), margin, y); y += 4; }
      if (order.country) { doc.text(order.country, margin, y); y += 4; }

      // Payment status on right
      var payStatus = order.paymentVerified ? 'VERIFIED' : (order.status === 'payment-rejected' ? 'REJECTED' : 'PENDING');
      var payColor = order.paymentVerified ? [46, 125, 50] : order.status === 'payment-rejected' ? [183, 28, 28] : [245, 127, 23];
      doc.setTextColor(payColor[0], payColor[1], payColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Status: ' + payStatus, pageW / 2 + 10, 71);

      // ─── ITEMS TABLE ─────────────────────
      y = Math.max(y + 8, 105);
      doc.setDrawColor(warm[0], warm[1], warm[2]);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('ITEM', margin, y);
      doc.text('QTY', pageW - margin - 70, y, { align: 'right' });
      doc.text('UNIT PRICE', pageW - margin - 30, y, { align: 'right' });
      doc.text('TOTAL', pageW - margin, y, { align: 'right' });

      y += 3;
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      // Items
      var items = order.items || [];
      // If no items array but single product → synthesize
      if (!items.length && order.product) {
        items = [{ name: order.product, quantity: order.qty || 1, price: order.amount || 0 }];
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(ink[0], ink[1], ink[2]);

      var subtotal = 0;
      items.forEach(function(item) {
        var itemName = (item.name || 'Item').substring(0, 50);
        var itemQty = parseInt(item.quantity || 1);
        var itemPrice = parseFloat(item.price || 0);
        var itemTotal = itemQty * itemPrice;
        subtotal += itemTotal;

        doc.text(itemName, margin, y);
        doc.text(String(itemQty), pageW - margin - 70, y, { align: 'right' });
        doc.text('NRs. ' + itemPrice.toLocaleString(), pageW - margin - 30, y, { align: 'right' });
        doc.text('NRs. ' + itemTotal.toLocaleString(), pageW - margin, y, { align: 'right' });
        y += 6;
      });

      // ─── TOTALS ───────────────────────────
      y += 3;
      doc.setDrawColor(warm[0], warm[1], warm[2]);
      doc.line(pageW / 2, y, pageW - margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('Subtotal', pageW / 2 + 10, y);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text('NRs. ' + subtotal.toLocaleString(), pageW - margin, y, { align: 'right' });
      y += 6;

      if (order.shipping || order.shippingCost) {
        doc.setTextColor(grey[0], grey[1], grey[2]);
        doc.text('Shipping', pageW / 2 + 10, y);
        doc.setTextColor(ink[0], ink[1], ink[2]);
        var ship = parseFloat(order.shippingCost || order.shipping || 0);
        doc.text(ship === 0 ? 'Complimentary' : 'NRs. ' + ship.toLocaleString(), pageW - margin, y, { align: 'right' });
        y += 6;
      }

      if (order.tax) {
        doc.setTextColor(grey[0], grey[1], grey[2]);
        doc.text('Tax (13% VAT)', pageW / 2 + 10, y);
        doc.setTextColor(ink[0], ink[1], ink[2]);
        doc.text('NRs. ' + parseFloat(order.tax).toLocaleString(), pageW - margin, y, { align: 'right' });
        y += 6;
      }

      y += 2;
      doc.setDrawColor(ink[0], ink[1], ink[2]);
      doc.setLineWidth(0.5);
      doc.line(pageW / 2, y, pageW - margin, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text('TOTAL', pageW / 2 + 10, y);
      var totalAmount = parseFloat(order.amount || order.total || subtotal);
      doc.text('NRs. ' + totalAmount.toLocaleString(), pageW - margin, y, { align: 'right' });

      // ─── FOOTER ───────────────────────────
      y = pageH - 40;
      doc.setDrawColor(warm[0], warm[1], warm[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(grey[0], grey[1], grey[2]);
      doc.text('Thank you for shopping with The Atelier', pageW / 2, y, { align: 'center' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Questions about your order? Email sodarisalon26@gmail.com or WhatsApp +977-9742590718', pageW / 2, y, { align: 'center' });
      y += 4;
      doc.text('Track your order: https://theatelier-ta.com/trackOrder.html', pageW / 2, y, { align: 'center' });
      y += 4;
      doc.text('Returns accepted within 3 days in original condition', pageW / 2, y, { align: 'center' });

      var blob = doc.output('blob');
      resolve(blob);
    } catch(e) {
      console.error('[Invoice] Build failed:', e);
      reject(e);
    }
  }

  function getPaymentLabel(m) {
    var map = { 'esewa':'eSewa', 'khalti':'Khalti', 'bank':'Bank Transfer', 'card':'Credit/Debit Card', 'cod':'Cash on Delivery' };
    return map[m] || m || 'Pending';
  }

  // ── SHIPPING LABEL PDF ─────────────────────────────────────────────
  window.generateShippingLabelPDF = function(order) {
    return new Promise(function(resolve, reject) {
      var build = function() {
        try {
          var jsPDF = window.jspdf.jsPDF;
          // 4x6 inch label size
          var doc = new jsPDF({ unit: 'in', format: [4, 6], orientation: 'portrait' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('FROM:', 0.25, 0.35);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text('The Atelier', 0.25, 0.55);
          doc.text('Kathmandu, Nepal', 0.25, 0.72);
          doc.text('+977-9742590718', 0.25, 0.89);

          doc.setDrawColor(0);
          doc.setLineWidth(0.02);
          doc.line(0.25, 1.1, 3.75, 1.1);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('TO:', 0.25, 1.35);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text((order.customer || '—').substring(0, 30), 0.25, 1.65);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          var addY = 1.95;
          if (order.address) { doc.text(String(order.address).substring(0, 40), 0.25, addY); addY += 0.25; }
          if (order.city || order.zip) { doc.text(((order.city || '') + ' ' + (order.zip || '')).trim(), 0.25, addY); addY += 0.25; }
          if (order.country) { doc.text(order.country, 0.25, addY); addY += 0.25; }
          if (order.phone) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Phone: ' + order.phone, 0.25, addY + 0.1);
          }

          // Order info at bottom
          doc.line(0.25, 4.5, 3.75, 4.5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('ORDER ID', 0.25, 4.75);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(14);
          doc.text(order.id || '—', 0.25, 5.05);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('DATE', 2.2, 4.75);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.text(order.date || new Date().toLocaleDateString('en-GB'), 2.2, 5.05);

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text('Handle with care — Luxury garment', 2, 5.75, { align: 'center' });

          resolve(doc.output('blob'));
        } catch(e) { reject(e); }
      };

      if (typeof window.jspdf === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = build;
        script.onerror = function() { reject(new Error('jsPDF load failed')); };
        document.head.appendChild(script);
      } else build();
    });
  };

  // ── WEEKLY DIGEST EMAIL ────────────────────────────────────────────
  // Triggered every Monday at 9am NPT when admin dashboard is opened
  window.checkAndSendWeeklyDigest = function() {
    try {
      var now = new Date();
      var npt = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.75 * 3600000)); // UTC+5:45
      // Only send Monday (day 1) 9am-11am NPT
      if (npt.getDay() !== 1) return;
      if (npt.getHours() < 9 || npt.getHours() >= 12) return;

      // Don't send twice in the same week
      var lastSent = localStorage.getItem('atelier_digest_last_sent');
      if (lastSent) {
        var lastDate = new Date(parseInt(lastSent));
        var daysSince = (now.getTime() - lastDate.getTime()) / (86400000);
        if (daysSince < 6) return;
      }

      sendWeeklyDigest();
      localStorage.setItem('atelier_digest_last_sent', String(now.getTime()));
    } catch(e) { console.warn('[Digest] Check failed:', e); }
  };

  function sendWeeklyDigest() {
    try {
      var orders = JSON.parse(localStorage.getItem('atelier_admin_orders') || '[]');
      var customOrders = JSON.parse(localStorage.getItem('atelier_custom_orders') || '[]');
      var stickerOrders = JSON.parse(localStorage.getItem('atelier_sticker_orders') || '[]');
      var inquiries = JSON.parse(localStorage.getItem('atelier_inquiries') || '[]');
      var products = JSON.parse(localStorage.getItem('atelier_admin_products') || '[]');
      var notifs = JSON.parse(localStorage.getItem('atelier_admin_notifications') || '[]');

      var now = Date.now();
      var WEEK = 7 * 86400000;

      // Parse date from order (format: "13 Apr 2026")
      function parseOrderDate(o) {
        try {
          if (o.timestamp) return new Date(o.timestamp).getTime();
          if (o.date) return new Date(o.date).getTime();
          return 0;
        } catch(e) { return 0; }
      }

      var weekOrders = orders.filter(function(o) { return (now - parseOrderDate(o)) < WEEK; });
      var weekCustom = customOrders.filter(function(o) { return (now - parseOrderDate(o)) < WEEK; });
      var weekSticker = stickerOrders.filter(function(o) { return (now - parseOrderDate(o)) < WEEK; });

      var revenue = weekOrders.reduce(function(s, o) { return s + parseFloat(o.amount || 0); }, 0);
      var pendingAction = orders.filter(function(o) { return o.status === 'awaiting-verification' || o.status === 'pending'; }).length;
      var pendingCustom = customOrders.filter(function(o) { return o.status === 'pending' || o.status === 'pending-quote'; }).length;
      var unreadInquiries = inquiries.filter(function(i) { return i.status === 'unread'; }).length;
      var lowStock = products.filter(function(p) { return p.stock && p.stock < 4 && p.status === 'active'; });
      var pendingWhatsApp = notifs.filter(function(n) { return !n.whatsappSent; }).length;

      // Top 3 products this week
      var productSales = {};
      weekOrders.forEach(function(o) {
        (o.items || []).forEach(function(item) {
          var name = (item.name || '').replace(/\s*\([A-Z]+\)$/, '');
          productSales[name] = (productSales[name] || 0) + parseInt(item.quantity || 1);
        });
      });
      var topProducts = Object.keys(productSales)
        .map(function(k) { return [k, productSales[k]]; })
        .sort(function(a, b) { return b[1] - a[1]; })
        .slice(0, 3);

      var subject = '📊 The Atelier — Weekly Digest (' + new Date().toLocaleDateString('en-GB') + ')';
      var body =
        'Good Monday morning!\n\n' +
        'Here is your weekly summary for The Atelier.\n\n' +
        '──────── REVENUE ────────\n' +
        'Total (last 7 days):   NRs. ' + Math.round(revenue).toLocaleString() + '\n' +
        'Regular orders:        ' + weekOrders.length + '\n' +
        'Custom orders:         ' + weekCustom.length + '\n' +
        'Sticker orders:        ' + weekSticker.length + '\n' +
        '\n──────── TOP PRODUCTS ────────\n';

      if (topProducts.length) {
        topProducts.forEach(function(p, i) {
          body += (i+1) + '. ' + p[0] + ' — ' + p[1] + ' sold\n';
        });
      } else {
        body += 'No product sales yet this week.\n';
      }

      body += '\n──────── ACTION NEEDED ────────\n' +
        '• ' + pendingAction + ' orders awaiting verification\n' +
        '• ' + pendingCustom + ' custom orders need price quotes\n' +
        '• ' + unreadInquiries + ' unread inquiries\n' +
        '• ' + pendingWhatsApp + ' pending WhatsApp notifications\n';

      if (lowStock.length) {
        body += '\n──────── LOW STOCK ────────\n';
        lowStock.slice(0, 10).forEach(function(p) {
          body += '• ' + p.name + ' — ' + p.stock + ' left\n';
        });
      }

      body += '\n──────── DASHBOARD ────────\n' +
        'https://theatelier-ta.com/analyticsDashboard.html\n\n' +
        'Have a great week ahead!\n\n— The Atelier Site';

      ADMINS.forEach(function(a) {
        var fd = new FormData();
        fd.append('_subject', subject);
        fd.append('_captcha', 'false');
        fd.append('_template', 'box');
        fd.append('name', 'The Atelier Site');
        fd.append('email', 'noreply@theatelier-ta.com');
        fd.append('message', body);
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(a.email), { method: 'POST', body: fd })
          .catch(function() {});
      });

      console.log('[Digest] Weekly digest sent');
    } catch(e) { console.warn('[Digest] Send failed:', e); }
  }

  // ── REVIEW REQUEST AUTOMATION ─────────────────────────────────────
  // When admin marks order "completed/delivered", schedule a review request
  // email for 7 days later. Check on dashboard load.
  window.checkReviewFollowUps = function() {
    try {
      var orders = JSON.parse(localStorage.getItem('atelier_admin_orders') || '[]');
      var sent = JSON.parse(localStorage.getItem('atelier_review_requests_sent') || '[]');
      var now = Date.now();
      var WEEK = 7 * 86400000;

      orders.forEach(function(o) {
        if (sent.indexOf(o.id) !== -1) return;
        if (o.status !== 'completed' && o.status !== 'delivered') return;
        if (!o.email) return;

        // Use completedAt if available, otherwise parse date
        var completedTime = o.completedAt || o.verifiedAt || (o.date ? new Date(o.date).getTime() : 0);
        if (typeof completedTime === 'string') completedTime = new Date(completedTime).getTime();
        if (!completedTime) return;

        if (now - completedTime < WEEK) return; // Too soon
        if (now - completedTime > 30 * 86400000) { // Too late (>30 days), skip
          sent.push(o.id);
          return;
        }

        sendReviewRequest(o);
        sent.push(o.id);
      });

      localStorage.setItem('atelier_review_requests_sent', JSON.stringify(sent));
    } catch(e) { console.warn('[ReviewFollowUp] Check failed:', e); }
  };

  function sendReviewRequest(order) {
    var reviewUrl = 'https://theatelier-ta.com/leaveReview.html?order=' +
      encodeURIComponent(order.id || '') + '&email=' + encodeURIComponent(order.email || '');
    var subject = 'How was your experience with ' + (order.product || 'your order') + '?';
    var body =
      'Hi ' + (order.customer || 'there') + ',\n\n' +
      'Thank you for choosing The Atelier. Your order ' + (order.id || '') + ' was delivered a week ago — we hope you are loving it!\n\n' +
      'Would you mind sharing a short review? It takes 30 seconds:\n\n' +
      reviewUrl + '\n\n' +
      'You can rate your purchase, write a few words, and (if you like) add a photo of yourself wearing the piece.\n\n' +
      'Reviews help us improve and let other shoppers see real experiences.\n\n' +
      'With gratitude,\nThe Atelier\nsodarisalon26@gmail.com | +977-9742590718';

    var fd = new FormData();
    fd.append('_subject', subject);
    fd.append('_captcha', 'false');
    fd.append('_template', 'box');
    fd.append('_replyto', 'sodarisalon26@gmail.com');
    fd.append('name', order.customer || 'Customer');
    fd.append('email', order.email);
    fd.append('message', body);
    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(order.email), { method: 'POST', body: fd })
      .then(function() { console.log('[ReviewFollowUp] Sent to ' + order.email); })
      .catch(function() {});
  }

  // ── FULFILLMENT CHECKLIST ─────────────────────────────────────────
  // State stored in atelier_fulfillment_checklists keyed by order ID
  window.getFulfillmentChecklist = function(orderId) {
    try {
      var all = JSON.parse(localStorage.getItem('atelier_fulfillment_checklists') || '{}');
      return all[orderId] || {
        paymentVerified: false,
        itemPacked: false,
        labelPrinted: false,
        handedToCourier: false,
        customerNotified: false
      };
    } catch(e) { return {}; }
  };

  window.saveFulfillmentChecklist = function(orderId, checklist) {
    try {
      var all = JSON.parse(localStorage.getItem('atelier_fulfillment_checklists') || '{}');
      all[orderId] = checklist;
      localStorage.setItem('atelier_fulfillment_checklists', JSON.stringify(all));
    } catch(e) {}
  };

  // Expose for dashboard use
  window.ATELIER_ADMINS_CONTACTS = ADMINS;
})();

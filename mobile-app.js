/* ═══════════════════════════════════════════════════════════════════════════
   THE ATELIER — Mobile Tab Bar & App Enhancements
   ═══════════════════════════════════════════════════════════════════════════ */
(function() {
  // Only on mobile
  if (window.innerWidth > 768) return;

  // ── CREATE BOTTOM TAB BAR ──────────────────────────────────────────────
  var currentPage = location.pathname.split('/').pop() || 'index.html';

  // Detect active tab
  function isActive(pages) {
    for (var i = 0; i < pages.length; i++) {
      if (currentPage === pages[i] || currentPage.indexOf(pages[i].replace('.html','')) >= 0) return true;
    }
    return false;
  }

  var tabs = [
    { icon: '◈', label: 'Home', href: 'index.html', pages: ['index.html', ''] },
    { icon: '◧', label: 'Shop', href: 'collection.html', pages: ['collection.html', 'productDetail.html'] },
    { icon: '✦', label: 'Custom', href: 'customize.html', pages: ['customize.html'] },
    { icon: '◫', label: 'Bag', href: 'shoppingCart.html', pages: ['shoppingCart.html', 'checkout.html'], hasBadge: true },
    { icon: '≡', label: 'More', href: '#more', pages: [] }
  ];

  var bar = document.createElement('div');
  bar.id = 'mobile-tab-bar';
  
  var html = '';
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    var active = isActive(t.pages) ? ' tab-active' : '';
    var badge = t.hasBadge ? '<span class="tab-badge" id="tab-cart-badge">0</span>' : '';
    html += '<a href="' + t.href + '" class="' + active + '">' +
      '<span class="tab-icon">' + t.icon + '</span>' +
      badge +
      '<span>' + t.label + '</span>' +
    '</a>';
  }
  bar.innerHTML = html;
  document.body.appendChild(bar);

  // ── "MORE" TAB — show a bottom sheet ───────────────────────────────────
  var moreLink = bar.querySelector('a[href="#more"]');
  if (moreLink) {
    moreLink.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMoreSheet();
    });
  }

  // Create the "More" bottom sheet
  var sheet = document.createElement('div');
  sheet.id = 'mobile-more-sheet';
  sheet.style.cssText = 'display:none;position:fixed;inset:0;z-index:1000;';
  sheet.innerHTML = 
    '<div id="more-sheet-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.4);opacity:0;transition:opacity 0.3s;"></div>' +
    '<div id="more-sheet-content" style="position:absolute;bottom:0;left:0;right:0;background:var(--cream,#f4f1ec);border-radius:16px 16px 0 0;padding:1.5rem 1.5rem calc(1.5rem + 64px + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);">' +
      '<div style="width:36px;height:4px;background:rgba(200,184,154,0.5);border-radius:2px;margin:0 auto 1.5rem;"></div>' +
      '<p style="font-size:0.55rem;letter-spacing:0.25em;text-transform:uppercase;color:#8a7f73;margin-bottom:1rem;">Explore</p>' +
      '<a href="aboutUs.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Our Story</a>' +
      '<a href="sustainability.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Sustainability</a>' +
      '<a href="press.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Press</a>' +
      '<p style="font-size:0.55rem;letter-spacing:0.25em;text-transform:uppercase;color:#8a7f73;margin-bottom:1rem;margin-top:1.5rem;">Support</p>' +
      '<a href="sizingGuide.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Sizing Guide</a>' +
      '<a href="shippingReturns.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Shipping & Returns</a>' +
      '<a href="careInstructions.html" style="display:block;padding:0.9rem 0;border-bottom:1px solid rgba(200,184,154,0.2);font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Care Instructions</a>' +
      '<a href="contactUs.html" style="display:block;padding:0.9rem 0;font-size:0.8rem;color:#0e0e0d;text-decoration:none;letter-spacing:0.08em;">Contact Us</a>' +
    '</div>';
  document.body.appendChild(sheet);

  // Highlight active link in More sheet
  var sheetLinks = sheet.querySelectorAll('a');
  for (var j = 0; j < sheetLinks.length; j++) {
    var href = sheetLinks[j].getAttribute('href');
    if (currentPage === href) {
      sheetLinks[j].style.color = '#8b5e3c';
      sheetLinks[j].style.fontWeight = '500';
      // Also mark More tab as active
      if (moreLink) moreLink.classList.add('tab-active');
    }
  }

  var sheetOpen = false;
  function toggleMoreSheet() {
    sheetOpen = !sheetOpen;
    if (sheetOpen) {
      sheet.style.display = 'block';
      setTimeout(function() {
        document.getElementById('more-sheet-backdrop').style.opacity = '1';
        document.getElementById('more-sheet-content').style.transform = 'translateY(0)';
      }, 10);
    } else {
      document.getElementById('more-sheet-backdrop').style.opacity = '0';
      document.getElementById('more-sheet-content').style.transform = 'translateY(100%)';
      setTimeout(function() { sheet.style.display = 'none'; }, 350);
    }
  }
  // Close on backdrop tap
  var backdrop = document.getElementById('more-sheet-backdrop');
  if (backdrop) backdrop.addEventListener('click', toggleMoreSheet);

  // ── UPDATE CART BADGE IN TAB BAR ───────────────────────────────────────
  function updateTabCartBadge() {
    try {
      var cart = JSON.parse(localStorage.getItem('atelier_cart') || '[]');
      var count = cart.reduce(function(s, i) { return s + (i.quantity || 0); }, 0);
      var badge = document.getElementById('tab-cart-badge');
      if (!badge) return;
      if (count > 0) {
        badge.style.display = 'flex';
        badge.textContent = count;
      } else {
        badge.style.display = 'none';
      }
    } catch(e) {}
  }
  updateTabCartBadge();
  // Poll for cart changes (handles add-to-bag from other scripts)
  setInterval(updateTabCartBadge, 1000);

  // ── HIDE TAB BAR ON SCROLL DOWN, SHOW ON SCROLL UP ────────────────────
  var lastScroll = 0;
  var tabBar = document.getElementById('mobile-tab-bar');
  window.addEventListener('scroll', function() {
    var current = window.pageYOffset || document.documentElement.scrollTop;
    if (current > lastScroll && current > 100) {
      tabBar.style.transform = 'translateY(100%)';
      tabBar.style.transition = 'transform 0.3s ease';
    } else {
      tabBar.style.transform = 'translateY(0)';
    }
    lastScroll = current <= 0 ? 0 : current;
  }, { passive: true });

  // ── PREVENT INPUT ZOOM ON iOS ──────────────────────────────────────────
  // Already handled by font-size: 16px in CSS

  // ── SWIPE-BACK GESTURE HINT ────────────────────────────────────────────
  var touchStartX = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var diff = e.changedTouches[0].clientX - touchStartX;
    // If swiped right from left edge
    if (touchStartX < 25 && diff > 80) {
      window.history.back();
    }
  }, { passive: true });

})();

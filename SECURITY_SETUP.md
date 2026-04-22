# 🔐 The Atelier — Backend Security Setup Guide

**Complete this setup BEFORE May 14, 2026** — that's when your current Firebase rules expire and the site will break if nothing is done.

Estimated time: **15-20 minutes** total.

---

## Overview

You're doing two things:

1. **Enable Firebase Authentication** — so admins log in with real, server-verified accounts
2. **Lock down Firebase Realtime Database rules** — replace expiring test-mode rules with production rules

Everything else (the code changes in `adminLogin.html` + `analyticsDashboard.html`) is already done and deployed. You just need to configure things in the Firebase Console.

---

## Step 1: Enable Firebase Authentication (5 min)

1. Go to https://console.firebase.google.com
2. Select your project: **the-atelier-ce832**
3. In the left sidebar, click **Authentication**
4. Click **Get started** (if you haven't already enabled it)
5. In the **Sign-in method** tab, click **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

Email/Password authentication is now enabled on your project.

---

## Step 2: Create admin user accounts (5 min)

Still in the **Authentication** section of Firebase Console:

1. Click the **Users** tab
2. Click **Add user** button (top-right)
3. Enter:
   - **Email:** `sodarisalon26@gmail.com`
   - **Password:** (pick a strong password, at least 8 chars with letters + numbers)
4. Click **Add user**
5. Repeat for the second admin:
   - **Email:** `tseringdong1@gmail.com`
   - **Password:** (pick a different strong password)

**IMPORTANT:** Write down both passwords somewhere safe (password manager, or on paper in a drawer). Firebase does NOT store these in a recoverable way — if you forget, you'll have to use the "Forgot Password" flow to reset.

---

## Step 3: Replace Firebase Realtime Database rules (5 min)

1. In Firebase Console left sidebar, click **Realtime Database**
2. Click the **Rules** tab at the top
3. You'll see the current rules (likely something like `".read": "now < ..."`, `".write": "now < ..."` which expires May 14)
4. **Delete everything** in that rule editor
5. Open the file `firebase-rules-production.json` from this repo
6. **Copy the entire contents** of that file
7. **Paste it** into the Firebase rules editor
8. Click **Publish** button (top-right)

You should see a green "Rules published successfully" toast.

---

## Step 4: Test the setup (5 min)

### Test 1: Admin login works
1. Open https://theatelier-ta.com/adminLogin.html
2. Sign in with `sodarisalon26@gmail.com` + the password you just set
3. You should reach the admin dashboard
4. Open DevTools (F12) → Console — if you see `[Firebase] Connected` with no red errors, ✓ success

### Test 2: Customer can still place orders
1. Open the public site in an incognito/private window (so you're not logged in as admin)
2. Add a product to cart
3. Proceed to checkout
4. Fill in details, upload a dummy payment proof image
5. Click "Place Order"
6. Should succeed — order lands in your admin dashboard

### Test 3: Customer can still submit inquiry
1. Incognito window
2. Open contact page
3. Submit a test inquiry
4. Should appear in admin dashboard under Inquiries

### Test 4: Public visitor CAN'T read admin data
1. Open incognito window, open DevTools Console
2. Try to read orders directly:
   ```javascript
   fetch('https://the-atelier-ce832-default-rtdb.asia-southeast1.firebasedatabase.app/orders.json').then(r => r.json()).then(console.log)
   ```
3. You should get `{ "error": "Permission denied" }` ✓

---

## Step 5: Delete the default insecure password (2 min)

The code currently has a fallback "legacy login" that uses a hardcoded default password `atelier2025` from localStorage. After you've confirmed Firebase Auth is working, disable this fallback:

1. Open `adminLogin.html` on GitHub (or ask Claude to do it)
2. Find the line containing `atelier2025`
3. Remove the "legacy fallback" block (the code is marked with a comment)

Or just tell Claude "remove the legacy login fallback" and it'll be done.

---

## What the rules DO and DON'T allow

| Data | Public read | Public write | Admin read | Admin write |
|---|---|---|---|---|
| Products | ✓ | ✗ | ✓ | ✓ |
| Collections, Reviews, Announcements, Promotions | ✓ | ✗ | ✓ | ✓ |
| Orders | ✗ | ✓ (create) | ✓ | ✓ |
| Custom orders, Sticker orders | ✗ | ✓ (create) | ✓ | ✓ |
| Inquiries | ✗ | ✓ (create) | ✓ | ✓ |
| Pending carts | ✗ | ✓ | ✓ | ✓ |
| Customers | ✗ | ✓ (auto-add) | ✓ | ✓ |
| Admin users, Admin notifications | ✗ | ✗ | ✓ | ✓ |
| Visitors analytics | ✗ | ✓ (track) | ✓ | — |

The gist: **Store data (products, reviews) is publicly readable. Private data (orders, customer info, inquiries) is admin-only. Customers can WRITE their own orders/inquiries but can't READ anyone else's.**

---

## Troubleshooting

### "I can't log in even with the right password"
- Make sure you ENABLED email/password sign-in in Step 1
- Check that you created the user in Step 2 (not just added as admin in localStorage)
- Password might have been auto-capitalized on mobile — type it in desktop first to verify

### "Orders aren't coming through after I applied the rules"
- Check browser console (F12) for errors
- Verify the rule JSON you pasted is valid (Firebase would have refused to publish otherwise)
- Double-check the DB_URL in `checkout.html` matches your Firebase project
- Make sure the order object has `id`, `customer`, and `createdAt` fields — the validation rule requires those

### "Admin dashboard is empty"
- You may have been auto-signed-out. Sign out, sign back in.
- Open DevTools → Application → IndexedDB → firebase-auth — check if there's a valid user session
- Try running `firebase.auth().currentUser` in DevTools — should return a user object

### "I forgot my password"
- Go to `adminLogin.html`
- Enter your email
- Click "Forgot password?"
- Firebase will send a reset email to that address

---

## After Setup

Your site is now properly secured:
- ✓ Firebase rules don't expire (replaced test-mode with production rules)
- ✓ Admin access requires server-verified authentication
- ✓ Customer data protected from public access
- ✓ Public checkout/inquiry flows still work
- ✓ Password reset available via email

If you later want a full backend (Cloud Functions for server-side email, scheduled cron jobs, payment gateway webhooks), see the "Option A" path we discussed — it's a next-level upgrade but not needed for basic security.

---

Need help with any step? Ping Claude and share a screenshot of what you see.

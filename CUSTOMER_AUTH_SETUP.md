# Customer Login (Magic Link) — Setup Guide

The code is built and deployed. To activate, you need to do **5 things in Firebase Console** (one-time, ~5 minutes total).

---

## 1. Enable Email Link sign-in

1. Go to https://console.firebase.google.com/
2. Select project **the-atelier-ce832**
3. In the left sidebar, click **Authentication**
4. Click the **Sign-in method** tab
5. Find **"Email/Password"** in the list and click on it
6. Toggle ON the option **"Email link (passwordless sign-in)"** (not just the regular Email/Password — both checkboxes should be on)
7. Click **Save**

---

## 2. Authorize your domain for sign-in

1. Still in Authentication, click the **Settings** tab
2. Scroll down to **Authorized domains**
3. Click **Add domain**
4. Enter: `theatelier-ta.com`
5. Click Add
6. Verify these are in the list:
   - `theatelier-ta.com`
   - `the-atelier-ce832.firebaseapp.com` (already there by default)
   - `localhost` (already there by default)

---

## 3. Customize the sign-in email template (optional but recommended)

The default email Firebase sends looks generic. To make it match your brand:

1. In Authentication → **Templates** tab
2. Click **Email link sign-in**
3. Click the pencil/edit icon
4. Customize:
   - **Sender name:** `The Atelier`
   - **Subject:** `Sign in to The Atelier`
   - **Message body:** (Firebase keeps the magic link automatically — you can rewrite the surrounding text)
5. Click Save

---

## 4. Apply the updated Firebase security rules

Go to **Realtime Database → Rules** and add these blocks (or paste the full updated `firebase-rules-production.json` from the repo):

```json
"customer_orders": {
  ".read": false,
  ".write": false,
  "$emailHash": {
    ".read": "auth != null",
    ".write": true
  }
}
```

Then click **Publish**.

---

## 5. Test it

1. Open https://theatelier-ta.com/customerLogin.html in an incognito window
2. Enter your email
3. Tap "Send Magic Link"
4. Check your inbox (may take 30 seconds; check spam too)
5. Click the link in the email
6. You should be signed in and redirected to "My Orders"
7. Sign out and try again — the second time should be even faster

---

## How it works

**Customer side:**
- Customer enters email → Firebase emails them a sign-in link
- Customer clicks link → Firebase verifies and signs them in
- Customer is redirected to `myOrders.html`
- They see all their past orders matching their email
- They can track each order, leave reviews on completed ones, etc.

**Admin side (you):**
- No change in your workflow
- When you create orders (online checkout, manual entry), the system writes a `customer_orders` index entry keyed by email hash
- This is what lets the customer find their orders when signed in

**Security:**
- Real Firebase Authentication — no passwords to manage or leak
- Magic links expire after 1 hour
- Customer can only see orders matching their email
- Admin orders/customers data still protected (admin auth required)
- Sensitive data (payment proofs, full address) never exposed to customer — only safe-to-show fields

**What customers see:**
- Order ID, product name + image, date, amount, status
- Tracking number (if you've added one)
- Customer-facing notes
- Buttons to track each order or leave a review (if completed)

**What customers DON'T see:**
- Payment proof screenshots
- Full shipping address
- Internal admin notes
- Other customers' orders

---

## Troubleshooting

**"Sign-in not yet configured for this domain"**
→ You missed Step 2 (authorize domain). Add `theatelier-ta.com` to Authorized domains.

**"Email link sign-in is not enabled"**
→ You missed Step 1. Toggle ON "Email link (passwordless sign-in)" in Email/Password sign-in method.

**Email never arrives**
→ Check spam folder. Wait up to 2 minutes. Try again. Check Firebase Console → Authentication → Users to see if anything was created.

**Customer signs in but sees no orders**
→ Their orders were placed before this feature went live, so they're not in the `customer_orders` index. Either:
- Have them place a new order to test
- Manually populate the index for old orders (one-time migration script — let Claude know if you want this)

---

## Quotas (free tier)

Firebase Email Link sign-in is **free** with these limits:
- 10,000 sign-in emails per month
- More than enough for a luxury brand at any reasonable scale

If you ever exceed, paid tier is ~$0.0006 per email — negligible.

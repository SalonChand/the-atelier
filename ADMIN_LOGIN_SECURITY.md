# 🔐 Admin Login Hardening — Setup & Usage Guide

This guide covers the new secret-URL + kill-switch system for admin login.

---

## 🆕 Your new admin login URL

**Bookmark this — it's your only way in:**

```
https://theatelier-ta.com/atelier-ta-portal-x7k2m9.html
```

Save it on:
- Your phone home screen / bookmarks
- Tsering's phone
- Your laptop browser bookmarks
- A password manager (1Password, Bitwarden) — most secure

The old URL `/adminLogin.html` now shows a 404 page to public visitors. It's no longer functional.

---

## 🚨 The recovery URL — save this somewhere safe

**Only use this if you accidentally lock yourself out:**

```
https://theatelier-ta.com/atelier-ta-portal-x7k2m9.html?recover=ATELIER_RECOVERY_2026
```

This URL **bypasses the kill switch**. After signing in via this URL, go to Security panel and re-enable login.

**Where to save it:**
- Encrypted notes app on your phone
- Password manager (under "Atelier Recovery")
- A piece of paper in a safe place

**DO NOT:**
- Email it to yourself (your email could be compromised)
- Save it in plain text on your phone
- Share it with non-admins

---

## 🔄 The Kill Switch — Daily Use

A new **Security panel** has been added to your admin sidebar (under "Access" → "🔒 Security").

### What's there:

1. **Login Kill Switch (toggle)**
   - Green = Enabled (admin login works normally)
   - Red = Disabled (login page shows "Login Disabled" message, refuses all attempts)

2. **Admin Login URL** — your secret URL with copy button

3. **Recovery URL** — emergency bypass with copy button

4. **Your Session info** — shows who's currently signed in

### When to flip the kill switch OFF:

- **End of business day** — turn it OFF when no admin should be logging in
- **When traveling** — protects against someone with your password trying to log in
- **After any suspicious activity** — block attackers immediately
- **Suspected credential leak** — instant lockdown until you figure out what happened

### When to flip it back ON:

- **Right before you need to sign in** — flip ON, sign in, flip OFF after
- **Or during business hours** if you have multiple people working

---

## ⚠️ Avoiding lockout

**The risk:** You disable login, then your browser session expires (rare but possible), and now you can't get back in.

**The mitigations (in order of preference):**

1. **Stay logged in.** Firebase sessions are very persistent. Don't manually sign out unless you mean to.

2. **Use the recovery URL.** This bypasses the kill switch entirely. Save it now in a place you'll find later.

3. **Have Tsering as a backup.** If you lock yourself out, Tsering may still have an active session and can re-enable login from her dashboard.

4. **Last resort.** If both admins are locked out and you can't find the recovery URL, you can edit the rule directly in Firebase Console:
   - Go to Firebase Console → Realtime Database → Data
   - Navigate to `admin_login_enabled` (if it exists)
   - Change value to `true` (or delete it)
   - Now the login form will show normally again

---

## 📋 First-time setup checklist

- [ ] Apply the updated Firebase rules (add `admin_login_enabled` block — see below)
- [ ] Bookmark the new admin URL on phone + laptop
- [ ] Save the recovery URL in your password manager
- [ ] Tell Tsering the new URL (in person or via secure channel — NOT email/SMS)
- [ ] Try the new URL once to confirm login works
- [ ] Verify the old URL `/adminLogin.html` shows a 404 page
- [ ] (Optional) Flip the kill switch OFF, then back ON, to confirm both states work
- [ ] (Optional) Test the recovery URL — it should show a yellow "Recovery mode" banner

---

## 🔧 Firebase rule update

Add this block to your Firebase rules (alongside your existing rules):

```json
"admin_login_enabled": {
  ".read": true,
  ".write": "auth != null"
}
```

Read is public so the login page can check the switch without being logged in. Write requires authentication so only admins can change it.

The full updated `firebase-rules-production.json` in your repo has this already.

---

## 🧠 Why this works (security model)

**Layer 1 — Obscurity:**
The actual login page is at an unguessable URL. Bots scanning for `/admin/login`, `/wp-admin`, `/adminLogin.html` etc. find nothing.

**Layer 2 — Kill switch:**
Even if someone discovers your secret URL (e.g., looking over your shoulder), the kill switch can lock the form down.

**Layer 3 — Firebase auth:**
Even with the URL AND the form unlocked, attackers still need correct email + password.

**Layer 4 — Firebase rules:**
Even with valid auth, the database rules restrict what data can be accessed.

**Each layer alone is breakable.** Together they make casual attacks impossible and serious attacks impractical.

---

## 🔄 Rotating the secret URL

If you ever suspect the URL has leaked, you can rotate it:

1. Tell Claude: "Rotate admin login URL"
2. Claude will rename `atelier-ta-portal-x7k2m9.html` to a new random slug
3. Update the 404 stub at the old slug
4. Update the Security panel display
5. Bookmark the new URL

The kill switch and recovery code can be rotated similarly if needed.

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/schema');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ─── Config ──────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI  || 'http://localhost:3001/api/auth/google/callback';

const APPLE_CLIENT_ID      = process.env.APPLE_CLIENT_ID      || ''; // Service ID (e.g. com.yourapp.service)
const APPLE_TEAM_ID        = process.env.APPLE_TEAM_ID        || '';
const APPLE_KEY_ID         = process.env.APPLE_KEY_ID         || '';
const APPLE_PRIVATE_KEY    = (process.env.APPLE_PRIVATE_KEY   || '').replace(/\\n/g, '\n');
const APPLE_REDIRECT_URI   = process.env.APPLE_REDIRECT_URI   || 'http://localhost:3001/api/auth/apple/callback';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find or create a user from OAuth provider data.
 * OAuth users get a random password hash (they never use password login).
 */
function findOrCreateOAuthUser(db, { email, name, provider, providerId }) {
  // Check if user already exists
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user) {
    // Update provider info if not yet set
    if (!user.oauth_provider) {
      db.prepare('UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?')
        .run(provider, providerId, user.id);
    }
    return user;
  }

  // Create new OAuth user (no usable password hash)
  const fakePasswordHash = `oauth_${provider}_${Date.now()}`;
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, phone, role, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name || email.split('@')[0], email, fakePasswordHash, '', 'customer', provider, providerId);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

/**
 * Issue a signed JWT and redirect the browser to the frontend callback page.
 */
function redirectWithToken(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  // Redirect to frontend — it will read the token from the URL and store it
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect to Google
// GET /api/auth/google
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID in server/.env' });
  }

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Step 2: Google redirects back here with ?code=...
// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_cancelled`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code',
    });

    const { id_token } = tokenRes.data;

    // Verify and decode the ID token
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    const db = getDb();
    const user = findOrCreateOAuthUser(db, {
      email:      payload.email,
      name:       payload.name,
      provider:   'google',
      providerId: payload.sub,
    });
    db.close();

    redirectWithToken(res, user);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
});

// ─── Apple OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect to Apple
// GET /api/auth/apple
router.get('/apple', (req, res) => {
  if (!APPLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Apple OAuth is not configured. Set APPLE_CLIENT_ID in server/.env' });
  }

  const params = new URLSearchParams({
    client_id:     APPLE_CLIENT_ID,
    redirect_uri:  APPLE_REDIRECT_URI,
    response_type: 'code id_token',
    scope:         'name email',
    response_mode: 'form_post',
  });

  res.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
});

// Step 2: Apple POSTs back here with the code
// POST /api/auth/apple/callback
router.post('/apple/callback', async (req, res) => {
  const { code, id_token, error, user: userJson } = req.body;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=apple_cancelled`);
  }

  try {
    // Decode the Apple ID token (without verifying signature for simplicity)
    // For production, verify using Apple's public keys
    const parts  = id_token.split('.');
    const claims = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));

    const email = claims.email;
    let   name  = email.split('@')[0];

    // Apple only sends name on the FIRST sign-in
    if (userJson) {
      try {
        const parsedUser = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        if (parsedUser.name) {
          name = `${parsedUser.name.firstName || ''} ${parsedUser.name.lastName || ''}`.trim() || name;
        }
      } catch (_) {}
    }

    const db = getDb();
    const user = findOrCreateOAuthUser(db, {
      email,
      name,
      provider:   'apple',
      providerId: claims.sub,
    });
    db.close();

    redirectWithToken(res, user);
  } catch (err) {
    console.error('Apple OAuth callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/login?error=apple_failed`);
  }
});

module.exports = router;

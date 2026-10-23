const crypto = require('node:crypto');

const COOKIE_NAME = 'sh_voucher_session';
const SESSION_SECONDS = 8 * 60 * 60;

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function makeCookie() {
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${payload}.${sign(payload)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

function clearCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

function hasValidSession(req) {
  const rawCookie = req.headers.cookie || '';
  const item = rawCookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!item) return false;
  const value = item.slice(COOKIE_NAME.length + 1);
  const separator = value.indexOf('.');
  if (separator < 1) return false;
  const payload = value.slice(0, separator);
  if (!/^\d+$/.test(payload) || Number(payload) <= Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(value.slice(separator + 1));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

module.exports = { makeCookie, clearCookie, hasValidSession };

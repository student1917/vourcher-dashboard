const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { getCollection } = require('./lib/db');
const { makeCookie, clearCookie, hasValidSession } = require('./lib/auth');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));

app.post('/api/login', (req, res) => {
  const expected = process.env.ACCESS_CODE;
  if (!expected) return res.status(500).json({ error: 'ACCESS_CODE chưa được cấu hình' });
  const supplied = typeof req.body?.code === 'string' ? req.body.code : '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) return res.status(401).json({ error: 'Mã truy cập chưa đúng' });
  try {
    res.set('Set-Cookie', makeCookie());
    res.set('Cache-Control', 'no-store');
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (_req, res) => {
  res.set('Set-Cookie', clearCookie());
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true });
});

app.get('/api/records', async (req, res) => {
  res.set('Cache-Control', 'no-store, private');
  if (!hasValidSession(req)) return res.status(401).json({ error: 'Cần nhập mã truy cập' });

  try {
    const page = Math.max(1, Math.min(1_000_000, Number.parseInt(req.query.page, 10) || 1));
    const pageSize = Math.max(10, Math.min(100, Number.parseInt(req.query.pageSize, 10) || 25));
    const sort = req.query.sort === 'asc' ? 1 : -1;
    const filter = {};
    const phone = typeof req.query.phone === 'string' ? req.query.phone.trim().slice(0, 32) : '';
    const campaignId = typeof req.query.campaignId === 'string' ? req.query.campaignId.trim().slice(0, 100) : '';
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';

    if (phone) filter.phone = { $regex: phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
    if (campaignId) filter.campaignId = campaignId;
    if (from || to) {
      const createdAt = {};
      if (/^\d{4}-\d{2}-\d{2}$/.test(from)) createdAt.$gte = new Date(`${from}T00:00:00+07:00`);
      if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        const until = new Date(`${to}T00:00:00+07:00`);
        until.setDate(until.getDate() + 1);
        createdAt.$lt = until;
      }
      if (Object.keys(createdAt).length) filter.createdAt = createdAt;
    }

    const collection = await getCollection();
    const [total, documents, campaigns] = await Promise.all([
      collection.countDocuments(filter),
      collection.find(filter, { projection: { phone: 1, value: 1, label: 1, campaignId: 1, createdAt: 1 } })
        .sort({ createdAt: sort, _id: sort })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      collection.distinct('campaignId')
    ]);

    const records = documents.map((doc) => ({
      id: String(doc._id), phone: doc.phone || '', value: Number(doc.value || 0),
      label: doc.label || '', campaignId: doc.campaignId || '',
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt || null
    }));
    res.json({ records, total, page, pageSize, campaigns: campaigns.filter(Boolean).sort() });
  } catch (error) {
    console.error('Voucher records query failed:', error.message);
    res.status(500).json({ error: 'Không tải được dữ liệu. Kiểm tra cấu hình database.' });
  }
});

// Vercel serves public assets from its CDN. This route also serves the built app locally.
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('*path', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`SoundHub dashboard running on http://localhost:${port}`));
}

module.exports = app;

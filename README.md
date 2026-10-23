# SoundHub Voucher Dashboard

MERN dashboard: MongoDB collection + Express API + React UI + Tailwind CSS. It supports phone search, date and campaign filters, created-date sorting, and server-side pagination. The data API and dashboard require one shared passcode.

## Local setup

1. Install Node.js 22 LTS (or Node.js 20.19+).
2. Open a terminal in the project folder and run `npm install`.
3. Copy `.env.example` to `.env` and fill in the real values.
4. Start the API in terminal 1 with `npm run server`.
5. Start React in terminal 2 with `npm run dev`.
6. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Vite forwards `/api` requests to Express on port 3000. For a production-like local run, use `npm run build` and then `npm start`; open `http://localhost:3000`.

## Environment variables

- `MONGODB_URI`: MongoDB Atlas connection string.
- `MONGODB_DB`: database name.
- `MONGODB_COLLECTION`: collection name, defaults to `vouchers`.
- `ACCESS_CODE`: long, unique shared passcode.
- `SESSION_SECRET`: random signing secret of at least 32 characters; keep it separate from `ACCESS_CODE`.
- `PORT`: local Express port, defaults to `3000`.

Generate a session secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Set the environment variables in Vercel Project Settings → Environment Variables. Never commit `.env` or expose the MongoDB URI in frontend code.

## Deploy to Vercel

Run `npm install`, `vercel login`, `vercel link`, then `vercel --prod`. Before production deployment, add the MongoDB and session variables under Vercel Project Settings → Environment Variables. Vercel builds the React app into `public/` and deploys the Express application. Viewers need only the site URL and passcode; they do not need Vercel accounts.

## Data fields

The app reads `phone`, `value`, `label`, `campaignId`, and `createdAt`, matching this record shape:

```js
{
  campaignId: 'soundhub-food-good-v1',
  phone: '0900000000',
  value: 400000,
  label: '400K',
  createdAt: new Date('2026-10-21T09:37:46.443Z')
}
```

The server applies the filters and pagination in MongoDB. The session cookie is HTTP-only, same-site strict, secure in production, and expires after 8 hours. Use a long passcode and a MongoDB database user with read-only access to this collection.

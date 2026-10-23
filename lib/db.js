const { MongoClient } = require('mongodb');

let connection;

async function getCollection() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error('MongoDB environment variables are not configured');
  }
  if (!connection) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000
    });
    connection = client.connect().then(() => client).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  const client = await connection;
  return client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION || 'vouchers');
}

module.exports = { getCollection };

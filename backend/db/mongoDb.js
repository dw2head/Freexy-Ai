const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = process.env.MONGODB_URI;

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined!");
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log("Connected to MongoDB successfully!");
  return db;
}

async function getDb() {
  if (!db) {
    await connectDB();
  }
  return db;
}

async function find(collectionName, query) {
  const db = await getDb();
  return db.collection(collectionName).find(query).toArray();
}

async function findOne(collectionName, query) {
  const db = await getDb();
  return db.collection(collectionName).findOne(query);
}

async function insert(collectionName, item) {
  const db = await getDb();
  const newItem = {
    _id: item._id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item
  };
  await db.collection(collectionName).insertOne(newItem);
  return newItem;
}

async function update(collectionName, id, updates) {
  const db = await getDb();
  const updateDoc = {
    $set: {
      ...updates,
      updatedAt: new Date().toISOString()
    }
  };
  await db.collection(collectionName).updateOne({ _id: id }, updateDoc);
  return db.collection(collectionName).findOne({ _id: id });
}

async function remove(collectionName, id) {
  const db = await getDb();
  await db.collection(collectionName).deleteOne({ _id: id });
  return true;
}

async function readData(collectionName) {
  const db = await getDb();
  return db.collection(collectionName).find({}).toArray();
}

async function writeData(collectionName, dataArray) {
  const db = await getDb();
  await db.collection(collectionName).deleteMany({});
  if (dataArray && dataArray.length > 0) {
    await db.collection(collectionName).insertMany(dataArray);
  }
  return true;
}

module.exports = {
  connectDB,
  find,
  findOne,
  insert,
  update,
  remove,
  readData,
  writeData
};

require('dotenv').config();

console.log("MONGO_URI =", process.env.MONGO_URI);

const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

async function run() {
    try {
        console.log("Connecting...");
        const client = new MongoClient(uri);
        await client.connect();
        console.log("Connected successfully!");
        await client.close();
    } catch (err) {
        console.error(err);
    }
}

run();
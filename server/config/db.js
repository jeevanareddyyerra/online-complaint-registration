const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB database connection established successfully.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectToDB;
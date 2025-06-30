const mongoose = require('mongoose');
require('dotenv').config();

//ATLAS MONGO
//const DB_USER = 'rodrigojmsleite'
//const DB_PASSWORD = encodeURIComponent('9fX25aNisrBbryaq');
//URL = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@link.ramjwob.mongodb.net/link?retryWrites=true&w=majority&appName=link`

//railway
//local const mongo_railway_url=mongodb://mongo:1oQZXKMbEzgyHuKQ0aVPnPEynZATwpcP@nozomi.proxy.rlwy.net:59141

const mongo_railway_url = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    if (!mongo_railway_url) {
      throw new Error('MONGO_URL não está definida.');
    }

    mongoose.connect(mongo_railway_url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ Conectado ao MongoDB (db link)');
  } catch (err) {
    console.error('❌ Erro na conexão com MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

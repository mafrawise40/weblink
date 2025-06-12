const mongoose = require('mongoose');

const DB_USER = 'rodrigojmsleite'
const DB_PASSWORD = encodeURIComponent('9fX25aNisrBbryaq');

const connectDB = async () => {
  try {
    mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@link.ramjwob.mongodb.net/link?retryWrites=true&w=majority&appName=link`, {
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

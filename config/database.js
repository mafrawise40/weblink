const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.connect('mongodb://admin:admin123@localhost:27017/link?authSource=admin', {
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

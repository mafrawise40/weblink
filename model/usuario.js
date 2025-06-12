const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // já hash da senha
  email: { type: String, required: true, unique: true },
  criadoEm: { type: Date, default: Date.now },
  ativo: {type: Boolean, default: true}
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
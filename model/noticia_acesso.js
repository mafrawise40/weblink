const mongoose = require('mongoose');

const NoticiaAcessoSchema = new mongoose.Schema({
  noticia: { type: mongoose.Schema.Types.ObjectId, ref: 'Noticia', required: true },
  ip: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  horario: { type: Date, default: Date.now },
  dispositivo: { type: String }, // nome do dispositivo (ex: navegador, celular, etc)
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // opcional, caso queira linkar usuário autenticado
});

const NoticiaAcesso = mongoose.model('NoticiaAcesso', NoticiaAcessoSchema);
module.exports = NoticiaAcesso;

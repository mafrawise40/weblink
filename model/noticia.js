const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema({
    titulo: { type: String },
    subtitulo: {type: String},
    resumo: { type: String },
    corpo: { type: String },
    fotos: [{ type: String }], // URLs ou paths das fotos
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date },
    autor: { type: String },
    validade: { type: Number, default: 15 }, //valida de 15 dias de ativado
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tipo: { type: String, required: true },
    linkEncurtado: {type: String, default: ''},
    status: {type: Boolean, default: true}
});

const Noticia = mongoose.model('Noticia', NoticiaSchema);
module.exports = Noticia;
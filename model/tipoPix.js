/*NomePagante: ?
ContaOrigem: 209.029.580-0
Cpf/Cnpj: ***.015.735.*** ??

Chave: ?
NomeRecebedor: ?
Cpf/Cnpj: ?
Valor: ?
PSP Recebedor: ( Nome do banco ?)
Data do Pagamento: ? 
Descrição: ? */


const mongoose = require('mongoose');

const TipoPixSchema = new mongoose.Schema({
  nomePagante: { type: String, required: true },      // Nome do pagador

  chave: { type: String, required: true },             // Chave Pix
  nomeRecebedor: { type: String, required: true },    // Nome do recebedor
  cpfCnpj: { type: String, required: true },          // CPF ou CNPJ do recebedor
  valor: { type: Number, required: true },             // Valor do pagamento
  nomeBancoPspRecebedor: { type: String, required: true },     // Nome do banco (PSP Recebedor)
  dataPagamento: { type: Date, required: true },       // Data do pagamento
  descricaoPagamento: { type: String },                          // Descrição opcional

  noticia: {                                           // Referência ao documento Notícia
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Noticia',
    required: true
  },

  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

// Atualiza o campo atualizadoEm antes de salvar
TipoPixSchema.pre('save', function(next) {
  this.atualizadoEm = Date.now();
  next();
});

const TipoPix = mongoose.model('TipoPix', TipoPixSchema);
module.exports = TipoPix;
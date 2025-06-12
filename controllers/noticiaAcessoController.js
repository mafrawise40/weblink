const express = require('express');
const router = express.Router();
const NoticiaAcesso = require('../model/noticia_acesso');
const Noticia = require('../model/noticia');

// Exemplo: listar usuários
router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Exemplo: criar usuário
router.post('/add/:idNoticia/:idUsuario', async (req, res) => {

    const { latitude, longitude } = req.body;
    const { idNoticia, idUsuario } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        await NoticiaAcesso.create({
            noticia: idNoticia,
            usuario: idUsuario,
            ip: ip,
            latitude: latitude,
            longitude: longitude,
            dispositivo: userAgent
          });

        res.status(201).json(NoticiaAcesso);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/getAcessos/:idNoticia', async (req, res) => {
    const { idNoticia } = req.params;

    try {
        // 🔸 Primeiro busca a notícia pelo ID
        const noticia = await Noticia.findById(idNoticia);

        if (!noticia) {
            return res.status(404).send('Notícia não encontrada');
        }

        // 🔸 Depois busca os acessos dessa notícia
        const acessos = await NoticiaAcesso.find({ noticia: idNoticia })
            .populate('usuario') // opcional, caso queira dados do usuário
            .sort({ horario: -1 });

        // 🔸 Renderiza a view passando a notícia e os acessos
        res.render('noticiaAcesso', { noticia, acessos });

    } catch (err) {
        res.status(500).send('Erro ao buscar acessos: ' + err.message);
    }
});

module.exports = router;
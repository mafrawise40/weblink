const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const NoticiaAcesso = require('../model/noticia_acesso');
const Noticia = require('../model/noticia');

// Exemplo: listar usuários
router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

router.post('/add/:idNoticia/:idUsuario', async (req, res) => {

    const { latitude, longitude } = req.body;
    const { idNoticia, idUsuario } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        const novoAcesso = await NoticiaAcesso.create({
            noticia: idNoticia,
            usuario: idUsuario,
            ip: ip,
            latitude: latitude,
            longitude: longitude,
            dispositivo: userAgent
        });

        dispararEventoAtualizarAcessoListagem(novoAcesso, idUsuario, idNoticia, req);

        res.status(201).json(NoticiaAcesso);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

});

router.get('/getAcessos/:idNoticia', async (req, res) => {
    const { idNoticia } = req.params;

    try {
        const noticia = await Noticia.findById(idNoticia);

        if (!noticia) {
            return res.status(404).send('Notícia não encontrada');
        }

        const acessosRaw = await NoticiaAcesso.find({ noticia: idNoticia })
            .populate('usuario')
            .sort({ horario: -1 });

        // 🔄 Formatar horário para o fuso de Brasília antes de enviar para a view
        const acessos = acessosRaw.map(acesso => ({
            ...acesso.toObject(), // transforma para objeto puro
            horarioFormatado: moment(acesso.horario)
                .tz('America/Sao_Paulo')
                .format('DD/MM/YYYY HH:mm:ss')
        }));

        res.render('noticiaAcesso', { noticia, acessos, urlBase: require('../config/global').urlBase });

    } catch (err) {
        res.status(500).send('Erro ao buscar acessos: ' + err.message);
    }
});

//usado para atualizar dinamicamente os acessos do websocket
router.get('/getAcessosJson/:idNoticia', async (req, res) => {
    const { idNoticia } = req.params;

    try {
        const noticia = await Noticia.findById(idNoticia);
        if (!noticia) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        const acessosRaw = await NoticiaAcesso.find({ noticia: idNoticia })
            .populate('usuario')
            .sort({ horario: -1 });

        const acessos = acessosRaw.map(acesso => ({
            ...acesso.toObject(),
            horarioFormatado: moment(acesso.horario)
                .tz('America/Sao_Paulo')
                .format('DD/MM/YYYY HH:mm:ss')
        }));

        res.json(acessos);

    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar acessos: ' + err.message });
    }
});

// 🔔 Dispara evento WebSocket
function dispararEventoAtualizarAcessoListagem(novoAcesso, idUsuario, idNoticia, req) {

    const wss = req.app.get('wss');
    //console.log("entrando no wss");
    //console.log(wss);
    wss.clients.forEach((client) => {
        //console.log("disparando...");
        if (client.readyState === 1) {

            let send = JSON.stringify({
                type: 'ACESSO_ATUALIZADO',
                idNoticia,
                acesso: {
                    usuario: idUsuario,
                    horario: moment(novoAcesso.horario).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss')
                }
            });
            //console.log(send);
            client.send(send);
        }
    });

}

module.exports = router;
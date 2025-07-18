const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const NoticiaAcesso = require('../model/noticia_acesso');
const Noticia = require('../model/noticia');

const multer = require('multer');
const upload = multer();

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
        if (!noticia) return res.status(404).send('Notícia não encontrada');

        const acessosRaw = await NoticiaAcesso.find({ noticia: idNoticia })
            .populate('usuario')
            .sort({ horario: -1 });

        const acessos = acessosRaw.map(acesso => {
            const horarioBrasilia = moment(acesso.horario).tz('America/Sao_Paulo');
            return {
                ...acesso.toObject(),
                horarioFormatado: horarioBrasilia.format('DD/MM/YYYY HH:mm:ss'),
                temFoto: !!acesso.foto
            };
        });

        res.render('noticiaAcesso', {
            noticia,
            acessos,
            urlBase: require('../config/global').urlBase
        });

    } catch (err) {
        //console.error('Erro ao buscar acessos:', err);
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

        const acessos = acessosRaw.map(acesso => {
            const horarioCorrigido = moment(acesso.horario).subtract(3, 'hours'); // remove 3h
            const fotoBase64 = acesso.foto?.data
                ? `data:${acesso.foto.contentType};base64,${acesso.foto.data.toString('base64')}`
                : null;

            return {
                ...acesso.toObject(),
                horarioFormatado: horarioCorrigido.format('DD/MM/YYYY HH:mm:ss'),
                fotoBase64
            };
        });

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



router.post('/add-foto/:idNoticia/:idUsuario', upload.single('foto'), async (req, res) => {
    const { idNoticia, idUsuario } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        const novoAcesso = await NoticiaAcesso.create({
            noticia: idNoticia,
            usuario: idUsuario,
            ip: ip,
            dispositivo: userAgent,
            foto: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                descricao: 'Foto capturada pela câmera frontal'
            },
            cameraFrontal: true
        });

        res.status(201).json(novoAcesso);
    } catch (err) {
        console.error('Erro ao salvar foto:', err);
        res.status(400).json({ error: err.message });
    }
});

// Servir imagem de acesso
router.get('/foto/:idAcesso', async (req, res) => {
    try {
        const acesso = await NoticiaAcesso.findById(req.params.idAcesso);
        if (!acesso || !acesso.foto || !acesso.foto.data) {
            return res.status(404).send('Foto não encontrada');
        }

        res.contentType(acesso.foto.contentType || 'image/jpeg');
        res.send(acesso.foto.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar a foto');
    }
});


module.exports = router;
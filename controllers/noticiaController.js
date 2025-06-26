const express = require('express');
const router = express.Router();
const User = require('../model/usuario');
const Noticia = require('../model/noticia');
const NoticiaAcesso = require('../model/noticia_acesso');
const { urlBase } = require('../config/global');
const { metropoles, recibo_pix, globo_news } = require('../enums/TipoNoticia');
const axios = require('axios');



//upload de arquivos
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const authMiddleware = require("../config/authMiddleware");

const fonte = `<div class="fonte-imagem"><b>Imagem:</b> Viva Notícia</div>`;

// Exemplo: listar usuários
router.get('/', async (req, res) => {

    const { latitude, longitude } = req.body;
    console.log(new Date());
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    res.json({ status: `Localização recebida -> Latitude: ${latitude}, Longitude: ${longitude}` });


});

// Exemplo: criar usuário
router.get('/criaNoticiaTeste', authMiddleware, async (req, res) => {
    try {

        const novoUser = new User({
            username: 'joaozinho',
            passwordHash: 'senha123hash', // Isso aqui deve ser hash real em produção
            email: 'joaozinho@email.com'
        });

        await novoUser.save();

        // 🔹 Criando uma nova notícia associada ao usuário
        const novaNoticia = new Noticia({
            titulo: 'Primeira Notícia do Joãozinho',
            corpo: 'Esta é a primeira notícia criada pelo Joãozinho.',
            fotos: ['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg'],
            usuario: novoUser._id // <-- Relacionamento com o usuário
        });

        await novaNoticia.save();

        res.status(201).json({
            message: 'Usuário e notícia criados com sucesso!',
            usuario: novoUser,
            noticia: novaNoticia
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


router.get('/cadastro', authMiddleware, async (req, res) => {
    const userId = req.session.userId;
    const noticia = { tipo: metropoles };
    res.render('noticiaCadastro', { noticia, userId });
});



router.post('/salvar', authMiddleware, upload.array('fotos', 10), async (req, res) => {
    try {

        let tipoP = req.body.tipo;

        const noticia = new Noticia({
            titulo: req.body.titulo,
            corpo: req.body.corpo,
            validade: req.body.validade,
            usuario: req.body.usuario, //get usuario logado
            autor: "padrão",
            resumo: req.body.resumo,
            tipo: tipoP,
            fotos: []
        });

        const novaNoticia = await noticia.save();
        const noticiaId = novaNoticia._id.toString();

        if (tipoP === "recibo_pix") {

            const tipoPix = new TipoPix({
                nomePagante: req.body.nomePagante,
                chave: req.body.chave,
                nomeRecebedor: req.body.nomeRecebedor,
                cpfCnpj: req.body.cpfCnpj,
                valor: req.body.valor,
                pspRecebedor: req.body.pspRecebedor,
                dataPagamento: req.body.dataPagamento,
                descricao: req.body.descricao,
                noticiaId: noticiaId
            });

            await tipoPix.save();

        } else {//noticia comum

            const dir = path.join(__dirname, '../public/uploads/', noticiaId);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Iterar sobre cada arquivo enviado para salvar no disco e coletar o caminho
            for (const file of req.files) {
                // Gerar um nome de arquivo único para evitar colisões
                const fileName = `${Date.now()}-${file.originalname}`;
                const filePath = path.join(dir, fileName); // Caminho completo no servidor

                // Escrever o buffer do arquivo no sistema de arquivos
                fs.writeFileSync(filePath, file.buffer); // Sincronizado para garantir que o arquivo foi salvo antes de continuar

                // Construir o caminho relativo ou URL pública para o banco de dados
                // Assumindo que 'public' é a raiz do seu servidor de arquivos estáticos
                const publicPath = `/uploads/${noticiaId}/${fileName}`;

                fotosParaSalvarNoDB.push({
                    data: file.buffer, 
                    contentType: file.mimetype,
                    nome: file.originalname,
                    path: publicPath // Salva o caminho público para a imagem
                });
            }

            await Noticia.findByIdAndUpdate(noticiaId, {
                $push: { fotos: { $each: fotosArray } }
            });
        }


        res.redirect('/noticia/listagem');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar notícia: ' + err.message);
    }
});




router.get('/noticiaTeste/:id/:idUsuario', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;  // pega o id da URL
        const idUsuario = req.params.idUsuario; // id do usuário para filtrar também

        // Busca notícia por id E usuário (filtra por ambos)
        const noticia = await Noticia.findOne({ _id: id, usuario: idUsuario }).populate('usuario');

        if (!noticia) {
            return res.status(404).json({ message: 'Notícia não encontrada' });
        }
        noticia.corpo = inserirImagemNoTextoTeste(noticia.corpo, "https://www.cnabrasil.org.br/storage/arquivos/Invasoes_de_terras.jpg");

        console.log(noticia)

        res.render('noticia', { noticia });
    } catch (err) {
        res.status(400).json({ error: err.message });
        console.log(err);
    }
});



router.get('/view/:id/:idUsuario', async (req, res) => {
    try {
        const id = req.params.id;  // pega o id da URL
        const idUsuario = req.params.idUsuario; // id do usuário para filtrar também

        // Busca notícia por id E usuário (filtra por ambos)
        const noticia = await Noticia.findOne({
            _id: id,
            usuario: idUsuario,
            status: true
        }).populate('usuario');

        if (!noticia) {
            return res.status(404).json({ message: 'Not Found' });
        }


        const metadata = getMetaData(noticia, noticia.usuario._id);

        if (noticia.tipo === metropoles) {
            noticia.corpo = formatarTextoCorpoMetropoles(noticia);
            res.render('metropoles/noticiaMetropoles', { noticia, metadata });
        } else if (noticia.tipo === globo_news) {
            res.render('noticia', { noticia, metadata });

        } else if (noticia.tipo === recibo_pix) {
            res.render('noticia', { noticia, metadata });

        } else {
            noticia.corpo = inserirImagensNoTexto(noticia.corpo, noticia.fotos);
            res.render('noticia', { noticia, metadata });

        }
    } catch (err) {
        res.status(400).json({ error: err.message });
        console.log(err);
    }
});


router.get('/id', async (req, res) => {



});


router.get('/listagem', authMiddleware, async (req, res) => {
    try {


        const usuarioId = req.session.userId; // Pegando usuário logado do middleware

        // Buscar notícias do usuário ordenadas por data
        const noticias = await Noticia.find({ usuario: usuarioId }).sort({ criadoEm: -1 });

        // Buscar contagem de acessos agrupados por notícia
        const acessos = await NoticiaAcesso.aggregate([
            {
                $group: {
                    _id: "$noticia",
                    total: { $sum: 1 }
                }
            }
        ]);

        // Mapear os acessos para objeto { idNoticia: total }
        const acessosMap = {};
        acessos.forEach(item => {
            acessosMap[item._id.toString()] = item.total;
        });

        // Gerar links encurtados
        const linksEncurtados = {};
        for (const noticia of noticias) {
            const urlOriginal = `${urlBase}/noticia/view/${noticia._id}/${usuarioId}`;
            //const link = await gerarLinkEncurtado(urlOriginal);
            linksEncurtados[noticia._id.toString()] = urlOriginal;
        }

        // Renderizar página
        res.render('noticiaListagem', { noticias, acessosMap, linksEncurtados });

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar notícias');
    }
});


router.get('/editar/:id', authMiddleware, async (req, res) => {
    const noticia = await Noticia.findById(req.params.id);
    const userId = req.session.userId;
    res.render('noticiaCadastro', { noticia, userId });
});

router.get('/desativar/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await Noticia.findByIdAndUpdate(id, { status: false });

        res.redirect('/noticia/listagem');
    } catch (err) {
        console.error('Erro ao desativar notícia:', err);
        res.status(500).send('Erro ao desativar notícia');
    }
});

router.get('/ativar/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await Noticia.findByIdAndUpdate(id, { status: true });

        res.redirect('/noticia/listagem');
    } catch (err) {
        console.error('Erro ao ativar notícia:', err);
        res.status(500).send('Erro ao ativar notícia');
    }
});

router.get('/excluir/:id', authMiddleware, async (req, res) => {
    try {
        const noticia = await Noticia.findByIdAndDelete(req.params.id);

        // Remove a pasta de fotos se existir
        const pastaFotos = path.join(__dirname, '../public/uploads/', req.params.id);
        if (fs.existsSync(pastaFotos)) {
            fs.rmSync(pastaFotos, { recursive: true, force: true });
        }

        res.redirect('/noticia/listagem');
    } catch (error) {
        res.status(500).send('Erro ao excluir notícia');
    }
});

function inserirImagemNoTextoTeste(texto, urlImagem) {
    const palavras = texto.split(/\s+/);

    if (palavras.length <= 150) {
        // Se tem menos de 150 palavras, não insere nada
        return texto + `<br><br><img src="' + urlImagem + '" alt="Imagem" style="max-width:100%">${fonte}<br><br>`;
    }

    // Pega as primeiras 150 palavras
    const primeiras150 = palavras.slice(0, 150).join(' ');

    // O restante do texto
    const resto = palavras.slice(150).join(' ');

    // Acha o próximo ponto final no resto
    const indicePonto = resto.indexOf('.');

    if (indicePonto === -1) {
        // Se não encontrar ponto final, apenas concatena tudo
        return primeiras150 + ' ' + resto;
    }

    // Divide o texto no ponto final encontrado
    const antesPonto = resto.slice(0, indicePonto + 1); // inclui o ponto final
    const depoisPonto = resto.slice(indicePonto + 1);   // depois do ponto final

    // Monta o texto final com a imagem inserida
    const textoFinal =
        primeiras150 + ' ' +
        antesPonto +
        `<br><br><img src="' + urlImagem + '" alt="Imagem" style="max-width:100%">${fonte}<br><br>` +
        depoisPonto;

    return textoFinal;
}


function inserirImagensNoTexto(texto, arrayFotos) {
    if (!arrayFotos || arrayFotos.length === 0) {
        return `<div style="font-size:18px;">${texto}</div>`;
    }

    const palavras = texto.split(/\s+/);
    const quantidadePalavras = palavras.length;
    let textoFinal = '';
    let indicePalavra = 0;
    let indiceImagem = 0;
    const qtdTextoParaQuebrarLinha = 60;

    while (indicePalavra < quantidadePalavras) {
        const blocoPalavras = palavras.slice(indicePalavra, indicePalavra + qtdTextoParaQuebrarLinha);
        textoFinal += `<span style="font-size:18px;">${blocoPalavras.join(' ')}</span> `;
        indicePalavra += qtdTextoParaQuebrarLinha;

        if (indicePalavra >= quantidadePalavras) {
            break;
        }

        const resto = palavras.slice(indicePalavra).join(' ');

        const indicePonto = resto.indexOf('.');

        if (indicePonto !== -1) {
            const antesPonto = resto.slice(0, indicePonto + 1);
            textoFinal += `<span style="font-size:18px;"> ${antesPonto}</span> `;

            const palavrasAntesPonto = antesPonto.trim().split(/\s+/).length;
            indicePalavra += palavrasAntesPonto;

            if (indiceImagem < arrayFotos.length) {
                textoFinal += `<br><br>
                <img src="${arrayFotos[indiceImagem]}" alt="Imagem" style="max-width:100%">
                ${fonte}<br><br>`;
                indiceImagem++;
            }
        } else {
            // Sem ponto final encontrado, interrompe o loop
            break;
        }
    }

    // Adiciona o restante do texto que ficou sem processar
    const restantePalavras = palavras.slice(indicePalavra).join(' ');
    if (restantePalavras) {
        textoFinal += `<span style="font-size:18px;"> ${restantePalavras}</span>`;
    }

    // Se ainda houver imagens não usadas, adiciona todas no final
    if (indiceImagem < arrayFotos.length) {
        for (let i = indiceImagem; i < arrayFotos.length; i++) {
            textoFinal += `<br><br>
            <img src="${arrayFotos[i]}" alt="Imagem" style="max-width:100%">
            ${fonte}<br><br>`;
        }
    }

    return textoFinal.trim();
}

function getMetaData(noticia, idUsuario) { // Voltou a ser síncrona se não houver operações assíncronas
    if (!noticia) return {};

    const URLBase = urlBase;
    const urlNoticia = `${URLBase}/noticia/view/${noticia._id}/${idUsuario}`;

    let urlImagem = `${URLBase}/default-image.png`; // Imagem padrão de fallback
    let imageType = 'image/png';

    if (noticia.fotos && noticia.fotos.length > 0) {
        const foto = noticia.fotos[0];
        const extMap = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/bmp': 'bmp',
            'image/svg+xml': 'svg'
        };

        // Prioriza foto.path se existir (indicando que a imagem foi salva no disco no upload)
        if (foto.path) {
            // Se foto.path for '/uploads/ID/nome_arquivo.png', a URL será:
            // https://metropoles-link.up.railway.app/uploads/ID/nome_arquivo.png
            urlImagem = `${URLBase}${foto.path}`;
            imageType = foto.contentType;
        } else if (foto.data) { // Se a imagem ainda estiver como Buffer no DB (para notícias antigas)
            // Mantém a lógica de usar a rota dinâmica para servir o blob
            const ext = extMap[foto.contentType] || 'jpg';
            urlImagem = `${URLBase}/noticia/imagem/${noticia._id}/0.${ext}`;
            imageType = foto.contentType;
        }
        // Se neither foto.path nor foto.data exists, it will use the default-image.png fallback.
    }

    return {
        title: noticia.titulo,
        description: noticia.resumo,
        url: urlNoticia,
        image: urlImagem,
        imageType: imageType
    };
}




/*async function gerarLinkEncurtado(url) {
    try {
        const response = await axios.get(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
        console.log('Link encurtado:', response.data);
    } catch (error) {
        console.error('Erro:', error.response ? error.response.data : error.message);
    }
}*/


function formatarTextoCorpoMetropoles(noticia) {
    if (!noticia || !noticia.corpo) return "";

    const corpo = noticia.corpo;
    const fotos = noticia.fotos || [];
    const noticiaId = noticia._id;

    if (fotos.length === 0) {
        return corpo;
    }

    const primeiraImagem = gerarHtmlImagem(noticiaId, 0);
    const partes = corpo.split('.');
    let resultado = primeiraImagem;
    let contadorPontos = 0;

    let indexImagem = 1;

    partes.forEach((parte) => {
        if (parte.trim() !== '') {
            resultado += parte + '.';
            contadorPontos++;

            if (contadorPontos % 4 === 0) {
                resultado += '<br><br>';

                if (indexImagem < fotos.length) {
                    resultado += gerarHtmlImagem(noticiaId, indexImagem);
                    indexImagem++;
                }
            }
        }
    });

    return resultado;
}


function gerarHtmlImagem(noticiaId, index) {
    return `
<div class="ImgDestaqueNoticiaWrapper-sc-1frrxvx-0 btGEwY">
    <div class="ImgDestaqueNoticiaWrapper__CreditoImagem-sc-1frrxvx-1 EObEe">
        <span class="Text__TextBase-sc-1d75gww-0 gWMhxK noticia__imagemDestaque--credito">
            Divulgação
        </span>
    </div>
    <figure class="ImgDestaqueNoticiaWrapper__Imagem-sc-1frrxvx-2 ebzoXV">
        <img alt="Imagem da notícia" loading="eager" width="1050" height="691" decoding="async" 
            data-nimg="1" class="imagem__placeholder" style="color:transparent" 
            src="/noticia/imagem/${noticiaId}/${index}">
    </figure>
</div>
`;
}

router.get('/imagem/:id/:index.:ext?', async (req, res) => {
    try {
        const noticia = await Noticia.findById(req.params.id);
        const index = parseInt(req.params.index);
        const foto = noticia?.fotos?.[index];

        if (!foto) {
            return res.status(404).send('Imagem não encontrada');
        }

        res.contentType(foto.contentType);
        res.send(foto.data);
    } catch (err) {
        res.status(500).send('Erro ao buscar imagem');
    }
});






module.exports = router;
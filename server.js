const express = require('express');
const path = require('path');
const session = require('express-session');

const noticiaController = require('./controllers/noticiaController');
const noticiaAcessoController = require('./controllers/noticiaAcessoController');
const userController = require("./controllers/loginController");

const authMiddleware = require("./config/authMiddleware");

const app = express();
const PORT = 3000;

const connectDB = require('./config/database');
connectDB(); //conecta com o mongo


const bodyParser = require('body-parser');
//login
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'chave-secreta-muito-segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2 // 2 horas
    }
}));

app.use((req, res, next) => { //define uma variável local na view (session)
    res.locals.session = req.session;
    next();
});


app.set('views', path.join(__dirname, 'views')); // Configura a pasta das views (onde ficam seus templates)
app.set('view engine', 'ejs'); // Configura EJS como engine para renderizar HTML com dados

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // ✅ Permite receber JSON no body das requisições



// Rotas
//app.use('/usuarios', userRoutes);
app.use('/user', userController);
app.use('/noticia',  noticiaController);
app.use('/noticia-acesso', noticiaAcessoController);


// Endpoint para receber localização
app.post('/salvar-localizacao', (req, res) => {
    const { latitude, longitude } = req.body;
    console.log(new Date());
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    res.json({ status: `Localização recebida -> Latitude: ${latitude}, Longitude: ${longitude}` });
});




// Inicializa o servidor Express
const server = app.listen(PORT, async () => {
    console.log(`Servidor rodando localmente em http://localhost:${PORT}`);

    // Conecta no Ngrok
   /* try {
        const listener = await ngrok.connect({ 
            addr: PORT, 
            authtoken_from_env: true // Usa token do ambiente
        });
        console.log(`🔥 Servidor público via Ngrok: ${listener.url()}`);
        console.log(`🌍 Endpoint: ${listener.url()}/salvar-localizacao`);
    } catch (error) {
        console.error('Erro ao iniciar Ngrok:', error);
    }*/
});

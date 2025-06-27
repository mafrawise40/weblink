const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const noticiaController = require('./controllers/noticiaController');
const noticiaAcessoController = require('./controllers/noticiaAcessoController');
const userController = require("./controllers/loginController");

const authMiddleware = require("./config/authMiddleware");

const { urlBase } = require('./config/global');

const PORT = 3000;
const app = express();
const server = http.createServer(app); // ⬅ cria o servidor HTTP
const wss = new WebSocket.Server({ server });

/** WEBSOCKETTT */
// ✅ 1. Evento que indica que o servidor WebSocket está pronto
wss.on('listening', () => {
    console.log('✅ WebSocket server está escutando conexões!');
});

// ✅ 2. Evento disparado quando um cliente se conecta
wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log('🟢 Novo cliente conectado via WebSocket. IP:', ip);
    ws.send(JSON.stringify({ message: 'Conexão WebSocket estabelecida com sucesso!' }));
});

// ✅ 3. Evento para erros
wss.on('error', (err) => {
    console.error('❌ Erro no WebSocket:', err);
});// ⬅ servidor WebSocket associado ao HTTP
/** FIM  */


const connectDB = require('./config/database');
connectDB(); //conecta com o mongo


// Torna o wss acessível para os controllers
app.set('wss', wss);

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
app.use('/noticia', noticiaController);
app.use('/noticia-acesso', noticiaAcessoController);



// Inicializa o servidor Express
server.listen(PORT, async () => {
    console.log(`Servidor rodando em ${urlBase}`);

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

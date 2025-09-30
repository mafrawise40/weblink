const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../model/usuario')


router.get('/login', (req, res) => {
    res.render('login'); 
});


// Processa login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user) {
        const match = await bcrypt.compare(password, user.passwordHash);
        if (match) {
            req.session.userId = user._id;
            return res.redirect('/noticia/listagem');
        }
    }

    res.send('Usuário ou senha inválidos! <a href="/user/login">Tentar novamente</a>');
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/user/login');
});


router.get('/create', async (req, res) => {
    const senha = '@li21@';
    const hash = await bcrypt.hash(senha, 10);
  
    const user = new User({
      username: 'ali21',
      passwordHash: hash,
      email: 'ali21@email.com',
      ativo: true,
      criadoEm: new Date(),
    });
  
    await user.save();
    res.send('Usuário criado!');
  });



module.exports = router;

const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- NOVA IMPORTAÇÃO

const app = express();
const PORT = 3000;
const saltRounds = 10;
const JWT_SECRET = 'seu_segredo_super_secreto_aqui_troque_depois'; // <-- TROQUE POR UMA FRASE SEGURA

// --- Configuração da Conexão com o MySQL ---
const dbConfig = { /* ... suas credenciais do banco ... */ };
const pool = mysql.createPool(dbConfig);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// --- ROTA DE LOGIN ATUALIZADA COM JWT ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = 'SELECT * FROM usuarios WHERE username = ?';
        const [rows] = await pool.query(sql, [username]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Se a senha estiver correta, crie um token
            const payload = { id: user.id, username: user.username, nivel: user.nivel };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); // Token expira em 8 horas

            res.json({ success: true, token: token }); // Envia o token para o front-end
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        console.error("Erro na rota de login:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// --- ROTAS DA API DE USUÁRIOS (CRUD COMPLETO) ---

// Listar todos os usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const sql = 'SELECT id, username, nivel FROM usuarios ORDER BY username ASC';
        const [users] = await pool.query(sql);
        res.json(users);
    } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }
});

// Buscar um usuário
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT id, username, nivel FROM usuarios WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }
});

// Criar um novo usuário
app.post('/api/usuarios', async (req, res) => {
    try {
        const { username, password, nivel } = req.body;
        if (!username || !password || !nivel) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO usuarios (username, password, nivel) VALUES (?, ?, ?)';
        await pool.query(sql, [username, hashedPassword, nivel]);
        res.status(201).json({ success: true, message: 'Usuário criado com sucesso!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nome de usuário já existe.' });
        }
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Atualizar um usuário
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, nivel, password } = req.body; // Password é opcional
        if (password && password.trim() !== '') {
            // Se uma nova senha foi enviada, atualize-a
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const sql = 'UPDATE usuarios SET username = ?, nivel = ?, password = ? WHERE id = ?';
            await pool.query(sql, [username, nivel, hashedPassword, id]);
        } else {
            // Se não, atualize apenas o nome e o nível
            const sql = 'UPDATE usuarios SET username = ?, nivel = ? WHERE id = ?';
            await pool.query(sql, [username, nivel, id]);
        }
        res.json({ success: true, message: 'Usuário atualizado com sucesso!' });
    } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }
});

// Deletar um usuário
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true, message: 'Usuário excluído com sucesso!' });
    } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }
});


// ... (SUAS ROTAS DE PRODUTOS E COLABORADORES CONTINUAM AQUI) ...


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
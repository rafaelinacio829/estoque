const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importa a biblioteca JWT

const app = express();
const PORT = 3000;
const saltRounds = 10;
// IMPORTANTE: Troque este segredo por uma frase longa e segura de sua escolha
const JWT_SECRET = 'seu_segredo_super_secreto_aqui_troque_depois';

// --- Configuração da Conexão com o MySQL ---
const dbConfig = {
    host: 'interchange.proxy.rlwy.net',
    user: 'root',
    password: 'FAhJuZOLrFpMgsgzafFkEBruHxrnbdGz',
    database: 'railway',
    port: 51338
};

const pool = mysql.createPool(dbConfig);

// --- Middlewares ---
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Middleware para desabilitar o cache para todas as rotas da API
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Middleware de Verificação de Token (protege as rotas)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"
    if (token == null) return res.sendStatus(401); // Não autorizado

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token inválido/expirado
        req.user = user;
        next();
    });
};

// ===================================================================
// --- ROTAS DA API ---
// ===================================================================

// --- Seção: Autenticação ---
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
            const payload = { id: user.id, username: user.username, nivel: user.nivel };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
            res.json({ success: true, token: token });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        console.error("Erro na rota de login:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// --- Seção: Produtos (Rotas Protegidas) ---
app.get('/api/produtos', verifyToken, async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM produtos ORDER BY id DESC'); res.json(rows); } catch (err) { console.error("[ERRO] Falha ao listar produtos:", err); res.status(500).json({message: 'Erro no servidor'}); } });
app.post('/api/produtos', verifyToken, async (req, res) => { try { const { nome, sku, estoque, preco } = req.body; const sql = 'INSERT INTO produtos (nome, sku, estoque, preco) VALUES (?, ?, ?, ?)'; const [result] = await pool.query(sql, [nome, sku, estoque, preco]); res.status(201).json({ success: true, message: 'Produto adicionado com sucesso!', productId: result.insertId }); } catch (err) { console.error("[ERRO] Falha ao adicionar produto:", err); res.status(500).json({message: 'Erro no servidor'}); } });
app.get('/api/produtos/count', verifyToken, async (req, res) => { try { const [rows] = await pool.query('SELECT COUNT(*) as total FROM produtos'); res.json({ success: true, total: rows[0].total }); } catch (err) { console.error("[ERRO] Falha ao contar produtos:", err); res.status(500).json({message: 'Erro no servidor'}); } });
app.get('/api/produtos/low-stock-count', verifyToken, async (req, res) => { try { const [rows] = await pool.query('SELECT COUNT(*) as total FROM produtos WHERE estoque < 2'); res.json({ success: true, total: rows[0].total }); } catch (err) { console.error("[ERRO] Falha ao contar baixo estoque:", err); res.status(500).json({message: 'Erro no servidor'}); } });
app.get('/api/produtos/no-stock-count', verifyToken, async (req, res) => { try { const [rows] = await pool.query('SELECT COUNT(*) as total FROM produtos WHERE estoque = 0'); res.json({ success: true, total: rows[0].total }); } catch (err) { console.error("[ERRO] Falha ao contar sem estoque:", err); res.status(500).json({message: 'Erro no servidor'}); } });
app.get('/api/produtos/:id', verifyToken, async (req, res) => { try { const { id } = req.params; const [rows] = await pool.query('SELECT * FROM produtos WHERE id = ?', [id]); if (rows.length === 0) return res.status(404).json({ success: false, message: 'Produto não encontrado.'}); res.json(rows[0]); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });
app.put('/api/produtos/:id', verifyToken, async (req, res) => { try { const { id } = req.params; const { nome, sku, estoque, preco } = req.body; const sql = 'UPDATE produtos SET nome = ?, sku = ?, estoque = ?, preco = ? WHERE id = ?'; await pool.query(sql, [nome, sku, estoque, preco, id]); res.json({ success: true, message: 'Produto atualizado com sucesso!' }); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });
app.delete('/api/produtos/:id', verifyToken, async (req, res) => { try { const { id } = req.params; await pool.query('DELETE FROM produtos WHERE id = ?', [id]); res.json({ success: true, message: 'Produto excluído com sucesso!' }); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });

// --- Seção: Colaboradores (Rotas Protegidas) ---
app.get('/api/colaboradores', verifyToken, async (req, res) => { try { const sql = 'SELECT id, nome, email, cargo, DATE_FORMAT(data_admissao, "%d/%m/%Y") as data_admissao, status FROM colaboradores ORDER BY nome ASC'; const [rows] = await pool.query(sql); res.json(rows); } catch (err) { console.error("[ERRO] Falha ao listar colaboradores:", err); res.status(500).json({ message: 'Erro interno do servidor.' }); } });
// ... (demais rotas de colaboradores POST, PUT, DELETE, etc.)

// --- Seção: Usuários (Rotas Protegidas) ---
app.get('/api/usuarios', verifyToken, async (req, res) => { try { const [users] = await pool.query('SELECT id, username, nivel FROM usuarios ORDER BY username ASC'); res.json(users); } catch (err) { console.error("[ERRO] Falha ao listar usuários:", err); res.status(500).json({ message: 'Erro no servidor' }); } });
app.post('/api/usuarios', verifyToken, async (req, res) => { try { const { username, password, nivel } = req.body; const hashedPassword = await bcrypt.hash(password, saltRounds); await pool.query('INSERT INTO usuarios (username, password, nivel) VALUES (?, ?, ?)', [username, hashedPassword, nivel]); res.status(201).json({ success: true, message: 'Usuário criado com sucesso!' }); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });
app.get('/api/usuarios/:id', verifyToken, async (req, res) => { try { const { id } = req.params; const [rows] = await pool.query('SELECT id, username, nivel FROM usuarios WHERE id = ?', [id]); res.json(rows[0]); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });
app.put('/api/usuarios/:id', verifyToken, async (req, res) => { try { const { id } = req.params; const { username, nivel, password } = req.body; if (password && password.trim() !== '') { const hashedPassword = await bcrypt.hash(password, saltRounds); await pool.query('UPDATE usuarios SET username = ?, nivel = ?, password = ? WHERE id = ?', [username, nivel, hashedPassword, id]); } else { await pool.query('UPDATE usuarios SET username = ?, nivel = ? WHERE id = ?', [username, nivel, id]); } res.json({ success: true, message: 'Usuário atualizado com sucesso!' }); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });
app.delete('/api/usuarios/:id', verifyToken, async (req, res) => { try { const { id } = req.params; await pool.query('DELETE FROM usuarios WHERE id = ?', [id]); res.json({ success: true, message: 'Usuário excluído com sucesso!' }); } catch (err) { console.error(err); res.status(500).json({message: 'Erro no servidor'}); } });

// ===================================================================
// --- INICIALIZAÇÃO DO SERVIDOR ---
// ===================================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    pool.getConnection()
        .then(connection => {
            console.log('Conectado ao MySQL com sucesso!');
            connection.release();
        })
        .catch(err => {
            console.error('ERRO AO CONECTAR COM O MYSQL:', err.message);
        });
});
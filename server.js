const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const saltRounds = 10;

// --- Configuração da Conexão com o MySQL ---
const dbConfig = {
    host: 'interchange.proxy.rlwy.net',
    user: 'root',
    password: 'FAhJuZOLrFpMgsgzafFkEBruHxrnbdGz',
    database: 'railway',
    port: 51338
};

const pool = mysql.createPool(dbConfig);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// ===================================================================
//         CORREÇÃO: Middleware para desabilitar o cache para a API
// ===================================================================
// Esta linha garante que o navegador sempre busque os dados mais
// recentes do servidor, resolvendo o problema do Status 304.
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
// ===================================================================

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const sql = 'SELECT * FROM usuarios WHERE username = ?';
        const [rows] = await pool.query(sql, [username]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        console.error("Erro na rota de login:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';
        await pool.query(sql, [username, hashedPassword]);
        res.status(201).json({ success: true, message: `Usuário ${username} registrado com sucesso!` });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Nome de usuário já existe.' });
        }
        console.error("Erro na rota de registro:", err);
        res.status(500).json({ success: false, message: 'Erro ao processar o registro.' });
    }
});

// --- ROTAS DA API DE PRODUTOS ---

// Adicionar um novo produto
app.post('/api/produtos', async (req, res) => {
    const { nome, sku, estoque, preco } = req.body;
    if (!nome || !sku || estoque === undefined || !preco) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    try {
        const sql = 'INSERT INTO produtos (nome, sku, estoque, preco) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [nome, sku, estoque, preco]);
        res.status(201).json({ success: true, message: 'Produto adicionado com sucesso!', productId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'O SKU informado já existe.' });
        }
        console.error("[ERRO] Falha ao adicionar produto:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const sql = 'SELECT * FROM produtos ORDER BY id DESC';
        const [products] = await pool.query(sql);
        res.json(products);
    } catch (err) {
        console.error("[ERRO] Falha ao listar produtos:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Contar produtos com baixo estoque (estoque < 2)
app.get('/api/produtos/low-stock-count', async (req, res) => {
    try {
        const sql = 'SELECT COUNT(*) as total FROM produtos WHERE estoque < 2';
        const [rows] = await pool.query(sql);
        res.json({ success: true, total: rows[0].total });
    } catch (err) {
        console.error("[ERRO] Falha ao contar produtos com baixo estoque:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Contar o total de produtos
app.get('/api/produtos/count', async (req, res) => {
    try {
        const sql = 'SELECT COUNT(*) as total FROM produtos';
        const [rows] = await pool.query(sql);
        res.json({ success: true, total: rows[0].total });
    } catch (err) {
        console.error("[ERRO] Falha ao contar produtos:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Buscar um único produto pelo ID
app.get('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM produtos WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`[ERRO] Falha ao buscar produto ${req.params.id}:`, err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Editar (Atualizar) um produto existente
app.put('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, sku, estoque, preco } = req.body;
        if (!nome || !sku || estoque === undefined || !preco) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
        }
        const sql = 'UPDATE produtos SET nome = ?, sku = ?, estoque = ?, preco = ? WHERE id = ?';
        await pool.query(sql, [nome, sku, estoque, preco, id]);
        res.json({ success: true, message: 'Produto atualizado com sucesso!' });
    } catch (err) {
        console.error(`[ERRO] Falha ao atualizar produto ${req.params.id}:`, err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Excluir um produto
app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM produtos WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
        }
        res.json({ success: true, message: 'Produto excluído com sucesso!' });
    } catch (err) {
        console.error(`[ERRO] Falha ao excluir produto ${req.params.id}:`, err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    pool.getConnection()
        .then(connection => {
            console.log('Conectado ao MySQL com sucesso!');
            connection.release();
        })
        .catch(err => {
            console.error('ERRO AO CONECTAR COM O MYSQL:', err.message);
            console.error('Verifique suas credenciais no arquivo server.js (dbConfig)');
        });
});
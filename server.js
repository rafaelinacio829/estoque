const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise'); // Usamos a versão com Promises para async/await
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const saltRounds = 10;

// --- Configuração da Conexão com o MySQL ---
// ATENÇÃO: Substitua com suas credenciais reais do MySQL.
const dbConfig = {
    host: 'interchange.proxy.rlwy.net',          // ou o IP do seu servidor de banco de dados
    user: 'root',               // seu usuário do MySQL
    password: 'FAhJuZOLrFpMgsgzafFkEBruHxrnbdGz', // sua senha do MySQL
    database: 'railway',
    port: 51338
};

// Criamos um "pool" de conexões. É mais eficiente do que criar uma nova conexão a cada consulta.
const pool = mysql.createPool(dbConfig);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// --- Rota de Login com lógica para MySQL ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const sql = 'SELECT * FROM usuarios WHERE username = ?';
        // O pool.query retorna um array [rows, fields]
        const [rows] = await pool.query(sql, [username]);

        const user = rows[0]; // Pegamos o primeiro resultado (se houver)

        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        // Compara a senha enviada com o hash salvo no banco
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

// --- Rota de Registro com lógica para MySQL ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';
        await pool.query(sql, [username, hashedPassword]);

        res.status(201).json({ success: true, message: `Usuário ${username} registrado com sucesso!` });

    } catch (err) {
        // Trata o erro específico de 'usuário duplicado' do MySQL
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Nome de usuário já existe.' });
        }

        console.error("Erro na rota de registro:", err);
        res.status(500).json({ success: false, message: 'Erro ao processar o registro.' });
    }
});
// --- NOVA ROTA: Adicionar um novo produto ---
app.post('/api/produtos', async (req, res) => {
    const { nome, sku, estoque, preco } = req.body;

    console.log('[LOG] Recebida requisição para adicionar novo produto:', req.body);

    // Validação simples dos dados recebidos
    if (!nome || !sku || estoque === undefined || !preco) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const sql = 'INSERT INTO produtos (nome, sku, estoque, preco) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [nome, sku, estoque, preco]);

        console.log(`[SUCESSO] Produto '${nome}' adicionado com o ID: ${result.insertId}`);
        res.status(201).json({ success: true, message: 'Produto adicionado com sucesso!', productId: result.insertId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'O SKU informado já existe.' });
        }
        console.error("[ERRO] Falha ao adicionar produto:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});
// --- NOVA ROTA: Listar todos os produtos ---
app.get('/api/produtos', async (req, res) => {
    console.log('[LOG] Recebida requisição para listar produtos.');
    try {
        // Seleciona todos os produtos, ordenando pelos mais recentes primeiro
        const sql = 'SELECT * FROM produtos ORDER BY id DESC';
        const [products] = await pool.query(sql);

        // Envia a lista de produtos como resposta JSON
        res.json(products);

    } catch (err) {
        console.error("[ERRO] Falha ao listar produtos:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});
// --- NOVA ROTA: Contar produtos com baixo estoque (estoque < 2) ---
app.get('/api/produtos/low-stock-count', async (req, res) => {
    console.log('[LOG] Recebida requisição para contagem de produtos com baixo estoque.');
    try {
        // A condição WHERE estoque < 2 é a chave aqui
        const sql = 'SELECT COUNT(*) as total FROM produtos WHERE estoque < 2';
        const [rows] = await pool.query(sql);
        const total = rows[0].total;

        res.json({ success: true, total: total });

    } catch (err) {
        console.error("[ERRO] Falha ao contar produtos com baixo estoque:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});
// --- NOVA ROTA: Contar o total de produtos ---
app.get('/api/produtos/count', async (req, res) => {
    console.log('[LOG] Recebida requisição para contagem de produtos.');
    try {
        const sql = 'SELECT COUNT(*) as total FROM produtos';
        const [rows] = await pool.query(sql);
        const total = rows[0].total; // Pega o valor da contagem

        res.json({ success: true, total: total });

    } catch (err) {
        console.error("[ERRO] Falha ao contar produtos:", err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    // Verifica se a conexão com o banco foi bem sucedida
    pool.getConnection()
        .then(connection => {
            console.log('Conectado ao MySQL com sucesso!');
            connection.release(); // Libera a conexão de volta para o pool
        })
        .catch(err => {
            console.error('ERRO AO CONECTAR COM O MYSQL:', err.message);
            console.error('Verifique suas credenciais no arquivo server.js (dbConfig)');
        });
});
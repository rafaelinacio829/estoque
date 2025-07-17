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
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. PEGAR O TOKEN DE AUTENTICAÇÃO ---
    const token = localStorage.getItem('token');

    // Se não houver token, o usuário não está logado. Redireciona para o login.
    if (!token) {
        window.location.href = 'login.html';
        return; // Interrompe a execução do script
    }

    // --- 2. CRIAR O CABEÇALHO DE AUTORIZAÇÃO PARA USAR NAS REQUISIÇÕES ---
    const authHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // Mapeamento dos elementos
    const productCountElement = document.getElementById('product-count');
    const lowStockCountElement = document.getElementById('low-stock-count');
    const noStockCountElement = document.getElementById('no-stock-count');
    const cadastrarItemBtn = document.getElementById('cadastrarItemBtn');

    // Função para buscar a contagem TOTAL de produtos
    const fetchProductCount = async () => {
        if (!productCountElement) return;
        try {
            // --- 3. ADICIONAR O CABEÇALHO NA REQUISIÇÃO ---
            const response = await fetch('/api/produtos/count', { headers: authHeaders });
            if (!response.ok) throw new Error('Falha ao buscar contagem total.');

            const data = await response.json();
            productCountElement.textContent = data.success ? data.total.toLocaleString('pt-BR') : '0';
        } catch (error) {
            console.error('Erro em fetchProductCount:', error);
            productCountElement.textContent = 'N/A';
        }
    };

    // Função para buscar contagem de produtos com BAIXO ESTOQUE
    const fetchLowStockCount = async () => {
        if (!lowStockCountElement) return;
        try {
            // --- 3. ADICIONAR O CABEÇALHO NA REQUISIÇÃO ---
            const response = await fetch('/api/produtos/low-stock-count', { headers: authHeaders });
            if (!response.ok) throw new Error('Falha ao buscar contagem de baixo estoque.');

            const data = await response.json();
            lowStockCountElement.textContent = data.success ? data.total.toLocaleString('pt-BR') : '0';
        } catch (error) {
            console.error('Erro em fetchLowStockCount:', error);
            lowStockCountElement.textContent = 'N/A';
        }
    };

    // Função para buscar contagem de produtos SEM ESTOQUE
    const fetchNoStockCount = async () => {
        if (!noStockCountElement) return;
        try {
            // --- 3. ADICIONAR O CABEÇALHO NA REQUISIÇÃO ---
            const response = await fetch('/api/produtos/no-stock-count', { headers: authHeaders });
            if (!response.ok) throw new Error('Falha ao buscar contagem de itens sem estoque.');

            const data = await response.json();
            noStockCountElement.textContent = data.success ? data.total.toLocaleString('pt-BR') : '0';
        } catch (error) {
            console.error('Erro em fetchNoStockCount:', error);
            noStockCountElement.textContent = 'N/A';
        }
    };

    // Lógica do botão "Cadastrar Item"
    if(cadastrarItemBtn) {
        cadastrarItemBtn.addEventListener('click', () => {
            window.location.href = 'produtos.html';
        });
    }

    // --- CHAMADA DAS FUNÇÕES ---
    fetchProductCount();
    fetchLowStockCount();
    fetchNoStockCount();

});
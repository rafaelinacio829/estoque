document.addEventListener('DOMContentLoaded', () => {

    const productCountElement = document.getElementById('product-count');
    const lowStockCountElement = document.getElementById('low-stock-count');
    const noStockCountElement = document.getElementById('no-stock-count'); // <-- NOVO
    const cadastrarItemBtn = document.getElementById('cadastrarItemBtn');

    // Função para buscar a contagem TOTAL de produtos
    const fetchProductCount = async () => {
        if (!productCountElement) return;
        try {
            const response = await fetch('/api/produtos/count');
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
            const response = await fetch('/api/produtos/low-stock-count');
            if (!response.ok) throw new Error('Falha ao buscar contagem de baixo estoque.');
            const data = await response.json();
            lowStockCountElement.textContent = data.success ? data.total.toLocaleString('pt-BR') : '0';
        } catch (error) {
            console.error('Erro em fetchLowStockCount:', error);
            lowStockCountElement.textContent = 'N/A';
        }
    };

    // --- NOVA FUNÇÃO para buscar contagem de produtos SEM ESTOQUE ---
    const fetchNoStockCount = async () => {
        if (!noStockCountElement) return;
        try {
            const response = await fetch('/api/produtos/no-stock-count');
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
    // Busca os dados para todos os cards assim que a página carrega
    fetchProductCount();
    fetchLowStockCount();
    fetchNoStockCount(); // <-- NOVO

});
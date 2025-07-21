document.addEventListener('DOMContentLoaded', () => {

    const productCountElement = document.getElementById('product-count');

    // Função para buscar a contagem de produtos da API
    const fetchProductCount = async () => {
        try {
            const response = await fetch('/api/produtos/count');
            if (!response.ok) {
                // Se a resposta não for bem-sucedida, lança um erro
                throw new Error('Falha ao buscar contagem de produtos.');
            }
            const data = await response.json();

            if (data.success) {
                // Formata o número com separador de milhar para pt-BR
                const formattedCount = data.total.toLocaleString('pt-BR');
                productCountElement.textContent = formattedCount;
            } else {
                productCountElement.textContent = 'Erro';
            }

        } catch (error) {
            console.error('Erro ao buscar contagem de produtos:', error);
            productCountElement.textContent = 'N/A'; // Mostra 'Não aplicável' em caso de erro
        }
    };
    document.addEventListener('DOMContentLoaded', () => {

        const productCountElement = document.getElementById('product-count');
        const lowStockCountElement = document.getElementById('low-stock-count'); // <-- NOVO

        // Função para buscar a contagem TOTAL de produtos
        const fetchProductCount = async () => {
            try {
                const response = await fetch('/api/produtos/count');
                if (!response.ok) throw new Error('Falha ao buscar contagem total.');

                const data = await response.json();
                if (data.success) {
                    productCountElement.textContent = data.total.toLocaleString('pt-BR');
                } else {
                    productCountElement.textContent = 'Erro';
                }
            } catch (error) {
                console.error('Erro em fetchProductCount:', error);
                productCountElement.textContent = 'N/A';
            }
        };

        // --- NOVA FUNÇÃO para buscar contagem de produtos com BAIXO ESTOQUE ---
        const fetchLowStockCount = async () => {
            try {
                const response = await fetch('/api/produtos/low-stock-count');
                if (!response.ok) throw new Error('Falha ao buscar contagem de baixo estoque.');

                const data = await response.json();
                if (data.success) {
                    lowStockCountElement.textContent = data.total.toLocaleString('pt-BR');
                } else {
                    lowStockCountElement.textContent = 'Erro';
                }
            } catch (error) {
                console.error('Erro em fetchLowStockCount:', error);
                lowStockCountElement.textContent = 'N/A';
            }
        };


        // --- CHAMADA DAS FUNÇÕES ---
        // Busca os dados para ambos os cards assim que a página carrega
        fetchProductCount();
        fetchLowStockCount(); // <-- NOVO

    });
    // Chama a função para buscar os dados assim que a página carrega
    fetchProductCount();

    // Você pode adicionar outras funções para os outros cards aqui no futuro
    // fetchLowStockCount();
    // fetchPendingOrdersCount();

});
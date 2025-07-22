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

        const cadastrarItemBtn = document.getElementById('cadastrarItemBtn');
        if (cadastrarItemBtn) {
            cadastrarItemBtn.addEventListener('click', () => {
                // Redireciona para a página de produtos
                window.location.href = 'produtos.html';
            });
        }

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


    // Botão Registrar Saída - Dashboard
    const registrarSaidaBtn = document.getElementById('registrarSaidaBtn');
    const saidaModal = document.getElementById('saidaModal');
    const closeSaidaModalBtn = document.getElementById('closeSaidaModalBtn');
    const saidaForm = document.getElementById('saidaForm');

    registrarSaidaBtn.addEventListener('click', () => {
        saidaModal.style.display = 'block';
    });
    closeSaidaModalBtn.addEventListener('click', () => {
        saidaModal.style.display = 'none';
        saidaForm.reset();
    });
    window.addEventListener('click', (event) => {
        if (event.target === saidaModal) {
            saidaModal.style.display = 'none';
            saidaForm.reset();
        }
    });

    // Função para buscar atividades recentes
    async function fetchRecentActivities() {
        try {
            const response = await fetch('/api/atividades-recentes');
            const atividades = await response.json();
            const tbody = document.querySelector('.recent-activities tbody');
            tbody.innerHTML = '';
            atividades.forEach(atividade => {
                const tipoTag = atividade.tipo === 'Saída'
                    ? '<span class="tag tag-saida">Saída</span>'
                    : '<span class="tag tag-entrada">Entrada</span>';
                const row = `<tr>
                    <td>${tipoTag}</td>
                    <td>${atividade.produto}</td>
                    <td>${atividade.quantidade}</td>
                    <td>${atividade.data}</td>
                </tr>`;
                tbody.innerHTML += row;
            });
        } catch (error) {
            // Em caso de erro, mantém a tabela como está
        }
    }

    // Chama ao carregar a página
    fetchRecentActivities();

    saidaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const produto = document.getElementById('produtoSaida').value;
        const quantidade = parseInt(document.getElementById('quantidadeSaida').value, 10);
        try {
            const response = await fetch('/api/saida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produto, quantidade })
            });
            const result = await response.json();
            if (result.success) {
                alert('Saída registrada com sucesso!');
                saidaModal.style.display = 'none';
                saidaForm.reset();
                fetchRecentActivities(); // Atualiza atividades
            } else {
                alert('Erro ao registrar saída: ' + (result.message || ''));
            }
        } catch (error) {
            alert('Erro de conexão com o servidor.');
        }
    });

});
document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addProductForm = document.getElementById('addProductForm');
    const tableBody = document.getElementById('product-table-body');

    // --- LÓGICA PARA BUSCAR E RENDERIZAR PRODUTOS ---

    // Função para formatar o preço como moeda brasileira
    const formatCurrency = (value) => {
        const numberValue = Number(value);
        if (isNaN(numberValue)) return 'R$ 0,00';
        return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Função para renderizar a tabela com os dados dos produtos
    const renderProductsTable = (products) => {
        tableBody.innerHTML = ''; // Limpa a tabela antes de preencher

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.nome}</td>
                    <td>${product.sku}</td>
                    <td>${product.estoque} un.</td>
                    <td>${formatCurrency(product.preco)}</td>
                    <td>
                        <button class="action-btn btn-edit" data-id="${product.id}">Editar</button>
                        <button class="action-btn btn-delete" data-id="${product.id}">Excluir</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    };

    // Função para buscar os produtos da API
    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/produtos');
            if (!response.ok) {
                throw new Error('Falha ao buscar os produtos.');
            }
            const products = await response.json();
            renderProductsTable(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar produtos.</td></tr>`;
        }
    };

    // --- LÓGICA DO MODAL (continua a mesma) ---

    const openModal = () => { modal.style.display = 'block'; };
    const closeModal = () => { modal.style.display = 'none'; };

    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            nome: document.getElementById('nome').value,
            sku: document.getElementById('sku').value,
            estoque: parseInt(document.getElementById('estoque').value, 10),
            preco: parseFloat(document.getElementById('preco').value)
        };

        try {
            const response = await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Produto adicionado com sucesso!');
                closeModal();
                addProductForm.reset();
                fetchProducts(); // <-- ATUALIZA A TABELA APÓS ADICIONAR
            } else {
                alert(`Erro: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });

    // --- CHAMADA INICIAL ---
    // Busca e exibe os produtos assim que a página carrega
    fetchProducts();
});
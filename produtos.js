document.addEventListener('DOMContentLoaded', () => {

    // Mapeamento de Elementos do DOM
    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addProductForm = document.getElementById('addProductForm');
    const tableBody = document.getElementById('product-table-body');
    const modalTitle = document.querySelector('#addProductModal h2');
    const submitButton = document.querySelector('#addProductForm button[type="submit"]');

    // Estado para controlar se estamos editando ou adicionando
    let editingProductId = null;

    // --- FUNÇÕES DE RENDERIZAÇÃO E API ---

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const renderProductsTable = (products) => {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
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
                        <button class="btn action-btn btn-edit" data-id="${product.id}">Editar</button>
                        <button class="btn action-btn btn-delete" data-id="${product.id}">Excluir</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/produtos');
            const products = await response.json();
            renderProductsTable(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar produtos.</td></tr>`;
        }
    };

    // --- LÓGICA DO MODAL (ABRIR/FECHAR) ---

    const openModalForNew = () => {
        editingProductId = null;
        modalTitle.textContent = 'Adicionar Novo Produto';
        submitButton.textContent = 'Cadastrar Produto';
        addProductForm.reset();
        modal.style.display = 'block';
    };

    const openModalForEdit = async (id) => {
        try {
            // ESTA É A LINHA QUE CORRIGIMOS
            const response = await fetch(`/api/produtos/${id}`);
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
            const product = await response.json();

            document.getElementById('nome').value = product.nome;
            document.getElementById('sku').value = product.sku;
            document.getElementById('estoque').value = product.estoque;
            document.getElementById('preco').value = product.preco;

            editingProductId = id;
            modalTitle.textContent = 'Editar Produto';
            submitButton.textContent = 'Salvar Alterações';
            modal.style.display = 'block';
        } catch (error) {
            console.error('Erro ao buscar dados do produto para edição:', error);
            alert('Não foi possível carregar os dados do produto.');
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        addProductForm.reset();
    };

    // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

    openModalBtn.addEventListener('click', openModalForNew);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    // Lógica do Formulário (Adicionar ou Editar)
    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            nome: document.getElementById('nome').value,
            sku: document.getElementById('sku').value,
            estoque: parseInt(document.getElementById('estoque').value, 10),
            preco: parseFloat(document.getElementById('preco').value)
        };

        const isEditing = editingProductId !== null;
        const url = isEditing ? `/api/produtos/${editingProductId}` : '/api/produtos';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                alert(isEditing ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
                closeModal();
                fetchProducts();
            } else {
                alert(`Erro: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });

    // Lógica da Tabela (Editar ou Excluir)
    tableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.action-btn'); // Melhora a detecção do clique
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('btn-edit')) {
            openModalForEdit(id);
        }

        if (target.classList.contains('btn-delete')) {
            if (confirm(`Tem certeza que deseja excluir o produto com ID ${id}?`)) {
                try {
                    const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (result.success) {
                        alert('Produto excluído com sucesso!');
                        fetchProducts();
                    } else {
                        alert(`Erro: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Erro ao excluir produto:', error);
                    alert('Não foi possível conectar ao servidor.');
                }
            }
        }
    });

    // --- CHAMADA INICIAL ---
    fetchProducts();
});
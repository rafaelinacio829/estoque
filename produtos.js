// Arquivo: produtos.js
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addProductForm = document.getElementById('addProductForm');
    const tableBody = document.getElementById('product-table-body');
    const modalTitle = document.querySelector('#addProductModal h2');
    const submitButton = document.querySelector('#addProductForm button[type="submit"]');
    let editingProductId = null;

    const formatCurrency = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const renderProductsTable = (products) => {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
            return;
        }
        products.forEach(product => {
            const row = `<tr><td>${product.id}</td><td>${product.nome}</td><td>${product.sku}</td><td>${product.estoque} un.</td><td>${formatCurrency(product.preco)}</td><td><button class="btn action-btn btn-edit" data-id="${product.id}">Editar</button><button class="btn action-btn btn-delete" data-id="${product.id}">Excluir</button></td></tr>`;
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

    const openModalForNew = () => {
        editingProductId = null;
        modalTitle.textContent = 'Adicionar Novo Produto';
        submitButton.textContent = 'Cadastrar Produto';
        addProductForm.reset();
        modal.style.display = 'block';
    };

    const openModalForEdit = async (id) => {
        try {
            const response = await fetch(`/api/produtos/${id}`);
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

    openModalBtn.addEventListener('click', openModalForNew);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

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
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.success) {
                alert(isEditing ? 'Produto atualizado!' : 'Produto adicionado!');
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

    tableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.action-btn');
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
                        alert('Produto excluído!');
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

    // Botão Registrar Saída
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
                // Aqui você pode atualizar a tabela de produtos ou atividades se desejar
            } else {
                alert('Erro ao registrar saída: ' + (result.message || ''));
            }
        } catch (error) {
            alert('Erro de conexão com o servidor.');
        }
    });

    fetchProducts();
});
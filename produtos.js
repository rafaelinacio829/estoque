document.addEventListener('DOMContentLoaded', () => {
    // --- 1. AUTENTICAÇÃO E CABEÇALHOS ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    const authHeadersJSON = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // --- 2. MAPEAMENTO DE ELEMENTOS DO DOM ---
    const addModal = document.getElementById('addProductModal');
    const openAddModalBtn = document.getElementById('openModalBtn');
    const closeAddModalBtn = document.getElementById('closeModalBtn');
    const addProductForm = document.getElementById('addProductForm');

    const saidaModal = document.getElementById('saidaModal');
    const openSaidaModalBtn = document.getElementById('openSaidaModalBtn');
    const closeSaidaModalBtn = document.getElementById('closeSaidaModalBtn');
    const saidaForm = document.getElementById('saidaForm');
    const produtoSelectSaida = document.getElementById('produtoSaida');

    const tableBody = document.getElementById('product-table-body');
    let editingProductId = null;

    // --- 3. FUNÇÕES PRINCIPAIS ---

    const formatCurrency = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const renderProductsTable = (products) => {
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
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
            const response = await fetch('/api/produtos', { headers: authHeaders });
            if (!response.ok) throw new Error('Falha ao buscar produtos');
            const products = await response.json();
            renderProductsTable(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar produtos.</td></tr>`;
        }
    };

    // --- 4. LÓGICA DO MODAL DE ADICIONAR/EDITAR ---
    const openModalForNew = () => {
        editingProductId = null;
        addProductForm.reset();
        addModal.querySelector('h2').textContent = 'Adicionar Novo Produto';
        addProductForm.querySelector('button[type="submit"]').textContent = 'Cadastrar Produto';
        addModal.style.display = 'block';
    };

    const openModalForEdit = async (id) => {
        try {
            const response = await fetch(`/api/produtos/${id}`, { headers: authHeaders });
            const product = await response.json();
            document.getElementById('nome').value = product.nome;
            document.getElementById('sku').value = product.sku;
            document.getElementById('estoque').value = product.estoque;
            document.getElementById('preco').value = product.preco;
            editingProductId = id;
            addModal.querySelector('h2').textContent = 'Editar Produto';
            addProductForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            addModal.style.display = 'block';
        } catch (error) {
            alert('Não foi possível carregar os dados do produto.');
        }
    };

    const closeAddModal = () => { addModal.style.display = 'none'; };

    // --- 5. LÓGICA DO MODAL DE SAÍDA ---
    const openSaidaModal = async () => {
        try {
            const response = await fetch('/api/produtos', { headers: authHeaders });
            const products = await response.json();
            produtoSelectSaida.innerHTML = '<option value="">Selecione um produto</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.nome} (Estoque: ${product.estoque})`;
                produtoSelectSaida.appendChild(option);
            });
            saidaModal.style.display = 'block';
        } catch (error) {
            alert('Não foi possível carregar a lista de produtos.');
        }
    };

    const closeSaidaModal = () => {
        saidaModal.style.display = 'none';
        saidaForm.reset();
    };

    // --- 6. EVENT LISTENERS ---
    if (openAddModalBtn) openAddModalBtn.addEventListener('click', openModalForNew);
    if (closeAddModalBtn) closeAddModalBtn.addEventListener('click', closeAddModal);
    if (openSaidaModalBtn) openSaidaModalBtn.addEventListener('click', openSaidaModal);
    if (closeSaidaModalBtn) closeSaidaModalBtn.addEventListener('click', closeSaidaModal);

    window.addEventListener('click', (event) => {
        if (event.target === addModal) closeAddModal();
        if (event.target === saidaModal) closeSaidaModal();
    });

    if (addProductForm) {
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
                const response = await fetch(url, { method, headers: authHeadersJSON, body: JSON.stringify(formData) });
                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    closeAddModal();
                    fetchProducts();
                } else {
                    alert(`Erro: ${result.message}`);
                }
            } catch (error) {
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    if (saidaForm) {
        saidaForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const saidaData = {
                produto_id: document.getElementById('produtoSaida').value,
                quantidade: parseInt(document.getElementById('quantidadeSaida').value, 10)
            };
            try {
                const response = await fetch('/api/saida', { method: 'POST', headers: authHeadersJSON, body: JSON.stringify(saidaData) });
                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    closeSaidaModal();
                    fetchProducts();
                } else {
                    alert(`Erro: ${result.message}`);
                }
            } catch (error) {
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('.action-btn');
            if (!target) return;
            const id = target.dataset.id;

            if (target.classList.contains('btn-edit')) {
                openModalForEdit(id);
            }

            if (target.classList.contains('btn-delete')) {
                if (confirm('Tem certeza que deseja excluir este produto?')) {
                    try {
                        const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE', headers: authHeaders });
                        const result = await response.json();
                        if (result.success) {
                            alert(result.message);
                            fetchProducts();
                        } else {
                            alert(`Erro: ${result.message}`);
                        }
                    } catch (error) {
                        alert('Não foi possível conectar ao servidor.');
                    }
                }
            }
        });
    }

    // --- 7. CHAMADA INICIAL ---
    fetchProducts();
});
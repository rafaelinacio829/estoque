document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addProductForm = document.getElementById('addProductForm');
    const tableBody = document.getElementById('product-table-body');

    // Verifica se todos os elementos essenciais existem antes de continuar
    if (!modal || !openModalBtn || !closeModalBtn || !addProductForm || !tableBody) {
        console.error('Um ou mais elementos essenciais do DOM não foram encontrados. Verifique os IDs no HTML.');
        return; // Interrompe a execução se algo estiver faltando
    }

    const formatCurrency = (value) => {
        const numberValue = Number(value);
        if (isNaN(numberValue)) return 'R$ 0,00';
        return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const renderProductsTable = (products) => {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>';
            return;
        }
        products.forEach(product => {
            // A CORREÇÃO ESTÁ AQUI: adicionamos a classe "btn" aos botões
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            renderProductsTable(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Erro ao carregar produtos.</td></tr>`;
        }
    };

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
                fetchProducts();
            } else {
                alert(`Erro: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });

    fetchProducts();
});
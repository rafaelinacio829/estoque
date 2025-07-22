document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICAÇÃO DE AUTENTICAÇÃO ---
    const token = localStorage.getItem('token');
    if (!token) {
        // Se não houver token, o usuário não está logado. Redireciona para o login.
        window.location.href = 'login.html';
        return;
    }

    // --- 2. CABEÇALHOS DE AUTENTICAÇÃO PARA A API ---
    // Headers para requisições que enviam dados (POST, PUT)
    const authHeadersJSON = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    // Headers para requisições que apenas buscam dados (GET, DELETE)
    const authHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // Mapeamento dos elementos do DOM
    const modal = document.getElementById('collaboratorModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const collaboratorForm = document.getElementById('collaboratorForm');
    const tableBody = document.getElementById('collaborator-table-body');
    const modalTitle = document.querySelector('#collaboratorModal h2');
    const submitButton = document.querySelector('#collaboratorForm button[type="submit"]');
    let editingCollaboratorId = null;

    const renderTable = (collaborators) => {
        tableBody.innerHTML = '';
        if (collaborators.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum colaborador cadastrado.</td></tr>';
            return;
        }
        collaborators.forEach(c => {
            const statusTag = c.status === 'ativo' ? 'tag-entrada' : 'tag-saida';
            const row = `
                <tr>
                    <td>${c.nome}</td>
                    <td>${c.email}</td>
                    <td>${c.cargo || 'N/A'}</td>
                    <td><span class="tag ${statusTag}">${c.status}</span></td>
                    <td>
                        <button class="btn action-btn btn-edit" data-id="${c.id}">Editar</button>
                        <button class="btn action-btn btn-delete" data-id="${c.id}">Excluir</button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    };

    const fetchData = async () => {
        try {
            // --- 3. ENVIA O TOKEN NA REQUISIÇÃO ---
            const response = await fetch('/api/colaboradores', { headers: authHeaders });
            if(response.status === 401 || response.status === 403) { window.location.href = 'login.html'; return; }
            const data = await response.json();
            renderTable(data);
        } catch (error) { console.error('Erro ao buscar colaboradores:', error); }
    };

    const openModalForNew = () => {
        editingCollaboratorId = null;
        modalTitle.textContent = 'Adicionar Novo Colaborador';
        submitButton.textContent = 'Salvar';
        collaboratorForm.reset();
        modal.style.display = 'block';
    };

    const openModalForEdit = async (id) => {
        try {
            const response = await fetch(`/api/colaboradores/${id}`, { headers: authHeaders });
            const data = await response.json();
            document.getElementById('nome').value = data.nome;
            document.getElementById('email').value = data.email;
            document.getElementById('cargo').value = data.cargo;
            document.getElementById('data_admissao').value = data.data_admissao ? data.data_admissao.split('T')[0] : '';
            document.getElementById('status').value = data.status;
            editingCollaboratorId = id;
            modalTitle.textContent = 'Editar Colaborador';
            submitButton.textContent = 'Salvar Alterações';
            modal.style.display = 'block';
        } catch (error) { alert('Não foi possível carregar os dados.'); }
    };

    const closeModal = () => { modal.style.display = 'none'; };

    openModalBtn.addEventListener('click', openModalForNew);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

    collaboratorForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            cargo: document.getElementById('cargo').value,
            data_admissao: document.getElementById('data_admissao').value,
            status: document.getElementById('status').value
        };
        const isEditing = editingCollaboratorId !== null;
        const url = isEditing ? `/api/colaboradores/${editingCollaboratorId}` : '/api/colaboradores';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method, headers: authHeadersJSON, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.success) {
                closeModal();
                fetchData();
            } else { alert(`Erro: ${result.message}`); }
        } catch (error) { alert('Não foi possível conectar ao servidor.'); }
    });

    tableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.action-btn');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('btn-edit')) {
            openModalForEdit(id);
        }
        if (target.classList.contains('btn-delete')) {
            if (confirm(`Tem certeza que deseja excluir?`)) {
                try {
                    const response = await fetch(`/api/colaboradores/${id}`, { method: 'DELETE', headers: authHeaders });
                    const result = await response.json();
                    if (result.success) fetchData(); else alert(`Erro: ${result.message}`);
                } catch (error) { alert('Não foi possível conectar ao servidor.'); }
            }
        }
    });

    fetchData();
});
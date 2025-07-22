document.addEventListener('DOMContentLoaded', () => {
    const submenuToggles = document.querySelectorAll('.has-submenu');

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            const parentLi = toggle.closest('li');
            parentLi.classList.toggle('open');
        });
    });

    // Mantém o submenu aberto se a página atual for um de seus links
    const currentPage = window.location.pathname.split('/').pop();
    const activeLink = document.querySelector(`.submenu a[href="${currentPage}"]`);
    if (activeLink) {
        const parentLi = activeLink.closest('.nav-group');
        if (parentLi) {
            parentLi.classList.add('open');
            // Opcional: marcar o link pai como ativo também
            parentLi.querySelector('.nav-link').classList.add('active');
        }
    } else {
        // Se a página principal do dashboard estiver ativa, não marca o submenu
        const dashboardLink = document.querySelector('.nav-link[href="dashboard.html"]');
        if (currentPage === "dashboard.html" && dashboardLink) {
            dashboardLink.classList.add('active');
        }
    }

    // Recupera o nível do usuário do localStorage
    const nivel = localStorage.getItem('nivel');
    // Esconde a aba Usuários se não for administrador
    if (nivel !== 'administrador') {
        const usuariosLink = document.querySelector('.sidebar-nav .nav-link span');
        if (usuariosLink && usuariosLink.textContent.trim() === 'Usuários') {
            usuariosLink.parentElement.style.display = 'none';
        }
    }
});
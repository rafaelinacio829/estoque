// Arquivo: sidebar.js

document.addEventListener('DOMContentLoaded', () => {

    // Lógica para o menu expansível
    const submenuToggle = document.querySelector('.nav-item.has-submenu');
    if (submenuToggle) {
        submenuToggle.addEventListener('click', (event) => {
            event.preventDefault(); // Impede a navegação ao clicar no item pai
            const navGroup = submenuToggle.closest('.nav-group');
            navGroup.classList.toggle('open');
        });
    }

    // Lógica para manter o submenu aberto se a página atual for um sub-item
    const activeSubmenuItem = document.querySelector('.submenu-item.active');
    if (activeSubmenuItem) {
        const parentNavGroup = activeSubmenuItem.closest('.nav-group');
        parentNavGroup.classList.add('open');
        // Também marca o item pai como ativo visualmente
        parentNavGroup.querySelector('.has-submenu').classList.add('active');
    }

    // Lógica para marcar o link ativo na página de produtos
    // (precisamos fazer isso via JS agora por causa da nova estrutura)
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'produtos.html') {
        const productLink = document.querySelector('a[href="produtos.html"]');
        if (productLink) {
            productLink.classList.add('active');
        }
    }
});
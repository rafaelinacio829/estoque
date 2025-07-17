document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // Impede o envio padrão do formulário, que recarregaria a página
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Envia os dados para o nosso futuro back-end
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (data.success) {
                    // Se o back-end responder com sucesso, redireciona para o dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Se responder com falha, exibe a mensagem de erro vinda do back-end
                    alert(data.message || 'Ocorreu um erro.');
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }
});
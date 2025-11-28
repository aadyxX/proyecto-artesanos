document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Si ya hay un token, redirigir al dashboard
    const token = localStorage.getItem('artesano_token');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        errorMessage.classList.add('d-none');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        fetch('/api/usuarios-jwt/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        })
        .then(data => {
            // Verificación CRÍTICA: el usuario debe ser de tipo 'artesano'
            if (data.user && data.user.tipo_usuario === 'artesano') {
                localStorage.setItem('artesano_token', data.access_token);
                window.location.href = 'dashboard.html';
            } else {
                // Si el tipo de usuario no es 'artesano', se trata como un error de login
                showError('Acceso denegado. Solo para usuarios artesanos.');
            }
        })
        .catch(error => {
            const message = error.error || 'Credenciales incorrectas o error del servidor.';
            showError(message);
        });
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }
});

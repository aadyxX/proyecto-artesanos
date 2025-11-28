// login.js

const API_URL = "http://localhost:8000/api/usuarios-jwt";
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const messageDiv = document.getElementById("loginMessage");
    messageDiv.innerHTML = "";

    if (!email || !password) {
        messageDiv.innerHTML = "<p class='error'>Todos los campos son obligatorios</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.access_token);
            messageDiv.innerHTML = `<p class="success">${data.message}</p>`;
            setTimeout(() => {
                window.location.href = "carrito.html";
            }, 1000);
        } else {
            messageDiv.innerHTML = `<p class="error">${data.message || "Error en login"}</p>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<p class="error">Error de red: ${error.message}</p>`;
    }
});


// --- REGISTRO ---

document.getElementById("registerForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const nombre = document.getElementById("registerNombre").value.trim();

    const apellidos = document.getElementById("registerApellidos").value.trim();

    const email = document.getElementById("registerEmail").value.trim();

    const password = document.getElementById("registerPassword").value.trim();

    const telefono = document.getElementById("registerTelefono").value.trim();

    const direccion = document.getElementById("registerDireccion").value.trim();

    const ciudad = document.getElementById("registerCiudad").value.trim();

    const estado = document.getElementById("registerEstado").value.trim();

    const codigo_postal = document.getElementById("registerCodigoPostal").value.trim();

    const messageDiv = document.getElementById("registerMessage");

    messageDiv.innerHTML = "";


    if (!nombre || !apellidos || !email || !password || !telefono || !direccion || !ciudad || !estado || !codigo_postal) {

        messageDiv.innerHTML = "<p class='error'>Todos los campos son obligatorios</p>";

        return;

    }


    if (password.length < 8) {

        messageDiv.innerHTML = "<p class='error'>La contraseña debe tener al menos 8 caracteres</p>";

        return;

    }


    try {

        const response = await fetch(`${API_URL}/register`, {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

                nombre,

                apellidos,

                email,

                password,

                telefono,

                direccion,

                ciudad,

                estado,

                codigo_postal,

            }),

        });


        const data = await response.json();


        if (response.ok) {

            messageDiv.innerHTML = `<p class="success">${data.message}</p>`;

        } else {

            const errores = data.errors ? Object.values(data.errors).flat().join("<br>") : data.message;

            messageDiv.innerHTML = `<p class="error">${errores}</p>`;

        }

    } catch (error) {

        messageDiv.innerHTML = `<p class="error">Error de red: ${error.message}</p>`;

    }

});


// Alternar entre login y registro
document.getElementById("mostrarRegistro").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
    document.getElementById("form-title").textContent = "Registro";
});

document.getElementById("mostrarLogin").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("form-title").textContent = "Iniciar Sesión";
});

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const productosResumen = document.getElementById('productos-resumen');
    const subtotalElem = document.getElementById('subtotal');
    const ivaElem = document.getElementById('iva');
    const envioElem = document.getElementById('envio');
    const totalElem = document.getElementById('total');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const usarDatosRegistro = document.getElementById('usar-datos-registro');

    // Campos de formulario
    const nombreInput = document.getElementById('nombre');
    const apellidosInput = document.getElementById('apellidos');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const ciudadInput = document.getElementById('ciudad');
    const estadoInput = document.getElementById('estado');
    const codigoPostalInput = document.getElementById('codigo_postal');

    // --- VERIFICACIÓN DE AUTENTICACIÓN ---
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- FUNCIÓN PARA CARGAR DATOS DEL CHECKOUT ---
    async function cargarCheckout() {
        try {
            const response = await fetch('http://localhost:8000/api/usuarios-jwt/checkout', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Error al cargar el checkout: ' + errorText);
            }

            const data = await response.json();
            console.log('Datos del checkout:', data);

            // Llenar datos de envío
            if (data.cliente) {
                nombreInput.value = data.cliente.nombre || '';
                apellidosInput.value = data.cliente.apellidos || '';
                telefonoInput.value = data.cliente.telefono || '';
                direccionInput.value = data.cliente.direccion || '';
                ciudadInput.value = data.cliente.ciudad || '';
                estadoInput.value = data.cliente.estado || '';
                codigoPostalInput.value = data.cliente.codigo_postal || '';
            }

            // Renderizar productos
            renderizarProductos(data.items);

            // Actualizar totales
            actualizarTotales(data);

        } catch (error) {
            console.error('Error en cargarCheckout:', error);
            alert('Error al cargar la página de checkout. Redirigiendo al carrito.');
            window.location.href = 'carrito.html';
        }
    }

    // --- FUNCIÓN PARA RENDERIZAR LOS PRODUCTOS ---
    function renderizarProductos(productos) {
        productosResumen.innerHTML = '';

        productos.forEach(item => {
            const productoHTML = `
                <div class="producto-resumen">
                    <img src="${window.location.origin}${item.producto.imagen_url}" alt="${item.producto.nombre}">
                    <div class="producto-info">
                        <h4>${item.producto.nombre}</h4>
                        <p>Cantidad: ${item.cantidad} | Artesano: ${item.artesano.nombre}</p>
                    </div>
                    <div class="producto-precio">$${parseFloat(item.subtotal).toFixed(2)}</div>
                </div>
            `;
            productosResumen.insertAdjacentHTML('beforeend', productoHTML);
        });
    }

    // --- FUNCIÓN PARA ACTUALIZAR LOS TOTALES ---
    function actualizarTotales(data) {
        const subtotal = data.subtotal || 0;
        const iva = data.iva || 0;
        const shippingActual = data.shipping_actual || 99.99;
        const total = data.total || 0;

        subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
        ivaElem.textContent = `$${iva.toFixed(2)}`;

        if (subtotal > 999) {
            envioElem.innerHTML = '<span class="text-decoration-line-through text-muted">$99.99</span> <span class="text-success fw-bold">GRATIS</span>';
        } else {
            envioElem.textContent = `$${parseFloat(shippingActual).toFixed(2)}`;
        }

        totalElem.textContent = `$${total.toFixed(2)}`;
    }

    // --- MANEJAR CHECKBOX DE USAR DATOS DE REGISTRO ---
    usarDatosRegistro.addEventListener('change', function() {
        if (this.checked) {
            cargarCheckout(); // Recargar datos del cliente
        } else {
            // Limpiar campos para edición manual
            nombreInput.value = '';
            apellidosInput.value = '';
            telefonoInput.value = '';
            direccionInput.value = '';
            ciudadInput.value = '';
            estadoInput.value = '';
            codigoPostalInput.value = '';
        }
    });

    // --- VALIDACIÓN DEL FORMULARIO ---
    function validarFormulario() {
        const campos = [
            { elem: nombreInput, nombre: 'Nombre' },
            { elem: apellidosInput, nombre: 'Apellidos' },
            { elem: telefonoInput, nombre: 'Teléfono' },
            { elem: direccionInput, nombre: 'Dirección' },
            { elem: ciudadInput, nombre: 'Ciudad' },
            { elem: estadoInput, nombre: 'Estado' },
            { elem: codigoPostalInput, nombre: 'Código Postal' }
        ];

        for (const campo of campos) {
            if (!campo.elem.value.trim()) {
                alert(`Por favor, complete el campo: ${campo.nombre}`);
                campo.elem.focus();
                return false;
            }
        }

        // Validar método de pago
        const metodoPago = document.querySelector('input[name="metodo_pago"]:checked');
        if (!metodoPago) {
            alert('Por favor, seleccione un método de pago');
            return false;
        }

        return true;
    }

    // --- CONFIRMAR COMPRA ---
    btnConfirmar.addEventListener('click', async function() {
        if (!validarFormulario()) {
            return;
        }

        const metodoPago = document.querySelector('input[name="metodo_pago"]:checked').value;

        const datosEnvio = {
            nombre: nombreInput.value.trim(),
            apellidos: apellidosInput.value.trim(),
            telefono: telefonoInput.value.trim(),
            direccion: direccionInput.value.trim(),
            ciudad: ciudadInput.value.trim(),
            estado: estadoInput.value.trim(),
            codigo_postal: codigoPostalInput.value.trim()
        };

        // Confirmar compra
        const confirmacion = confirm(`¿Está seguro de que desea confirmar la compra con ${metodoPago}?`);
        if (!confirmacion) {
            return;
        }

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Procesando...';

        try {
            const response = await fetch(`${window.location.origin}/api/usuarios-jwt/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    metodo_pago: metodoPago,
                    datos_envio: datosEnvio
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar la compra');
            }

            const data = await response.json();
            alert('¡Compra realizada exitosamente!');

            // Redirigir a página de confirmación o productos
            window.location.href = 'productos.html';

        } catch (error) {
            console.error('Error al confirmar compra:', error);
            alert('Error: ' + error.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar Compra';
        }
    });

    // --- CANCELAR Y REGRESAR AL CARRITO ---
    btnCancelar.addEventListener('click', function() {
        window.location.href = 'carrito.html';
    });

    // --- INICIALIZACIÓN ---
    cargarCheckout();
});

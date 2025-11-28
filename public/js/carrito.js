document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const listaProductos = document.getElementById('lista-productos');
    const subtotalProductosElem = document.getElementById('subtotal-productos');
    const costoEnvioElem = document.getElementById('costo-envio');
    const totalPedidoElem = document.getElementById('total-pedido');
    const carritoVacioElem = document.getElementById('carrito-vacio');
    const carritoContenidoElem = document.getElementById('carrito-contenido');
    const btnCerrarSesion = document.getElementById('cerrarSesion');
    const bienvenidaElem = document.getElementById('bienvenida');

    // --- VERIFICACIÓN DE AUTENTICACIÓN ---
    if (!token) {
        // Si no hay token, redirigir a la página de login
        window.location.href = 'login.html';
        return;
    }

    // --- FUNCIÓN PARA OBTENER EL NOMBRE DEL USUARIO ---
    async function fetchUserName() {
        try {
            const API_BASE_URL = window.location.origin;
// ... y luego en la petición ...
const response = await fetch(`${API_BASE_URL}/api/usuarios-jwt/miUsuario`, {

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('No se pudo obtener la información del usuario.');
            }

            const data = await response.json();
            if (data.cliente && data.cliente.nombre) {
                bienvenidaElem.textContent = `¡Hola, ${data.cliente.nombre}! Aquí está tu carrito.`;
            }
        } catch (error) {
            console.error('Error al obtener el nombre del usuario:', error);
            bienvenidaElem.textContent = '¡Bienvenido a tu carrito!';
        }
    }


    // --- FUNCIÓN PARA CARGAR LOS PRODUCTOS DEL CARRITO ---
    async function cargarCarrito() {
        console.log('Cargando carrito...');
        console.log('Token:', token);
        try {
            const response = await fetch('http://localhost:8000/api/usuarios-jwt/carrito', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Respuesta de la API:', response);
            console.log('Status de la respuesta:', response.status);
            console.log('OK de la respuesta:', response.ok);

            if (response.status === 401) {
                console.log('Token inválido o expirado. Redirigiendo a login.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error al cargar el carrito:', errorText);
                throw new Error('Error al cargar el carrito: ' + errorText);
            }

            const data = await response.json();
            console.log('Datos recibidos de la API:', data);

            if (data.items && data.items.length > 0) {
                console.log('Productos encontrados en el carrito:', data.items.length);
                carritoVacioElem.style.display = 'none';
                carritoContenidoElem.style.display = 'block';
                renderizarProductos(data.items);
                actualizarResumen(data);
            } else {
                console.log('El carrito está vacío o no se recibieron items.');
                mostrarCarritoVacio();
            }

        } catch (error) {
            console.error('Error en cargarCarrito:', error);
            mostrarCarritoVacio();
        }
    }

    // --- FUNCIÓN PARA RENDERIZAR LOS PRODUCTOS EN EL HTML ---
    function renderizarProductos(productos) {
        console.log('Intentando renderizar productos:', productos);
        listaProductos.innerHTML = ''; // Limpiar la lista antes de renderizar
        if (productos.length === 0) {
            console.log('No hay productos para renderizar.');
            mostrarCarritoVacio();
            return;
        }
        productos.forEach(item => {
        const productoHTML = `
            <div class="producto-item" data-id="${item.id}" data-producto-id="${item.producto.id}" data-stock="${item.producto.stock}">

                <div class="info-producto">
                    <img src="${window.location.origin}${item.producto.imagen_url}" alt="${item.producto.nombre}" class="imagen-producto">
                    <div class="detalles-producto">
                        <p class="nombre-producto">${item.producto.nombre}</p>
                        <p class="precio-producto">$${parseFloat(item.producto.precio).toFixed(2)}</p>
                        <button class="btn-eliminar">Eliminar</button>
                    </div>
                </div>

                <div class="control-cantidad">
                    <button class="btn-cantidad menos">-</button>
                    <input type="number" value="${item.cantidad}" min="1" max="${item.producto.stock}" class="input-cantidad">
                    <button class="btn-cantidad mas">+</button>
                </div>

                <span class="subtotal-item">$${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
        `;
        listaProductos.insertAdjacentHTML('beforeend', productoHTML);
    });
        console.log('Productos renderizados.');
    }

    // --- FUNCIÓN PARA ACTUALIZAR EL RESUMEN DEL PEDIDO ---
    function actualizarResumen(data) {
        console.log('Datos para actualizar resumen:', data);
        const subtotal = data.subtotal || 0;
        const iva = data.iva || 0;
        const shippingOriginal = data.shipping_original || 99.99;
        const shippingActual = data.shipping_actual || 99.99;
        const total = data.total || 0;

        console.log('Subtotal:', subtotal, 'Shipping actual:', shippingActual, 'Es gratis?', parseFloat(shippingActual) === 0);

        subtotalProductosElem.textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('iva-amount').textContent = `$${iva.toFixed(2)}`;

        const costoEnvioElem = document.getElementById('costo-envio');

        if (subtotal > 999) {
            costoEnvioElem.innerHTML = '<span class="text-decoration-line-through text-muted">$99.99</span> <span class="text-success fw-bold">GRATIS</span>';
            console.log('Mostrando envío gratis porque subtotal > 999');
        } else {
            costoEnvioElem.textContent = `$${parseFloat(shippingActual).toFixed(2)}`;
            console.log('Mostrando envío pagado');
        }

        totalPedidoElem.textContent = `$${total.toFixed(2)}`;
    }

    // --- FUNCIÓN PARA MOSTRAR EL CARRITO VACÍO ---
    function mostrarCarritoVacio() {
        carritoVacioElem.style.display = 'block';
        carritoContenidoElem.style.display = 'none';
    }

    // --- MANEJO DE EVENTOS PARA ELIMINAR Y CAMBIAR CANTIDAD ---
    listaProductos.addEventListener('click', async function(e) {
        const productoItem = e.target.closest('.producto-item');
        if (!productoItem) return;

        const carritoProductoId = productoItem.dataset.id;

        // Eliminar producto
        if (e.target.classList.contains('btn-eliminar')) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
                await eliminarProducto(carritoProductoId);
            }
        }

        // Actualizar cantidad
        if (e.target.classList.contains('btn-cantidad')) {
            const inputCantidad = productoItem.querySelector('.input-cantidad');
            let cantidad = parseInt(inputCantidad.value);
            const stockDisponible = parseInt(productoItem.dataset.stock); // Asumiendo que agregaremos el stock al dataset

            if (e.target.classList.contains('mas')) {
                if (cantidad >= stockDisponible) {
                    alert(`No puedes agregar más. Stock disponible: ${stockDisponible}`);
                    return;
                }
                cantidad++;
            } else if (e.target.classList.contains('menos') && cantidad > 1) {
                cantidad--;
            }

            inputCantidad.value = cantidad;
            const productoId = productoItem.dataset.productoId;
            await actualizarCantidad(productoId, cantidad);
        }
    });
    
    // --- Listener para cambios directos en el input de cantidad ---
    listaProductos.addEventListener('change', async function(e) {
        if (e.target.classList.contains('input-cantidad')) {
            const productoItem = e.target.closest('.producto-item');
            if (!productoItem) return;

            const productoId = productoItem.dataset.productoId;
            const stockDisponible = parseInt(productoItem.dataset.stock);
            let cantidad = parseInt(e.target.value);

            if (isNaN(cantidad) || cantidad < 1) {
                cantidad = 1;
                e.target.value = 1;
            } else if (cantidad > stockDisponible) {
                alert(`Cantidad máxima permitida: ${stockDisponible}`);
                e.target.value = stockDisponible;
                cantidad = stockDisponible;
            }

            await actualizarCantidad(productoId, cantidad);
        }
    });


    // --- FUNCIÓN PARA ELIMINAR UN PRODUCTO DEL CARRITO ---
    async function eliminarProducto(id) {
        try {
            const response = await fetch(`http://localhost:8000/api/usuarios-jwt/carrito/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar el producto.');
            }
            
            cargarCarrito(); // Recargar el carrito para reflejar los cambios

        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Hubo un problema al eliminar el producto.');
        }
    }

    // --- FUNCIÓN PARA ACTUALIZAR LA CANTIDAD DE UN PRODUCTO ---
    async function actualizarCantidad(productoId, cantidad) {
        try {
            const response = await fetch(`${window.location.origin}/api/usuarios-jwt/carrito`, {
                method: 'POST', // El backend usa updateOrCreate, por eso POST
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    producto_id: productoId,
                    cantidad: cantidad
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 400 && errorData.message.includes('stock')) {
                    alert(`Error: ${errorData.message}. Stock disponible: ${errorData.stock_disponible}`);
                    cargarCarrito(); // Recargar para revertir la cantidad en el input
                    return;
                }
                throw new Error('No se pudo actualizar la cantidad.');
            }

            cargarCarrito(); // Recargar para ver los cambios y totales correctos

        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            alert('Hubo un problema al actualizar la cantidad.');
        }
    }


    // --- CERRAR SESIÓN ---
    btnCerrarSesion.addEventListener('click', async () => {
        try {
            await fetch('http://localhost:8000/api/usuarios-jwt/logout', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        } finally {
            // Siempre eliminar el token y redirigir
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    });


    // --- INICIALIZACIÓN ---
    fetchUserName();
    cargarCarrito();
});

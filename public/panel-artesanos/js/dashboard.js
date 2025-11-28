document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('artesano_token');
    if (!token) return; // auth.js se encarga de la redirección

    setupLogout();
    cargarDatosArtesano(token);
});

/**
 * Configura el botón de cierre de sesión.
 */
function setupLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('artesano_token');
            window.location.href = 'login.html';
        });
    }
}

/**
 * Realiza una petición fetch incluyendo el token de autorización.
 * @param {string} url - La URL a la que se hará la petición.
 * @param {string} token - El token JWT.
 * @returns {Promise<any>} - La promesa con los datos JSON.
 */
async function fetchWithAuth(url, token) {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    });

    if (response.status === 401) {
        localStorage.removeItem('artesano_token');
        window.location.href = 'login.html';
        throw new Error('No autorizado');
    }

    if (!response.ok) {
        throw new Error(`Error en la petición a ${url}`);
    }

    return response.json();
}

/**
 * Carga y muestra la información del artesano, y luego carga sus estadísticas y pedidos.
 * @param {string} token - El token JWT.
 */
function cargarDatosArtesano(token) {
    const nombreElement = document.getElementById('nombre-artesano');
    const negocioElement = document.getElementById('negocio-artesano');

    fetchWithAuth('/api/panel/mis-datos', token)
        .then(data => {
            if (data.success && data.artesano) {
                const artesano = data.artesano;
                nombreElement.textContent = `${artesano.nombre} ${artesano.apellidos}`;
                negocioElement.textContent = artesano.nombre_negocio;

                // Una vez que tenemos los datos, cargamos el resto del dashboard
                cargarEstadisticas(token);
                cargarPedidosRecientes(token);
            } else {
                throw new Error(data.message || 'La respuesta del servidor no fue exitosa.');
            }
        })
        .catch(error => {
            console.error('Error al cargar datos del artesano:', error);
            if (nombreElement) nombreElement.textContent = 'Error';
            if (negocioElement) negocioElement.textContent = 'Recargue la página';
        });
}

/**
 * Carga las estadísticas del dashboard.
 * @param {string} token - El token JWT.
 */
function cargarEstadisticas(token) {
    fetchWithAuth('/api/panel/estadisticas', token)
        .then(data => {
            if (data.success && data.estadisticas) {
                document.getElementById('total-productos').textContent = data.estadisticas.productos;
                document.getElementById('total-pedidos').textContent = data.estadisticas.pedidos;
                document.getElementById('total-ventas').textContent = `$${data.estadisticas.ventas}`;
                document.getElementById('total-visitas').textContent = data.estadisticas.visitas;
            }
        })
        .catch(error => console.error('Error al cargar estadísticas:', error));
}

/**
 * Carga los pedidos recientes en la tabla del dashboard.
 * @param {string} token - El token JWT.
 */
function cargarPedidosRecientes(token) {
    const tablaBody = document.getElementById('tabla-pedidos');

    fetchWithAuth('/api/panel/pedidos-recientes', token)
        .then(data => {
            if (data.success && data.pedidos) {
                tablaBody.innerHTML = ''; // Limpiar la tabla

                if (data.pedidos.length === 0) {
                    tablaBody.innerHTML = '<tr><td colspan="7" class="no-data">No hay pedidos recientes</td></tr>';
                    return;
                }

                data.pedidos.forEach(pedido => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${pedido.id}</td>
                        <td>${pedido.cliente_nombre}</td>
                        <td>${new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
                        <td>${pedido.cantidad_productos}</td>
                        <td>$${parseFloat(pedido.total).toFixed(2)}</td>
                        <td><span class="status ${pedido.estado}">${pedido.estado}</span></td>
                        <td><a href="producto-detalle.html?id=${pedido.id}" class="btn-view">Ver</a></td>
                    `;
                    tablaBody.appendChild(tr);
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar pedidos recientes:', error);
            tablaBody.innerHTML = '<tr><td colspan="7" class="no-data">Error al cargar los pedidos</td></tr>';
        });
}

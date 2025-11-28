document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/scm';

    const pedidoSelect = document.getElementById('pedido-select');
    const seguimientoContainer = document.getElementById('seguimiento-container');
    const inventarioTableBody = document.getElementById('inventario-table-body');
    const devolucionesTableBody = document.getElementById('devoluciones-table-body');

    // 1. Poblar el dropdown de pedidos
    const populatePedidosDropdown = async () => {
        try {
            const response = await fetch(`${API_URL}/pedidos`);
            if (!response.ok) throw new Error('Error al cargar los pedidos');
            const pedidos = await response.json();

            pedidoSelect.innerHTML = '<option selected disabled>Seleccione un ID...</option>';
            pedidos.forEach(pedido => {
                const option = document.createElement('option');
                option.value = pedido.id;
                option.textContent = `Pedido #${pedido.id}`;
                pedidoSelect.appendChild(option);
            });
        } catch (error) {
            console.error(error);
            pedidoSelect.innerHTML = `<option disabled>${error.message}</option>`;
        }
    };

    // 2. Obtener y mostrar el seguimiento de un pedido
    const fetchSeguimiento = async (pedidoId) => {
        if (!pedidoId) {
            seguimientoContainer.innerHTML = '';
            return;
        }
        try {
            seguimientoContainer.innerHTML = '<p>Cargando...</p>';
            const response = await fetch(`${API_URL}/seguimiento-pedido/${pedidoId}`);
            if (!response.ok) throw new Error(`Pedido #${pedidoId} no encontrado`);
            const data = await response.json();

            seguimientoContainer.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Detalles del Pedido #${data.pedido_id}</h5>
                        <p><strong>Cliente:</strong> ${data.nombre_cliente}</p>
                        <p><strong>Dirección:</strong> ${data.direccion_envio}</p>
                        <p><strong>Productos:</strong> ${data.productos_en_pedido.replace(/;/g, '<br>')}</p>
                        <hr>
                        <h6 class="card-subtitle mb-2 text-muted">Información de Envío</h6>
                        <p><strong>Estado:</strong> <span class="badge bg-info">${data.estado_envio || 'No disponible'}</span></p>
                        <p><strong>Empresa:</strong> ${data.empresa_transporte || 'No disponible'}</p>
                        <p><strong>Nº Seguimiento:</strong> ${data.numero_seguimiento || 'No disponible'}</p>
                        <p><strong>Fecha de Envío:</strong> ${data.fecha_envio || 'No disponible'}</p>
                        <p><strong>Entrega Estimada:</strong> ${data.fecha_entrega_estimada || 'No disponible'}</p>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error(error);
            seguimientoContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // 3. Obtener y mostrar el inventario
    const fetchInventario = async () => {
        try {
            const response = await fetch(`${API_URL}/inventario`);
            if (!response.ok) throw new Error('Error al cargar el inventario');
            const data = await response.json();

            inventarioTableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.artesano}</td>
                    <td>${item.producto}</td>
                    <td><span class="badge ${item.stock < 10 ? 'bg-danger' : 'bg-success'}">${item.stock}</span></td>
                `;
                inventarioTableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            inventarioTableBody.innerHTML = `<tr><td colspan="3" class="text-danger">${error.message}</td></tr>`;
        }
    };

    // 4. Obtener y mostrar las devoluciones
    const fetchDevoluciones = async () => {
        try {
            const response = await fetch(`${API_URL}/devoluciones`);
            if (!response.ok) throw new Error('Error al cargar las devoluciones');
            const data = await response.json();

            devolucionesTableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.artesano}</td>
                    <td>${item.producto}</td>
                    <td>${item.total_devoluciones}</td>
                `;
                devolucionesTableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            devolucionesTableBody.innerHTML = `<tr><td colspan="3" class="text-danger">${error.message}</td></tr>`;
        }
    };

    // Event Listeners
    pedidoSelect.addEventListener('change', (e) => fetchSeguimiento(e.target.value));

    // Carga inicial de datos
    populatePedidosDropdown();
    fetchInventario();
    fetchDevoluciones();
});

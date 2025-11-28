document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/erp';

    // Función para formatear moneda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    };

    // Función para generar colores aleatorios para los gráficos
    const createColorPalette = (num) => {
        const colors = [];
        for (let i = 0; i < num; i++) {
            const hue = (i * 360) / num;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        return colors;
    };

    // 1. Cargar Impuestos y Comisiones
    const fetchImpuestos = async () => {
        const tableBody = document.getElementById('impuestos-table-body');
        try {
            const response = await fetch(`${API_URL}/impuestos-comisiones`);
            const data = await response.json();
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.nombre_negocio}</td>
                    <td>${formatCurrency(item.ventas_totales)}</td>
                    <td>${formatCurrency(item.impuesto_iva)}</td>
                    <td>${formatCurrency(item.comision_plataforma)}</td>
                </tr>
            `).join('');
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Error al cargar datos.</td></tr>`;
        }
    };

    // 2. Cargar Productos con Bajo Stock
    const fetchBajoStock = async () => {
        const tableBody = document.getElementById('bajo-stock-table-body');
        try {
            const response = await fetch(`${API_URL}/bajo-stock`);
            const data = await response.json();
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.producto}</td>
                    <td>${item.artesano}</td>
                    <td><span class="badge bg-warning text-dark">${item.stock}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-danger">Error al cargar datos.</td></tr>`;
        }
    };

    // 3. Cargar Total de Ventas por Artesano (Gráfico)
    const fetchVentasArtesano = async () => {
        const ctx = document.getElementById('ventasArtesanoChart').getContext('2d');
        try {
            const response = await fetch(`${API_URL}/ventas-artesano`);
            const data = await response.json();
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.artesano),
                    datasets: [{
                        label: 'Total Ventas',
                        data: data.map(d => d.total_ventas),
                        backgroundColor: createColorPalette(data.length)
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        } catch (error) {
            console.error(error);
        }
    };

    // 4. Cargar Ventas por Categoría (Gráfico)
    const fetchVentasCategoria = async () => {
        const ctx = document.getElementById('ventasCategoriaChart').getContext('2d');
        try {
            const response = await fetch(`${API_URL}/ventas-categoria`);
            const data = await response.json();
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.categoria),
                    datasets: [{
                        data: data.map(d => d.total_ventas),
                        backgroundColor: createColorPalette(data.length)
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'right' } } }
            });
        } catch (error) {
            console.error(error);
        }
    };

    // 5. Cargar Artículos con Mejores Reseñas
    const fetchMejoresResenas = async () => {
        const tableBody = document.getElementById('resenas-table-body');
        try {
            const response = await fetch(`${API_URL}/mejores-resenas`);
            const data = await response.json();
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.nombre}</td>
                    <td><span class="badge bg-info">${parseFloat(item.calificacion_promedio).toFixed(2)} ★</span></td>
                </tr>
            `).join('');
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="2" class="text-danger">Error al cargar datos.</td></tr>`;
        }
    };

    // Cargar todos los datos
    fetchImpuestos();
    fetchBajoStock();
    fetchVentasArtesano();
    fetchVentasCategoria();
    fetchMejoresResenas();
});

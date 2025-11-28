document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/crm';

    // Función para generar colores aleatorios para los gráficos
    const getRandomColor = () => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    };

    // 1. Cargar y mostrar los productos más vendidos
    const fetchTopProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/top-selling-products`);
            if (!response.ok) throw new Error('Error al cargar los productos más vendidos');
            const data = await response.json();

            const ctx = document.getElementById('topProductsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(p => p.nombre),
                    datasets: [{
                        label: 'Total Vendido',
                        data: data.map(p => p.total_vendido),
                        backgroundColor: data.map(() => getRandomColor()),
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
            document.getElementById('topProductsChart').parentElement.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // 2. Cargar y mostrar los clientes que más compran
    const fetchTopClients = async () => {
        try {
            const response = await fetch(`${API_URL}/top-clients`);
            if (!response.ok) throw new Error('Error al cargar los mejores clientes');
            const data = await response.json();

            const ctx = document.getElementById('topClientsChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.map(c => `${c.nombre} ${c.apellidos}`),
                    datasets: [{
                        label: 'Total de Compras',
                        data: data.map(c => c.total_compras),
                        backgroundColor: data.map(() => getRandomColor()),
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
            document.getElementById('topClientsChart').parentElement.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // 3. Cargar y mostrar los productos más comprados por cliente
    const fetchTopProductsByClients = async () => {
        try {
            const response = await fetch(`${API_URL}/top-products-by-clients`);
            if (!response.ok) throw new Error('Error al cargar los productos por cliente');
            const data = await response.json();

            const container = document.getElementById('topProductsByClientContainer');
            container.innerHTML = ''; // Limpiar contenedor

            let count = 0;
            for (const clientName in data) {
                const products = data[clientName];
                const accordionId = `accordion-${count}`;

                const item = document.createElement('div');
                item.classList.add('accordion-item');
                item.innerHTML = `
                    <h2 class="accordion-header" id="heading-${accordionId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionId}" aria-expanded="false" aria-controls="collapse-${accordionId}">
                            ${clientName}
                        </button>
                    </h2>
                    <div id="collapse-${accordionId}" class="accordion-collapse collapse" aria-labelledby="heading-${accordionId}" data-bs-parent="#topProductsByClientContainer">
                        <div class="accordion-body">
                            <ul class="list-group">
                                ${products.map(p => `
                                    <li class="list-group-item">
                                        ${p.nombre_producto}
                                        <span class="badge bg-primary rounded-pill">${p.cantidad_comprada}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                container.appendChild(item);
                count++;
            }

        } catch (error) {
            console.error(error);
            document.getElementById('topProductsByClientContainer').innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // Cargar todos los datos al iniciar
    fetchTopProducts();
    fetchTopClients();
    fetchTopProductsByClients();
});

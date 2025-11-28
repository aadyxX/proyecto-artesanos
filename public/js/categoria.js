document.addEventListener("DOMContentLoaded", () => {
    // Cargar el menú de categorías en la barra lateral
    cargarMenuCategorias();

    // Obtener el ID de la categoría desde la URL
    const params = new URLSearchParams(window.location.search);
    const categoriaId = params.get('id');

    // Si hay un ID de categoría en la URL, cargar esa categoría y sus productos
    if (categoriaId) {
        cargarCategoriaYProductos(categoriaId);
    } else {
        // Opcional: Cargar una categoría por defecto o mostrar un mensaje
        const gridProductos = document.querySelector("#grid-productos");
        if(gridProductos) gridProductos.innerHTML = `<p>Selecciona una categoría para ver los productos.</p>`;
    }

    // Aquí puedes mantener la lógica para los filtros si la necesitas en el futuro
});

/**
 * Carga la información de una categoría y la lista de sus productos.
 * @param {number} categoriaId - El ID de la categoría a cargar.
 */
function cargarCategoriaYProductos(categoriaId) {
    const tituloRosa = document.getElementById("titulo-rosa");
    const tituloVerde = document.getElementById("titulo-verde");
    const descripcion = document.getElementById("descripcion-categoria");
    const gridProductos = document.querySelector("#grid-productos");

    if (!tituloRosa || !tituloVerde || !descripcion || !gridProductos) return;

    // 1. Cargar datos de la categoría (para el título y descripción)
    fetch(`/api/categorias/${categoriaId}`)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener la categoría");
            return res.json();
        })
        .then(data => {
            if (!data.success || !data.categoria) {
                tituloRosa.textContent = "Categoría";
                tituloVerde.textContent = "no encontrada";
                return;
            }
            const categoria = data.categoria;
            const partesTitulo = categoria.nombre.split(" ");
            tituloRosa.textContent = partesTitulo[0] || "";
            tituloVerde.textContent = partesTitulo.slice(1).join(" ") || "";
            descripcion.textContent = categoria.descripcion || "Descripción no disponible.";
        })
        .catch(err => {
            console.error("❌ Error al cargar datos de la categoría:", err);
            tituloRosa.textContent = "Error";
            descripcion.textContent = "No se pudo cargar la información de la categoría.";
        });

    // 2. Cargar productos de la categoría
    gridProductos.innerHTML = `<p>Cargando productos...</p>`;

    fetch(`/api/categorias/${categoriaId}/productos`)
        .then(res => {
            if (!res.ok) {
                if (res.status === 404) {
                    gridProductos.innerHTML = `<p>No se encontraron productos para esta categoría.</p>`;
                } else {
                    throw new Error("Error en la respuesta de productos");
                }
                return null; // Detener la cadena de promesas
            }
            return res.json();
        })
        .then(data => {
            if (!data || !data.success || !data.productos.length) {
                if (gridProductos.innerHTML.includes("Cargando")) {
                   gridProductos.innerHTML = `<p>No hay productos disponibles en esta categoría.</p>`;
                }
                return;
            }

            gridProductos.innerHTML = ""; // Limpiar "Cargando..."

            data.productos.forEach(producto => {
                const card = document.createElement("div");
                card.className = "col";
                card.innerHTML = `
                    <div class="card h-100 producto-card">
                        <img src="/storage/${producto.imagen_principal}" class="card-img-top" alt="${producto.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text text-muted">${producto.categoria_nombre}</p>
                            <p class="card-text fw-bold text-primary">$${parseFloat(producto.precio).toFixed(2)}</p>
                        </div>
                        <div class="card-footer bg-transparent border-0">
                            <a href="/producto-individual.html?id=${producto.id}" class="btn btn-outline-primary w-100">Ver Producto</a>
                        </div>
                    </div>
                `;
                gridProductos.appendChild(card);
            });
        })
        .catch(err => {
            console.error("❌ Error al cargar productos:", err);
            gridProductos.innerHTML = `<p>Hubo un error al cargar los productos. Inténtalo de nuevo más tarde.</p>`;
        });
}

/**
 * Carga la lista de categorías en el menú lateral.
 */
function cargarMenuCategorias() {
    const lista = document.getElementById("menu-categorias");
    if (!lista) return;

    // Usamos la ruta que ya tenías para obtener todas las categorías
    fetch("/api/categorias")
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener las categorías");
            return res.json();
        })
        .then(data => {
            if (!data.success || !data.categorias) {
                lista.innerHTML = "<li>No hay categorías disponibles</li>";
                return;
            }

            lista.innerHTML = ""; // limpiar

            data.categorias.forEach(categoria => {
                const li = document.createElement("li");
                // El enlace ahora redirige a la página de categoría con el ID correcto
                li.innerHTML = `<a href="categoria.html?id=${categoria.id}">${categoria.nombre}</a>`;
                lista.appendChild(li);
            });
        })
        .catch(err => {
            console.error("❌ Error al cargar menú de categorías:", err);
            lista.innerHTML = "<li>Error al cargar categorías.</li>";
        });
}
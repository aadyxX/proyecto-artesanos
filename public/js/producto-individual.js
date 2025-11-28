document.addEventListener("DOMContentLoaded", () => {
    cargarProducto();
    cargarOpiniones(); // Cargar opiniones al cargar la página
    cargarProductosSimilares(); // Cargar productos similares al cargar la página

    // Configurar eventos para las miniaturas
    const mainProductImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.product-thumbnails .thumbnail');

    if (mainProductImage && thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                mainProductImage.src = this.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Configurar eventos para los botones de cantidad
    const btnMinus = document.getElementById('button-minus');
    const btnPlus = document.getElementById('button-plus');
    const inputQuantity = document.getElementById('quantity');

    if (btnMinus && btnPlus && inputQuantity) {
        btnMinus.addEventListener('click', () => {
            let quantity = parseInt(inputQuantity.value);
            if (quantity > 1) {
                inputQuantity.value = quantity - 1;
            }
        });

        btnPlus.addEventListener('click', () => {
            let quantity = parseInt(inputQuantity.value);
            inputQuantity.value = quantity + 1;
        });

        inputQuantity.addEventListener('change', () => {
            let quantity = parseInt(inputQuantity.value);
            if (isNaN(quantity) || quantity < 1) {
                inputQuantity.value = 1;
            }
        });
    }

    // Configurar evento para el botón de agregar al carrito
    const btnAddToCart = document.querySelector('.btn-primary.text-white');
    if (btnAddToCart) {
        btnAddToCart.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            const quantity = parseInt(inputQuantity.value);

            if (!productId) {
                alert('No se pudo identificar el producto');
                return;
            }

            agregarAlCarrito(productId, quantity);
        });
    }
});

function cargarProducto() {
    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get("id");

    if (!productoId) {
        console.error("No se encontró el ID del producto en la URL");
        return;
    }

    fetch(`/api/productos/${productoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el producto");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const producto = data.producto;
                const imagenes = data.imagenes;

                document.title = `${producto.Nombre_Producto} - ArteMisa`;

                document.querySelector('.col-lg-5 h1').textContent = producto.Nombre_Producto;
                document.querySelector('.col-lg-5 .display-6').textContent = `$${Number(producto.Precio).toFixed(2)}`;

                const featuresList = document.querySelector('.list-unstyled.text-muted');
                if (featuresList) {
                    featuresList.innerHTML = `
                        <li><i class="fas fa-check text-success me-2"></i>Categoría: ${producto.Categoria}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Artesano: ${producto.Nombre_Artesano}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Negocio: ${producto.Artesano_Negocio}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Región: ${producto.Region_Artesano}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Stock disponible: ${producto.Stock_Disponible}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Estado: ${producto.Estado_Producto}</li>
                        <li><i class="fas fa-check text-success me-2"></i>Publicado: ${new Date(producto.Fecha_Publicacion).toLocaleDateString()}</li>
                    `;
                }

                const descriptionTabContent = document.querySelector('#description');
                if (descriptionTabContent) {
                    descriptionTabContent.innerHTML = `
                        <p>${producto.Descripcion_Producto}</p>
                    `;
                }

                const mainProductImage = document.getElementById('main-product-image');
                const productThumbnailsContainer = document.querySelector('.product-thumbnails');

                if (mainProductImage && productThumbnailsContainer && imagenes.length > 0) {
                    productThumbnailsContainer.innerHTML = ''; // Clear existing thumbnails
                    let firstImageSet = false;

                    imagenes.forEach((imagen, index) => {
                        const colDiv = document.createElement('div');
                        colDiv.classList.add('col-3');

                        const img = document.createElement('img');
                        img.src = imagen.imagen_base64 || `img/${imagen.ruta_imagen}`;
                        img.alt = `${producto.Nombre_Producto} vista ${index + 1}`;
                        img.classList.add('img-fluid', 'rounded', 'shadow-sm', 'thumbnail');

                        if (imagen.es_principal && !firstImageSet) {
                            mainProductImage.src = img.src;
                            img.classList.add('active');
                            firstImageSet = true;
                        } else if (index === 0 && !firstImageSet) {
                            // Fallback to first image if no principal is set
                            mainProductImage.src = img.src;
                            img.classList.add('active');
                            firstImageSet = true;
                        }

                        colDiv.appendChild(img);
                        productThumbnailsContainer.appendChild(colDiv);

                        img.addEventListener('click', function() {
                            mainProductImage.src = this.src;
                            document.querySelectorAll('.product-thumbnails .thumbnail').forEach(t => t.classList.remove('active'));
                            this.classList.add('active');
                        });
                    });
                } else if (mainProductImage && imagenes.length > 0) {
                    // Fallback if no thumbnails container, just set main image
                    const primaryImage = imagenes.find(img => img.es_principal) || imagenes[0];
                    mainProductImage.src = primaryImage.imagen_base64 || `img/${primaryImage.ruta_imagen}`;
                    mainProductImage.alt = producto.Nombre_Producto;
                }

            } else {
                console.error("Error al obtener el producto:", data.message);
            }
        })
        .catch(error => {
            console.error("Error en la petición fetch:", error);
        });
}

function cargarOpiniones() {
    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get("id");

    console.log("Cargando opiniones para productoId:", productoId);

    if (!productoId) {
        console.error("No se encontró el ID del producto en la URL para cargar opiniones");
        return;
    }

    fetch(`/api/productos/${productoId}/resenas`)
        .then(response => {
            console.log("Respuesta de la API de opiniones:", response);
            if (!response.ok) {
                throw new Error("Error al cargar las opiniones: " + response.statusText);
            }
            return response.json();
        })
        .then(reviews => {
            console.log("Opiniones recibidas:", reviews);
            const reviewsContainer = document.getElementById('reviews-list');
            if (reviewsContainer) {
                console.log("Contenedor de opiniones encontrado.");
                reviewsContainer.innerHTML = ''; // Clear existing content

                if (reviews.length === 0) {
                    reviewsContainer.innerHTML = '<p>No hay opiniones para este producto aún.</p>';
                    console.log("No hay opiniones para mostrar.");
                    return;
                }

                reviews.forEach(review => {
                    console.log("Añadiendo opinión:", review.Nombre_Cliente);
                    const reviewElement = document.createElement('div');
                    reviewElement.classList.add('card', 'mb-3');

                    let starsHtml = '';
                    for (let i = 0; i < 5; i++) {
                        if (i < review.Calificacion) {
                            starsHtml += '<i class="fas fa-star text-warning"></i>';
                        } else {
                            starsHtml += '<i class="far fa-star text-warning"></i>';
                        }
                    }

                    reviewElement.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">${review.Nombre_Cliente}</h5>
                            <div class="mb-2">${starsHtml}</div>
                            <p class="card-text">${review.Comentario_Cliente}</p>
                            <p class="card-text"><small class="text-muted">Fecha: ${new Date(review.Fecha_Resena).toLocaleDateString()}</small></p>
                        </div>
                    `;
                    reviewsContainer.appendChild(reviewElement);
                });
            } else {
                console.error("Contenedor de opiniones (#reviews-list) no encontrado.");
            }
        })
        .catch(error => {
            console.error("Error en la petición fetch de opiniones:", error);
        });
}

function agregarAlCarrito(productId, quantity) {
    fetch("/api/carrito/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-CSRF-TOKEN": getCsrfToken(),
        },
        body: JSON.stringify({
            producto_id: productId,
            cantidad: quantity,
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Error al añadir al carrito'); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message || "Producto añadido al carrito");
            // Optionally update cart count in header
        } else {
            throw new Error(data.message || "Error al añadir al carrito");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(`Error al añadir al carrito: ${error.message}`);
    });
}

function getCsrfToken() {
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute("content");
    }
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            return decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
        }
    }
    return "";
}

function cargarProductosSimilares() {
    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get("id");

    if (!productoId) {
        console.error("No se encontró el ID del producto en la URL para cargar productos similares");
        return;
    }

    fetch(`/api/productos/${productoId}/similares`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar productos similares");
            }
            return response.json();
        })
        .then(data => {
            const similarProductsContainer = document.querySelector('.row.mt-5:last-child .row');
            if (similarProductsContainer) {
                similarProductsContainer.innerHTML = ''; // Limpiar productos estáticos existentes

                if (data.productos && data.productos.length > 0) {
                    data.productos.forEach(product => {
                        const colDiv = document.createElement('div');
                        colDiv.classList.add('col-md-3', 'mb-4');

                        colDiv.innerHTML = `
                            <div class="card h-100 shadow-sm">
                                <img src="${product.imagen || 'https://via.placeholder.com/150?text=No+Image'}" class="card-img-top" alt="${product.nombre}">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">${product.nombre}</h5>
                                    <p class="card-text text-muted">${product.artesano}</p>
                                    <p class="card-text fw-bold text-primary mt-auto">$${product.precio.toFixed(2)}</p>
                                    <a href="producto-individual.html?id=${product.id}" class="btn btn-sm btn-ver-producto mt-2">Ver Producto</a>
                                </div>
                            </div>
                        `;
                        similarProductsContainer.appendChild(colDiv);
                    });
                } else {
                    similarProductsContainer.innerHTML = '<p class="col-12 text-center">No hay productos similares disponibles.</p>';
                }
            }
        })
        .catch(error => {
            console.error("Error al cargar productos similares:", error);
        });
}
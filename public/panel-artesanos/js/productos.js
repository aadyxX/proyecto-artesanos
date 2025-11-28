document.addEventListener("DOMContentLoaded", () => {
 
  cargarDatosArtesano()

  cargarCategorias()

  let urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("eliminado") === "true") {
    let mensajeEliminacion = document.getElementById("mensaje-eliminacion")
    if (mensajeEliminacion) {
      mensajeEliminacion.style.display = "block"
      setTimeout(() => {
        mensajeEliminacion.style.display = "none"
      }, 3000)

      window.history.replaceState({}, document.title, "productos.html")
    }
  }

  cargarProductos()

  configurarEventos()
})

function cargarDatosArtesano() {
  fetch("/api/artesano", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        document.getElementById("nombre-artesano").textContent = data.artesano.nombre
        document.getElementById("negocio-artesano").textContent = data.artesano.negocio
      } else {
        throw new Error(data.message || "Error al cargar datos del artesano")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      document.getElementById("nombre-artesano").textContent = "Error al cargar datos"
      document.getElementById("negocio-artesano").textContent = "Intente nuevamente"
    })
}

function cargarCategorias() {
  let selectCategoria = document.getElementById("filtro-categoria")

  selectCategoria.innerHTML = '<option value="">Cargando categorías...</option>'

  fetch("/api/categorias", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`)
      }
      return response.json()
    })
    .then((data) => {
      console.log("Respuesta de categorías:", data) 

      if (data.success) {
        selectCategoria.innerHTML = '<option value="">Todas las categorías</option>'

        let categoriasMap = new Map()

        if (data.categorias && data.categorias.length > 0) {
          data.categorias.forEach((categoria) => {
            if (!categoriasMap.has(categoria.nombre)) {
              categoriasMap.set(categoria.nombre, categoria.id)

              let option = document.createElement("option")
              option.value = categoria.id
              option.textContent = categoria.nombre
              selectCategoria.appendChild(option)
            }
          })

          console.log("Categorías únicas cargadas:", categoriasMap.size)
        } else {
          console.error("No se encontraron categorías")
        }
      } else {
        throw new Error(data.message || "Error al cargar las categorías")
      }
    })
    .catch((error) => {
      console.error("Error al cargar categorías:", error)
      selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>'
    })
}

function cargarProductos() {
  let contenedor = document.getElementById("productos-container")
  contenedor.innerHTML = `
    <div class="producto-card producto-placeholder">
        <div class="producto-imagen placeholder"></div>
        <div class="producto-info">
            <div class="producto-nombre placeholder"></div>
            <div class="producto-precio placeholder"></div>
            <div class="producto-categoria placeholder"></div>
            <div class="producto-acciones placeholder"></div>
        </div>
    </div>
    <div class="producto-card producto-placeholder">
        <div class="producto-imagen placeholder"></div>
        <div class="producto-info">
            <div class="producto-nombre placeholder"></div>
            <div class="producto-precio placeholder"></div>
            <div class="producto-categoria placeholder"></div>
            <div class="producto-acciones placeholder"></div>
        </div>
    </div>
    <div class="producto-card producto-placeholder">
        <div class="producto-imagen placeholder"></div>
        <div class="producto-info">
            <div class="producto-nombre placeholder"></div>
            <div class="producto-precio placeholder"></div>
            <div class="producto-categoria placeholder"></div>
            <div class="producto-acciones placeholder"></div>
        </div>
    </div>
  `

  let busqueda = document.getElementById("buscar-producto").value.trim()
  let categoria = document.getElementById("filtro-categoria").value
  let estado = document.getElementById("filtro-estado").value

  let url = "/api/productos?"
  let params = new URLSearchParams()

  if (busqueda) {
    params.append("busqueda", busqueda)
  }

  if (categoria) {
    params.append("categoria", categoria)
  }

  if (estado) {
    params.append("estado", estado)
  }

  let paginaActual = Number.parseInt(document.getElementById("pagina-actual").textContent)
  params.append("pagina", paginaActual)
  params.append("por_pagina", 12) 

  url += params.toString()

  fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-CSRF-TOKEN": getCsrfToken(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }
      return response.json()
    })
    .then((data) => {
      console.log("Respuesta de productos:", data)

      if (data.success) {
       
        document.getElementById("pagina-actual").textContent = data.paginacion.pagina_actual
        document.getElementById("total-paginas").textContent = data.paginacion.total_paginas

        
        document.getElementById("prev-page").disabled = data.paginacion.pagina_actual <= 1
        document.getElementById("next-page").disabled = data.paginacion.pagina_actual >= data.paginacion.total_paginas

        mostrarProductos(data.productos)
      } else {
        throw new Error(data.message || "Error al cargar los productos")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      contenedor.innerHTML = `<div class="no-data">Error al cargar los productos: ${error.message}</div>`
    })
}

function mostrarProductos(productos) {
  let contenedor = document.getElementById("productos-container")

  if (productos.length === 0) {
    contenedor.innerHTML = '<div class="no-data">No se encontraron productos</div>'
    return
  }

  let html = ""

  productos.forEach((producto) => {
    let imagenUrl = producto.imagen || "img/product-placeholder.jpg"

    html += `
          <div class="producto-card">
              <div class="producto-imagen">
                  <img src="${imagenUrl}" alt="${producto.nombre}">
                  <span class="producto-estado estado-${producto.estado}">${capitalizar(producto.estado)}</span>
              </div>
              <div class="producto-info">
                  <h3 class="producto-nombre">${producto.nombre}</h3>
                  <p class="producto-precio">${formatearPrecio(producto.precio)}</p>
                  <p class="producto-categoria">${producto.categoria.nombre}</p>
                  <div class="producto-acciones">
                      <a href="producto-detalle.html?id=${producto.id}" class="btn-action" title="Ver detalle">
                          <img src="img/ver.svg" alt="Ver">
                      </a>
                      <a href="producto-nuevo.html?id=${producto.id}" class="btn-action" title="Editar">
                          <img src="img/editar.svg" alt="Editar">
                      </a>
                      <button class="btn-action btn-eliminar" title="Eliminar" data-id="${producto.id}" data-nombre="${producto.nombre}" data-categoria="${producto.categoria.nombre}" data-imagen="${imagenUrl}">
                          <img src="img/eliminar.svg" alt="Eliminar">
                      </button>
                  </div>
              </div>
          </div>
      `
  })

  contenedor.innerHTML = html

  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", function () {
      mostrarModalEliminar(this.dataset.id, this.dataset.nombre, this.dataset.categoria, this.dataset.imagen)
    })
  })
}

function configurarEventos() {
  let btnBuscar = document.getElementById("btn-buscar")
  let inputBuscar = document.getElementById("buscar-producto")

  btnBuscar.addEventListener("click", () => {
    buscarProductos()
  })

  inputBuscar.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      buscarProductos()
    }
  })

  let filtroCategoria = document.getElementById("filtro-categoria")
  let filtroEstado = document.getElementById("filtro-estado")

  filtroCategoria.addEventListener("change", () => {
    filtrarProductos()
  })

  filtroEstado.addEventListener("change", () => {
    filtrarProductos()
  })

  let btnPrevPage = document.getElementById("prev-page")
  let btnNextPage = document.getElementById("next-page")

  btnPrevPage.addEventListener("click", () => {
    let paginaActual = Number.parseInt(document.getElementById("pagina-actual").textContent)
    if (paginaActual > 1) {
      document.getElementById("pagina-actual").textContent = paginaActual - 1
      cargarProductos()
    }
  })

  btnNextPage.addEventListener("click", () => {
    let paginaActual = Number.parseInt(document.getElementById("pagina-actual").textContent)
    let totalPaginas = Number.parseInt(document.getElementById("total-paginas").textContent)
    if (paginaActual < totalPaginas) {
      document.getElementById("pagina-actual").textContent = paginaActual + 1
      cargarProductos()
    }
  })

  let modalEliminar = document.getElementById("modal-eliminar")
  let btnCancelarEliminar = document.getElementById("cancelar-eliminar")
  let btnConfirmarEliminar = document.getElementById("confirmar-eliminar")
  let btnCerrarModal = document.querySelector(".close-modal")

  btnCancelarEliminar.addEventListener("click", () => {
    cerrarModalEliminar()
  })

  btnCerrarModal.addEventListener("click", () => {
    cerrarModalEliminar()
  })

  btnConfirmarEliminar.addEventListener("click", () => {
    eliminarProducto()
  })

  window.addEventListener("click", (e) => {
    if (e.target === modalEliminar) {
      cerrarModalEliminar()
    }
  })
}

function buscarProductos() {
  document.getElementById("pagina-actual").textContent = "1"

  cargarProductos()
}

function filtrarProductos() {

  document.getElementById("pagina-actual").textContent = "1"

  cargarProductos()
}

function mostrarModalEliminar(id, nombre, categoria, imagen) {
  let modal = document.getElementById("modal-eliminar")
  let productoNombre = document.getElementById("producto-eliminar-nombre")
  let productoCategoria = document.getElementById("producto-eliminar-categoria")
  let productoImagen = document.getElementById("producto-eliminar-imagen")
  let btnConfirmar = document.getElementById("confirmar-eliminar")

  productoNombre.textContent = nombre
  productoCategoria.textContent = categoria
  productoImagen.src = imagen
  btnConfirmar.dataset.id = id

  modal.classList.add("active")
}

function cerrarModalEliminar() {
  let modal = document.getElementById("modal-eliminar")
  modal.classList.remove("active")
}

function eliminarProducto() {
  let id = document.getElementById("confirmar-eliminar").dataset.id
  let btnConfirmar = document.getElementById("confirmar-eliminar")

  btnConfirmar.disabled = true
  btnConfirmar.textContent = "Eliminando..."

  fetch(`/api/productos/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "X-CSRF-TOKEN": getCsrfToken(),
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor")
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        cerrarModalEliminar()

        let contenedor = document.getElementById("productos-container")
        contenedor.insertAdjacentHTML(
          "beforebegin",
          `
        <div class="alert alert-success" id="alerta-eliminacion">
          Producto eliminado correctamente
        </div>
      `,
        )

        setTimeout(() => {
          let alerta = document.getElementById("alerta-eliminacion")
          if (alerta) {
            alerta.remove()
          }
        }, 3000)

        cargarProductos()
      } else {
        throw new Error(data.message || "Error al eliminar el producto")
      }
    })
    .catch((error) => {
      console.error("Error:", error)

      alert(`Error al eliminar el producto: ${error.message}`)

      btnConfirmar.disabled = false
      btnConfirmar.textContent = "Eliminar"
    })
}

function formatearPrecio(precio) {
  return (
    "$" +
    Number.parseFloat(precio)
      .toFixed(2)
      .replace(/\d(?=(\d{3})+\.)/g, "$&,")
  )
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function getCsrfToken() {
  let metaToken = document.querySelector('meta[name="csrf-token"]')
  if (metaToken) {
    return metaToken.getAttribute("content")
  }

  let cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.startsWith("XSRF-TOKEN=")) {
      return decodeURIComponent(cookie.substring("XSRF-TOKEN=".length))
    }
  }

  return ""
}

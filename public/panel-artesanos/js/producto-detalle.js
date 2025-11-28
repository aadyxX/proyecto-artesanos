document.addEventListener("DOMContentLoaded", () => {
  
  cargarDatosArtesano()

  let urlParams = new URLSearchParams(window.location.search)
  let productoId = urlParams.get("id")

  if (productoId) {
    cargarProducto(productoId)
  } else {
    window.location.href = "productos.html"
  }

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

function cargarProducto(id) {
  document.getElementById("producto-nombre").textContent = "Cargando..."
  document.getElementById("producto-nombre-breadcrumb").textContent = "Cargando..."

  fetch(`/api/productos/${id}`, {
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
        let producto = data.producto

        document.getElementById("producto-nombre").textContent = producto.nombre
        document.getElementById("producto-nombre-breadcrumb").textContent = producto.nombre
        document.getElementById("producto-categoria").textContent = producto.categoria_nombre
        document.getElementById("producto-precio").textContent = formatearPrecio(producto.precio)
        document.getElementById("producto-stock").textContent = producto.stock
        document.getElementById("producto-estado").innerHTML =
          `<span class="estado-badge estado-${producto.estado}">${capitalizar(producto.estado)}</span>`
        document.getElementById("producto-destacado").textContent = producto.destacado == 1 ? "Sí" : "No"
        document.getElementById("producto-fecha").textContent = formatearFecha(producto.fecha_creacion)
        document.getElementById("producto-descripcion").textContent = producto.descripcion

        document.getElementById("btn-editar").href = `producto-nuevo.html?id=${producto.id}`

        document.getElementById("producto-eliminar-nombre").textContent = producto.nombre
        document.getElementById("producto-eliminar-categoria").textContent = producto.categoria_nombre
        document.getElementById("confirmar-eliminar").dataset.id = producto.id

        if (data.imagenes && data.imagenes.length > 0) {

          let imagenPrincipal = data.imagenes.find((img) => img.es_principal == 1)
          if (imagenPrincipal && imagenPrincipal.imagen_base64) {
            document.getElementById("imagen-principal").src = imagenPrincipal.imagen_base64
            document.getElementById("producto-eliminar-imagen").src = imagenPrincipal.imagen_base64
          } else {
            document.getElementById("imagen-principal").src = "img/product-placeholder.jpg"
            document.getElementById("producto-eliminar-imagen").src = "img/product-placeholder.jpg"
          }

          let imagenesAdicionales = data.imagenes.filter((img) => img.es_principal == 0)
          let contenedorAdicionales = document.getElementById("imagenes-adicionales-container")

          let html = ""
          imagenesAdicionales.forEach((imagen) => {
            if (imagen.imagen_base64) {
              html += `
              <div class="imagen-adicional" data-src="${imagen.imagen_base64}">
                  <img src="${imagen.imagen_base64}" alt="${producto.nombre}">
              </div>
            `
            }
          })

          contenedorAdicionales.innerHTML = html

          document.querySelectorAll(".imagen-adicional").forEach((img) => {
            img.addEventListener("click", function () {
              cambiarImagenPrincipal(this.dataset.src)

              document.querySelectorAll(".imagen-adicional").forEach((i) => i.classList.remove("active"))
              this.classList.add("active")
            })
          })
        } else {
          document.getElementById("imagen-principal").src = "img/product-placeholder.jpg"
          document.getElementById("producto-eliminar-imagen").src = "img/product-placeholder.jpg"
          document.getElementById("imagenes-adicionales-container").innerHTML = ""
        }

        if (data.estadisticas) {
          document.getElementById("producto-visitas").textContent = data.estadisticas.visitas
          document.getElementById("producto-carritos").textContent = data.estadisticas.carritos
          document.getElementById("producto-ventas").textContent = data.estadisticas.ventas
          document.getElementById("producto-ingresos").textContent = formatearPrecio(data.estadisticas.ingresos)
        }
      } else {
        throw new Error(data.message || "Error al cargar el producto")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      document.getElementById("producto-nombre").textContent = "Error al cargar el producto"
      document.getElementById("producto-descripcion").textContent = error.message
    })
}

function configurarEventos() {
  let btnEliminar = document.getElementById("btn-eliminar")
  let modalEliminar = document.getElementById("modal-eliminar")
  let btnCancelarEliminar = document.getElementById("cancelar-eliminar")
  let btnConfirmarEliminar = document.getElementById("confirmar-eliminar")
  let btnCerrarModal = document.querySelector(".close-modal")

  btnEliminar.addEventListener("click", () => {
    modalEliminar.classList.add("active")
  })

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

function cambiarImagenPrincipal(src) {
  document.getElementById("imagen-principal").src = src
}

function cerrarModalEliminar() {
  let modal = document.getElementById("modal-eliminar")
  modal.classList.remove("active")
}

function eliminarProducto() {
  let urlParams = new URLSearchParams(window.location.search)
  let productoId = urlParams.get("id")

  let btnConfirmar = document.getElementById("confirmar-eliminar")
  btnConfirmar.disabled = true
  btnConfirmar.textContent = "Eliminando..."

  fetch(`/api/productos/${productoId}`, {
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
        window.location.href = "productos.html?eliminado=true"
      } else {
        throw new Error(data.message || "Error al eliminar el producto")
      }
    })
    .catch((error) => {
      console.error("Error:", error)

      alert(`Error al eliminar el producto: ${error.message}`)

      btnConfirmar.disabled = false
      btnConfirmar.textContent = "Eliminar"

      cerrarModalEliminar()
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

function formatearFecha(fecha) {
  let opciones = { year: "numeric", month: "long", day: "numeric" }
  return new Date(fecha).toLocaleDateString("es-MX", opciones)
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

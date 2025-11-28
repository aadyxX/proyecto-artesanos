document.addEventListener("DOMContentLoaded", () => {
  
  cargarDatosArtesano()
 
  cargarCategorias()


  let urlParams = new URLSearchParams(window.location.search)
  let productoId = urlParams.get("id")

  if (productoId) {
    document.getElementById("titulo-pagina").textContent = "Editar Producto"
    document.getElementById("btn-guardar").textContent = "Actualizar Producto"
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

function cargarCategorias() {
  let selectCategoria = document.getElementById("categoria")

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
        selectCategoria.innerHTML = '<option value="">Selecciona una categoría</option>'

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
          selectCategoria.innerHTML = '<option value="">No hay categorías disponibles</option>'
          console.error("No se encontraron categorías")
        }

        let urlParams = new URLSearchParams(window.location.search)
        let productoId = urlParams.get("id")
        if (productoId) {
          cargarProducto(productoId)
        }
      } else {
        throw new Error(data.message || "Error al cargar las categorías")
      }
    })
    .catch((error) => {
      console.error("Error al cargar categorías:", error)
      selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>'
      mostrarError(`Error al cargar las categorías: ${error.message}. Por favor, recarga la página.`)
    })
}

function cargarProducto(id) {
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

        document.getElementById("producto-id").value = producto.id
        document.getElementById("nombre").value = producto.nombre
        document.getElementById("categoria").value = producto.categoria_id
        document.getElementById("precio").value = producto.precio
        document.getElementById("stock").value = producto.stock
        document.getElementById("descripcion").value = producto.descripcion
        document.getElementById("destacado").checked = producto.destacado == 1
        document.getElementById("estado").value = producto.estado

        if (data.imagenes && data.imagenes.length > 0) {
         
          let imagenPrincipal = data.imagenes.find((img) => img.es_principal == 1)
          if (imagenPrincipal && imagenPrincipal.imagen_base64) {
            let previewPrincipal = document.getElementById("preview-principal")
            previewPrincipal.querySelector("img").src = imagenPrincipal.imagen_base64
            previewPrincipal.style.display = "block"

            let placeholder = document.querySelector("#imagen-principal-container .upload-placeholder")
            if (placeholder) {
              placeholder.style.display = "none"
            }

            previewPrincipal.dataset.imagenId = imagenPrincipal.id
          }

          let imagenesAdicionales = data.imagenes.filter((img) => img.es_principal == 0)
          let contenedoresAdicionales = document.querySelectorAll(".imagen-adicional")

          imagenesAdicionales.forEach((imagen, index) => {
            if (index < contenedoresAdicionales.length && imagen.imagen_base64) {
              let contenedor = contenedoresAdicionales[index].closest(".image-upload")
              let preview = contenedor.querySelector(".image-preview")
              preview.querySelector("img").src = imagen.imagen_base64
              preview.style.display = "block"

              let placeholder = contenedor.querySelector(".upload-placeholder")
              if (placeholder) {
                placeholder.style.display = "none"
              }

              preview.dataset.imagenId = imagen.id
            }
          })
        }
      } else {
        throw new Error(data.message || "Error al cargar el producto")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      mostrarError(`Error al cargar el producto: ${error.message}`)
    })
}

function configurarEventos() {

  let formulario = document.getElementById("producto-form")
  formulario.addEventListener("submit", (e) => {
    e.preventDefault()
    guardarProducto()
  })

  let inputImagenPrincipal = document.getElementById("imagen-principal")
  inputImagenPrincipal.addEventListener("change", function () {
    mostrarVistaPrevia(this, "preview-principal")
  })

  let inputsImagenesAdicionales = document.querySelectorAll(".imagen-adicional")
  inputsImagenesAdicionales.forEach((input) => {
    input.addEventListener("change", function () {
      let contenedor = this.closest(".image-upload")
      let preview = contenedor.querySelector(".image-preview")
      mostrarVistaPrevia(this, preview)
    })
  })

  document.querySelectorAll(".remove-image").forEach((btn) => {
    btn.addEventListener("click", function () {
      eliminarImagen(this)
    })
  })
}

function mostrarVistaPrevia(input, previewId) {
  if (input.files && input.files[0]) {
    let reader = new FileReader()

    reader.onload = (e) => {
      let preview

      if (typeof previewId === "string") {
        preview = document.getElementById(previewId)
      } else {
        preview = previewId
      }

      preview.querySelector("img").src = e.target.result
      preview.style.display = "block"

      let placeholder = input.closest(".image-upload").querySelector(".upload-placeholder")
      if (placeholder) {
        placeholder.style.display = "none"
      }
    }

    reader.readAsDataURL(input.files[0])
  }
}

function eliminarImagen(btn) {
  let contenedor = btn.closest(".image-upload")
  let input = contenedor.querySelector('input[type="file"]')
  let preview = contenedor.querySelector(".image-preview")
  let placeholder = contenedor.querySelector(".upload-placeholder")

  input.value = ""

  preview.style.display = "none"
  placeholder.style.display = "block"

  if (preview.dataset.imagenId) {
    console.log(`Imagen marcada para eliminar: ${preview.dataset.imagenId}`)
  }
}

function guardarProducto() {
  
  if (!validarFormulario()) {
    return
  }

  let btnGuardar = document.getElementById("btn-guardar")
  let textoOriginal = btnGuardar.textContent
  btnGuardar.disabled = true
  btnGuardar.textContent = "Guardando..."

  document.getElementById("alert-success").style.display = "none"
  document.getElementById("alert-error").style.display = "none"

  let formulario = document.getElementById("producto-form")
  let formData = new FormData(formulario)

  let imagenesEliminar = []
  document.querySelectorAll(".image-preview[data-imagen-id]").forEach((preview) => {
    if (preview.style.display === "none") {
      imagenesEliminar.push(preview.dataset.imagenId)
    }
  })

  if (imagenesEliminar.length > 0) {
    imagenesEliminar.forEach((id) => {
      formData.append("imagenes_eliminar[]", id)
    })
  }

  let productoId = formData.get("id")
  let url = productoId ? `/api/productos/${productoId}` : "/api/productos"

  console.log("Enviando datos al servidor:", url)

  fetch(url, {
    method: "POST",
    headers: {
      "X-CSRF-TOKEN": getCsrfToken(),
      Accept: "application/json",
    },
    body: formData,
  })
    .then((response) => {
      return response.json().then((data) => {
        if (!response.ok) {
          throw new Error(data.message || `Error en la respuesta del servidor: ${response.status}`)
        }
        return data
      })
    })
    .then((data) => {
      if (data.success) {
        let alertSuccess = document.getElementById("alert-success")
        alertSuccess.textContent = data.message || "Producto guardado correctamente."
        alertSuccess.style.display = "block"

        alertSuccess.scrollIntoView({ behavior: "smooth" })

        setTimeout(() => {
          window.location.href = "productos.html"
        }, 2000)
      } else {
        throw new Error(data.message || "Error al guardar el producto")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      mostrarError(`Error al guardar el producto: ${error.message}`)

      btnGuardar.disabled = false
      btnGuardar.textContent = textoOriginal
    })
}

function validarFormulario() {
  let esValido = true
  let errores = []

  let nombre = document.getElementById("nombre")
  let categoria = document.getElementById("categoria")
  let precio = document.getElementById("precio")
  let stock = document.getElementById("stock")
  let descripcion = document.getElementById("descripcion")
  let imagenPrincipal = document.getElementById("imagen-principal")
  let productoId = document.getElementById("producto-id").value

  if (!nombre.value.trim()) {
    errores.push("El nombre del producto es obligatorio")
    nombre.classList.add("error")
    esValido = false
  } else {
    nombre.classList.remove("error")
  }

  if (!categoria.value) {
    errores.push("Debes seleccionar una categoría")
    categoria.classList.add("error")
    esValido = false
  } else {
    categoria.classList.remove("error")
  }

  if (!precio.value || isNaN(precio.value) || Number.parseFloat(precio.value) <= 0) {
    errores.push("El precio debe ser un número mayor que cero")
    precio.classList.add("error")
    esValido = false
  } else {
    precio.classList.remove("error")
  }

  if (!stock.value || isNaN(stock.value) || Number.parseInt(stock.value) < 0) {
    errores.push("El stock debe ser un número no negativo")
    stock.classList.add("error")
    esValido = false
  } else {
    stock.classList.remove("error")
  }

  if (!descripcion.value.trim()) {
    errores.push("La descripción del producto es obligatoria")
    descripcion.classList.add("error")
    esValido = false
  } else {
    descripcion.classList.remove("error")
  }

  if (!productoId && (!imagenPrincipal.files || imagenPrincipal.files.length === 0)) {
    errores.push("Debes seleccionar una imagen principal")
    imagenPrincipal.parentElement.classList.add("error")
    esValido = false
  } else {
    imagenPrincipal.parentElement.classList.remove("error")
  }

  if (!esValido) {
    mostrarError("Por favor, corrige los siguientes errores:<br>" + errores.join("<br>"))
  }

  return esValido
}

function mostrarError(mensaje) {
  let alertError = document.getElementById("alert-error")
  alertError.innerHTML = mensaje
  alertError.style.display = "block"
  alertError.scrollIntoView({ behavior: "smooth" })
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

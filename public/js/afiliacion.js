document.addEventListener("DOMContentLoaded", () => {
  let formulario = document.getElementById("formulario-afiliacion")
  let alertSuccess = document.getElementById("alert-success")
  let alertError = document.getElementById("alert-error")

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

  formulario.addEventListener("submit", (e) => {
    e.preventDefault()

    alertSuccess.style.display = "none"
    alertError.style.display = "none"

    if (!validarFormulario()) {
      return
    }

    let formData = new FormData(formulario)

    let formDataObj = {}
    formData.forEach((value, key) => {
      formDataObj[key] = value
    })

    fetch("/api/afiliacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCsrfToken(),
        Accept: "application/json",
      },
      body: JSON.stringify(formDataObj),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Mostrar mensaje de éxito
          alertSuccess.style.display = "block"
          formulario.reset()

          alertSuccess.scrollIntoView({ behavior: "smooth" })
        } else {
          alertError.textContent = data.message || "Ha ocurrido un error al enviar tu solicitud."
          alertError.style.display = "block"

          alertError.scrollIntoView({ behavior: "smooth" })
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        alertError.textContent = "Ha ocurrido un error al procesar tu solicitud."
        alertError.style.display = "block"

        // Desplazar hacia el mensaje
        alertError.scrollIntoView({ behavior: "smooth" })
      })
  })

  function validarFormulario() {
    let esValido = true

    let camposRequeridos = formulario.querySelectorAll("[required]")
    camposRequeridos.forEach((campo) => {
      if (!campo.value.trim()) {
        marcarError(campo, "Este campo es obligatorio")
        esValido = false
      } else {
        limpiarError(campo)
      }
    })

    let email = document.getElementById("email")
    if (email.value && !validarEmail(email.value)) {
      marcarError(email, "Por favor, ingresa un correo electrónico válido")
      esValido = false
    }

    let telefono = document.getElementById("telefono")
    if (telefono.value && !validarTelefono(telefono.value)) {
      marcarError(telefono, "Por favor, ingresa un número de teléfono válido")
      esValido = false
    }

    let terminos = document.getElementById("terminos")
    if (!terminos.checked) {
      marcarError(terminos, "Debes aceptar los términos y condiciones")
      esValido = false
    }

    return esValido
  }

  function validarEmail(email) {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  function validarTelefono(telefono) {
    let regex = /^[0-9\s\-+()]{8,15}$/
    return regex.test(telefono)
  }

  function marcarError(campo, mensaje) {
    let errorPrevio = campo.parentElement.querySelector(".error-mensaje")
    if (errorPrevio) {
      errorPrevio.remove()
    }

    let errorMensaje = document.createElement("div")
    errorMensaje.className = "error-mensaje"
    errorMensaje.style.color = "#e91e63"
    errorMensaje.style.fontSize = "12px"
    errorMensaje.style.marginTop = "5px"
    errorMensaje.textContent = mensaje

    campo.style.borderColor = "#e91e63"
    campo.parentElement.appendChild(errorMensaje)
  }

  function limpiarError(campo) {
    campo.style.borderColor = ""
    let errorMensaje = campo.parentElement.querySelector(".error-mensaje")
    if (errorMensaje) {
      errorMensaje.remove()
    }
  }
})

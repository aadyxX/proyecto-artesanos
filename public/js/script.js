
// FILTROS PARA LAS CATEGORIAS O SEA PRODUCTOS (en la pagina de especificos)

document.addEventListener("DOMContentLoaded", () => {
    let tabBtns = document.querySelectorAll(".tab-btn")
    let tabContents = document.querySelectorAll(".tab-content")
  
    tabBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("activo"))
        tabContents.forEach((c) => c.classList.remove("activo"))
  
        btn.classList.add("activo")
        tabContents[index].classList.add("activo")
      })
    })
  
    let btnAplicarFiltros = document.querySelector(".btn-aplicar-filtros")
    if (btnAplicarFiltros) {
      btnAplicarFiltros.addEventListener("click", () => {
        // aqui va lo que se le va aaplicar a los filtros seleccionados
        console.log("Aplicando filtros...")
  
        let precioMin = document.querySelector(".input-precio:first-child")?.value
        let precioMax = document.querySelector(".input-precio:last-child")?.value
        let categoriasSeleccionadas = Array.from(document.querySelectorAll(".checkbox-container input:checked")).map(
          (checkbox) => checkbox.parentElement.textContent.trim(),
        )
        let ordenarPor = document.querySelector(".select-ordenar").value
  
        console.log("Precio mínimo:", precioMin)
        console.log("Precio máximo:", precioMax)
        console.log("Categorías seleccionadas:", categoriasSeleccionadas)
        console.log("Ordenar por:", ordenarPor)
  
        // aqui va lo qu se le va a aplicar a  los productos mostrados
      })
    }



    // En un entorno real, harías una petición al servidor para obtener las categorías
  fetch("api/categorias.php")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener las categorías")
      }
      return response.json()
    })
    .then((categorias) => {
      // Obtener el contenedor del submenu de categorías
      const submenuCategorias = document.querySelector(".menu-desplegable:nth-child(3) .submenu ul")

      // Si encontramos el elemento, lo llenamos con las categorías
      if (submenuCategorias) {
        // Limpiar cualquier contenido existente
        submenuCategorias.innerHTML = ""

        // Crear y añadir elementos para cada categoría
        categorias.forEach((categoria) => {
          // Crear el elemento li
          const li = document.createElement("li")

          // Crear el enlace
          const a = document.createElement("a")
          a.href = `categoria.html?id=${categoria.id}`
          a.textContent = categoria.nombre

          // Añadir el enlace al li
          li.appendChild(a)

          // Añadir el li al submenu
          submenuCategorias.appendChild(li)
        })
      }
    })
    .catch((error) => {
      console.error("Error:", error)
    })
  })



  
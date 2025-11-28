# TODO: Corregir rutas de fetch para servidor alwaysdata.net

## Archivos a editar:
- [x] public/js/login.js: Cambiar API_URL de localhost a dinámico
- [x] public/js/checkout.js: Cambiar URLs de fetch de localhost a dinámico y URLs de imágenes
- [x] public/js/carrito.js: Cambiar URLs de fetch de localhost a dinámico y URLs de imágenes
- [x] public/js/script.js: Cambiar ruta de categorias.php a /api/categorias

## Detalles de cambios:
1. login.js: const API_URL = "http://localhost:8000/api/usuarios-jwt"; → const API_URL = window.location.origin + "/api/usuarios-jwt";
2. checkout.js: fetch('http://localhost:8000/api/usuarios-jwt/checkout' → fetch(`${window.location.origin}/api/usuarios-jwt/checkout`
3. checkout.js: img src="http://localhost:8000${item.producto.imagen_url}" → img src="${window.location.origin}${item.producto.imagen_url}"
4. carrito.js: fetch('http://localhost:8000/api/usuarios-jwt/carrito' → fetch(`${window.location.origin}/api/usuarios-jwt/carrito`
5. carrito.js: img src="http://localhost:8000${item.producto.imagen_url}" → img src="${window.location.origin}${item.producto.imagen_url}"
6. script.js: fetch("api/categorias.php") → fetch("/api/categorias")

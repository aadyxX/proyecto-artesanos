<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductoController extends Controller
{
    public function index(Request $request)
    {
        try {
           
            $artesanoId = $request->input('artesano_id', 1);
        
            $busqueda = $request->input('busqueda');
            $categoria = $request->input('categoria');
            $estado = $request->input('estado');
            $pagina = $request->input('pagina', 1);
            $porPagina = $request->input('por_pagina', 10);
        
            $query = "SELECT p.*, c.nombre as categoria_nombre, 
                 (SELECT ruta_imagen FROM imagenes_producto WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen_principal
                 FROM productos p
                 JOIN categorias c ON p.categoria_id = c.id
                 WHERE p.artesano_id = ?";
            $params = [$artesanoId];
        
            if ($busqueda) {
                $query .= " AND p.nombre LIKE ?";
                $params[] = "%{$busqueda}%";
            }
        
            if ($categoria) {
                $query .= " AND p.categoria_id = ?";
                $params[] = $categoria;
            }
        
            if ($estado) {
                $query .= " AND p.estado = ?";
                $params[] = $estado;
            }
        
            $query .= " ORDER BY p.fecha_creacion DESC";

            $offset = ($pagina - 1) * $porPagina;
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $porPagina;
            $params[] = $offset;
        
            $productos = DB::select($query, $params);
        
            $queryCount = "SELECT COUNT(*) as total FROM productos p WHERE p.artesano_id = ?";
            $paramsCount = [$artesanoId];
        
            if ($busqueda) {
                $queryCount .= " AND p.nombre LIKE ?";
                $paramsCount[] = "%{$busqueda}%";
            }
        
            if ($categoria) {
                $queryCount .= " AND p.categoria_id = ?";
                $paramsCount[] = $categoria;
            }
        
            if ($estado) {
                $queryCount .= " AND p.estado = ?";
                $paramsCount[] = $estado;
            }
        
            $totalProductos = DB::selectOne($queryCount, $paramsCount)->total;
            $totalPaginas = ceil($totalProductos / $porPagina);
        
            $productosFormateados = [];
            foreach ($productos as $producto) {
                $imagenBase64 = null;
                if ($producto->imagen_principal) {
                    $rutaCompleta = storage_path('app/public/' . $producto->imagen_principal);
                    if (file_exists($rutaCompleta)) {
                        $tipoImagen = mime_content_type($rutaCompleta);
                        $imagenData = base64_encode(file_get_contents($rutaCompleta));
                        $imagenBase64 = 'data:' . $tipoImagen . ';base64,' . $imagenData;
                    }
                }
            
                $productosFormateados[] = [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'precio' => (float)$producto->precio,
                    'stock' => $producto->stock,
                    'estado' => $producto->estado,
                    'destacado' => (bool)$producto->destacado,
                    'categoria' => [
                        'id' => $producto->categoria_id,
                        'nombre' => $producto->categoria_nombre
                    ],
                    'imagen' => $imagenBase64 ?: null
                ];
            }
        
            return response()->json([
                'success' => true,
                'productos' => $productosFormateados,
                'paginacion' => [
                    'total' => $totalProductos,
                    'por_pagina' => $porPagina,
                    'pagina_actual' => (int)$pagina,
                    'total_paginas' => $totalPaginas
                ]
            ]);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los productos: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function show($id)
    {
        try {
            $producto = DB::selectOne("
                SELECT p.nombre AS Nombre_Producto, p.descripcion AS Descripcion_Producto, p.precio AS Precio, p.stock AS Stock_Disponible, p.estado AS Estado_Producto, c.nombre AS Categoria, a.nombre_negocio AS Artesano_Negocio, a.nombre AS Nombre_Artesano, a.region AS Region_Artesano, p.fecha_creacion AS Fecha_Publicacion 
                FROM productos p 
                JOIN categorias c ON p.categoria_id = c.id 
                JOIN artesanos a ON p.artesano_id = a.id 
                WHERE p.id = ?
            ", [$id]);
        
            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }
        
            $imagenesDB = DB::select("
                SELECT id, ruta_imagen, es_principal
                FROM imagenes_producto
                WHERE producto_id = ?
                ORDER BY es_principal DESC, id ASC
            ", [$id]);
        
            $imagenes = [];
            foreach ($imagenesDB as $imagen) {
                $rutaCompleta = storage_path('app/public/' . $imagen->ruta_imagen);
                $imagenBase64 = null;
            
                if (file_exists($rutaCompleta)) {
                    $tipoImagen = mime_content_type($rutaCompleta);
                    $imagenData = base64_encode(file_get_contents($rutaCompleta));
                    $imagenBase64 = 'data:' . $tipoImagen . ';base64,' . $imagenData;
                }
            
                $imagenes[] = [
                    'id' => $imagen->id,
                    'ruta_imagen' => $imagen->ruta_imagen,
                    'es_principal' => $imagen->es_principal,
                    'imagen_base64' => $imagenBase64
                ];
            }
    
            return response()->json([
                'success' => true,
                'producto' => $producto,
                'imagenes' => $imagenes
            ]);
        
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el producto: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:150',
                'categoria_id' => 'required|integer|exists:categorias,id',
                'precio' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'descripcion' => 'required|string',
                'destacado' => 'boolean',
                'estado' => 'required|in:activo,inactivo,agotado',
                'imagen_principal' => 'required|image|max:5120',
                'imagenes_adicionales.*' => 'nullable|image|max:5120'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $artesanoId = $request->input('artesano_id', 1);
            
            DB::beginTransaction();
            
            $productoId = DB::table('productos')->insertGetId([
                'artesano_id' => $artesanoId,
                'categoria_id' => $request->categoria_id,
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'precio' => $request->precio,
                'stock' => $request->stock,
                'destacado' => $request->has('destacado') ? 1 : 0,
                'estado' => $request->estado,
                'fecha_creacion' => now(),
                'fecha_edicion' => now()
            ]);
            
            if ($request->hasFile('imagen_principal')) {
                $imagenPrincipal = $request->file('imagen_principal');
                $rutaImagen = $imagenPrincipal->store('productos', 'public');
                
                DB::table('imagenes_producto')->insert([
                    'producto_id' => $productoId,
                    'ruta_imagen' => $rutaImagen,
                    'es_principal' => 1,
                    'fecha_creacion' => now()
                ]);
            }
            
            if ($request->hasFile('imagenes_adicionales')) {
                foreach ($request->file('imagenes_adicionales') as $imagen) {
                    $rutaImagen = $imagen->store('productos', 'public');
                    
                    DB::table('imagenes_producto')->insert([
                        'producto_id' => $productoId,
                        'ruta_imagen' => $rutaImagen,
                        'es_principal' => 0,
                        'fecha_creacion' => now()
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto creado correctamente',
                'producto_id' => $productoId
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el producto: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:150',
                'categoria_id' => 'required|integer|exists:categorias,id',
                'precio' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'descripcion' => 'required|string',
                'destacado' => 'boolean',
                'estado' => 'required|in:activo,inactivo,agotado',
                'imagen_principal' => 'nullable|image|max:5120', 
                'imagenes_adicionales.*' => 'nullable|image|max:5120',
                'imagenes_eliminar' => 'nullable|array',
                'imagenes_eliminar.*' => 'integer'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $producto = DB::selectOne("SELECT * FROM productos WHERE id = ?", [$id]);
            
            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }
            
            DB::beginTransaction();
            
            DB::table('productos')
                ->where('id', $id)
                ->update([
                    'categoria_id' => $request->categoria_id,
                    'nombre' => $request->nombre,
                    'descripcion' => $request->descripcion,
                    'precio' => $request->precio,
                    'stock' => $request->stock,
                    'destacado' => $request->has('destacado') ? 1 : 0,
                    'estado' => $request->estado,
                    'fecha_edicion' => now()
                ]);
            
            if ($request->hasFile('imagen_principal')) {
                $imagenPrincipal = $request->file('imagen_principal');
                $rutaImagen = $imagenPrincipal->store('productos', 'public');
                
                $imagenPrincipalActual = DB::selectOne("
                    SELECT id, ruta_imagen FROM imagenes_producto 
                    WHERE producto_id = ? AND es_principal = 1
                ", [$id]);
                
                if ($imagenPrincipalActual) {
                    Storage::disk('public')->delete($imagenPrincipalActual->ruta_imagen);
    
                    DB::table('imagenes_producto')
                        ->where('id', $imagenPrincipalActual->id)
                        ->update([
                            'ruta_imagen' => $rutaImagen,
                            'fecha_creacion' => now()
                        ]);
                } else {
                    // Insertar nueva imagen principal
                    DB::table('imagenes_producto')->insert([
                        'producto_id' => $id,
                        'ruta_imagen' => $rutaImagen,
                        'es_principal' => 1,
                        'fecha_creacion' => now()
                    ]);
                }
            }
            
            if ($request->has('imagenes_eliminar') && is_array($request->imagenes_eliminar)) {
                foreach ($request->imagenes_eliminar as $imagenId) {
                    $imagen = DB::selectOne("
                        SELECT ruta_imagen 
                        FROM imagenes_producto 
                        WHERE id = ? AND producto_id = ?
                    ", [$imagenId, $id]);
                    
                    if ($imagen) {
                        Storage::disk('public')->delete($imagen->ruta_imagen);
                        
                        DB::table('imagenes_producto')->where('id', $imagenId)->delete();
                    }
                }
            }
            
            if ($request->hasFile('imagenes_adicionales')) {
                foreach ($request->file('imagenes_adicionales') as $imagen) {
                    if ($imagen->isValid()) {
                        $rutaImagen = $imagen->store('productos', 'public');
                        
                        DB::table('imagenes_producto')->insert([
                            'producto_id' => $id,
                            'ruta_imagen' => $rutaImagen,
                            'es_principal' => 0,
                            'fecha_creacion' => now()
                        ]);
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto actualizado correctamente'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el producto: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
    
    public function destroy($id)
    {
        try {
            $producto = DB::selectOne("SELECT * FROM productos WHERE id = ?", [$id]);
            
            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }
            
            $imagenes = DB::select("SELECT ruta_imagen FROM imagenes_producto WHERE producto_id = ?", [$id]);
            
            DB::beginTransaction();
            
            foreach ($imagenes as $imagen) {
                Storage::disk('public')->delete($imagen->ruta_imagen);
            }
        
            DB::table('imagenes_producto')->where('producto_id', $id)->delete();
            DB::table('productos')->where('id', $id)->delete();
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto eliminado correctamente'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el producto: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getCategorias()
    {
        try {
           
            $categorias = DB::select("
                SELECT MIN(id) as id, nombre 
                FROM categorias 
                GROUP BY nombre 
                ORDER BY nombre
            ");
            
            \Log::info('Categorías obtenidas:', ['count' => count($categorias), 'categorias' => $categorias]);
            
            return response()->json([
                'success' => true,
                'categorias' => $categorias
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error al obtener categorías: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSimilarProducts($id)
    {
        try {
            $similarProducts = DB::select("
                SELECT
                    p2.id AS Producto_Similar_ID,
                    p2.nombre AS Nombre_Producto,
                    p2.precio AS Precio,
                    a.nombre_negocio AS Artesano,
                    (SELECT ruta_imagen FROM imagenes_producto ip WHERE ip.producto_id = p2.id AND ip.es_principal = 1 LIMIT 1) AS imagen_principal
                FROM
                    productos p1
                JOIN
                    productos p2 ON p1.categoria_id = p2.categoria_id
                JOIN
                    artesanos a ON p2.artesano_id = a.id
                WHERE
                    p1.id = ?
                    AND p2.id <> ?
                LIMIT 4;
            ", [$id, $id]);

            $productosFormateados = [];
            foreach ($similarProducts as $producto) {
                $imagenBase64 = null;
                if ($producto->imagen_principal) {
                    $rutaCompleta = storage_path('app/public/' . $producto->imagen_principal);
                    if (file_exists($rutaCompleta)) {
                        $tipoImagen = mime_content_type($rutaCompleta);
                        $imagenData = base64_encode(file_get_contents($rutaCompleta));
                        $imagenBase64 = 'data:' . $tipoImagen . ';base64,' . $imagenData;
                    }
                }
            
                $productosFormateados[] = [
                    'id' => $producto->Producto_Similar_ID,
                    'nombre' => $producto->Nombre_Producto,
                    'precio' => (float)$producto->Precio,
                    'artesano' => $producto->Artesano,
                    'imagen' => $imagenBase64 ?: null
                ];
            }

            return response()->json([
                'success' => true,
                'productos' => $productosFormateados
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los productos similares: ' . $e->getMessage()
            ], 500);
        }
    }
}

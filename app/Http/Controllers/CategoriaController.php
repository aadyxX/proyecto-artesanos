<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoriaController extends Controller
{
public function obtenerCategorias()
{
    $categorias = DB::table('categorias')->select('id', 'nombre')->get();

    return response()->json([
        'success' => true,
        'categorias' => $categorias
    ]);
}

    public function obtenerCategoria($slug)
{
    $categoria = DB::table('categorias')->where('slug', $slug)->first();

    if (!$categoria) {
        return response()->json(['error' => 'Categoría no encontrada'], 404);
    }

    return response()->json([
        'titulo_rosa' => $categoria->titulo_rosa,
        'titulo_verde' => $categoria->titulo_verde,
        'descripcion' => $categoria->descripcion
    ]);
}

    public function obtenerTodasLasCategorias()
{
    $categorias = DB::table('categorias')
        ->select('id', 'nombre')
        ->orderBy('nombre')
        ->get();

    return response()->json($categorias);
}

    public function productosPorCategoria($id)
    {
        $productos = DB::table('productos as p')
            ->join('categorias as c', 'p.categoria_id', '=', 'c.id')
            ->leftJoin('imagenes_producto as ip', function($join) {
                $join->on('p.id', '=', 'ip.producto_id')
                     ->where('ip.es_principal', '=', 1);
            })
            ->where('p.categoria_id', '=', $id)
            ->select(
                'p.id',
                'p.nombre',
                'p.descripcion',
                'p.precio',
                'c.nombre as categoria_nombre',
                DB::raw('IFNULL(ip.ruta_imagen, "img/placeholder.jpg") as imagen_principal')
            )
            ->orderBy('p.nombre')
            ->get();

        if ($productos->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No se encontraron productos para esta categoría.'], 404);
        }

        return response()->json(['success' => true, 'productos' => $productos]);
    }

}

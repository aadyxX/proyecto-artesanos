<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResenaController extends Controller
{
    public function show($productId)
    {
        $reviews = DB::select("
            SELECT r.calificacion AS Calificacion, r.comentario AS Comentario_Cliente, r.fecha_resena AS Fecha_Resena, p.nombre AS Nombre_Producto, c.nombre AS Nombre_Cliente
            FROM resenas r
            JOIN productos p ON r.producto_id = p.id
            JOIN clientes c ON r.cliente_id = c.id
            WHERE r.producto_id = ?
        ", [$productId]);

        return response()->json($reviews);
    }
}

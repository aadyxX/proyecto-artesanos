<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class ScmController extends Controller
{
    /**
     * Obtiene todos los IDs de los pedidos para el dropdown.
     */
    public function getPedidos(): JsonResponse
    {
        $pedidos = DB::table('pedidos')->select('id')->orderBy('id')->get();
        return response()->json($pedidos);
    }

    /**
     * Obtiene el seguimiento de un pedido específico.
     */
    public function getSeguimientoPedido($id): JsonResponse
    {
        $seguimiento = DB::select("
            SELECT
              p.id AS pedido_id,
              p.cliente_nombre AS nombre_cliente,
              p.direccion_envio,
              pe.estado AS estado_envio,
              pe.numero_seguimiento,
              pe.empresa_transporte,
              pe.fecha_envio,
              pe.fecha_entrega_estimada,
              GROUP_CONCAT(CONCAT(prod.nombre, ' (Cantidad: ', pd.cantidad, ')') SEPARATOR '; ') AS productos_en_pedido
            FROM pedidos AS p
            JOIN pedidos_detalle AS pd ON p.id = pd.pedido_id
            JOIN productos AS prod ON pd.producto_id = prod.id
            LEFT JOIN envios AS pe ON p.id = pe.pedido_id
            WHERE p.id = ?
            GROUP BY p.id, p.cliente_nombre, p.direccion_envio, pe.estado, pe.numero_seguimiento, pe.empresa_transporte, pe.fecha_envio, pe.fecha_entrega_estimada;
        ", [$id]);

        if (empty($seguimiento)) {
            return response()->json(['message' => 'Pedido no encontrado'], 404);
        }

        return response()->json($seguimiento[0]);
    }

    /**
     * Obtiene el inventario total por artesano y producto.
     */
    public function getInventario(): JsonResponse
    {
        $inventario = DB::select("
            SELECT
              a.nombre_negocio AS artesano,
              p.nombre AS producto,
              p.stock
            FROM productos AS p
            JOIN artesanos AS a ON p.artesano_id = a.id
            ORDER BY a.nombre_negocio, p.stock ASC;
        ");

        return response()->json($inventario);
    }

    /**
     * Obtiene las devoluciones por artesano y producto.
     */
    public function getDevoluciones(): JsonResponse
    {
        $devoluciones = DB::select("
            SELECT
              a.nombre_negocio AS artesano,
              p.nombre AS producto,
              COUNT(d.id) AS total_devoluciones
            FROM devoluciones AS d
            JOIN productos AS p ON d.producto_id = p.id
            JOIN artesanos AS a ON p.artesano_id = a.id
            GROUP BY a.nombre_negocio, p.nombre
            ORDER BY total_devoluciones DESC;
        ");

        return response()->json($devoluciones);
    }
}

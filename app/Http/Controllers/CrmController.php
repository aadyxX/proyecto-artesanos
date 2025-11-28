<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class CrmController extends Controller
{
    /**
     * Obtiene los productos más vendidos.
     */
    public function getTopSellingProducts(): JsonResponse
    {
        $topProducts = DB::select("
            SELECT p.nombre, SUM(pd.cantidad) AS total_vendido
            FROM pedidos_detalle AS pd
            JOIN productos AS p ON pd.producto_id = p.id
            GROUP BY p.nombre
            ORDER BY total_vendido DESC
            LIMIT 10;
        ");

        return response()->json($topProducts);
    }

    /**
     * Obtiene los clientes que más compran.
     */
    public function getTopClients(): JsonResponse
    {
        $topClients = DB::select("
            SELECT c.nombre, c.apellidos, COUNT(p.id) AS total_compras
            FROM clientes AS c
            JOIN pedidos AS p ON c.id = p.cliente_id
            GROUP BY c.id, c.nombre, c.apellidos
            ORDER BY total_compras DESC
            LIMIT 10;
        ");

        return response()->json($topClients);
    }

    /**
     * Obtiene los productos que más compran los clientes principales.
     */
    public function getTopProductsByTopClients(): JsonResponse
    {
        $topProductsByClients = DB::select("
            SELECT c.nombre AS nombre_cliente, c.apellidos AS apellido_cliente, p.nombre AS nombre_producto, SUM(pd.cantidad) AS cantidad_comprada
            FROM clientes AS c
            JOIN pedidos AS pe ON c.id = pe.cliente_id
            JOIN pedidos_detalle AS pd ON pe.id = pd.pedido_id
            JOIN productos AS p ON pd.producto_id = p.id
            GROUP BY c.id, c.nombre, c.apellidos, p.nombre
            ORDER BY c.nombre, c.apellidos, cantidad_comprada DESC;
        ");

        // Procesar para agrupar por cliente
        $clientsData = [];
        foreach ($topProductsByClients as $row) {
            $clientName = $row->nombre_cliente . ' ' . $row->apellido_cliente;
            if (!isset($clientsData[$clientName])) {
                $clientsData[$clientName] = [];
            }
            $clientsData[$clientName][] = [
                'nombre_producto' => $row->nombre_producto,
                'cantidad_comprada' => $row->cantidad_comprada
            ];
        }

        return response()->json($clientsData);
    }
}

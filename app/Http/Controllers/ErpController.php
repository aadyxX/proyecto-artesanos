<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class ErpController extends Controller
{
    /**
     * Calcula impuestos y comisiones para artesanos.
     */
    public function getImpuestosComisiones(): JsonResponse
    {
        $data = DB::select("
            SELECT
                A.nombre, A.apellidos, A.nombre_negocio,
                SUM(PD.subtotal) AS ventas_totales,
                SUM(PD.subtotal) * 0.16 AS impuesto_iva,
                SUM(PD.subtotal) * 0.10 AS comision_plataforma
            FROM artesanos AS A
            JOIN productos AS P ON A.id = P.artesano_id
            JOIN pedidos_detalle AS PD ON P.id = PD.producto_id
            GROUP BY A.id, A.nombre, A.apellidos, A.nombre_negocio
            ORDER BY ventas_totales DESC;
        ");
        return response()->json($data);
    }

    /**
     * Obtiene productos con bajo stock (menos de 5 unidades).
     */
    public function getBajoStock(): JsonResponse
    {
        $data = DB::select("
            SELECT p.nombre AS producto, p.stock, a.nombre_negocio AS artesano
            FROM productos AS p
            JOIN artesanos AS a ON p.artesano_id = a.id
            WHERE p.stock < 5
            ORDER BY p.stock ASC;
        ");
        return response()->json($data);
    }

    /**
     * Obtiene el total de ventas por artesano.
     */
    public function getVentasPorArtesano(): JsonResponse
    {
        $data = DB::select("
            SELECT a.nombre_negocio AS artesano, SUM(pd.subtotal) AS total_ventas
            FROM pedidos_detalle AS pd
            JOIN productos AS p ON pd.producto_id = p.id
            JOIN artesanos AS a ON p.artesano_id = a.id
            GROUP BY a.nombre_negocio
            ORDER BY total_ventas DESC;
        ");
        return response()->json($data);
    }

    /**
     * Obtiene las ventas por categoría de producto.
     */
    public function getVentasPorCategoria(): JsonResponse
    {
        $data = DB::select("
            SELECT c.nombre AS categoria, SUM(pd.subtotal) AS total_ventas
            FROM pedidos_detalle AS pd
            JOIN productos AS p ON pd.producto_id = p.id
            JOIN categorias AS c ON p.categoria_id = c.id
            GROUP BY c.nombre
            ORDER BY total_ventas DESC;
        ");
        return response()->json($data);
    }

    /**
     * Obtiene los artículos con las mejores reseñas.
     */
    public function getMejoresResenas(): JsonResponse
    {
        $data = DB::select("
            SELECT P.nombre, AVG(R.calificacion) AS calificacion_promedio
            FROM resenas AS R
            JOIN productos AS P ON R.producto_id = P.id
            GROUP BY P.id, P.nombre
            ORDER BY calificacion_promedio DESC
            LIMIT 10;
        ");
        return response()->json($data);
    }
}

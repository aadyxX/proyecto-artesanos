<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ArtesanoController extends Controller
{
    // Este método queda obsoleto y podría ser eliminado en el futuro.
    // Se mantiene por si alguna otra parte del sistema aún lo usa.
    public function getDatosArtesano(Request $request)
    {
        $artesanoId = $request->input('artesano_id', 1);
        $artesano = DB::table('artesanos')->where('id', $artesanoId)->first();
        if (!$artesano) {
            return response()->json(['success' => false, 'message' => 'Artesano no encontrado'], 404);
        }
        return response()->json(['success' => true, 'artesano' => $artesano]);
    }
    
    /**
     * Obtiene las estadísticas del dashboard para el artesano autenticado.
     */
    public function getDashboardEstadisticas(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
            }
            $artesano = DB::table('artesanos')->where('user_id', $user->id)->first();
            if (!$artesano) {
                return response()->json(['success' => false, 'message' => 'Artesano no encontrado.'], 404);
            }
            $artesanoId = $artesano->id;

            $totalProductos = DB::table('productos')->where('artesano_id', $artesanoId)->count();
            $totalPedidos = DB::table('pedidos')->where('artesano_id', $artesanoId)->where('estado', 'pendiente')->count();
            $ventasMes = DB::table('pedidos')
                ->where('artesano_id', $artesanoId)
                ->whereIn('estado', ['enviado', 'entregado'])
                ->whereMonth('fecha_pedido', now()->month)
                ->whereYear('fecha_pedido', now()->year)
                ->sum('total');
            $totalVisitas = DB::table('visitas_producto as vp')
                ->join('productos as p', 'vp.producto_id', '=', 'p.id')
                ->where('p.artesano_id', $artesanoId)
                ->count();

            $estadisticas = [
                'productos' => $totalProductos,
                'pedidos' => $totalPedidos,
                'ventas' => number_format($ventasMes, 2),
                'visitas' => $totalVisitas
            ];
            
            return response()->json([
                'success' => true,
                'estadisticas' => $estadisticas
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Obtiene los 5 pedidos más recientes para el artesano autenticado.
     */
    public function getPedidosRecientes(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
            }
            $artesano = DB::table('artesanos')->where('user_id', $user->id)->first();
            if (!$artesano) {
                return response()->json(['success' => false, 'message' => 'Artesano no encontrado.'], 404);
            }
            $artesanoId = $artesano->id;

            $pedidos = DB::table('pedidos')
                ->where('artesano_id', $artesanoId)
                ->select('id', 'cliente_nombre', 'fecha_pedido', 'cantidad_productos', 'total', 'estado')
                ->orderBy('fecha_pedido', 'desc')
                ->limit(5)
                ->get();
            
            return response()->json([
                'success' => true,
                'pedidos' => $pedidos
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener pedidos recientes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene la información completa del artesano autenticado.
     */
    public function getMiInformacion(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
            }

            $artesano = DB::table('artesanos')->where('user_id', $user->id)->first();

            if (!$artesano) {
                return response()->json(['success' => false, 'message' => 'No se encontraron datos de artesano para este usuario.'], 404);
            }

            return response()->json(['success' => true, 'artesano' => $artesano]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la información del artesano: ' . $e->getMessage()
            ], 500);
        }
    }
}
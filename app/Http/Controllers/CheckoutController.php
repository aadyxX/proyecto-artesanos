<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Artesano;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class CheckoutController extends Controller
{
    public function index()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token inválido o expirado'], 401);
        }

        $cliente = Cliente::where('user_id', $user->id)->first();

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        // Obtener items del carrito con información del artesano
        $carritoItems = DB::select("
            SELECT
                cp.id AS carrito_id,
                p.id AS producto_id,
                p.nombre AS nombre_producto,
                p.precio,
                p.stock,
                cp.cantidad,
                (p.precio * cp.cantidad) AS subtotal_item,
                a.id AS artesano_id,
                a.nombre AS artesano_nombre,
                a.apellidos AS artesano_apellidos,
                ip.ruta_imagen
            FROM
                users u
            JOIN
                clientes c ON u.id = c.user_id
            JOIN
                carrito_productos cp ON c.id = cp.cliente_id
            JOIN
                productos p ON cp.producto_id = p.id
            JOIN
                artesanos a ON p.artesano_id = a.id
            LEFT JOIN
                imagenes_producto ip ON p.id = ip.producto_id AND ip.es_principal = 1
            WHERE
                u.id = ?
        ", [$user->id]);

        if (empty($carritoItems)) {
            return response()->json(['message' => 'El carrito está vacío'], 400);
        }

        // Calcular totales
        $subtotal = 0;
        $formattedItems = [];

        foreach ($carritoItems as $item) {
            $subtotal += $item->subtotal_item;
            $imagenUrl = $item->ruta_imagen ? '/storage/' . trim($item->ruta_imagen) : '/img/default-product.jpg';

            $formattedItems[] = [
                'id' => $item->carrito_id,
                'cantidad' => $item->cantidad,
                'subtotal' => $item->subtotal_item,
                'producto' => [
                    'id' => $item->producto_id,
                    'nombre' => $item->nombre_producto,
                    'precio' => $item->precio,
                    'stock' => $item->stock,
                    'imagen_url' => $imagenUrl
                ],
                'artesano' => [
                    'id' => $item->artesano_id,
                    'nombre' => $item->artesano_nombre . ' ' . $item->artesano_apellidos
                ]
            ];
        }

        $iva_rate = 0.16;
        $iva_amount = $subtotal * $iva_rate;
        $shipping_original = 99.99;
        $shipping_actual = $subtotal > 999 ? 0.00 : $shipping_original;
        $total = $subtotal + $iva_amount + $shipping_actual;

        return response()->json([
            'cliente' => [
                'nombre' => $cliente->nombre,
                'apellidos' => $cliente->apellidos,
                'telefono' => $cliente->telefono,
                'direccion' => $cliente->direccion,
                'ciudad' => $cliente->ciudad,
                'estado' => $cliente->estado,
                'codigo_postal' => $cliente->codigo_postal
            ],
            'items' => $formattedItems,
            'subtotal' => $subtotal,
            'iva' => $iva_amount,
            'shipping_original' => $shipping_original,
            'shipping_actual' => $shipping_actual,
            'total' => $total
        ]);
    }

    public function store(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token inválido o expirado'], 401);
        }

        $cliente = Cliente::where('user_id', $user->id)->first();

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'metodo_pago' => 'required|in:tarjeta,oxxo,paypal',
            'datos_envio' => 'required|array',
            'datos_envio.nombre' => 'required|string|max:100',
            'datos_envio.apellidos' => 'required|string|max:100',
            'datos_envio.telefono' => 'required|string|max:20',
            'datos_envio.direccion' => 'required|string|max:255',
            'datos_envio.ciudad' => 'required|string|max:100',
            'datos_envio.estado' => 'required|string|max:100',
            'datos_envio.codigo_postal' => 'required|string|max:10'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        // Obtener items del carrito
        $carritoItems = DB::select("
            SELECT
                cp.id AS carrito_id,
                p.id AS producto_id,
                p.nombre AS nombre_producto,
                p.precio,
                p.stock,
                cp.cantidad,
                (p.precio * cp.cantidad) AS subtotal_item,
                a.id AS artesano_id,
                a.nombre AS artesano_nombre,
                a.apellidos AS artesano_apellidos
            FROM
                users u
            JOIN
                clientes c ON u.id = c.user_id
            JOIN
                carrito_productos cp ON c.id = cp.cliente_id
            JOIN
                productos p ON cp.producto_id = p.id
            JOIN
                artesanos a ON p.artesano_id = a.id
            WHERE
                u.id = ?
        ", [$user->id]);

        if (empty($carritoItems)) {
            return response()->json(['message' => 'El carrito está vacío'], 400);
        }

        // Verificar stock
        foreach ($carritoItems as $item) {
            if ($item->cantidad > $item->stock) {
                return response()->json([
                    'message' => "Stock insuficiente para el producto: {$item->nombre_producto}",
                    'stock_disponible' => $item->stock
                ], 400);
            }
        }

        // Agrupar por artesano
        $pedidosPorArtesano = [];
        foreach ($carritoItems as $item) {
            $artesanoId = $item->artesano_id;
            if (!isset($pedidosPorArtesano[$artesanoId])) {
                $pedidosPorArtesano[$artesanoId] = [
                    'artesano_id' => $artesanoId,
                    'items' => [],
                    'total' => 0
                ];
            }
            $pedidosPorArtesano[$artesanoId]['items'][] = $item;
            $pedidosPorArtesano[$artesanoId]['total'] += $item->subtotal_item;
        }

        DB::beginTransaction();

        try {
            $pedidosCreados = [];

            foreach ($pedidosPorArtesano as $pedidoData) {
                // Crear pedido
                $pedidoId = DB::table('pedidos')->insertGetId([
                    'artesano_id' => $pedidoData['artesano_id'],
                    'cliente_nombre' => $request->datos_envio['nombre'] . ' ' . $request->datos_envio['apellidos'],
                    'cliente_email' => $user->email,
                    'cliente_telefono' => $request->datos_envio['telefono'],
                    'direccion_envio' => $request->datos_envio['direccion'] . ', ' . $request->datos_envio['ciudad'] . ', ' . $request->datos_envio['estado'] . ' ' . $request->datos_envio['codigo_postal'],
                    'cantidad_productos' => count($pedidoData['items']),
                    'total' => $pedidoData['total'],
                    'cliente_id' => $cliente->id
                ]);

                // Crear detalles del pedido
                foreach ($pedidoData['items'] as $item) {
                    DB::table('pedidos_detalle')->insert([
                        'pedido_id' => $pedidoId,
                        'producto_id' => $item->producto_id,
                        'cantidad' => $item->cantidad,
                        'precio' => $item->precio,
                        'subtotal' => $item->subtotal_item
                    ]);

                    // Descontar stock
                    DB::table('productos')
                        ->where('id', $item->producto_id)
                        ->decrement('stock', $item->cantidad);
                }

                $pedidosCreados[] = $pedidoId;
            }

            // Limpiar carrito
            DB::table('carrito_productos')->where('cliente_id', $cliente->id)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Compra realizada exitosamente',
                'pedidos' => $pedidosCreados,
                'metodo_pago' => $request->metodo_pago
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Error al procesar la compra: ' . $e->getMessage()], 500);
        }
    }
}

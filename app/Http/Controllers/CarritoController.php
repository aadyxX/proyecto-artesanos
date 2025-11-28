<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CarritoProducto;
use App\Models\Cliente;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class CarritoController extends Controller
{
    public function __construct()
    {
        // El middleware se aplica en las rutas, no aquí
    }

    public function index()
    {
        try {
            if (!$user = JWTAuth::parseToken()->authenticate()) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token inválido o expirado'], 401);
        }

        $cliente = Cliente::where('user_id', $user->id)->first();

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $carritoItems = DB::select("
            SELECT
                cp.id AS carrito_id,
                p.id AS producto_id,
                p.nombre AS nombre_producto,
                p.precio,
                p.stock,
                cp.cantidad,
                (p.precio * cp.cantidad) AS subtotal_item,
                ip.ruta_imagen
            FROM
                users u
            JOIN
                clientes c ON u.id = c.user_id
            JOIN
                carrito_productos cp ON c.id = cp.cliente_id
            JOIN
                productos p ON cp.producto_id = p.id
            LEFT JOIN
                imagenes_producto ip ON p.id = ip.producto_id AND ip.es_principal = 1
            WHERE
                u.id = ?
        ", [$user->id]);

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
                ]
            ];
        }

        $iva_rate = 0.16;
        $iva_amount = $subtotal * $iva_rate;
        $shipping_original = 99.99;
        $shipping_actual = $subtotal > 999 ? 0.00 : $shipping_original;
        $total = $subtotal + $iva_amount + $shipping_actual;

        return response()->json([
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
        $user = JWTAuth::parseToken()->authenticate();
        $cliente = Cliente::where('user_id', $user->id)->first();

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|integer|min:1',
        ]);

        $producto = DB::table('productos')->where('id', $request->producto_id)->first();

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($request->cantidad > $producto->stock) {
            return response()->json([
                'message' => 'Cantidad solicitada excede el stock disponible',
                'stock_disponible' => $producto->stock
            ], 400);
        }

        $item = CarritoProducto::updateOrCreate(
            ['cliente_id' => $cliente->id, 'producto_id' => $request->producto_id],
            ['cantidad' => $request->cantidad]
        );

        return response()->json($item, 201);
    }

    public function destroy($id)
    {
        $user = JWTAuth::parseToken()->authenticate();
        $cliente = Cliente::where('user_id', $user->id)->first();

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $item = CarritoProducto::where('id', $id)->where('cliente_id', $cliente->id)->first();

        if ($item) {
            $item->delete();
            return response()->json(['message' => 'Producto eliminado del carrito']);
        }

        return response()->json(['message' => 'Producto no encontrado en el carrito'], 404);
    }
}

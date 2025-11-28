<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AfiliacionController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ArtesanoController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\UserJWTController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\ScmController;
use App\Http\Controllers\ErpController;
use App\Http\Controllers\ResenaController;
use App\Http\Controllers\CheckoutController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/afiliacion', [AfiliacionController::class, 'store']);

//usuarios
Route::group(['prefix' => 'usuarios-jwt'], function () {
    // Rutas publicas
    Route::post('/register', [UserJWTController::class, 'register']);
    Route::post('/login', [UserJWTController::class, 'login']);

    // Rutas protegidas con JWT
    Route::group(['middleware' => 'auth:api'], function () {
        Route::get('/listar', [UserJWTController::class, 'listar']);
        Route::get('/refresh', [UserJWTController::class, 'refresh']);
        Route::get('/logout', [UserJWTController::class, 'logout']);
        Route::get('/miUsuario', [UserJWTController::class, 'miUsuario']);
        Route::put('/editarNombre', [UserJWTController::class, 'editarNombre']);

        // Rutas para el carrito
        Route::get('/carrito', [CarritoController::class, 'index']);
        Route::post('/carrito', [CarritoController::class, 'store']);
        Route::delete('/carrito/{id}', [CarritoController::class, 'destroy']);

        // Rutas para checkout
        Route::get('/checkout', [CheckoutController::class, 'index']);
        Route::post('/checkout', [CheckoutController::class, 'store']);
    });
});

// Rutas específicas para el panel de artesanos
Route::get('/panel/mis-datos', [ArtesanoController::class, 'getMiInformacion']);
Route::get('/panel/estadisticas', [ArtesanoController::class, 'getDashboardEstadisticas']);
Route::get('/panel/pedidos-recientes', [ArtesanoController::class, 'getPedidosRecientes']);

Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/{id}', [ProductoController::class, 'show']);
Route::post('/productos', [ProductoController::class, 'store']);
Route::post('/productos/{id}', [ProductoController::class, 'update']);
Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);
Route::get('/productos/{id}/resenas', [ResenaController::class, 'show']);
Route::get('/productos/{id}/similares', [ProductoController::class, 'getSimilarProducts']);

Route::get('/categorias', [ProductoController::class, 'getCategorias']);

// metodos para categorias
Route::get('/categorias/{id}/productos', [CategoriaController::class, 'productosPorCategoria']);
Route::get('/productos/categoria/{categoria}', [ProductoController::class, 'porCategoria']);
Route::get('/categoria/{slug}', [CategoriaController::class, 'obtenerCategoria']);

Route::get('/categorias/{id}', function ($id) {
    $categoria = DB::table('categorias')->where('id', $id)->first();

    if (!$categoria) {
        return response()->json(['success' => false, 'message' => 'Categoría no encontrada'], 404);
    }

    return response()->json(['success' => true, 'categoria' => $categoria]);
});

Route::get('/categoriaas', [CategoriaController::class, 'categoriasConProductos']);

Route::get('/artesano', [ArtesanoController::class, 'getDatosArtesano']);

Route::get('/dashboard/estadisticas', [ArtesanoController::class, 'getDashboardEstadisticas']);
Route::get('/pedidos/recientes', [ArtesanoController::class, 'getPedidosRecientes']);

// Rutas para el Dashboard CRM
Route::prefix('crm')->group(function () {
    Route::get('/top-selling-products', [CrmController::class, 'getTopSellingProducts']);
    Route::get('/top-clients', [CrmController::class, 'getTopClients']);
    Route::get('/top-products-by-clients', [CrmController::class, 'getTopProductsByTopClients']);
});

// Rutas para el Dashboard SCM
Route::prefix('scm')->group(function () {
    Route::get('/pedidos', [ScmController::class, 'getPedidos']);
    Route::get('/seguimiento-pedido/{id}', [ScmController::class, 'getSeguimientoPedido']);
    Route::get('/inventario', [ScmController::class, 'getInventario']);
    Route::get('/devoluciones', [ScmController::class, 'getDevoluciones']);
});

// Rutas para el Dashboard ERP
Route::prefix('erp')->group(function () {
    Route::get('/impuestos-comisiones', [ErpController::class, 'getImpuestosComisiones']);
    Route::get('/bajo-stock', [ErpController::class, 'getBajoStock']);
    Route::get('/ventas-artesano', [ErpController::class, 'getVentasPorArtesano']);
    Route::get('/ventas-categoria', [ErpController::class, 'getVentasPorCategoria']);
Route::get('/mejores-resenas', [ErpController::class, 'getMejoresResenas']);
});

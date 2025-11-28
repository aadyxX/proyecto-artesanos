<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Validation\ValidationException;

class UserJWTController extends Controller
{

    public function register(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'nombre' => 'required|string|max:100',
                'apellidos' => 'required|string|max:100',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'telefono' => 'required|string|max:20',
                'direccion' => 'required|string|max:255',
                'ciudad' => 'required|string|max:100',
                'estado' => 'required|string|max:100',
                'codigo_postal' => 'required|string|max:10',
            ]);

            $usuario = DB::transaction(function () use ($validatedData) {
                $usuario = User::create([
                    'email' => $validatedData['email'],
                    'password' => Hash::make($validatedData['password']),
                    'tipo_usuario' => 'cliente',
                ]);

                Cliente::create([
                    'user_id' => $usuario->id,
                    'nombre' => $validatedData['nombre'],
                    'apellidos' => $validatedData['apellidos'],
                    'telefono' => $validatedData['telefono'],
                    'direccion' => $validatedData['direccion'],
                    'ciudad' => $validatedData['ciudad'],
                    'estado' => $validatedData['estado'],
                    'codigo_postal' => $validatedData['codigo_postal'],
                ]);

                return $usuario;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario registrado exitosamente',
                'usuario' => $usuario,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if (!$token = Auth::guard('api')->attempt($request->only('email', 'password'))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas',
                ], 401);
            }

            $user = Auth::guard('api')->user();

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario autenticado exitosamente',
                'user' => $user,
                'access_token' => $token,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al autenticar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function listar()
    {
        try {
            $usuarios = User::all();
            return response()->json([
                'status' => 'success',
                'message' => 'Registros de la tabla users',
                'usuarios' => $usuarios,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al listar registros de la tabla users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Rutas protegidas con JWT
    public function refresh()
    {
        try {
            // if (!Auth::guard('api')->check()) {
            //     return response()->json([
            //         'status' => 'error',
            //         'message' => 'Usuario no autenticado',
            //     ], 401);
            // }
            $newToken = Auth::guard('api')->refresh();
            return response()->json([
                'status' => 'success',
                'message' => 'Token actualizado exitosamente',
                'token' => $newToken,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar token',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout()
    {
        try {
            // if (!Auth::guard('api')->check()) {
            //     return response()->json([
            //         'status' => 'error',
            //         'message' => 'Usuario no autenticado',
            //     ], 401);
            // }
            Auth::guard('api')->logout();
            return response()->json([
                'status' => 'success',
                'message' => 'Usuario desautenticado exitosamente',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al desautenticar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function miUsuario()
    {
        try {
            $usuario = Auth::guard('api')->user();

            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no autenticado',
                ], 401);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Datos del usuario',
                'user' => $usuario
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // public function editarNombre(Request $request)
    // {
    //     try {
    //         $usuario = Auth::guard('api')->user();

    //         // if (!$usuario) {
    //         //     return response()->json([
    //         //         'status' => 'error',
    //         //         'message' => 'Usuario no autenticado',
    //         //     ], 401);
    //         // }

    //         $request->validate([
    //             'name' => 'required|string|max:255',
    //         ]);

    //         $usuario->name = $request->name;
    //         $usuario->save();

    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'Nombre de usuario actualizado exitosamente',
    //             'usuario' => $usuario,
    //         ]);
    //     } catch (Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Error al eliminar usuario',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

}

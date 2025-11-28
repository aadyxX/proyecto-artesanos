<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AfiliacionController extends Controller
{
    public function index()
    {
        return view('afiliacion');
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'required|email|max:150',
            'telefono' => 'required|string|max:20',
            'negocio' => 'required|string|max:150',
            'descripcion' => 'required|string|max:500',
            'region' => 'required|string|max:100',
            'especialidad' => 'required|string|max:50',
            'mensaje' => 'nullable|string|max:500',
            'terminos' => 'required|accepted'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor, verifica los datos ingresados.',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $id = DB::insert('INSERT INTO solicitudes_afiliacion (
                nombre, 
                apellidos, 
                email, 
                telefono, 
                nombre_negocio, 
                descripcion_negocio, 
                region, 
                especialidad, 
                mensaje_adicional, 
                fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())', [
                $request->nombre,
                $request->apellidos,
                $request->email,
                $request->telefono,
                $request->negocio,
                $request->descripcion,
                $request->region,
                $request->especialidad,
                $request->mensaje
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Solicitud enviada correctamente'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la solicitud: ' . $e->getMessage()
            ], 500);
        }
    }
    









    
    // public function aprobarSolicitud($id)
    // {
    //     try {
    //         $solicitud = DB::selectOne("
    //             SELECT * FROM solicitudes_afiliacion WHERE id = ? AND estado != 'aprobado'
    //         ", [$id]);
            
    //         if (!$solicitud) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Solicitud no encontrada o ya aprobada'
    //             ], 404);
    //         }
            
    //         DB::beginTransaction();
            
    //         DB::update("
    //             UPDATE solicitudes_afiliacion 
    //             SET estado = 'aprobado', fecha_edicion = NOW() 
    //             WHERE id = ?
    //         ", [$id]);
            
    //         $artesanoId = DB::table('artesanos')->insertGetId([
    //             'solicitud_id' => $id,
    //             'nombre' => $solicitud->nombre,
    //             'apellidos' => $solicitud->apellidos,
    //             'email' => $solicitud->email,
    //             'telefono' => $solicitud->telefono,
    //             'nombre_negocio' => $solicitud->nombre_negocio,
    //             'descripcion_negocio' => $solicitud->descripcion_negocio,
    //             'region' => $solicitud->region,
    //             'especialidad' => $solicitud->especialidad,
    //             'estado' => 'activo',
    //             'fecha_creacion' => now(),
    //             'fecha_edicion' => now()
    //         ]);
            
    //         DB::commit();
            
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Solicitud aprobada correctamente',
    //             'artesano_id' => $artesanoId
    //         ]);
            
    //     } catch (\Exception $e) {
    //         DB::rollBack();
            
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error al aprobar la solicitud: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }
    
    // public function rechazarSolicitud($id, Request $request)
    // {
    //     try {
    //         $solicitud = DB::selectOne("
    //             SELECT * FROM solicitudes_afiliacion WHERE id = ? AND estado != 'rechazado'
    //         ", [$id]);
            
    //         if (!$solicitud) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Solicitud no encontrada o ya rechazada'
    //             ], 404);
    //         }
            
    //         DB::update("
    //             UPDATE solicitudes_afiliacion 
    //             SET estado = 'rechazado', fecha_edicion = NOW() 
    //             WHERE id = ?
    //         ", [$id]);
            
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Solicitud rechazada correctamente'
    //         ]);
            
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error al rechazar la solicitud: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }
}

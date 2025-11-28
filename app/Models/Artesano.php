<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artesano extends Model
{
    use HasFactory;

    protected $table = 'artesanos';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'solicitud_id',
        'nombre',
        'apellidos',
        'telefono',
        'nombre_negocio',
        'descripcion_negocio',
        'region',
        'especialidad',
        'foto_perfil',
        'estado',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

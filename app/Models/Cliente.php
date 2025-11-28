<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'clientes';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'nombre',
        'apellidos',
        'telefono',
        'direccion',
        'ciudad',
        'estado',
        'codigo_postal',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

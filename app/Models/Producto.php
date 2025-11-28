<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';

    protected $fillable = [
        'artesano_id',
        'categoria_id',
        'nombre',
        'descripcion',
        'precio',
        'stock',
        'destacado',
        'estado',
    ];

    public function artesano()
    {
        return $this->belongsTo(Artesano::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function imagenes()
    {
        return $this->hasMany(ImagenProducto::class);
    }

    public function imagenPrincipal()
    {
        return $this->hasOne(ImagenProducto::class)->where('es_principal', 1);
    }
}

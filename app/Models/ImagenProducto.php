<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImagenProducto extends Model
{
    use HasFactory;

    protected $table = 'imagenes_producto';

    protected $fillable = [
        'producto_id',
        'ruta_imagen',
        'es_principal',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/YYYY_MM_DD_HHMMSS_create_productos_table.php

public function up(): void
{
    Schema::create('productos', function (Blueprint $table) {
        $table->id(); // Esto crea la columna 'id' que 'carritos' necesita
        $table->string('nombre');
        $table->text('descripcion');
        $table->decimal('precio', 8, 2);
        $table->integer('stock');
        // Asegúrate de que esta llave foránea apunte a una tabla 'artesanos' que ya exista
        // Si la tabla 'artesanos' no existe, necesitarás una migración para ella también.
        $table->foreignId('artesano_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('categoria_id')->constrained('categorias')->onDelete('cascade'); // Asumo que tienes una tabla 'categorias'
        $table->string('imagen_url')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};

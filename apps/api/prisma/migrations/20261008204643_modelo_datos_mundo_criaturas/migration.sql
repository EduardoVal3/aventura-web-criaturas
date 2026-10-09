-- CreateTable
CREATE TABLE "personaje" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monedas" INTEGER NOT NULL DEFAULT 100,
    "ubicacion_actual_id" TEXT NOT NULL DEFAULT 'LOC-01',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zona" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "es_segura" BOOLEAN NOT NULL DEFAULT false,
    "nivel_minimo" INTEGER,
    "nivel_maximo" INTEGER,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conexion_zona" (
    "id" TEXT NOT NULL,
    "zona_origen_id" TEXT NOT NULL,
    "zona_destino_id" TEXT NOT NULL,

    CONSTRAINT "conexion_zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_zona" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,

    CONSTRAINT "evento_zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aparicion_zona" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "nivel_minimo" INTEGER NOT NULL,
    "nivel_maximo" INTEGER NOT NULL,

    CONSTRAINT "aparicion_zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especie" (
    "id" TEXT NOT NULL,
    "id_externo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "challenge_rating" DOUBLE PRECISION NOT NULL,
    "hp_base" INTEGER NOT NULL,
    "ataque_base" INTEGER NOT NULL,
    "defensa_base" INTEGER NOT NULL,
    "velocidad_base" INTEGER NOT NULL,
    "tasa_captura" DOUBLE PRECISION NOT NULL,
    "es_especial" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,

    CONSTRAINT "especie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento" (
    "id" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_accion" TEXT NOT NULL,
    "poder" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criatura" (
    "id" TEXT NOT NULL,
    "personaje_id" TEXT,
    "especie_id" TEXT NOT NULL,
    "apodo" TEXT,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "experiencia" INTEGER NOT NULL DEFAULT 0,
    "hp_actual" INTEGER NOT NULL,
    "hp_maximo" INTEGER NOT NULL,
    "ataque" INTEGER NOT NULL,
    "defensa" INTEGER NOT NULL,
    "velocidad" INTEGER NOT NULL,
    "en_equipo" BOOLEAN NOT NULL DEFAULT false,
    "orden_equipo" INTEGER,
    "fecha_captura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objeto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "precio_compra" INTEGER NOT NULL,
    "precio_venta" INTEGER NOT NULL,
    "efecto_valor" INTEGER NOT NULL,

    CONSTRAINT "objeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_personaje" (
    "id" TEXT NOT NULL,
    "personaje_id" TEXT NOT NULL,
    "objeto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventario_personaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuentro" (
    "id" TEXT NOT NULL,
    "personaje_id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "criatura_rival_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_CURSO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),

    CONSTRAINT "encuentro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combate" (
    "id" TEXT NOT NULL,
    "encuentro_id" TEXT NOT NULL,
    "turno" INTEGER NOT NULL,
    "es_turno_jugador" BOOLEAN NOT NULL,
    "accion_ultima" TEXT,
    "detalle_json" JSONB,

    CONSTRAINT "combate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zona_desbloqueada" (
    "id" TEXT NOT NULL,
    "personaje_id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "fecha_desbloqueo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zona_desbloqueada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial" (
    "id" TEXT NOT NULL,
    "personaje_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "datos_json" JSONB,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personaje_usuario_id_key" ON "personaje"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "conexion_zona_zona_origen_id_zona_destino_id_key" ON "conexion_zona"("zona_origen_id", "zona_destino_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_zona_zona_id_tipo_key" ON "evento_zona"("zona_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "aparicion_zona_zona_id_especie_id_key" ON "aparicion_zona"("zona_id", "especie_id");

-- CreateIndex
CREATE UNIQUE INDEX "especie_id_externo_key" ON "especie"("id_externo");

-- CreateIndex
CREATE UNIQUE INDEX "especie_slug_key" ON "especie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "objeto_codigo_key" ON "objeto"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_personaje_personaje_id_objeto_id_key" ON "inventario_personaje"("personaje_id", "objeto_id");

-- CreateIndex
CREATE UNIQUE INDEX "zona_desbloqueada_personaje_id_zona_id_key" ON "zona_desbloqueada"("personaje_id", "zona_id");

-- AddForeignKey
ALTER TABLE "personaje" ADD CONSTRAINT "personaje_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personaje" ADD CONSTRAINT "personaje_ubicacion_actual_id_fkey" FOREIGN KEY ("ubicacion_actual_id") REFERENCES "zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conexion_zona" ADD CONSTRAINT "conexion_zona_zona_origen_id_fkey" FOREIGN KEY ("zona_origen_id") REFERENCES "zona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conexion_zona" ADD CONSTRAINT "conexion_zona_zona_destino_id_fkey" FOREIGN KEY ("zona_destino_id") REFERENCES "zona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_zona" ADD CONSTRAINT "evento_zona_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aparicion_zona" ADD CONSTRAINT "aparicion_zona_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aparicion_zona" ADD CONSTRAINT "aparicion_zona_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criatura" ADD CONSTRAINT "criatura_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "personaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criatura" ADD CONSTRAINT "criatura_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_personaje" ADD CONSTRAINT "inventario_personaje_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "personaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_personaje" ADD CONSTRAINT "inventario_personaje_objeto_id_fkey" FOREIGN KEY ("objeto_id") REFERENCES "objeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuentro" ADD CONSTRAINT "encuentro_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "personaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuentro" ADD CONSTRAINT "encuentro_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuentro" ADD CONSTRAINT "encuentro_criatura_rival_id_fkey" FOREIGN KEY ("criatura_rival_id") REFERENCES "criatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combate" ADD CONSTRAINT "combate_encuentro_id_fkey" FOREIGN KEY ("encuentro_id") REFERENCES "encuentro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zona_desbloqueada" ADD CONSTRAINT "zona_desbloqueada_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "personaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zona_desbloqueada" ADD CONSTRAINT "zona_desbloqueada_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_personaje_id_fkey" FOREIGN KEY ("personaje_id") REFERENCES "personaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

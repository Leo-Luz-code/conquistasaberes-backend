-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "titulo_evento" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'Palestra',
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "modalidade" TEXT NOT NULL DEFAULT 'PRESENCIAL',
    "vagas" INTEGER,
    "capa_url" TEXT,
    "fk_secretaria" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_enrollments" (
    "id" TEXT NOT NULL,
    "fk_usuario" TEXT NOT NULL,
    "fk_evento" TEXT NOT NULL,
    "presenca_validada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_enrollments_fk_usuario_fk_evento_key" ON "event_enrollments"("fk_usuario", "fk_evento");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_fk_secretaria_fkey" FOREIGN KEY ("fk_secretaria") REFERENCES "secretarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_enrollments" ADD CONSTRAINT "event_enrollments_fk_usuario_fkey" FOREIGN KEY ("fk_usuario") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_enrollments" ADD CONSTRAINT "event_enrollments_fk_evento_fkey" FOREIGN KEY ("fk_evento") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

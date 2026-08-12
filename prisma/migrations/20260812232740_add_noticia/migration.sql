-- AlterTable
ALTER TABLE "secretarias" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cor_identificacao" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "responsavel_email" TEXT,
ADD COLUMN     "responsavel_nome" TEXT,
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "noticias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "conteudo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "capa_url" TEXT,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "autor_nome" TEXT,
    "fk_secretaria_alvo" TEXT,
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_fk_secretaria_alvo_fkey" FOREIGN KEY ("fk_secretaria_alvo") REFERENCES "secretarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

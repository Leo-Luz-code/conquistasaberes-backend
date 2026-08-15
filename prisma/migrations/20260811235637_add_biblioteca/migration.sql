-- CreateTable
CREATE TABLE "Biblioteca" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "documentoUrl" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Biblioteca_pkey" PRIMARY KEY ("id")
);

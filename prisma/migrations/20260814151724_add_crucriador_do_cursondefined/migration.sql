-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "fk_criador" TEXT;

-- AlterTable
ALTER TABLE "trilhas" ADD COLUMN     "fk_criador" TEXT;

-- AddForeignKey
ALTER TABLE "trilhas" ADD CONSTRAINT "trilhas_fk_criador_fkey" FOREIGN KEY ("fk_criador") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_fk_criador_fkey" FOREIGN KEY ("fk_criador") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

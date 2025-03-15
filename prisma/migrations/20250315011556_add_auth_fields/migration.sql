-- AlterTable
ALTER TABLE "User" ADD COLUMN "constituencyId" TEXT;
ALTER TABLE "User" ADD COLUMN "password" TEXT;
ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'user';

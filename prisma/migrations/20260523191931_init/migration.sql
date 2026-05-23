/*
  Warnings:

  - You are about to drop the column `UID_LEGAL_BRANCH` on the `DOCUMENT_TEMPLATE` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DOCUMENT_TEMPLATE" DROP CONSTRAINT "DOCUMENT_TEMPLATE_UID_LEGAL_BRANCH_fkey";

-- DropIndex
DROP INDEX "DOCUMENT_TEMPLATE_UID_LEGAL_BRANCH_idx";

-- AlterTable
ALTER TABLE "DOCUMENT_TEMPLATE" DROP COLUMN "UID_LEGAL_BRANCH";

-- CreateTable
CREATE TABLE "_TemplateBranches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TemplateBranches_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TemplateBranches_B_index" ON "_TemplateBranches"("B");

-- AddForeignKey
ALTER TABLE "_TemplateBranches" ADD CONSTRAINT "_TemplateBranches_A_fkey" FOREIGN KEY ("A") REFERENCES "DOCUMENT_TEMPLATE"("UID_DOCUMENT_TEMPLATE") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateBranches" ADD CONSTRAINT "_TemplateBranches_B_fkey" FOREIGN KEY ("B") REFERENCES "LEGAL_BRANCH"("UID_LEGAL_BRANCH") ON DELETE CASCADE ON UPDATE CASCADE;

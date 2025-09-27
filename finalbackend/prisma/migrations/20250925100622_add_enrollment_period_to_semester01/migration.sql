/*
  Warnings:

  - You are about to drop the column `createdAt` on the `semesters` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `semesters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `semesters` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `enrollmentEnd` DATETIME(3) NULL,
    ADD COLUMN `enrollmentStart` DATETIME(3) NULL;

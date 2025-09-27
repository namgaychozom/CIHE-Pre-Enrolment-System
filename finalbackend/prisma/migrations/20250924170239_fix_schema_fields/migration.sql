/*
  Warnings:

  - You are about to drop the column `academicYearyear` on the `semesters` table. All the data in the column will be lost.
  - Added the required column `academicYear` to the `semesters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `semesters` DROP COLUMN `academicYearyear`,
    ADD COLUMN `academicYear` INTEGER NOT NULL;

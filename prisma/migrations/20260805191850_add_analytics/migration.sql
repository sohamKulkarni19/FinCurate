-- AlterTable
ALTER TABLE "Scheme" ADD COLUMN     "alpha" DOUBLE PRECISION,
ADD COLUMN     "beta" DOUBLE PRECISION,
ADD COLUMN     "downsideCapture" DOUBLE PRECISION,
ADD COLUMN     "informationRatio" DOUBLE PRECISION,
ADD COLUMN     "return1Y" DOUBLE PRECISION,
ADD COLUMN     "return3M" DOUBLE PRECISION,
ADD COLUMN     "return3Y" DOUBLE PRECISION,
ADD COLUMN     "return5Y" DOUBLE PRECISION,
ADD COLUMN     "sharpeRatio" DOUBLE PRECISION,
ADD COLUMN     "sortinoRatio" DOUBLE PRECISION,
ADD COLUMN     "upsideCapture" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "BenchmarkObservation" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BenchmarkObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkObservation_date_key" ON "BenchmarkObservation"("date");

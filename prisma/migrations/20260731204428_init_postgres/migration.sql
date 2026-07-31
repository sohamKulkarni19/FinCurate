-- CreateTable
CREATE TABLE "Scheme" (
    "id" INTEGER NOT NULL,
    "schemeCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavObservation" (
    "id" SERIAL NOT NULL,
    "schemeId" INTEGER NOT NULL,
    "navDate" TIMESTAMP(3) NOT NULL,
    "nav" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NavObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_schemeCode_key" ON "Scheme"("schemeCode");

-- CreateIndex
CREATE UNIQUE INDEX "NavObservation_schemeId_navDate_key" ON "NavObservation"("schemeId", "navDate");

-- AddForeignKey
ALTER TABLE "NavObservation" ADD CONSTRAINT "NavObservation_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "niantic_site_cache" (
    "siteId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "meshPath" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niantic_site_cache_pkey" PRIMARY KEY ("siteId")
);

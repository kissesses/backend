-- CreateTable
CREATE TABLE "blocked_hwids" (
    "hwid" TEXT NOT NULL,
    "reason" TEXT,
    "blocked_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_hwids_pkey" PRIMARY KEY ("hwid")
);

-- CreateTable
CREATE TABLE "user_activity_events" (
    "id" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "metadata" JSONB,
    "request_ip" TEXT,
    "user_agent" TEXT,
    "node_uuid" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_events_uuid_key" ON "user_activity_events"("uuid");

-- CreateIndex
CREATE INDEX "user_activity_events_user_id_occurred_at_idx" ON "user_activity_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "user_activity_events_event_type_idx" ON "user_activity_events"("event_type");

-- CreateIndex
CREATE INDEX "user_activity_events_occurred_at_idx" ON "user_activity_events"("occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "user_activity_events" ADD CONSTRAINT "user_activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

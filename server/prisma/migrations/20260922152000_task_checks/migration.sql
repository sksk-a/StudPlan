ALTER TABLE "Task" ADD CONSTRAINT "Task_importance_check" CHECK ("importance" BETWEEN 1 AND 3);
ALTER TABLE "Task" ADD CONSTRAINT "Task_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 3);
ALTER TABLE "Task" ADD CONSTRAINT "Task_estimatedMinutes_check" CHECK ("estimatedMinutes" BETWEEN 1 AND 525600);
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedAt_check" CHECK (("status" = 'completed' AND "completedAt" IS NOT NULL) OR ("status" <> 'completed' AND "completedAt" IS NULL));

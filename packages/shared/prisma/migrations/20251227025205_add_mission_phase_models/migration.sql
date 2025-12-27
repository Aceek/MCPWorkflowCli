-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT NOT NULL,
    "scope" TEXT,
    "constraints" TEXT,
    "profile" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentPhase" INTEGER NOT NULL DEFAULT 0,
    "totalPhases" INTEGER NOT NULL DEFAULT 1,
    "missionPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Phase_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "phaseId" TEXT,
    "callerType" TEXT,
    "agentName" TEXT,
    "agentPrompt" TEXT,
    "areas" TEXT NOT NULL DEFAULT '[]',
    "snapshotId" TEXT,
    "snapshotType" TEXT,
    "snapshotData" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "summary" TEXT,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "limitations" TEXT NOT NULL DEFAULT '[]',
    "manualReviewNeeded" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewReason" TEXT,
    "nextSteps" TEXT NOT NULL DEFAULT '[]',
    "packagesAdded" TEXT NOT NULL DEFAULT '[]',
    "packagesRemoved" TEXT NOT NULL DEFAULT '[]',
    "commandsExecuted" TEXT NOT NULL DEFAULT '[]',
    "testsStatus" TEXT,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "filesAdded" TEXT NOT NULL DEFAULT '[]',
    "filesModified" TEXT NOT NULL DEFAULT '[]',
    "filesDeleted" TEXT NOT NULL DEFAULT '[]',
    "scopeMatch" BOOLEAN,
    "unexpectedFiles" TEXT NOT NULL DEFAULT '[]',
    "warnings" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Task_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("achievements", "areas", "commandsExecuted", "completedAt", "durationMs", "filesAdded", "filesDeleted", "filesModified", "goal", "id", "limitations", "manualReviewNeeded", "manualReviewReason", "name", "nextSteps", "packagesAdded", "packagesRemoved", "parentTaskId", "scopeMatch", "snapshotData", "snapshotId", "snapshotType", "startedAt", "status", "summary", "testsStatus", "tokensInput", "tokensOutput", "unexpectedFiles", "warnings", "workflowId") SELECT "achievements", "areas", "commandsExecuted", "completedAt", "durationMs", "filesAdded", "filesDeleted", "filesModified", "goal", "id", "limitations", "manualReviewNeeded", "manualReviewReason", "name", "nextSteps", "packagesAdded", "packagesRemoved", "parentTaskId", "scopeMatch", "snapshotData", "snapshotId", "snapshotType", "startedAt", "status", "summary", "testsStatus", "tokensInput", "tokensOutput", "unexpectedFiles", "warnings", "workflowId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_workflowId_idx" ON "Task"("workflowId");
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_startedAt_idx" ON "Task"("startedAt");
CREATE INDEX "Task_phaseId_idx" ON "Task"("phaseId");
CREATE INDEX "Task_callerType_idx" ON "Task"("callerType");
CREATE INDEX "Task_agentName_idx" ON "Task"("agentName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");

-- CreateIndex
CREATE INDEX "Mission_createdAt_idx" ON "Mission"("createdAt");

-- CreateIndex
CREATE INDEX "Phase_missionId_idx" ON "Phase"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_missionId_number_key" ON "Phase"("missionId", "number");

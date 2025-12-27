-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan" TEXT,
    "objective" TEXT,
    "scope" TEXT,
    "constraints" TEXT,
    "profile" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentPhase" INTEGER NOT NULL DEFAULT 0,
    "totalPhases" INTEGER NOT NULL DEFAULT 1,
    "missionPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "totalDurationMs" INTEGER,
    "totalTokens" INTEGER
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Phase_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
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

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionsConsidered" TEXT NOT NULL DEFAULT '[]',
    "chosen" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "tradeOffs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "progress" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Milestone_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServerInfo" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "websocketPort" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processId" INTEGER
);

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "Workflow_createdAt_idx" ON "Workflow"("createdAt");

-- CreateIndex
CREATE INDEX "Phase_workflowId_idx" ON "Phase"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_workflowId_number_key" ON "Phase"("workflowId", "number");

-- CreateIndex
CREATE INDEX "Task_workflowId_idx" ON "Task"("workflowId");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_startedAt_idx" ON "Task"("startedAt");

-- CreateIndex
CREATE INDEX "Task_phaseId_idx" ON "Task"("phaseId");

-- CreateIndex
CREATE INDEX "Task_callerType_idx" ON "Task"("callerType");

-- CreateIndex
CREATE INDEX "Task_agentName_idx" ON "Task"("agentName");

-- CreateIndex
CREATE INDEX "Decision_taskId_idx" ON "Decision"("taskId");

-- CreateIndex
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");

-- CreateIndex
CREATE INDEX "Issue_taskId_idx" ON "Issue"("taskId");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- CreateIndex
CREATE INDEX "Milestone_taskId_idx" ON "Milestone"("taskId");

-- CreateIndex
CREATE INDEX "Milestone_createdAt_idx" ON "Milestone"("createdAt");


-- Drop existing tables to avoid conflict with new multi-user structure
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "WebhookAlert" CASCADE;
DROP TABLE IF EXISTS "Settings" CASCADE;
DROP TABLE IF EXISTS "Trade" CASCADE;
DROP TABLE IF EXISTS "DailyLog" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "tradeCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "session" TEXT NOT NULL,
    "challengePhase" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "setupTypes" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "tp1" DOUBLE PRECISION NOT NULL,
    "tp2" DOUBLE PRECISION NOT NULL,
    "tp3" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "exitReason" TEXT,
    "actualPnlPct" DOUBLE PRECISION,
    "riskPips" DOUBLE PRECISION,
    "rr1" DOUBLE PRECISION,
    "rr2" DOUBLE PRECISION,
    "rr3" DOUBLE PRECISION,
    "checklistScore" INTEGER NOT NULL,
    "checklistItems" TEXT NOT NULL,
    "preReasoning" TEXT NOT NULL,
    "postNotes" TEXT,
    "mistakes" TEXT,
    "partialClose" BOOLEAN NOT NULL DEFAULT false,
    "breakevenMoved" BOOLEAN NOT NULL DEFAULT false,
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "emotionBefore" TEXT NOT NULL,
    "emotionAfter" TEXT,
    "disciplineRating" INTEGER,
    "wouldRetake" TEXT,
    "revengeTradeFlag" BOOLEAN NOT NULL DEFAULT false,
    "fomoFlag" BOOLEAN NOT NULL DEFAULT false,
    "followedRules" BOOLEAN NOT NULL DEFAULT true,
    "brokenRule" TEXT,
    "pressureToTrade" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dailyLogId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mentalState" INTEGER NOT NULL,
    "physicalState" TEXT NOT NULL,
    "marketConfidence" INTEGER NOT NULL,
    "distractionLevel" TEXT NOT NULL,
    "sleepQuality" TEXT NOT NULL,
    "personalStress" BOOLEAN NOT NULL DEFAULT false,
    "stressDetails" TEXT,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "marketBias" TEXT,
    "goldBehaviour" TEXT,
    "cryptoBehaviour" TEXT,
    "keyNewsEvents" TEXT,
    "goodDayToTrade" INTEGER,
    "strategyRating" INTEGER,
    "setupsWorked" TEXT,
    "setupsFailed" TEXT,
    "sessionActivity" TEXT,
    "obQuality" INTEGER,
    "fvgReliability" INTEGER,
    "followedPlan" TEXT,
    "biggestMistake" TEXT,
    "biggestSuccess" TEXT,
    "whatDifferently" TEXT,
    "lessonLearned" TEXT,
    "keyLevels" TEXT,
    "expectedBias" TEXT,
    "scheduledNews" TEXT,
    "tomorrowPlan" TEXT,
    "tradingGoals" TEXT,
    "autoSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "accountSize" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "currentPhase" TEXT NOT NULL DEFAULT 'Phase 1',
    "riskPerTrade" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "maxTradesPerDay" INTEGER NOT NULL DEFAULT 2,
    "webhookUrl" TEXT,
    "screenshotPath" TEXT,
    "googleSheetId" TEXT,
    "notionApiKey" TEXT,
    "discordWebhook" TEXT,
    "telegramToken" TEXT,
    "telegramChatId" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookAlert" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION,
    "tp1" DOUBLE PRECISION,
    "tp2" DOUBLE PRECISION,
    "session" TEXT,
    "setup" TEXT,
    "rawPayload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "convertedTradeId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WebhookAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "tradeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_tradeCode_key" ON "Trade"("tradeCode");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_userId_key" ON "DailyLog"("date", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookAlert" ADD CONSTRAINT "WebhookAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

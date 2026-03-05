-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "openaiApiKey" TEXT,
    "anthropicApiKey" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "elevenlabsApiKey" TEXT,
    "elevenlabsVoiceId" TEXT,
    "elevenlabsModelId" TEXT NOT NULL DEFAULT 'eleven_multilingual_v2',
    "elevenlabsStability" REAL NOT NULL DEFAULT 0.5,
    "elevenlabsSimilarity" REAL NOT NULL DEFAULT 0.75,
    "podcastName" TEXT,
    "podcastDescription" TEXT,
    "podcastAuthor" TEXT,
    "podcastCoverUrl" TEXT,
    "podcastCategory" TEXT NOT NULL DEFAULT 'Technology',
    "podcastLanguage" TEXT NOT NULL DEFAULT 'en-us',
    "podcastExplicit" BOOLEAN NOT NULL DEFAULT false,
    "defaultPromptTemplate" TEXT,
    "targetScriptLength" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "episodeNumber" INTEGER,
    "script" TEXT,
    "summary" TEXT,
    "duration" INTEGER,
    "audioUrl" TEXT,
    "audioFileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "errorStep" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "durationMs" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PipelineLog_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_slug_key" ON "Episode"("slug");

-- CreateIndex
CREATE INDEX "Episode_userId_idx" ON "Episode"("userId");

-- CreateIndex
CREATE INDEX "Episode_status_idx" ON "Episode"("status");

-- CreateIndex
CREATE INDEX "PipelineLog_episodeId_idx" ON "PipelineLog"("episodeId");

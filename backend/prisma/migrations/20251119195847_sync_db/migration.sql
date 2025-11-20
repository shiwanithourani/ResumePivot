-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterResumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "expirationDate" DATETIME,
    CONSTRAINT "Certification_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certification" ("expirationDate", "id", "issueDate", "issuingOrganization", "masterResumeId", "name") SELECT "expirationDate", "id", "issueDate", "issuingOrganization", "masterResumeId", "name" FROM "Certification";
DROP TABLE "Certification";
ALTER TABLE "new_Certification" RENAME TO "Certification";
CREATE TABLE "new_CoverLetterVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoverLetterVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverLetterVersion_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CoverLetterVersion" ("content", "createdAt", "id", "jobDescriptionId", "updatedAt", "userId", "versionName") SELECT "content", "createdAt", "id", "jobDescriptionId", "updatedAt", "userId", "versionName" FROM "CoverLetterVersion";
DROP TABLE "CoverLetterVersion";
ALTER TABLE "new_CoverLetterVersion" RENAME TO "CoverLetterVersion";
CREATE TABLE "new_Education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterResumeId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    CONSTRAINT "Education_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Education" ("degree", "endDate", "fieldOfStudy", "id", "institution", "masterResumeId", "startDate") SELECT "degree", "endDate", "fieldOfStudy", "id", "institution", "masterResumeId", "startDate" FROM "Education";
DROP TABLE "Education";
ALTER TABLE "new_Education" RENAME TO "Education";
CREATE TABLE "new_JobDescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "extractedFunctionalRole" TEXT NOT NULL,
    "extractedIndustryDomain" TEXT NOT NULL,
    "userEditedRole" TEXT,
    "userEditedDomain" TEXT,
    "companyName" TEXT,
    "jobTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JobDescription" ("companyName", "createdAt", "extractedFunctionalRole", "extractedIndustryDomain", "id", "jobTitle", "originalText", "updatedAt", "userId") SELECT "companyName", "createdAt", "extractedFunctionalRole", "extractedIndustryDomain", "id", "jobTitle", "originalText", "updatedAt", "userId" FROM "JobDescription";
DROP TABLE "JobDescription";
ALTER TABLE "new_JobDescription" RENAME TO "JobDescription";
CREATE TABLE "new_MasterResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personalInfo" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MasterResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MasterResume" ("createdAt", "id", "personalInfo", "updatedAt", "userId") SELECT "createdAt", "id", "personalInfo", "updatedAt", "userId" FROM "MasterResume";
DROP TABLE "MasterResume";
ALTER TABLE "new_MasterResume" RENAME TO "MasterResume";
CREATE UNIQUE INDEX "MasterResume_userId_key" ON "MasterResume"("userId");
CREATE TABLE "new_ResumeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResumeVersion_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResumeVersion" ("content", "createdAt", "id", "jobDescriptionId", "summary", "tagline", "updatedAt", "userId", "versionName") SELECT "content", "createdAt", "id", "jobDescriptionId", "summary", "tagline", "updatedAt", "userId", "versionName" FROM "ResumeVersion";
DROP TABLE "ResumeVersion";
ALTER TABLE "new_ResumeVersion" RENAME TO "ResumeVersion";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "generationsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "updatedAt") SELECT "createdAt", "email", "id", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_WorkExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterResumeId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT NOT NULL,
    CONSTRAINT "WorkExperience_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkExperience" ("company", "description", "endDate", "id", "jobTitle", "location", "masterResumeId", "startDate") SELECT "company", "description", "endDate", "id", "jobTitle", "location", "masterResumeId", "startDate" FROM "WorkExperience";
DROP TABLE "WorkExperience";
ALTER TABLE "new_WorkExperience" RENAME TO "WorkExperience";
CREATE TABLE "new_WorkExperienceTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workExperienceId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "WorkExperienceTag_workExperienceId_fkey" FOREIGN KEY ("workExperienceId") REFERENCES "WorkExperience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkExperienceTag" ("id", "tag", "type", "workExperienceId") SELECT "id", "tag", "type", "workExperienceId" FROM "WorkExperienceTag";
DROP TABLE "WorkExperienceTag";
ALTER TABLE "new_WorkExperienceTag" RENAME TO "WorkExperienceTag";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

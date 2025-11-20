const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/applications/generate - Generate a new resume and cover letter
router.post('/generate', async (req, res) => {
  const { userId } = req.userData;
  const { jobDescriptionId, versionName, customTagline, customSummary, customCoverLetterContent } = req.body;

  try {
    // Subscription Check
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.subscriptionTier === 'FREE') {
      const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
      if (user.subscriptionStartDate < thirtyDaysAgo) {
        await prisma.user.update({
          where: { id: userId },
          data: { generationsThisMonth: 0, subscriptionStartDate: new Date() },
        });
        // Re-fetch user after reset
        user = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (user.generationsThisMonth >= 2) {
        return res.status(403).json({ error: 'Upgrade to Pro for unlimited generations.' });
      }
    }

    // 1. Fetch the Master Resume
    const masterResume = await prisma.masterResume.findUnique({
      where: { userId },
      include: {
        workExperiences: {
          include: {
            tags: true
          }
        },
        educations: true,
        certifications: true
      }
    });

    if (!masterResume) {
      return res.status(404).json({ error: 'Master resume not found.' });
    }

    // 2. Fetch the Job Description
    const jobDescription = await prisma.jobDescription.findUnique({
      where: { id: jobDescriptionId }
    });

    if (!jobDescription) {
      return res.status(404).json({ error: 'Job description not found.' });
    }

    // 3. Generate the tailored resume content (PRD Step 3)
    // Filters work experiences based on matching Functional Role or Industry Domain tags
const tailoredWorkExperiences = masterResume.workExperiences.filter(we =>
    we.tags.some(tag => {
        const lowerTag = tag.tag.toLowerCase();
        const lowerRole = jobDescription.extractedFunctionalRole.toLowerCase();
        const lowerDomain = jobDescription.extractedIndustryDomain.toLowerCase();
        // ✅ Bidirectional matching
        return lowerTag.includes(lowerRole) || lowerRole.includes(lowerTag) ||
               lowerTag.includes(lowerDomain) || lowerDomain.includes(lowerTag);
    })
);
    
    // Fallback: Use all work experiences if tailoring yields no results (to prevent an empty resume)
    const workExperiencesToUse = tailoredWorkExperiences.length > 0 
        ? tailoredWorkExperiences 
        : masterResume.workExperiences;

    const tailoredResumeContent = {
      personalInfo: masterResume.personalInfo,
      workExperiences: workExperiencesToUse,
      educations: masterResume.educations,
      certifications: masterResume.certifications
    };

    // 4. Create the new ResumeVersion (PRD Step 4)
    const resumeVersion = await prisma.resumeVersion.create({
      data: {
        userId,
        jobDescriptionId,
        versionName,
        tagline: customTagline || `Tailored for ${jobDescription.jobTitle}`,
        summary: customSummary || `A summary for ${jobDescription.jobTitle}`,
        content: tailoredResumeContent // JSON field
      }
    });

    // 5. Create the new CoverLetterVersion (PRD Step 4)
    const coverLetterVersion = await prisma.coverLetterVersion.create({
      data: {
        userId,
        jobDescriptionId,
versionName: `Cover Letter for ${versionName}`,
content: customCoverLetterContent || `Dear Hiring Manager,\n\nI am writing to express my interest in the ${jobDescription.jobTitle} position at ${jobDescription.companyName}, which I discovered through [Platform where you saw the ad]. With my extensive experience in [mention key skills or experiences relevant to the job], I am confident that I would be a valuable asset to your team.\n\nMy background in [mention your industry or domain] has prepared me to tackle the challenges of this role. I am particularly drawn to [mention something specific about the company or job that interests you].\n\nI have attached my resume for your review and welcome the opportunity to discuss how my skills and experience can benefit ${jobDescription.companyName}.\n\nThank you for your time and consideration.\n\nSincerely,\n${masterResume.personalInfo?.name || 'The Applicant'}`
}
});

    // Increment generation count
    await prisma.user.update({
      where: { id: userId },
      data: { generationsThisMonth: { increment: 1 } },
    });

    res.json({ resumeVersion, coverLetterVersion });

  } catch (error) {
    console.error("Detailed generation error:", error);
    res.status(500).json({ error: 'An error occurred while generating the application materials.', details: error.message });
    }
});

// GET /api/applications/versions - Get all resume and cover letter versions
router.get('/versions', async (req, res) => {
  const { userId } = req.userData;

  try {
    const resumeVersions = await prisma.resumeVersion.findMany({
      where: { userId }
    });
    const coverLetterVersions = await prisma.coverLetterVersion.findMany({
      where: { userId }
    });
    res.json({ resumeVersions, coverLetterVersions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching application versions.' });
  }
});

// DELETE /api/applications/resume/:id - Delete a resume version
router.delete('/resume/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { userId } = req.userData;
    const resumeVersion = await prisma.resumeVersion.findUnique({
      where: { id },
    });

    if (!resumeVersion || resumeVersion.userId !== userId) {
      return res.status(404).json({ error: 'Resume version not found or you do not have permission to delete it.' });
    }

    await prisma.resumeVersion.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the resume version.' });
  }
});

// DELETE /api/applications/cover-letter/:id - Delete a cover letter version
router.delete('/cover-letter/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { userId } = req.userData;
    const coverLetterVersion = await prisma.coverLetterVersion.findUnique({
      where: { id },
    });

    if (!coverLetterVersion || coverLetterVersion.userId !== userId) {
      return res.status(404).json({ error: 'Cover letter version not found or you do not have permission to delete it.' });
    }

    await prisma.coverLetterVersion.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the cover letter version.' });
  }
});

// PUT /api/applications/resume/:id - Update a resume version
router.put('/resume/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  const { content, tagline, summary } = req.body;

  try {
    const resumeVersion = await prisma.resumeVersion.findUnique({
      where: { id },
    });

    if (!resumeVersion || resumeVersion.userId !== userId) {
      return res.status(404).json({ error: 'Resume version not found or you do not have permission to edit it.' });
    }

    const updatedVersion = await prisma.resumeVersion.update({
      where: { id },
      data: {
        content,
        tagline,
        summary,
      },
    });
    res.json(updatedVersion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the resume version.' });
  }
});

// PUT /api/applications/cover-letter/:id - Update a cover letter version
router.put('/cover-letter/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  const { content } = req.body;

  try {
    const coverLetterVersion = await prisma.coverLetterVersion.findUnique({
      where: { id },
    });

    if (!coverLetterVersion || coverLetterVersion.userId !== userId) {
      return res.status(404).json({ error: 'Cover letter version not found or you do not have permission to edit it.' });
    }

    const updatedVersion = await prisma.coverLetterVersion.update({
      where: { id },
      data: {
        content,
      },
    });
    res.json(updatedVersion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the cover letter version.' });
  }
});

module.exports = router;
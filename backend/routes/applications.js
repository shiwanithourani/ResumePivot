const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/applications/generate - Generate a new resume and cover letter
router.post('/generate', async (req, res) => {
  let { userId } = req.userData;
  const {
    jobDescriptionId,
    versionName,
    customTagline,
    customSummary,
    customCoverLetterContent,
    coverLetterLength,
    coverLetterStyle
  } = req.body;

  try {
    // --- Subscription Check ---
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Reset FREE user generation count if 30 days passed
    if (user.subscriptionTier === 'FREE' && (!user.subscriptionStartDate || user.subscriptionStartDate < thirtyDaysAgo)) {
      user = await prisma.user.update({
        where: { id: userId },
        data: { generationsThisMonth: 0, subscriptionStartDate: new Date() },
      });
    }

    // Block FREE users exceeding monthly limit
    if (user.subscriptionTier === 'FREE' && user.generationsThisMonth >= 2) {
      return res.status(403).json({ error: 'Upgrade to Pro for unlimited generations.' });
    }

    // --- Fetch Master Resume with relations ---
    const masterResume = await prisma.masterResume.findUnique({
      where: { userId },
      include: {
        workExperiences: { include: { tags: true } },
        educations: true,
        certifications: true
      }
    });

    if (!masterResume) return res.status(404).json({ error: 'Master resume not found.' });

    // --- Fetch Job Description ---
    const jobDescription = await prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });
    if (!jobDescription) return res.status(404).json({ error: 'Job description not found.' });

    // --- Tailored Resume Content ---
    const tailoredWorkExperiences = masterResume.workExperiences.filter(we =>
      we.tags.some(tag => {
        const lowerTag = tag.tag.toLowerCase();
        const lowerRole = jobDescription.extractedFunctionalRole.toLowerCase();
        const lowerDomain = jobDescription.extractedIndustryDomain.toLowerCase();
        return lowerTag.includes(lowerRole) || lowerRole.includes(lowerTag) ||
               lowerTag.includes(lowerDomain) || lowerDomain.includes(lowerTag);
      })
    );

    const workExperiencesToUse = tailoredWorkExperiences.length > 0
      ? tailoredWorkExperiences
      : masterResume.workExperiences;

    const tailoredResumeContent = {
      personalInfo: masterResume.personalInfo,
      workExperiences: workExperiencesToUse,
      educations: masterResume.educations,
      certifications: masterResume.certifications
    };

    // --- Generate Cover Letter ---
    let coverLetterContent = customCoverLetterContent || '';
    if (!coverLetterContent) {
      const name = masterResume.personalInfo?.name || 'The Applicant';
      const role = jobDescription.jobTitle;
      const company = jobDescription.companyName;

      // Templates for different lengths and styles
      const templates = {
        short: {
          classic: `Dear Hiring Manager,\n\nI am interested in the ${role} role at ${company}. My experience makes me confident I can contribute effectively.\n\nSincerely,\n${name}`,
          modern: `Hello Team,\n\nExcited about the ${role} position at ${company}! My experience aligns perfectly with your needs.\n\nCheers,\n${name}`,
        },
        medium: {
          classic: `Dear Hiring Manager,\n\nI am writing to express my interest in the ${role} position at ${company}. My background in [industry/skills] equips me to add value immediately. I am particularly drawn to [company-specific point].\n\nLooking forward to discussing my candidacy.\n\nSincerely,\n${name}`,
          modern: `Hi ${company} Team,\n\nThrilled to apply for the ${role} role! I bring [skills/experience] and a passion for [company-specific point]. Would love to chat about how I can contribute.\n\nBest,\n${name}`,
        },
        long: {
          classic: `Dear Hiring Manager,\n\nI am writing to express my interest in the ${role} position at ${company}. Over the course of my career, I have developed [key skills/achievements] which make me a strong candidate for this role. My experience in [industry/domain] allows me to contribute effectively from day one. I am particularly drawn to [company initiative/product] and believe my background aligns perfectly with your needs.\n\nAttached is my resume for your review. I would welcome the opportunity to discuss how my expertise can benefit ${company}.\n\nThank you for your time and consideration.\n\nSincerely,\n${name}`,
          modern: `Hello ${company} Team,\n\nExcited to apply for the ${role} position! With experience in [skills/achievements], I’m ready to contribute to [company initiative/product]. My background in [industry/domain] aligns well with your goals, and I’m confident I can deliver immediate impact.\n\nPlease see my attached resume. Looking forward to connecting!\n\nCheers,\n${name}`,
        }
      };

      const len = ['short','medium','long'].includes(coverLetterLength) ? coverLetterLength : 'medium';
      const style = ['classic','modern'].includes(coverLetterStyle) ? coverLetterStyle : 'classic';

      coverLetterContent = templates[len][style];
    }

    // --- Save Resume and Cover Letter Versions ---
    const resumeVersion = await prisma.resumeVersion.create({
      data: {
        userId,
        jobDescriptionId,
        versionName,
        tagline: customTagline || `Tailored for ${jobDescription.jobTitle}`,
        summary: customSummary || `A summary for ${jobDescription.jobTitle}`,
        content: tailoredResumeContent
      }
    });

    const coverLetterVersion = await prisma.coverLetterVersion.create({
      data: {
        userId,
        jobDescriptionId,
        versionName: `Cover Letter for ${versionName}`,
        content: coverLetterContent
      }
    });

    // --- Increment FREE generation count ---
    if (user.subscriptionTier === 'FREE') {
      await prisma.user.update({
        where: { id: userId },
        data: { generationsThisMonth: { increment: 1 } }
      });
    }

    res.json({ resumeVersion, coverLetterVersion });

  } catch (error) {
    console.error("Detailed generation error:", error);
    res.status(500).json({ error: 'An error occurred while generating the application materials.', details: error.message });
  }
});

// --- Fetch all resume and cover letter versions ---
router.get('/versions', async (req, res) => {
  const { userId } = req.userData;
  try {
    const resumeVersions = await prisma.resumeVersion.findMany({ where: { userId } });
    const coverLetterVersions = await prisma.coverLetterVersion.findMany({ where: { userId } });
    res.json({ resumeVersions, coverLetterVersions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching application versions.' });
  }
});

// --- Delete Resume Version ---
router.delete('/resume/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  try {
    const resumeVersion = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!resumeVersion || resumeVersion.userId !== userId) {
      return res.status(404).json({ error: 'Resume version not found or permission denied.' });
    }
    await prisma.resumeVersion.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting resume version.' });
  }
});

// --- Delete Cover Letter Version ---
router.delete('/cover-letter/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  try {
    const coverLetterVersion = await prisma.coverLetterVersion.findUnique({ where: { id } });
    if (!coverLetterVersion || coverLetterVersion.userId !== userId) {
      return res.status(404).json({ error: 'Cover letter version not found or permission denied.' });
    }
    await prisma.coverLetterVersion.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting cover letter version.' });
  }
});

// --- Update Resume Version ---
router.put('/resume/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  const { content, tagline, summary } = req.body;

  try {
    const resumeVersion = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!resumeVersion || resumeVersion.userId !== userId) {
      return res.status(404).json({ error: 'Resume version not found or permission denied.' });
    }

    const updatedVersion = await prisma.resumeVersion.update({
      where: { id },
      data: { content, tagline, summary }
    });

    res.json(updatedVersion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating resume version.' });
  }
});

// --- Update Cover Letter Version ---
router.put('/cover-letter/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.userData;
  const { content } = req.body;

  try {
    const coverLetterVersion = await prisma.coverLetterVersion.findUnique({ where: { id } });
    if (!coverLetterVersion || coverLetterVersion.userId !== userId) {
      return res.status(404).json({ error: 'Cover letter version not found or permission denied.' });
    }

    const updatedVersion = await prisma.coverLetterVersion.update({
      where: { id },
      data: { content }
    });

    res.json(updatedVersion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating cover letter version.' });
  }
});

module.exports = router;

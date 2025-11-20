const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Enhanced extraction with better patterns
function extractJobDetails(text) {
    const lowerText = text.toLowerCase();

    const roleKeywords = {
        "Product Manager": ["product manager", "product owner", "pm "],
        "Software Engineer": ["software engineer", "developer", "programmer", "sde", "software development engineer"],
        "Data Scientist": ["data scientist", "ml engineer", "machine learning"],
        "Program Manager": ["program manager", "project manager", "technical program manager"],
        "Partnerships Manager": ["partnerships manager", "business development", "bd manager"],
        "Marketing Manager": ["marketing manager", "growth manager"],
        "Sales Manager": ["sales manager", "account executive"],
    };

    const domainKeywords = {
        "Fintech": ["fintech", "financial services", "payment", "banking", "finance"],
        "SaaS": ["saas", "software as a service", "cloud software"],
        "Healthcare": ["healthcare", "health tech", "medical", "biotech"],
        "Education": ["education", "edtech", "learning"],
        "E-commerce": ["ecommerce", "e-commerce", "retail", "marketplace"],
        "Tech": ["technology", "software", "it "],
    };

    const findBestMatch = (text, keywords) => {
        for (const [key, values] of Object.entries(keywords)) {
            if (values.some(kw => text.includes(kw))) {
                return key;
            }
        }
        return null;
    };

    let role = findBestMatch(lowerText, roleKeywords) || "General Role";
    let domain = findBestMatch(lowerText, domainKeywords) || "General Industry";

    // ✅ Better title extraction
    let title = "Job Title Not Found";
    const titlePatterns = [
        /(?:job\s+title|position|role)[:\s]+([^\n]+)/i,
        /^([A-Z][a-zA-Z\s,&-]+?)\s*[-–—]\s*([A-Z][a-zA-Z\s,]+)/m, // "Senior Engineer - Google"
        /^([A-Z][a-zA-Z\s,&-]+?)\s+at\s+/im, // "Senior Engineer at Google"
    ];

    for (const regex of titlePatterns) {
        const match = text.match(regex);
        if (match && match[1]) {
            title = match[1].trim();
            break;
        }
    }
    
    if (title === "Job Title Not Found") {
        const firstLine = text.split('\n')[0]?.trim();
        if (firstLine && firstLine.length < 100) {
            title = firstLine;
        } else {
            title = role; // Fallback to detected role
        }
    }

    // ✅ Better company extraction
    let companyName = "Company Not Found";
    const companyPatterns = [
        /(?:company|organization)[:\s]+([^\n]+)/i,
        /at\s+([A-Z][a-zA-Z0-9\s,&.]+?)(?:\s|$|,)/,
        /[-–—]\s+([A-Z][a-zA-Z0-9\s,&.]+?)(?:\s|$)/,
    ];

    for (const regex of companyPatterns) {
        const match = text.match(regex);
        if (match && match[1]) {
            companyName = match[1].trim();
            break;
        }
    }

    return { role, domain, title, companyName };
}

// POST /api/jobs/extract-details
router.post('/extract-details', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }
    try {
        const details = extractJobDetails(text);
        res.json(details);
    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ error: 'An error occurred during extraction.' });
    }
});

// POST /api/jobs
router.post('/', async (req, res) => {
    const { userId } = req.userData;
    const { originalText } = req.body;

    try {
        const { role, domain, title, companyName } = extractJobDetails(originalText);

        const jobDescription = await prisma.jobDescription.create({
            data: {
                userId,
                originalText,
                extractedFunctionalRole: role,
                extractedIndustryDomain: domain,
                jobTitle: title,
                companyName: companyName,
            },
        });
        res.json(jobDescription);
    } catch (error) {
        console.error("Error creating job description:", error);
        res.status(500).json({ error: 'An error occurred while creating the job description.' });
    }
});

// GET /api/jobs
router.get('/', async (req, res) => {
    const { userId } = req.userData;
    try {
        const jobDescriptions = await prisma.jobDescription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobDescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching job descriptions.' });
    }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { originalText, extractedFunctionalRole, extractedIndustryDomain, companyName, jobTitle, userEditedRole, userEditedDomain } = req.body;

    try {
        const jobDescription = await prisma.jobDescription.update({
            where: { id },
            data: {
                originalText,
                extractedFunctionalRole,
                extractedIndustryDomain,
                companyName,
                jobTitle,
                userEditedRole,
                userEditedDomain,
            }
        });
        res.json(jobDescription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the job description.' });
    }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // ✅ Delete related versions first
        await prisma.resumeVersion.deleteMany({ where: { jobDescriptionId: id } });
        await prisma.coverLetterVersion.deleteMany({ where: { jobDescriptionId: id } });
        await prisma.jobDescription.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the job description.' });
    }
});

module.exports = router;
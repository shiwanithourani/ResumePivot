const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const prisma = new PrismaClient();

// Auto-tagging with expanded keywords
function autoTagExperience(description) {
    const lower = (description || "").toLowerCase();
    let roleTag = "General";
    
    if (lower.includes("product manage") || lower.includes("product owner")) roleTag = "Product";
    else if (lower.includes("software engineer") || lower.includes("developer") || lower.includes("programmer")) roleTag = "Engineering";
    else if (lower.includes("program manage") || lower.includes("project manage")) roleTag = "Program";
    else if (lower.includes("partner") || lower.includes("business development")) roleTag = "Partnerships";
    else if (lower.includes("data scien") || lower.includes("machine learn")) roleTag = "Data Science";
    else if (lower.includes("market")) roleTag = "Marketing";

    let domainTag = "General";
    if (lower.includes("fintech") || lower.includes("payment") || lower.includes("financial")) domainTag = "Fintech";
    else if (lower.includes("saas") || lower.includes("software as a service")) domainTag = "SaaS";
    else if (lower.includes("health") || lower.includes("medical")) domainTag = "Healthcare";
    else if (lower.includes("educat") || lower.includes("edtech")) domainTag = "Education";
    else if (lower.includes("ecommerce") || lower.includes("retail")) domainTag = "E-commerce";

    return [
        { tag: roleTag, type: "Functional Role" },
        { tag: domainTag, type: "Industry Domain" },
    ];
}

function parseResumeText(text) {
    console.log("🔍 Parsing text...");
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedinRegex = /(?:linkedin\.com\/in\/)([\w-]+)/i;
    const websiteRegex = /(https?:\/\/[\w.-]+\.[\w.-]+)/;

    // ✅ FIX: Proper extraction
    const personalInfo = {
        name: lines[0] || "N/A",
        email: (text.match(emailRegex) || ["N/A"])[0],
        phone: (text.match(phoneRegex) || ["N/A"])[0],
        linkedin: (text.match(linkedinRegex) || [null, "N/A"])[1],
        website: (text.match(websiteRegex) || ["N/A"])[0],
    };

    console.log("✅ Personal info extracted:", personalInfo);

    let currentSection = "personal";
    const workExperiences = [];
    const educations = [];
    const certifications = [];
    let currentWork = null;

    const sectionKeywords = {
        summary: ["summary", "objective", "profile", "about"],
        work: ["experience", "work history", "employment", "professional experience"],
        education: ["education", "academic", "qualifications"],
        certifications: ["certifications", "licenses", "courses", "skills", "technical skills"],
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Detect section headers
        let isSectionHeader = false;
        for (const [section, keywords] of Object.entries(sectionKeywords)) {
            if (keywords.some(kw => lower === kw || lower.startsWith(kw))) {
                if (currentWork && currentWork.description) {
                    workExperiences.push(currentWork);
                    currentWork = null;
                }
                currentSection = section;
                console.log(`📌 Found ${section} section`);
                isSectionHeader = true;
                break;
            }
        }
        if (isSectionHeader) continue;

        // Skip summary section content
        if (currentSection === "summary") continue;

        // Parse work experience
        if (currentSection === "work") {
            const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–");
            
            // Detect new job entry: non-bullet, reasonable length, or contains a date range
            const dateRangeRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)[\s,.]*\d{4}/i;
            const hasDateRange = dateRangeRegex.test(line);

            if (!isBullet && (line.length > 5 || hasDateRange)) {
                const nextLine = lines[i + 1] || "";
                const nextIsBullet = nextLine.startsWith("•") || nextLine.startsWith("-") || nextLine.startsWith("*");

                if (currentWork && currentWork.description) {
                    workExperiences.push(currentWork);
                }
                currentWork = {
                    jobTitle: line,
                    company: "Company Not Specified",
                    location: "Location Not Specified",
                    description: "",
                    startDate: new Date().toISOString(),
                    endDate: null,
                };

                if (!nextIsBullet && nextLine.length > 3) {
                    currentWork.company = nextLine;
                    i++; // Skip company line
                }
            } else if (currentWork && isBullet) {
                // Append bullet point to current work description
                const clean = line.replace(/^[•\-\*–]\s*/, "").trim();
                if (clean) {
                    currentWork.description += (currentWork.description ? "\n" : "") + clean;
                }
            } else if (!isBullet && line.length > 0 && currentWork && !currentWork.description) {
                // Might be additional job info (dates, location) before bullets start
                // Add to company or skip
            }
        }

        // Parse education
        if (currentSection === "education") {
            if (line.length > 5) {
                const nextLine = lines[i + 1] || "";
                if (nextLine.length > 3 && !nextLine.startsWith("•")) {
                    educations.push({
                        degree: line,
                        institution: nextLine,
                        fieldOfStudy: "N/A",
                        startDate: new Date().toISOString(),
                        endDate: new Date().toISOString()
                    });
                    i++; // Skip institution line
                } else {
                    // Single line education entry
                    educations.push({
                        degree: line,
                        institution: "Institution Not Specified",
                        fieldOfStudy: "N/A",
                        startDate: new Date().toISOString(),
                        endDate: new Date().toISOString()
                    });
                }
            }
        }

        // Parse certifications
        if (currentSection === "certifications") {
            if (line.length > 3 && !sectionKeywords.certifications.some(kw => lower === kw)) {
                certifications.push({
                    name: line,
                    issuingOrganization: "N/A",
                    issueDate: new Date().toISOString()
                });
            }
        }
    }

    // Add last work entry if exists
    if (currentWork && currentWork.description) {
        workExperiences.push(currentWork);
    }

    console.log(`✅ Parsed: ${workExperiences.length} jobs, ${educations.length} edu, ${certifications.length} certs`);
    return { personalInfo, workExperiences, educations, certifications };
}

// Multer setup
const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.userData.userId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.pdf', '.txt', '.doc', '.docx'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, TXT, DOC, DOCX allowed'));
        }
    }
});

// UPLOAD
const authMiddleware = require('../middleware/auth');

router.post("/upload", authMiddleware, upload.single("resume"), async (req, res) => {
    console.log("➡ Upload hit");
    if (!req.file) return res.status(400).json({ error: "No file" });

    console.log("📄", req.file.originalname);
    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
        let text = '';

        if (ext === '.pdf') {
            console.log("🔍 Parsing PDF...");
            const buffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(buffer); // use the top-level import
            text = data.text;
            console.log("✅ PDF extracted:", text.length);
        } else if (ext === '.docx' || ext === '.doc') {
            console.log("🔍 Parsing DOCX...");
            const buffer = fs.readFileSync(req.file.path);
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
            console.log("✅ DOCX extracted:", text.length);
        } else if (ext === '.txt') {
            text = fs.readFileSync(req.file.path, 'utf8');
            console.log("✅ TXT read:", text.length);
        }

        console.log("📝 First 300 chars:", text.substring(0, 300));

        if (!text || text.length < 50) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Not enough text extracted" });
        }

        const parsed = parseResumeText(text);

        // Ensure at least one work experience exists
        if (parsed.workExperiences.length === 0) {
            parsed.workExperiences.push({
                jobTitle: "Position Not Detected",
                company: "Company Not Detected",
                location: "N/A",
                description: text.substring(0, 500),
                startDate: new Date().toISOString(),
                endDate: null
            });
        }

        const master = await prisma.masterResume.upsert({
            where: { userId: req.userData.userId },
            create: {
                user: {
               connectOrCreate: {
              where: { id: req.userData.userId },
            create: {
            id: req.userData.userId,
            email: parsed.personalInfo?.email || `user+${req.userData.userId}@example.invalid`,
            password: "temp1234" // Prisma requires non-null password
              }}},
                
                personalInfo: parsed.personalInfo,
                workExperiences: {
                    create: parsed.workExperiences.map(w => ({
                        jobTitle: w.jobTitle,
                        company: w.company,
                        location: w.location || "N/A",
                        description: w.description,
                        startDate: new Date(w.startDate),
                        endDate: w.endDate ? new Date(w.endDate) : null,
                        tags: { create: autoTagExperience(w.jobTitle + " " + w.description) }
                    }))
                },
                educations: {
                    create: parsed.educations.map(e => ({
                        institution: e.institution,
                        degree: e.degree,
                        fieldOfStudy: e.fieldOfStudy || "N/A",
                        startDate: new Date(e.startDate),
                        endDate: new Date(e.endDate),
                    }))
                },
                certifications: {
                    create: parsed.certifications.map(c => ({
                        name: c.name,
                        issuingOrganization: c.issuingOrganization,
                        issueDate: new Date(c.issueDate),
                    }))
                },
            },
            update: {
                user: { connect: { id: req.userData.userId } },
                personalInfo: parsed.personalInfo,
                workExperiences: {
                    deleteMany: {},
                    create: parsed.workExperiences.map(w => ({
                        jobTitle: w.jobTitle,
                        company: w.company,
                        location: w.location || "N/A",
                        description: w.description,
                        startDate: new Date(w.startDate),
                        endDate: w.endDate ? new Date(w.endDate) : null,
                        tags: { create: autoTagExperience(w.jobTitle + " " + w.description) }
                    }))
                },
                educations: {
                    deleteMany: {},
                    create: parsed.educations.map(e => ({
                        institution: e.institution,
                        degree: e.degree,
                        fieldOfStudy: e.fieldOfStudy || "N/A",
                        startDate: new Date(e.startDate),
                        endDate: new Date(e.endDate),
                    }))
                },
                certifications: {
                    deleteMany: {},
                    create: parsed.certifications.map(c => ({
                        name: c.name,
                        issuingOrganization: c.issuingOrganization,
                        issueDate: new Date(c.issueDate),
                    }))
                },
            },
            include: {
                workExperiences: { include: { tags: true } },
                educations: true,
                certifications: true,
            }
        });

        fs.unlinkSync(req.file.path);
        console.log("✅ Upload success!");
        res.json({ message: "Success", masterResume: master });
    } catch (err) {
        console.error("❌ Upload error:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

// GET
router.get("/", async (req, res) => {
    try {
        const resume = await prisma.masterResume.findUnique({
            where: { userId: req.userData.userId },
            include: {
                workExperiences: { include: { tags: true } },
                educations: true,
                certifications: true,
            },
        });
        res.json(resume);
    } catch (err) {
        console.error("❌ GET error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST manual
router.post('/', async (req, res) => {
    const { personalInfo, workExperiences, educations, certifications } = req.body;
    try {
        const resume = await prisma.masterResume.upsert({
            where: { userId: req.userData.userId },
            create: {
                userId: req.userData.userId,
                personalInfo,
                workExperiences: {
                    create: (workExperiences || []).map(we => ({
                        jobTitle: we.jobTitle || we.title,
                        company: we.company,
                        location: we.location || "N/A",
                        description: we.description || '',
                        startDate: new Date(we.startDate || new Date()),
                        endDate: we.endDate ? new Date(we.endDate) : null,
                        tags: { create: autoTagExperience(we.description || we.jobTitle) }
                    }))
                },
                educations: {
                    create: (educations || []).map(e => ({
                        institution: e.institution,
                        degree: e.degree,
                        fieldOfStudy: e.fieldOfStudy || "N/A",
                        startDate: new Date(),
                        endDate: new Date()
                    }))
                },
                certifications: {
                    create: (certifications || []).map(c => ({
                        name: c.name,
                        issuingOrganization: c.issuer || c.issuingOrganization,
                        issueDate: new Date()
                    }))
                }
            },
            update: {
                personalInfo,
                workExperiences: {
                    deleteMany: {},
                    create: (workExperiences || []).map(we => ({
                        jobTitle: we.jobTitle || we.title,
                        company: we.company,
                        location: we.location || "N/A",
                        description: we.description || '',
                        startDate: new Date(we.startDate || new Date()),
                        endDate: we.endDate ? new Date(we.endDate) : null,
                        tags: { create: autoTagExperience(we.description || we.jobTitle) }
                    }))
                },
                educations: {
                    deleteMany: {},
                    create: (educations || []).map(e => ({
                        institution: e.institution,
                        degree: e.degree,
                        fieldOfStudy: e.fieldOfStudy || "N/A",
                        startDate: new Date(),
                        endDate: new Date()
                    }))
                },
                certifications: {
                    deleteMany: {},
                    create: (certifications || []).map(c => ({
                        name: c.name,
                        issuingOrganization: c.issuer || c.issuingOrganization,
                        issueDate: new Date()
                    }))
                }
            },
            include: {
                workExperiences: { include: { tags: true } },
                educations: true,
                certifications: true,
            }
        });
        
        // ✅ Sync resume versions after update
        if (resume) {
            syncResumeVersions(req.userData.userId).catch(err => 
                console.error("Sync error (non-blocking):", err)
            );
        }
        
        res.json(resume);
    } catch (err) {
        console.error("❌ POST error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Sync function
async function syncResumeVersions(userId) {
    console.log(`🔄 Syncing resume versions for user: ${userId}`);
    try {
        const masterResume = await prisma.masterResume.findUnique({
            where: { userId },
            include: { workExperiences: { include: { tags: true } }, educations: true, certifications: true },
        });

        if (!masterResume) return;

        const resumeVersions = await prisma.resumeVersion.findMany({
            where: { userId },
            include: { jobDescription: true },
        });

        for (const version of resumeVersions) {
            const { jobDescription } = version;
            if (!jobDescription) continue;

            const tailoredWorkExperiences = masterResume.workExperiences.filter(we =>
                we.tags.some(tag => {
                    const lowerTag = tag.tag.toLowerCase();
                    const lowerRole = jobDescription.extractedFunctionalRole.toLowerCase();
                    const lowerDomain = jobDescription.extractedIndustryDomain.toLowerCase();
                    return lowerTag.includes(lowerRole) || lowerTag.includes(lowerDomain) ||
                           lowerRole.includes(lowerTag) || lowerDomain.includes(lowerTag);
                })
            );

            const workExperiencesToUse = tailoredWorkExperiences.length > 0
                ? tailoredWorkExperiences
                : masterResume.workExperiences;

            const tailoredResumeContent = {
                personalInfo: masterResume.personalInfo,
                workExperiences: workExperiencesToUse,
                educations: masterResume.educations,
                certifications: masterResume.certifications,
            };

            await prisma.resumeVersion.update({
                where: { id: version.id },
                data: { content: tailoredResumeContent },
            });
            console.log(`✅ Synced version: ${version.versionName}`);
        }
    } catch (error) {
        console.error(`❌ Sync error for user ${userId}:`, error);
    }
}

// DELETE - Proper cascade
router.delete("/", async (req, res) => {
    console.log("🗑️ DELETE /api/resume for userId:", req.userData.userId);
    try {
        // Use a transaction to ensure atomicity
        await prisma.$transaction(async (prisma) => {
            // Delete all related data first
            await prisma.resumeVersion.deleteMany({ where: { userId: req.userData.userId } });
            await prisma.coverLetterVersion.deleteMany({ where: { userId: req.userData.userId } });
            await prisma.jobDescription.deleteMany({ where: { userId: req.userData.userId } });

            // Now, delete the master resume. The schema should handle cascading deletes for its direct relations.
            await prisma.masterResume.delete({ where: { userId: req.userData.userId } });
        });

        console.log("✅ Delete successful");
        res.status(204).send();
    } catch (err) {
        console.error("❌ Delete error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/update-from-version', async (req, res) => {
    const { userId } = req.userData;
    const { versionContent } = req.body;

    try {
        const { personalInfo, workHistory, education, certifications } = versionContent;

        const updatedMasterResume = await prisma.masterResume.update({
            where: { userId },
            data: {
                personalInfo,
                workExperiences: {
                    deleteMany: {},
                    create: workHistory.map(wh => ({
                        jobTitle: wh.title,
                        company: wh.company,
                        location: wh.location,
                        description: wh.description.join('\n'),
                        startDate: new Date(wh.startDate),
                        endDate: wh.endDate === 'Present' ? null : new Date(wh.endDate),
                        tags: { create: autoTagExperience(wh.description.join('\n')) }
                    }))
                },
                educations: {
                    deleteMany: {},
                    create: education.map(edu => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        endDate: new Date(edu.graduationDate),
                    }))
                },
                certifications: {
                    deleteMany: {},
                    create: certifications.map(cert => ({
                        name: cert.name,
                        issuingOrganization: cert.issuer,
                        issueDate: new Date(cert.date),
                    }))
                },
            },
            include: {
                workExperiences: { include: { tags: true } },
                educations: true,
                certifications: true,
            }
        });

        res.json(updatedMasterResume);
    } catch (error) {
        console.error("Update from version error:", error);
        res.status(500).json({ error: 'An error occurred while updating the master resume from a version.' });
    }
});

module.exports = router;
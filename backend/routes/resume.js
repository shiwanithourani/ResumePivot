// routes/resume.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fssync = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const prisma = new PrismaClient();

// ---------- Helpers ----------
// routes/resume.js


// ---------- Helpers ----------
// ---------- Helpers ----------
function nowISOString() { return new Date().toISOString(); }
function safeSanitizeFileName(name) { return name.replace(/[^\w.-]/g, '_'); }

function autoTagExperience(description = '') {
    const lower = (description || '').toLowerCase();
    const roleTags = [];
    if (/product manage|product owner|product manager/.test(lower)) roleTags.push("Product");
    if (/software engineer|software developer|developer|programmer|engineer|sde/.test(lower)) roleTags.push("Engineering");
    if (/program manage|project manage|project manager|program manager/.test(lower)) roleTags.push("Program");
    if (/partner|business development|bd\W|bd /.test(lower)) roleTags.push("Partnerships");
    if (/data scien|machine learn|ml engineer|data engineer/.test(lower)) roleTags.push("Data Science");
    if (/market(ing)?/.test(lower)) roleTags.push("Marketing");
    if (roleTags.length === 0) roleTags.push("General");

    const domainTags = [];
    if (/fintech|payment|financial|banking/.test(lower)) domainTags.push("Fintech");
    if (/saas|software as a service/.test(lower)) domainTags.push("SaaS");
    if (/health|medical|pharma|healthcare/.test(lower)) domainTags.push("Healthcare");
    if (/educat|edtech|school|university/.test(lower)) domainTags.push("Education");
    if (/e-?commerce|retail|marketplace/.test(lower)) domainTags.push("E-commerce");
    if (domainTags.length === 0) domainTags.push("General");

    const combined = [];
    roleTags.forEach(t => combined.push({ tag: t, type: "Functional Role" }));
    domainTags.forEach(t => combined.push({ tag: t, type: "Industry Domain" }));
    return combined;
}

function extractContacts(text = '') {
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const email = emailMatch ? emailMatch[0] : "N/A";
    const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?[\d-.\s]{6,15}\d/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "N/A";
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+/i);
    const linkedin = linkedinMatch ? linkedinMatch[0] : "N/A";
    const websiteMatch = text.match(/https?:\/\/[^\s,]+|www\.[^\s,]+/i);
    const website = websiteMatch ? websiteMatch[0] : "N/A";
    return { email, phone, linkedin, website };
}

// ✅ FIXED: Better line splitting
function splitIntoLogicalLines(text) {
    if (!text) return [];
    const cleaned = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/\u00A0/g, ' ');
    return cleaned.split('\n').map(s => s.trim()).filter(Boolean);
}

// ✅ FIXED: Better header detection
const headerToSection = [
    { re: /^(professional\s+summary|summary|profile|about\s+me|objective)$/i, section: 'summary' },
    { re: /^(professional\s+experience|experience|employment|work\s+history|work\s+experience)$/i, section: 'work' },
    { re: /^(education|academic\s+background|academic|qualifications)$/i, section: 'education' },
    { re: /^(certifications?|licenses?|certificates?|professional\s+development)$/i, section: 'certifications' },
    { re: /^(skills|technical\s+skills|competencies|core\s+competencies)$/i, section: 'skills' }
];

function isHeaderLine(line) {
    if (!line) return false;
    const trimmed = line.trim();
    
    // Check exact section matches first
    for (const h of headerToSection) {
        if (h.re.test(trimmed)) return true;
    }
    
    // All caps short line
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 40 && !/\d{4}/.test(trimmed)) {
        return true;
    }
    
    // Ends with colon
    if (/^[A-Z][A-Za-z\s]{2,30}:$/.test(trimmed)) return true;
    
    return false;
}

// ✅ FIXED: Parse dates properly
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    const str = dateStr.trim();
    
    // Handle "Present", "Current", etc
    if (/^(present|current|now|ongoing)$/i.test(str)) return null;
    
    // Match patterns like "Jan 2020", "January 2020", "01/2020", "2020"
    const monthYear = str.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)[.,\s]*(\d{4})\b/i);
    if (monthYear) {
        const monthMap = {
            jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
            apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
            aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
            nov: 10, november: 10, dec: 11, december: 11
        };
        const month = monthMap[monthYear[1].toLowerCase()];
        const year = parseInt(monthYear[2]);
        return new Date(year, month, 1).toISOString();
    }
    
    // Just year
    const yearMatch = str.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return new Date(parseInt(yearMatch[0]), 0, 1).toISOString();
    }
    
    return null;
}

// ✅ FIXED: Parse job header with location and dates
function parseJobHeader(line) {
    let title = "N/A";
    let company = "N/A";
    let location = "N/A";
    let startDate = null;
    let endDate = null;
    
    // Extract dates first
    const datePattern = /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)[.,\s]*(\d{4})\s*[-–—to]+\s*(present|current|jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)[.,\s]*(\d{4})?/i;
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
        startDate = parseDate(dateMatch[1] + ' ' + dateMatch[2]);
        endDate = dateMatch[3] ? parseDate(dateMatch[3] + ' ' + (dateMatch[4] || '')) : null;
        // Remove date portion from line
        line = line.replace(dateMatch[0], '').trim();
    } else {
        // Try simpler year range
        const yearRange = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(present|current|(19|20)\d{2})/i);
        if (yearRange) {
            startDate = parseDate(yearRange[0].split(/[-–—]/)[0]);
            endDate = parseDate(yearRange[0].split(/[-–—]/)[1]);
            line = line.replace(yearRange[0], '').trim();
        }
    }
    
    // Split by common separators
    const separators = /[\u2014\u2013–—\-|]/;
    const parts = line.split(separators).map(p => p.trim()).filter(Boolean);
    
    if (parts.length >= 2) {
        title = parts[0];
        company = parts[1];
        if (parts.length >= 3) location = parts[2];
    } else if (parts.length === 1) {
        // Try "at" pattern: "Senior Engineer at Google"
        const atMatch = parts[0].match(/^(.+?)\s+at\s+(.+?)(?:\s*,\s*(.+))?$/i);
        if (atMatch) {
            title = atMatch[1].trim();
            company = atMatch[2].trim();
            if (atMatch[3]) location = atMatch[3].trim();
        } else {
            title = parts[0];
        }
    }
    
    // Try to extract location from common patterns
    if (location === "N/A") {
        const locPattern = /,\s*([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}|[A-Z][a-zA-Z\s]+)$/;
        const locMatch = company.match(locPattern);
        if (locMatch) {
            location = locMatch[1].trim();
            company = company.replace(locMatch[0], '').trim();
        }
    }
    
    return { title, company, location, startDate, endDate };
}

// ✅ FIXED: Better bullet detection and parsing
function isBulletLine(line) {
    return /^\s*([-•●○◦▪▫\*\u2022\u25E6\u25AA]|\d+\.)\s+/.test(line);
}

function stripBullet(line) {
    return line.replace(/^\s*([-•●○◦▪▫\*\u2022\u25E6\u25AA]|\d+\.)\s+/, '').trim();
}

// ✅ FIXED: Better bullet grouping - keeps bullets separate
function groupBullets(lines) {
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        
        if (isBulletLine(line)) {
            let bullet = stripBullet(line);
            let j = i + 1;
            
            // Look ahead for continuation lines (indented or lowercase start, not a new bullet/header)
            while (j < lines.length && 
                   !isBulletLine(lines[j]) && 
                   !isHeaderLine(lines[j]) &&
                   lines[j].trim().length > 0) {
                
                const nextLine = lines[j].trim();
                
                // If starts with lowercase or is very short, it's likely a continuation
                if (/^[a-z]/.test(nextLine) || nextLine.length < 50) {
                    bullet += ' ' + nextLine;
                    j++;
                } else {
                    // Otherwise it's a new paragraph/item
                    break;
                }
            }
            
            result.push({ type: 'bullet', text: bullet.trim() });
            i = j;
        } else if (isHeaderLine(line)) {
            result.push({ type: 'header', text: line.trim() });
            i++;
        } else {
            result.push({ type: 'text', text: line.trim() });
            i++;
        }
    }
    
    return result;
}

// ✅ FIXED: Main parser - keeps bullets as array items
function parseResumeText(text) {
    const lines = splitIntoLogicalLines(text || '');
    const contacts = extractContacts(text || '');
    const sections = { summary: [], work: [], education: [], certifications: [], skills: [], other: [] };
    let currentSection = 'other';
    
    // Better name extraction - look in first 5 lines
    let name = "N/A";
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        // Skip if it's an email, phone, or URL
        if (/@/.test(line) || /\d{3}[-.\s]?\d{3}/.test(line) || /https?:/.test(line)) continue;
        // Skip if it's all caps section header
        if (line === line.toUpperCase() && line.length > 15) continue;
        // Skip if it has dates
        if (/\b(19|20)\d{2}\b/.test(line)) continue;
        
        // Clean potential name
        const cleaned = line.split(/[|,]/)[0].trim();
        if (cleaned.length >= 3 && cleaned.length < 50 && /^[A-Z]/.test(cleaned)) {
            name = cleaned;
            break;
        }
    }
    
    // Section classification
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        
        // Check if this is a section header
        let foundSection = false;
        for (const h of headerToSection) {
            if (h.re.test(line)) {
                currentSection = h.section;
                foundSection = true;
                break;
            }
        }
        
        if (foundSection) continue;
        if (isHeaderLine(line)) continue; // Skip generic headers
        
        if (!sections[currentSection]) sections[currentSection] = [];
        sections[currentSection].push(line);
    }
    
    const personalInfo = { 
        name, 
        email: contacts.email, 
        phone: contacts.phone, 
        linkedin: contacts.linkedin, 
        website: contacts.website 
    };
    
    // ✅ FIXED: Work parsing - keeps bullets as separate array items
    const workExperiences = [];
    if (sections.work.length > 0) {
        const grouped = groupBullets(sections.work);
        let currentJob = null;
        
        for (const item of grouped) {
            if (item.type === 'text' || item.type === 'header') {
                // Check if this looks like a job header
                const line = item.text;
                const hasDateOrSeparator = /\d{4}|—|–|-|\||at\s+/i.test(line);
                const notTooLong = line.length < 150;
                
                if (hasDateOrSeparator && notTooLong) {
                    // Save previous job
                    if (currentJob) {
                        workExperiences.push(currentJob);
                    }
                    
                    // Parse new job
                    const parsed = parseJobHeader(line);
                    currentJob = {
                        jobTitle: parsed.title,
                        company: parsed.company,
                        location: parsed.location,
                        description: [], // Array of bullets
                        startDate: parsed.startDate || nowISOString(),
                        endDate: parsed.endDate
                    };
                } else if (currentJob) {
                    // Add as paragraph text
                    currentJob.description.push(line);
                }
            } else if (item.type === 'bullet') {
                if (!currentJob) {
                    // Create default job if bullets appear without header
                    currentJob = {
                        jobTitle: "Position Not Detected",
                        company: "Company Not Detected",
                        location: "N/A",
                        description: [],
                        startDate: nowISOString(),
                        endDate: null
                    };
                }
                currentJob.description.push(item.text);
            }
        }
        
        // Save last job
        if (currentJob) {
            workExperiences.push(currentJob);
        }
    }
    
    // Fallback if no work found
    if (workExperiences.length === 0) {
        workExperiences.push({
            jobTitle: "Position Not Detected",
            company: "Company Not Detected",
            location: "N/A",
            description: [(text || '').substring(0, 600)],
            startDate: nowISOString(),
            endDate: null
        });
    }
    
    // ✅ FIXED: Education parsing
    const educations = [];
    if (sections.education.length > 0) {
        let i = 0;
        while (i < sections.education.length) {
            const line = sections.education[i];
            
            let institution = line;
            let degree = "N/A";
            let fieldOfStudy = "N/A";
            let graduationDate = null;
            
            // Check if degree info is in same line or next line
            const degreePattern = /\b(Bachelor|Master|PhD|Ph\.?D\.?|B\.?S\.?c?\.?|M\.?S\.?c?\.?|B\.?A\.?|M\.?A\.?|MBA|Associate)\b/i;
            const degreeMatch = line.match(degreePattern);
            
            if (degreeMatch) {
                // Degree in same line
                const parts = line.split(/[-–—,|]/);
                if (parts.length >= 2) {
                    degree = parts[0].trim();
                    institution = parts[1].trim();
                } else {
                    degree = line;
                }
            } else if (i + 1 < sections.education.length && degreePattern.test(sections.education[i + 1])) {
                // Degree in next line
                degree = sections.education[i + 1];
                i++;
            }
            
            // Extract field of study
            const fieldMatch = degree.match(/\b(?:in|of)\s+([A-Z][a-zA-Z\s]+)/);
            if (fieldMatch) {
                fieldOfStudy = fieldMatch[1].trim();
            }
            
            // Extract graduation date
            const yearMatch = (line + ' ' + degree).match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                graduationDate = new Date(parseInt(yearMatch[0]), 5, 1).toISOString(); // Mid-year default
            }
            
            educations.push({
                institution: institution || "N/A",
                degree: degree || "N/A",
                fieldOfStudy,
                startDate: graduationDate ? new Date(new Date(graduationDate).getFullYear() - 4, 8, 1).toISOString() : new Date().toISOString(),
                endDate: graduationDate || new Date().toISOString()
            });
            
            i++;
        }
    }
    
    // Certifications
    const certifications = (sections.certifications || []).map(line => {
        const year = (line.match(/\b(19|20)\d{2}\b/) || [null])[0];
        let name = line;
        let org = "N/A";
        
        // Try to split cert name and org
        const parts = line.split(/[-–—,|]/);
        if (parts.length >= 2) {
            name = parts[0].trim();
            org = parts[1].trim();
        }
        
        return { 
            name, 
            issuingOrganization: org, 
            issueDate: year ? new Date(parseInt(year), 0, 1).toISOString() : new Date().toISOString() 
        };
    });
    
    // ✅ IMPORTANT: Convert description arrays to formatted strings with bullets
    const workForStorage = workExperiences.map(w => ({
        jobTitle: w.jobTitle,
        company: w.company,
        location: w.location,
        description: Array.isArray(w.description) 
            ? w.description.map(b => `• ${b}`).join('\n') 
            : (w.description || ''),
        startDate: w.startDate,
        endDate: w.endDate
    }));
    
    return { personalInfo, workExperiences: workForStorage, educations, certifications };
}


// ---------- Multer ----------
const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        const dir = 'uploads/';
        if (!fssync.existsSync(dir)) fssync.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path.basename(file.originalname, ext);
        const userId = (req.userData && req.userData.userId) ? req.userData.userId : 'anon';
        const safeBase = safeSanitizeFileName(base);
        const filename = `${safeSanitizeFileName(userId + '-' + Date.now() + '-' + safeBase)}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.pdf', '.txt', '.doc', '.docx'].includes(ext)) cb(null, true);
        else cb(new Error('Only PDF, TXT, DOC, DOCX allowed'));
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const authMiddleware = require('../middleware/auth');

// ---------- Routes ----------

// UPLOAD
router.post("/upload", authMiddleware, upload.single("resume"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!req.userData || !req.userData.userId) return res.status(401).json({ error: "Invalid user" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;
    let text = '';

    try {
        if (ext === '.pdf') {
            const buffer = await fs.readFile(filePath);
            text = (await pdfParse(buffer)).text || '';
        } else if (ext === '.docx' || ext === '.doc') {
            const buffer = await fs.readFile(filePath);
            const extracted = await mammoth.extractRawText({ buffer });
            text = extracted && extracted.value ? extracted.value : '';
        } else if (ext === '.txt') {
            text = await fs.readFile(filePath, 'utf8');
        }

        try { await fs.unlink(filePath); } catch (e) { /* ignore cleanup errors */ }

        if (!text || text.length < 50) return res.status(400).json({ error: "Not enough text extracted from the document" });

        const parsed = parseResumeText(text);

        const workCreates = (parsed.workExperiences || []).map(w => {
            const tagsToCreate = autoTagExperience((w.jobTitle || '') + ' ' + (w.description || '')).map(t => ({ tag: t.tag, type: t.type }));
            return {
                jobTitle: w.jobTitle || "N/A",
                company: w.company || "N/A",
                location: w.location || "N/A",
                description: w.description || "",
                startDate: w.startDate ? new Date(w.startDate) : new Date(),
                endDate: w.endDate ? new Date(w.endDate) : null,
                tags: { create: tagsToCreate }
            };
        });

        const educationCreates = (parsed.educations || []).map(e => ({
            institution: e.institution || "N/A",
            degree: e.degree || "N/A",
            fieldOfStudy: e.fieldOfStudy || "N/A",
            startDate: e.startDate ? new Date(e.startDate) : new Date(),
            endDate: e.endDate ? new Date(e.endDate) : new Date()
        }));

        const certificationCreates = (parsed.certifications || []).map(c => ({
            name: c.name || "N/A",
            issuingOrganization: c.issuingOrganization || "N/A",
            issueDate: c.issueDate ? new Date(c.issueDate) : new Date()
        }));

        // Upsert master resume
        const master = await prisma.masterResume.upsert({
            where: { userId: req.userData.userId },
            create: {
                userId: req.userData.userId,
                personalInfo: parsed.personalInfo,
                workExperiences: { create: workCreates },
                educations: { create: educationCreates },
                certifications: { create: certificationCreates }
            },
            update: {
                personalInfo: parsed.personalInfo,
                workExperiences: { deleteMany: {}, create: workCreates },
                educations: { deleteMany: {}, create: educationCreates },
                certifications: { deleteMany: {}, create: certificationCreates }
            },
            include: {
                workExperiences: { include: { tags: true } },
                educations: true,
                certifications: true
            }
        });

        // Non-blocking sync
        syncResumeVersions(req.userData.userId).catch(err => console.error("Sync error (non-blocking):", err));

        res.json({ message: "Success", masterResume: master });
    } catch (err) {
        try { if (await fs.stat(filePath)) await fs.unlink(filePath); } catch (e) { /* ignore */ }
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET
router.get("/", authMiddleware, async (req, res) => {
    try {
        const resume = await prisma.masterResume.findUnique({
            where: { userId: req.userData.userId }
        });

        if (resume) {
            const workExperiences = await prisma.workExperience.findMany({
                where: { masterResumeId: resume.id },
                include: { tags: true }
            });
            const educations = await prisma.education.findMany({ where: { masterResumeId: resume.id } });
            const certifications = await prisma.certification.findMany({ where: { masterResumeId: resume.id } });

            resume.workExperiences = workExperiences;
            resume.educations = educations;
            resume.certifications = certifications;
        }

        res.json(resume);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// POST manual
router.post('/', authMiddleware, async (req, res) => {
    const { personalInfo, workExperiences, educations, certifications } = req.body;
    try {
        const workCreates = (workExperiences || []).map(w => ({
            jobTitle: w.jobTitle || "N/A",
            company: w.company || "N/A",
            location: w.location || "N/A",
            description: w.description || "",
            startDate: w.startDate ? new Date(w.startDate) : new Date(),
            endDate: w.endDate ? new Date(w.endDate) : null,
            tags: { create: autoTagExperience((w.description || '') + ' ' + (w.jobTitle || '')).map(t => ({ tag: t.tag, type: t.type })) }
        }));
        const educationCreates = (educations || []).map(e => ({
            institution: e.institution || "N/A",
            degree: e.degree || "N/A",
            fieldOfStudy: e.fieldOfStudy || "N/A",
            startDate: e.startDate ? new Date(e.startDate) : new Date(),
            endDate: e.endDate ? new Date(e.endDate) : new Date()
        }));
        const certificationCreates = (certifications || []).map(c => ({
            name: c.name || "N/A",
            issuingOrganization: c.issuingOrganization || "N/A",
            issueDate: c.issueDate ? new Date(c.issueDate) : new Date()
        }));

        const resume = await prisma.masterResume.upsert({
            where: { userId: req.userData.userId },
            create: {
                userId: req.userData.userId,
                personalInfo: personalInfo || {},
                workExperiences: { create: workCreates },
                educations: { create: educationCreates },
                certifications: { create: certificationCreates }
            },
            update: {
                personalInfo: personalInfo || {},
                workExperiences: { deleteMany: {}, create: workCreates },
                educations: { deleteMany: {}, create: educationCreates },
                certifications: { deleteMany: {}, create: certificationCreates }
            },
            include: { workExperiences: { include: { tags: true } }, educations: true, certifications: true }
        });

        syncResumeVersions(req.userData.userId).catch(err => console.error("Sync error:", err));

        res.json(resume);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// DELETE
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.userData.userId;
        if (!userId) return res.status(401).json({ error: "Invalid user" });

        // find master resume
        const master = await prisma.masterResume.findUnique({ where: { userId } });
        if (!master) return res.status(204).send();

        const masterId = master.id;

        // Delete related data
        const workExperiences = await prisma.workExperience.findMany({ where: { masterResumeId: masterId } });
        for (const we of workExperiences) {
            await prisma.workExperienceTag.deleteMany({ where: { workExperienceId: we.id } });
        }
        await prisma.workExperience.deleteMany({ where: { masterResumeId: masterId } });
        await prisma.education.deleteMany({ where: { masterResumeId: masterId } });
        await prisma.certification.deleteMany({ where: { masterResumeId: masterId } });
        await prisma.resumeVersion.deleteMany({ where: { userId } });
        await prisma.coverLetterVersion.deleteMany({ where: { userId } });
        await prisma.jobDescription.deleteMany({ where: { userId } });
        await prisma.masterResume.delete({ where: { id: masterId } });

        return res.status(204).send();
    } catch (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ error: err.message || "Failed to delete resume" });
    }
});

// Update from version
router.post('/update-from-version', authMiddleware, async (req, res) => {
    const { userId } = req.userData;
    const { versionContent } = req.body;

    try {
        if (!versionContent) return res.status(400).json({ error: 'versionContent is required' });

        const { personalInfo, workHistory = [], education = [], certifications = [] } = versionContent;

        const workCreates = workHistory.map(wh => ({
            jobTitle: wh.title || "N/A",
            company: wh.company || "N/A",
            location: wh.location || "N/A",
            description: Array.isArray(wh.description) ? wh.description.join('\n') : (wh.description || ''),
            startDate: wh.startDate ? new Date(wh.startDate) : new Date(),
            endDate: (wh.endDate && wh.endDate !== 'Present') ? new Date(wh.endDate) : null,
            tags: { create: autoTagExperience((wh.title || '') + ' ' + (Array.isArray(wh.description) ? wh.description.join(' ') : (wh.description || ''))).map(t => ({ tag: t.tag, type: t.type })) }
        }));

        const educationCreates = education.map(e => ({
            institution: e.institution || "N/A",
            degree: e.degree || "N/A",
            fieldOfStudy: e.fieldOfStudy || "N/A",
            startDate: e.graduationDate ? new Date(e.graduationDate) : new Date(),
            endDate: e.graduationDate ? new Date(e.graduationDate) : new Date()
        }));

        const certificationCreates = certifications.map(c => ({
            name: c.name || "N/A",
            issuingOrganization: c.issuer || "N/A",
            issueDate: c.date ? new Date(c.date) : new Date()
        }));

        const updatedMasterResume = await prisma.masterResume.update({
            where: { userId },
            data: {
                personalInfo: personalInfo || {},
                workExperiences: { deleteMany: {}, create: workCreates },
                educations: { deleteMany: {}, create: educationCreates },
                certifications: { deleteMany: {}, create: certificationCreates }
            },
            include: { workExperiences: { include: { tags: true } }, educations: true, certifications: true }
        });

        res.json(updatedMasterResume);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating master resume from version' });
    }
});

// syncResumeVersions
async function syncResumeVersions(userId) {
    try {
        const masterResume = await prisma.masterResume.findUnique({
            where: { userId },
            include: { workExperiences: { include: { tags: true } }, educations: true, certifications: true }
        });
        if (!masterResume) return;

        const resumeVersions = await prisma.resumeVersion.findMany({ where: { userId }, include: { jobDescription: true } });

        for (const version of resumeVersions) {
            const { jobDescription } = version;
            if (!jobDescription) continue;

            const lowerRole = (jobDescription.extractedFunctionalRole || '').toLowerCase();
            const lowerDomain = (jobDescription.extractedIndustryDomain || '').toLowerCase();

            const tailoredWorkExperiences = masterResume.workExperiences.filter(we =>
                (we.tags || []).some(tag => {
                    const t = (tag.tag || '').toLowerCase();
                    return (t && (lowerRole.includes(t) || lowerDomain.includes(t) || t.includes(lowerRole) || t.includes(lowerDomain)));
                })
            );

            const workExperiencesToUse = tailoredWorkExperiences.length > 0 ? tailoredWorkExperiences : masterResume.workExperiences;

            await prisma.resumeVersion.update({
                where: { id: version.id },
                data: {
                    content: {
                        personalInfo: masterResume.personalInfo,
                        workExperiences: workExperiencesToUse,
                        educations: masterResume.educations,
                        certifications: masterResume.certifications
                    }
                }
            });
        }
    } catch (err) {
        console.error(`Sync error for user ${userId}:`, err);
        throw err;
    }
}

module.exports = router;

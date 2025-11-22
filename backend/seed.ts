import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: "pass@example.com",
      password: "password123",
      subscriptionTier: "FREE",
    },
  });

  console.log("Created user:", user);

  // Create a MasterResume for that user
  const masterResume = await prisma.masterResume.create({
    data: {
      userId: user.id,
      personalInfo: {
        name: "Test User",
        phone: "123-456-7890",
        email: "test@example.com",
      },
      workExperiences: {
        create: [
          {
            jobTitle: "Software Engineer",
            company: "TechCorp",
            location: "Remote",
            startDate: new Date("2023-01-01"),
            description: "Developed amazing features.",
            tags: {
              create: [
                { tag: "Frontend", type: "FUNCTIONAL_ROLE" },
                { tag: "Tech", type: "INDUSTRY_DOMAIN" },
              ],
            },
          },
        ],
      },
      educations: {
        create: [
          {
            institution: "Test University",
            degree: "BSc Computer Science",
            fieldOfStudy: "Software Engineering",
            startDate: new Date("2018-09-01"),
            endDate: new Date("2022-06-01"),
          },
        ],
      },
      certifications: {
        create: [
          {
            name: "Certified Developer",
            issuingOrganization: "Test Org",
            issueDate: new Date("2023-01-01"),
          },
        ],
      },
    },
  });

  console.log("Created MasterResume:", masterResume);

  // Optional: create a JobDescription and ResumeVersion
  const jobDesc = await prisma.jobDescription.create({
    data: {
      userId: user.id,
      originalText: "Looking for a frontend engineer",
      extractedFunctionalRole: "Frontend Engineer",
      extractedIndustryDomain: "Tech",
    },
  });

  console.log("Created JobDescription:", jobDesc);

  const resumeVersion = await prisma.resumeVersion.create({
    data: {
      userId: user.id,
      jobDescriptionId: jobDesc.id,
      versionName: "v1",
      tagline: "Creative Frontend Developer",
      summary: "Experienced in React, Node.js",
      content: { skills: ["React", "Node.js"], projects: ["Project A"] },
    },
  });

  console.log("Created ResumeVersion:", resumeVersion);

  console.log("Seeding complete!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

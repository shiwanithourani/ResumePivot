import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      masterResume: {
        include: {
          workExperiences: {
            include: { tags: true },
          },
          educations: true,
          certifications: true,
        },
      },
      jobDescriptions: {
        include: {
          resumeVersions: true,
          coverLetterVersions: true,
        },
      },
      resumeVersions: true,
      coverLetterVersions: true,
    },
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const connectDB = require('../config/db');

const prisma = new PrismaClient();

const migrateData = async () => {
  try {
    // Connect to MongoDB
    const db = await connectDB();
    console.log('MongoDB connected for migration');

    // 1. Fetch all users and their related data
    const users = await prisma.user.findMany({
      include: {
        masterResume: {
          include: {
            workExperiences: {
              include: {
                tags: true,
              },
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
      },
    });

    console.log(`Found ${users.length} users to migrate.`);

    const newUsersCollection = db.collection('NewUsers');
    const newJobDescriptionsCollection = db.collection('NewJobDescriptions');

    // Clear out the new collections if they have any data from previous runs
    await newUsersCollection.deleteMany({});
    await newJobDescriptionsCollection.deleteMany({});

    for (const user of users) {
      // 2. Transform user data
      const newUser = {
        ...user,
        masterResume: user.masterResume,
      };
      delete newUser.jobDescriptions; // This will be handled separately

      // 3. Insert the new user document
      await newUsersCollection.insertOne(newUser);

      // 4. Transform and insert job description data
      for (const job of user.jobDescriptions) {
        const newJobDescription = {
          ...job,
          resumeVersions: job.resumeVersions,
          coverLetterVersions: job.coverLetterVersions,
        };
        await newJobDescriptionsCollection.insertOne(newJobDescription);
      }
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    await prisma.$disconnect();
    // The MongoDB connection from connectDB doesn't have a close method exposed,
    // but the script will exit, effectively closing the connection.
    process.exit();
  }
};

migrateData();
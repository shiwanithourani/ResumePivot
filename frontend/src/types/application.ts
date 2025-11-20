export interface ResumeVersion {
  id: string;
  userId: string;
  masterResumeId: string;
  jobDescriptionId: string;
  versionName: string;
  tagline: string;
  summary: string;
  content: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      linkedin?: string;
      website?: string;
    };
    workHistory: Array<{
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      description: string[];
    }>;
    education: Array<{
      degree: string;
      institution: string;
      graduationDate: string;
      description?: string[];
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  templateId: string; // e.g., "modern", "classic"
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CoverLetterVersion {
  id: string;
  userId: string;
  masterResumeId: string;
  jobDescriptionId: string;
  versionName: string;
  content: string; // The full text of the cover letter
  lengthConfig: "short" | "medium" | "long";
  customQuestions: string[]; // Questions provided by the user to address
  templateId: string; // e.g., "standard", "formal"
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
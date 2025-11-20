export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD or 'Present'
  description: string[]; // Array of bullet points
  tags: string[]; // Functional Role, Industry Domain
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  graduationDate: string; // YYYY-MM-DD
  description?: string[]; // Optional bullet points
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // YYYY-MM-DD
}

export interface MasterResume {
  id: string;
  userId: string; 
  personalInfo: PersonalInfo;
  workHistory: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  createdDate: string; // ISO string
  lastModifiedDate: string; // ISO string
}
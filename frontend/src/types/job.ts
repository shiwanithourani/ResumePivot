export interface JobDescription {
  id: string;
  userId: string; // Mock user ID for now
  originalText: string;
  extractedRole: string;
  extractedDomain: string;
  userEditedRole?: string; // Optional, if user overrides extracted role
  userEditedDomain?: string; // Optional, if user overrides extracted domain
  jobTitle?: string;
  companyName?: string;
  createdDate: string; // ISO string
  lastModifiedDate: string; // ISO string
}
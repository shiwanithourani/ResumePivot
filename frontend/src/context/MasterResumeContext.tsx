import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { MasterResume, WorkExperience, Education, Certification } from "@/types/resume";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import apiClient from "@/lib/api";

interface MasterResumeContextType {
  masterResume: MasterResume | null;
  isLoading: boolean;
  uploadMasterResume: (file: File) => Promise<void>;
  updateMasterResume: (updatedData: Partial<MasterResume>) => Promise<void>;
  deleteMasterResume: () => Promise<void>;
}

// Define types for backend data structures to avoid using 'any'
interface BackendWorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  tags: { tag: string }[];
}

interface BackendEducation {
  id: string;
  degree: string;
  institution: string;
  endDate: string;
}

interface BackendCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
}

const MasterResumeContext = createContext<MasterResumeContextType | undefined>(
  undefined,
);

export const MasterResumeProvider = ({ children }: { children: ReactNode }) => {
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    const fetchMasterResume = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const response = await apiClient.get("/resume");
          if (response.data) {
            // Transform backend data to frontend format
            const backendData = response.data;
            const transformedData: MasterResume = {
              id: backendData.id,
              userId: backendData.userId,
              personalInfo: backendData.personalInfo,
              workHistory: backendData.workExperiences?.map((we: BackendWorkExperience) => ({
                id: we.id,
                title: we.jobTitle,
                company: we.company,
                location: we.location || "N/A",
                startDate: we.startDate,
                endDate: we.endDate || "Present",
                description: we.description ? we.description.split('\n') : [],
                tags: we.tags?.map((t: { tag: string }) => t.tag) || []
              })) || [],
              education: backendData.educations?.map((edu: BackendEducation) => ({
                id: edu.id,
                degree: edu.degree,
                institution: edu.institution,
                graduationDate: edu.endDate
              })) || [],
              certifications: backendData.certifications?.map((cert: BackendCertification) => ({
                id: cert.id,
                name: cert.name,
                issuer: cert.issuingOrganization,
                date: cert.issueDate
              })) || [],
              createdDate: backendData.createdAt || new Date().toISOString(),
              lastModifiedDate: backendData.updatedAt || new Date().toISOString()
            };
            setMasterResume(transformedData);
          }
        } catch (error) {
          console.error("No master resume found for user.", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchMasterResume();
  }, [token]);

  const uploadMasterResume = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await apiClient.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { masterResume: backendData } = response.data;
      
      if (!backendData) {
        toast.error("Failed to get master resume from response.");
        return;
      }

      // Transform response back to frontend format
      const transformedData: MasterResume = {
        id: backendData.id,
        userId: backendData.userId,
        personalInfo: backendData.personalInfo,
        workHistory: backendData.workExperiences?.map((we: BackendWorkExperience) => ({
          id: we.id,
          title: we.jobTitle,
          company: we.company,
          location: we.location || "N/A",
          startDate: we.startDate,
          endDate: we.endDate || "Present",
          description: we.description ? we.description.split('\n') : [],
          tags: we.tags?.map((t: { tag: string }) => t.tag) || []
        })) || [],
        education: backendData.educations?.map((edu: BackendEducation) => ({
          id: edu.id,
          degree: edu.degree,
          institution: edu.institution,
          graduationDate: edu.endDate
        })) || [],
        certifications: backendData.certifications?.map((cert: BackendCertification) => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuingOrganization,
          date: cert.issueDate
        })) || [],
        createdDate: backendData.createdAt || new Date().toISOString(),
        lastModifiedDate: backendData.updatedAt || new Date().toISOString()
      };
      
      setMasterResume(transformedData);
      toast.success("Master resume uploaded and parsed successfully!");
    } catch (error) {
      toast.error("Failed to upload and parse resume.");
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMasterResume = async (updatedData: Partial<MasterResume>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/resume", {
        personalInfo: updatedData.personalInfo || masterResume?.personalInfo,
        workExperiences: (updatedData.workHistory || masterResume?.workHistory || []).map(wh => ({
          jobTitle: wh.title,
          company: wh.company,
          location: wh.location || "N/A",
          startDate: wh.startDate,
          endDate: wh.endDate === "Present" ? null : wh.endDate,
          description: Array.isArray(wh.description) ? wh.description.join('\n') : wh.description
        })),
        educations: (updatedData.education || masterResume?.education || []).map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          startDate: edu.graduationDate,
          endDate: edu.graduationDate
        })),
        certifications: (updatedData.certifications || masterResume?.certifications || []).map(cert => ({
          name: cert.name,
          issuingOrganization: cert.issuer,
          issueDate: cert.date
        }))
      });
      
      // Transform response
      const backendData = response.data;
      const transformedData: MasterResume = {
        id: backendData.id,
        userId: backendData.userId,
        personalInfo: backendData.personalInfo,
        workHistory: backendData.workExperiences?.map((we: BackendWorkExperience) => ({
          id: we.id,
          title: we.jobTitle,
          company: we.company,
          location: we.location || "N/A",
          startDate: we.startDate,
          endDate: we.endDate || "Present",
          description: we.description ? we.description.split('\n') : [],
          tags: we.tags?.map((t: { tag: string }) => t.tag) || []
        })) || [],
        education: backendData.educations?.map((edu: BackendEducation) => ({
          id: edu.id,
          degree: edu.degree,
          institution: edu.institution,
          graduationDate: edu.endDate
        })) || [],
        certifications: backendData.certifications?.map((cert: BackendCertification) => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuingOrganization,
          date: cert.issueDate
        })) || [],
        createdDate: backendData.createdAt || new Date().toISOString(),
        lastModifiedDate: backendData.updatedAt || new Date().toISOString()
      };
      
      setMasterResume(transformedData);
      toast.success("Master resume updated successfully!");
    } catch (error) {
      toast.error("Failed to update master resume.");
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMasterResume = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete("/resume");
      setMasterResume(null);
      toast.success("Master resume deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete master resume.");
      console.error("Delete error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MasterResumeContext.Provider
      value={{
        masterResume,
        isLoading,
        uploadMasterResume,
        updateMasterResume,
        deleteMasterResume,
      }}
    >
      {children}
    </MasterResumeContext.Provider>
  );
};

export const useMasterResume = () => {
  const context = useContext(MasterResumeContext);
  if (context === undefined) {
    throw new Error(
      "useMasterResume must be used within a MasterResumeProvider",
    );
  }
  return context;
};
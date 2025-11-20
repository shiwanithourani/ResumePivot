import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ResumeVersion, CoverLetterVersion } from "@/types/application";
import { MasterResume, WorkExperience } from "@/types/resume";
import { JobDescription } from "@/types/job";
import { toast } from "sonner";
import { useMasterResume } from "./MasterResumeContext"; // Import useMasterResume
import { useAuth } from "./AuthContext";
import apiClient from "@/lib/api";
import { AxiosError } from "axios";

interface ApplicationContextType {
  resumeVersions: ResumeVersion[];
  coverLetterVersions: CoverLetterVersion[];
  isLoading: boolean;
  generateApplicationMaterials: (
    masterResume: MasterResume,
    jobDescription: JobDescription,
    versionName: string,
    customQuestions: string[],
    templateId: string,
    lengthConfig: "short" | "medium" | "long",
  ) => Promise<{ resume: ResumeVersion; coverLetter: CoverLetterVersion } | null>;
  updateResumeVersion: (
    id: string,
    updatedData: Partial<ResumeVersion>,
  ) => Promise<void>;
  updateCoverLetterVersion: (
    id: string,
    updatedData: Partial<CoverLetterVersion>,
  ) => Promise<void>;
  deleteResumeVersion: (id: string) => Promise<void>;
  deleteCoverLetterVersion: (id: string) => Promise<void>;
  updateMasterFromVersion: (
    versionType: "resume" | "coverLetter",
    versionId: string,
  ) => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined,
);

export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [coverLetterVersions, setCoverLetterVersions] = useState<
    CoverLetterVersion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { updateMasterResume } = useMasterResume(); // Use the master resume context

  const { token } = useAuth();

  useEffect(() => {
    const fetchApplicationVersions = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const response = await apiClient.get("/applications/versions");
          setResumeVersions(response.data.resumeVersions || []);
          setCoverLetterVersions(response.data.coverLetterVersions || []);
        } catch (error) {
          toast.error("Failed to load application versions.");
          console.error("Fetch versions error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchApplicationVersions();
  }, [token]);

  const generateApplicationMaterials = async (
    masterResume: MasterResume,
    jobDescription: JobDescription,
    versionName: string,
    customQuestions: string[],
    templateId: string,
    lengthConfig: "short" | "medium" | "long",
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/applications/generate", {
        jobDescriptionId: jobDescription.id,
        versionName,
        customQuestions,
        templateId,
        lengthConfig,
      });
      const { resumeVersion, coverLetterVersion } = response.data;
      setResumeVersions((prev) => [...prev, resumeVersion]);
      setCoverLetterVersions((prev) => [...prev, coverLetterVersion]);
      toast.success("Application materials generated successfully!");
      return { resume: resumeVersion, coverLetter: coverLetterVersion };
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      if (axiosError.response && axiosError.response.status === 403) {
        toast.error("You've reached your monthly limit.", {
          action: {
            label: "Upgrade to Pro",
            onClick: () => (window.location.href = "/upgrade"),
          },
        });
      } else {
        toast.error("Failed to generate application materials.");
      }
      console.error("Generation error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateResumeVersion = async (
    id: string,
    updatedData: Partial<ResumeVersion>,
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(`/applications/resume/${id}`, updatedData);
      setResumeVersions((prev) =>
        prev.map((rv) => (rv.id === id ? response.data : rv)),
      );
      toast.success("Resume version updated successfully!");
    } catch (error) {
      toast.error("Failed to update resume version.");
      console.error("Update resume error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoverLetterVersion = async (
    id: string,
    updatedData: Partial<CoverLetterVersion>,
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(
        `/applications/cover-letter/${id}`,
        updatedData,
      );
      setCoverLetterVersions((prev) =>
        prev.map((clv) => (clv.id === id ? response.data : clv)),
      );
      toast.success("Cover letter version updated successfully!");
    } catch (error) {
      toast.error("Failed to update cover letter version.");
      console.error("Update cover letter error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResumeVersion = async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/applications/resume/${id}`);
      setResumeVersions((prev) => prev.filter((rv) => rv.id !== id));
      toast.success("Resume version deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete resume version.");
      console.error("Delete resume error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCoverLetterVersion = async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/applications/cover-letter/${id}`);
      setCoverLetterVersions((prev) => prev.filter((clv) => clv.id !== id));
      toast.success("Cover letter version deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete cover letter version.");
      console.error("Delete cover letter error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMasterFromVersion = async (
    versionType: "resume" | "coverLetter",
    versionId: string,
  ) => {
    setIsLoading(true);
    try {
      if (versionType === "resume") {
        const version = resumeVersions.find((rv) => rv.id === versionId);
        if (version) {
          await apiClient.post("/resume/update-from-version", {
            versionContent: version.content,
          });
          // After the backend update, we need to refetch the master resume
          // The MasterResumeProvider will handle this automatically when the context is updated
          toast.success("Master resume updated from this version.");
        }
      } else if (versionType === "coverLetter") {
        toast.info("Cover letter content cannot directly update master resume.");
      }
    } catch (error) {
      toast.error("Failed to update master resume from version.");
      console.error("Update master from version error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ApplicationContext.Provider
      value={{
        resumeVersions,
        coverLetterVersions,
        isLoading,
        generateApplicationMaterials,
        updateResumeVersion,
        updateCoverLetterVersion,
        deleteResumeVersion,
        deleteCoverLetterVersion,
        updateMasterFromVersion,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return context;
};
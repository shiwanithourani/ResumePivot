import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { JobDescription } from "@/types/job";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import apiClient from "@/lib/api";

interface JobDescriptionContextType {
  jobDescriptions: JobDescription[];
  isLoading: boolean;
  addJobDescription: (data: Partial<JobDescription>) => Promise<void>;
  updateJobDescription: (
    id: string,
    updatedData: Partial<JobDescription>,
  ) => Promise<void>;
  deleteJobDescription: (id: string) => Promise<void>;
}

const JobDescriptionContext = createContext<
  JobDescriptionContextType | undefined
>(undefined);


export const JobDescriptionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    const fetchJobDescriptions = async () => {
      if (token) {
        setIsLoading(true);
        try {
          const response = await apiClient.get("/jobs");
          setJobDescriptions(response.data || []);
        } catch (error) {
          toast.error("Failed to load job descriptions.");
          console.error("Fetch JDs error:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchJobDescriptions();
  }, [token]);

  const addJobDescription = async (data: Partial<JobDescription>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/jobs", data);
      setJobDescriptions((prev) => [...prev, response.data]);
      toast.success("Job description added successfully!");
    } catch (error) {
      toast.error("Failed to add job description.");
      console.error("Add JD error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobDescription = async (
    id: string,
    updatedData: Partial<JobDescription>,
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(`/jobs/${id}`, updatedData);
      setJobDescriptions((prev) =>
        prev.map((jd) => (jd.id === id ? response.data : jd)),
      );
      toast.success("Job description updated successfully!");
    } catch (error) {
      toast.error("Failed to update job description.");
      console.error("Update JD error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJobDescription = async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/jobs/${id}`);
      setJobDescriptions((prev) => prev.filter((jd) => jd.id !== id));
      toast.success("Job description deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete job description.");
      console.error("Delete JD error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <JobDescriptionContext.Provider
      value={{
        jobDescriptions,
        isLoading,
        addJobDescription,
        updateJobDescription,
        deleteJobDescription,
      }}
    >
      {children}
    </JobDescriptionContext.Provider>
  );
};

export const useJobDescriptions = () => {
  const context = useContext(JobDescriptionContext);
  if (context === undefined) {
    throw new Error(
      "useJobDescriptions must be used within a JobDescriptionProvider",
    );
  }
  return context;
};
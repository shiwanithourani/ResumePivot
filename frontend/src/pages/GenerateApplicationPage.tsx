import React, { useState } from "react";
import ApplicationGenerator from "@/components/ApplicationGenerator";
import { useMasterResume } from "@/context/MasterResumeContext";
import { Loader2, FileWarning } from "lucide-react";
import { useJobDescriptions } from "@/context/JobDescriptionContext";
import { JobDescription } from "@/types/job";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const GenerateApplicationPage = () => {
  const { masterResume, isLoading: isMasterResumeLoading } = useMasterResume();
  const { jobDescriptions, isLoading: isJobDescriptionsLoading } = useJobDescriptions();
  const [selectedJobDescription, setSelectedJobDescription] = useState<JobDescription | null>(null);

  const handleSelectJobDescription = (jobId: string) => {
    const selectedJd = jobDescriptions.find((jd) => jd.id === jobId);
    setSelectedJobDescription(selectedJd || null);
  };

  if (isMasterResumeLoading || isJobDescriptionsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
        <h1 className="text-xl font-medium text-gray-300 text-center max-w-md mt-4">
          Loading application generator...
        </h1>
      </div>
    );
  }

  if (!masterResume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
          <FileWarning className="w-16 h-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Master Resume Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mx-auto">
            You need to upload your Master Resume before you can generate application materials.
            Please go to the "Master Resume" section to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Select Job Description</CardTitle>
            <CardDescription>
              Choose from your saved job descriptions to start generating application materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobDescriptions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic py-4 text-center">
                No job descriptions available. Please add one from the "Job Descriptions" page.
              </p>
            ) : (
              <Select onValueChange={handleSelectJobDescription} value={selectedJobDescription?.id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Job Description" />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions.map((jd) => (
                    <SelectItem key={jd.id} value={jd.id}>
                      {jd.jobTitle || jd.userEditedRole || jd.extractedRole} at {jd.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedJobDescription && (
          <ApplicationGenerator
            jobDescription={selectedJobDescription}
            key={selectedJobDescription.id} // Re-mounts the component when the JD changes
          />
        )}
      </div>
    </div>
  );
};

export default GenerateApplicationPage;
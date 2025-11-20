import React, { useState } from "react";
import { useJobDescriptions } from "@/context/JobDescriptionContext";
import { JobDescription } from "@/types/job";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const JobDescriptionsPage = () => {
  const { jobDescriptions, isLoading, addJobDescription, updateJobDescription, deleteJobDescription } =
    useJobDescriptions();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingJobDescription, setEditingJobDescription] =
    useState<JobDescription | null>(null);

  const handleAddJobDescription = async (data: Partial<JobDescription>) => {
    await addJobDescription(data);
    setIsFormDialogOpen(false);
  };

  const handleEditJobDescription = (jd: JobDescription) => {
    setEditingJobDescription(jd);
    setIsFormDialogOpen(true);
  };

  const handleSaveEditedJobDescription = async (updatedData: Partial<JobDescription>) => {
    if (editingJobDescription) {
      await updateJobDescription(editingJobDescription.id, updatedData);
    }
    setIsFormDialogOpen(false);
    setEditingJobDescription(null);
  };

  const handleCloseDialog = () => {
    setIsFormDialogOpen(false);
    setEditingJobDescription(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
        <h1 className="text-xl font-medium text-gray-300 text-center max-w-md mt-4">
          Loading job descriptions...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Job Descriptions</h1>
          <Button onClick={() => {
            setEditingJobDescription(null);
            setIsFormDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add New Job Description
          </Button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage all the job descriptions you're applying for. Paste the text, and we'll help extract key details.
        </p>

        <Separator className="my-8" />

        <h2 className="text-2xl font-semibold mb-4">Saved Job Descriptions</h2>
        {jobDescriptions.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <p className="text-lg italic">
              No job descriptions added yet. Click "Add New Job Description" to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {jobDescriptions.map((jd) => (
              <JobDescriptionCard
                key={jd.id}
                jobDescription={jd}
                onEdit={handleEditJobDescription}
                onDelete={deleteJobDescription}
              />
            ))}
          </div>
        )}

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {editingJobDescription ? "Edit Job Description" : "Add New Job Description"}
              </DialogTitle>
              <DialogDescription>
                {editingJobDescription
                  ? "Update the details of this job description."
                  : "Paste the job description text below. We'll try to extract the role and domain."}
              </DialogDescription>
            </DialogHeader>
            <JobDescriptionForm
              initialData={editingJobDescription || undefined}
              onSave={
                editingJobDescription
                  ? handleSaveEditedJobDescription
                  : handleAddJobDescription
              }
              onCancel={handleCloseDialog}
              isNew={!editingJobDescription}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JobDescriptionsPage;
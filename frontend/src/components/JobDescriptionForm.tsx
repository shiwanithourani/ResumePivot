import React, { useState, useEffect } from "react";
import { JobDescription } from "@/types/job";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react"; // Added Sparkles icon
import { useJobDescriptions } from "@/context/JobDescriptionContext";
import { toast } from "sonner";

interface JobDescriptionFormProps {
  initialData?: JobDescription;
  onSave: (data: Partial<JobDescription>) => Promise<void>;
  onCancel?: () => void;
  isNew?: boolean;
}

const JobDescriptionForm = ({
  initialData,
  onSave,
  onCancel,
  isNew = false,
}: JobDescriptionFormProps) => {
  const [originalText, setOriginalText] = useState(initialData?.originalText || "");
  const [extractedRole, setExtractedRole] = useState(initialData?.extractedRole || "");
  const [extractedDomain, setExtractedDomain] = useState(initialData?.extractedDomain || "");
  const [userEditedRole, setUserEditedRole] = useState(initialData?.userEditedRole || "");
  const [userEditedDomain, setUserEditedDomain] = useState(initialData?.userEditedDomain || "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const { isLoading, addJobDescription } = useJobDescriptions();

  useEffect(() => {
    if (initialData) {
      setOriginalText(initialData.originalText || "");
      setExtractedRole(initialData.extractedRole || "");
      setExtractedDomain(initialData.extractedDomain || "");
      setUserEditedRole(initialData.userEditedRole || initialData.extractedRole || "");
      setUserEditedDomain(initialData.userEditedDomain || initialData.extractedDomain || "");
      setJobTitle(initialData.jobTitle || "");
      setCompanyName(initialData.companyName || "");
    } else {
      // Reset for new form
      setOriginalText("");
      setExtractedRole("");
      setExtractedDomain("");
      setUserEditedRole("");
      setUserEditedDomain("");
      setJobTitle("");
      setCompanyName("");
    }
  }, [initialData]);


  const handleExtract = async () => {
    if (!originalText.trim()) {
      toast.warning("Please paste a job description first.");
      return;
    }
    try {
      const response = await apiClient.post("/jobs/extract-details", { text: originalText });
      const { role, domain, title, companyName } = response.data;
      setExtractedRole(role);
      setExtractedDomain(domain);
      setUserEditedRole(role);
      setUserEditedDomain(domain);
      setJobTitle(title);
      setCompanyName(companyName);
      toast.success("Details extracted successfully!");
    } catch (error) {
      toast.error("Failed to extract details.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalText.trim()) {
      toast.error("Job description text cannot be empty.");
      return;
    }

    const dataToSave: Partial<JobDescription> = {
      originalText: originalText.trim(),
      extractedRole: extractedRole,
      extractedDomain: extractedDomain,
      userEditedRole: userEditedRole.trim() || extractedRole, // Use user-edited if available, else extracted
      userEditedDomain: userEditedDomain.trim() || extractedDomain, // Use user-edited if available, else extracted
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
    };

    if (isNew) {
      await addJobDescription(dataToSave);
    } else {
      await onSave(dataToSave);
    }
    onCancel?.(); // Close dialog or reset form after save
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[60vh]">
        <div>
          <Label htmlFor="originalText" className="text-sm font-medium text-gray-700 dark:text-gray-200">Job Description Text</Label>
          <Textarea
            id="originalText"
            placeholder="Paste the job description here..."
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            rows={8}
            required
            disabled={!isNew} // Only allow editing original text for new entries
            className="mt-1"
          />
          {isNew && (
            <Button type="button" onClick={handleExtract} className="mt-3 w-full sm:w-auto" variant="outline">
              <Sparkles className="mr-2 h-4 w-4" /> Extract Role & Domain
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="extractedRole" className="text-sm font-medium text-gray-700 dark:text-gray-200">Extracted Functional Role</Label>
          <Input
            id="extractedRole"
            value={extractedRole}
            readOnly
            className="bg-gray-100 dark:bg-gray-700 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="extractedDomain" className="text-sm font-medium text-gray-700 dark:text-gray-200">Extracted Industry Domain</Label>
          <Input
            id="extractedDomain"
            value={extractedDomain}
            readOnly
            className="bg-gray-100 dark:bg-gray-700 mt-1"
          />
        </div>

        <div>
          <Label htmlFor="userEditedRole" className="text-sm font-medium text-gray-700 dark:text-gray-200">User-Edited Functional Role (Optional Override)</Label>
          <Input
            id="userEditedRole"
            placeholder="Override extracted role"
            value={userEditedRole}
            onChange={(e) => setUserEditedRole(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="userEditedDomain" className="text-sm font-medium text-gray-700 dark:text-gray-200">User-Edited Industry Domain (Optional Override)</Label>
          <Input
            id="userEditedDomain"
            placeholder="Override extracted domain"
            value={userEditedDomain}
            onChange={(e) => setUserEditedDomain(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700 dark:text-gray-200">Job Title</Label>
          <Input
            id="jobTitle"
            placeholder="Enter job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-200">Company Name</Label>
          <Input
            id="companyName"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isNew ? (
            "Add Job Description"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
};

export default JobDescriptionForm;
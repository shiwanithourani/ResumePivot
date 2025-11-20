import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, X } from "lucide-react"; // Added X icon for tags
import { useMasterResume } from "@/context/MasterResumeContext";
import { useApplication } from "@/context/ApplicationContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ApplicationPreview from "./ApplicationPreview";
import { ResumeVersion, CoverLetterVersion } from "@/types/application";
import { JobDescription } from "@/types/job";

interface ApplicationGeneratorProps {
  jobDescription: JobDescription;
}

const ApplicationGenerator = ({ jobDescription }: ApplicationGeneratorProps) => {
  const { masterResume } = useMasterResume();
  const { generateApplicationMaterials, isLoading } = useApplication();

  const [versionName, setVersionName] = useState("");
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern"); // Default template
  const [coverLetterLength, setCoverLetterLength] = useState<
    "short" | "medium" | "long"
  >("medium");

  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<ResumeVersion | null>(
    null,
  );
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<
    CoverLetterVersion | null
  >(null);

  const handleAddQuestion = () => {
    if (newQuestion.trim() && !customQuestions.includes(newQuestion.trim())) {
      setCustomQuestions((prev) => [...prev, newQuestion.trim()]);
      setNewQuestion("");
    } else if (customQuestions.includes(newQuestion.trim())) {
      toast.warning("Question already added!");
    }
  };

  const handleRemoveQuestion = (questionToRemove: string) => {
    setCustomQuestions((prev) =>
      prev.filter((q) => q !== questionToRemove),
    );
  };

  const handleGenerate = async () => {
    if (!masterResume) {
      toast.error("Please upload a master resume first.");
      return;
    }
    if (!versionName.trim()) {
      toast.error("Please provide a name for this application version.");
      return;
    }

    const result = await generateApplicationMaterials(
      masterResume,
      jobDescription,
      versionName.trim(),
      customQuestions,
      selectedTemplate,
      coverLetterLength,
    );

    if (result) {
      setGeneratedResume(result.resume);
      setGeneratedCoverLetter(result.coverLetter);
      setShowPreviewDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
        Generate Application for {jobDescription.jobTitle || jobDescription.userEditedRole} at {jobDescription.companyName}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        You are generating application materials for the job description with the following text: <em>"{jobDescription.originalText.substring(0, 150)}..."</em>
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">1. Application Details</CardTitle>
          <CardDescription>
            Provide a name for this version and any custom questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="versionName" className="text-sm font-medium text-gray-700 dark:text-gray-200">Version Name</Label>
            <Input
              id="versionName"
              placeholder="e.g., Product Manager - Acme Corp"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customQuestions" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Custom Job Questions (for Cover Letter)
            </Label>
            <div className="flex flex-wrap gap-2 mb-2 mt-1">
              {customQuestions.map((q, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200"
                >
                  {q}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-100"
                    onClick={() => handleRemoveQuestion(q)}
                  />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="newQuestion"
                placeholder="Add a question (e.g., 'Why Acme Corp?')"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                className="flex-grow"
              />
              <Button type="button" onClick={handleAddQuestion} variant="outline">
                <PlusCircle className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="coverLetterLength" className="text-sm font-medium text-gray-700 dark:text-gray-200">Cover Letter Length</Label>
            <Select
              onValueChange={(value: "short" | "medium" | "long") =>
                setCoverLetterLength(value)
              }
              value={coverLetterLength}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template" className="text-sm font-medium text-gray-700 dark:text-gray-200">Design Template</Label>
            <Select
              onValueChange={setSelectedTemplate}
              value={selectedTemplate}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleGenerate}
        className="w-full py-3 text-lg"
        disabled={isLoading || !masterResume || !versionName.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Application Materials"
        )}
      </Button>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Generated Application Preview</DialogTitle>
            <DialogDescription>
              Review and edit your tailored resume and cover letter.
            </DialogDescription>
          </DialogHeader>
          {generatedResume && generatedCoverLetter && (
            <ApplicationPreview
              resume={generatedResume}
              coverLetter={generatedCoverLetter}
              onClose={() => setShowPreviewDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationGenerator;
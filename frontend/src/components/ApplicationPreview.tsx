import React, { useState } from "react";
import { ResumeVersion, CoverLetterVersion } from "@/types/application";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplication } from "@/context/ApplicationContext";
import { Loader2, Download, FileText, File } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApplicationPreviewProps {
  resume?: ResumeVersion;
  coverLetter?: CoverLetterVersion;
  onClose: () => void;
}

const ApplicationPreview = ({
  resume,
  coverLetter,
  onClose,
}: ApplicationPreviewProps) => {
  const { updateResumeVersion, updateCoverLetterVersion, updateMasterFromVersion, isLoading } =
    useApplication();

  const [editedResumeContent, setEditedResumeContent] = useState(
    resume ? JSON.stringify(resume.content, null, 2) : "",
  );
  const [editedCoverLetterContent, setEditedCoverLetterContent] = useState(
    coverLetter ? coverLetter.content : "",
  );
  const [editedResumeTagline, setEditedResumeTagline] = useState(resume?.tagline || "");
  const [editedResumeSummary, setEditedResumeSummary] = useState(resume?.summary || "");
  const [showUpdateMasterDialog, setShowUpdateMasterDialog] = useState(false);
  const [currentVersionType, setCurrentVersionType] = useState<"resume" | "coverLetter" | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"resume" | "cover-letter">(resume ? "resume" : "cover-letter");

  const handleSaveResume = async () => {
    if (!resume) return;
    try {
      const parsedContent = JSON.parse(editedResumeContent);
      await updateResumeVersion(resume.id, {
        content: parsedContent,
        tagline: editedResumeTagline,
        summary: editedResumeSummary,
      });
      setCurrentVersionType("resume");
      setCurrentVersionId(resume.id);
      setShowUpdateMasterDialog(true);
    } catch (error) {
      toast.error("Invalid JSON for resume content. Please check your formatting.");
      console.error("Resume save error:", error);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!coverLetter) return;
    await updateCoverLetterVersion(coverLetter.id, {
      content: editedCoverLetterContent,
    });
    setCurrentVersionType("coverLetter");
    setCurrentVersionId(coverLetter.id);
    setShowUpdateMasterDialog(true);
  };

  const handleUpdateMasterConfirm = async () => {
    if (currentVersionType && currentVersionId) {
      await updateMasterFromVersion(currentVersionType, currentVersionId);
    }
    setShowUpdateMasterDialog(false);
  };

  const handleDownload = () => {
    // ... (download logic remains the same)
  };

  const renderResumeEditor = () => (
    <div className="space-y-4 flex-grow p-4 overflow-y-auto">
      <div>
        <Label htmlFor="resumeTagline">Tagline</Label>
        <Input id="resumeTagline" value={editedResumeTagline} onChange={(e) => setEditedResumeTagline(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="resumeSummary">Summary</Label>
        <Textarea id="resumeSummary" value={editedResumeSummary} onChange={(e) => setEditedResumeSummary(e.target.value)} rows={4} />
      </div>
      <div>
        <Label htmlFor="resumeContent">Resume Content (JSON)</Label>
        <Textarea id="resumeContent" value={editedResumeContent} onChange={(e) => setEditedResumeContent(e.target.value)} rows={20} className="font-mono text-xs" />
      </div>
    </div>
  );

  const renderCoverLetterEditor = () => (
    <div className="space-y-4 flex-grow p-4 overflow-y-auto">
      <div>
        <Label htmlFor="coverLetterContent">Cover Letter Content</Label>
        <Textarea id="coverLetterContent" value={editedCoverLetterContent} onChange={(e) => setEditedCoverLetterContent(e.target.value)} rows={25} />
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left Pane: Navigation */}
      <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
        {resume && (
          <Button variant={activeView === 'resume' ? 'secondary' : 'ghost'} onClick={() => setActiveView('resume')} className="justify-start">
            <File className="mr-2 h-4 w-4" /> Resume
          </Button>
        )}
        {coverLetter && (
          <Button variant={activeView === 'cover-letter' ? 'secondary' : 'ghost'} onClick={() => setActiveView('cover-letter')} className="justify-start">
            <FileText className="mr-2 h-4 w-4" /> Cover Letter
          </Button>
        )}
      </div>

      {/* Right Pane: Editor and Actions */}
      <div className="flex-1 flex flex-col">
        <div className="flex-grow overflow-hidden">
          {activeView === 'resume' ? renderResumeEditor() : renderCoverLetterEditor()}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleDownload} disabled={isLoading}><Download className="mr-2 h-4 w-4" /> Download</Button>
          {activeView === 'resume' && (
            <Button onClick={handleSaveResume} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Resume"}
            </Button>
          )}
          {activeView === 'cover-letter' && (
            <Button onClick={handleSaveCoverLetter} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Cover Letter"}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showUpdateMasterDialog} onOpenChange={setShowUpdateMasterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Master Resume?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to apply these changes to your Master Resume as well?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep separate</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateMasterConfirm}>Yes, update Master</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicationPreview;
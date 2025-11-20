import React, { useState } from "react";
import { useApplication } from "@/context/ApplicationContext";
import { ResumeVersion, CoverLetterVersion } from "@/types/application";
import ApplicationVersionCard from "@/components/ApplicationVersionCard";
import { Loader2, FileQuestion } from "lucide-react"; // Added FileQuestion icon
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ApplicationPreview from "@/components/ApplicationPreview";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const MyApplicationsPage = () => {
  const {
    resumeVersions,
    coverLetterVersions,
    isLoading,
    deleteResumeVersion,
    deleteCoverLetterVersion,
  } = useApplication();
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<
    ResumeVersion | CoverLetterVersion | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleViewVersion = (version: ResumeVersion | CoverLetterVersion) => {
    setSelectedVersion(version);
    setShowPreviewDialog(true);
  };

  const handleDeleteVersion = async (
    id: string,
    type: "resume" | "coverLetter",
  ) => {
    if (type === "resume") {
      await deleteResumeVersion(id);
    } else {
      await deleteCoverLetterVersion(id);
    }
  };

  const handleClosePreview = () => {
    setShowPreviewDialog(false);
    setSelectedVersion(null);
  };

  const allVersions = [...resumeVersions, ...coverLetterVersions].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const filteredVersions = allVersions.filter((version) =>
    version.versionName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
        <h1 className="text-xl font-medium text-gray-300 text-center max-w-md mt-4">
          Loading your applications...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Applications</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Here you can find all your generated resume and cover letter versions.
          Review, edit, or delete them as needed.
        </p>

        <Input
          placeholder="Search by version name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6"
        />

        <Separator className="my-8" />

        {filteredVersions.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg italic">
              No application versions found. Generate one from the "Generate Application" page!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {filteredVersions.map((version) => (
              <ApplicationVersionCard
                key={version.id}
                version={version}
                onView={handleViewVersion}
                onDelete={handleDeleteVersion}
              />
            ))}
          </div>
        )}

        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Application Version Preview</DialogTitle>
              <DialogDescription>
                Review and edit your tailored resume and cover letter.
              </DialogDescription>
            </DialogHeader>
            {selectedVersion && (
              <ApplicationPreview
                resume={
                  (selectedVersion as ResumeVersion).tagline !== undefined
                    ? (selectedVersion as ResumeVersion)
                    : undefined
                }
                coverLetter={
                  (selectedVersion as CoverLetterVersion).content !== undefined &&
                  (selectedVersion as ResumeVersion).tagline === undefined
                    ? (selectedVersion as CoverLetterVersion)
                    : undefined
                }
                onClose={handleClosePreview}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyApplicationsPage;
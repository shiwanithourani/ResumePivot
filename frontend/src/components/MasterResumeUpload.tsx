import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useMasterResume } from "@/context/MasterResumeContext";
import { FileUp, Loader2 } from "lucide-react"; // Changed Upload to FileUp for better visual

const MasterResumeUpload = () => {
  const { uploadMasterResume, isLoading } = useMasterResume();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMasterResume(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
      <FileUp className="w-16 h-16 text-blue-500 dark:text-blue-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Upload Your Master Resume
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        Get started by uploading your existing resume (Word or PDF). We'll parse
        it and help you manage your career history efficiently.
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx"
      />
      <Button
        onClick={handleUploadClick}
        disabled={isLoading}
        className="px-6 py-3 text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload Resume"
        )}
      </Button>
    </div>
  );
};

export default MasterResumeUpload;
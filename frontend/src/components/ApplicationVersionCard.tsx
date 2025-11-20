import React from "react";
import { ResumeVersion, CoverLetterVersion } from "@/types/application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileText, File } from "lucide-react";
import { format } from "date-fns";

interface ApplicationVersionCardProps {
  version: ResumeVersion | CoverLetterVersion;
  onView: (version: ResumeVersion | CoverLetterVersion) => void;
  onDelete: (id: string, type: "resume" | "coverLetter") => void;
}

const ApplicationVersionCard = ({
  version,
  onView,
  onDelete,
}: ApplicationVersionCardProps) => {
  const isResume = (version as ResumeVersion).tagline !== undefined;
  const type = isResume ? "resume" : "coverLetter";

  return (
    <Card className="relative hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          {isResume ? <File className="h-5 w-5 text-purple-500 dark:text-purple-400" /> : <FileText className="h-5 w-5 text-teal-500 dark:text-teal-400" />}
          {version.versionName}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(version)}>
            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete this ${type} version?`)) {
                onDelete(version.id, type);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {isResume
            ? (version as ResumeVersion).summary
            : (version as CoverLetterVersion).content.substring(0, 150) + "..."}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {isResume ? "Resume" : "Cover Letter"}
          </Badge>
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
            Created: {format(new Date(version.createdAt), "MMM dd, yyyy")}
          </Badge>
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
            Last Modified: {format(new Date(version.updatedAt), "MMM dd, yyyy")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationVersionCard;
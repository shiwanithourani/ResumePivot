import React from "react";
import { JobDescription } from "@/types/job";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileText } from "lucide-react"; // Added FileText icon
import { format } from "date-fns";

interface JobDescriptionCardProps {
  jobDescription: JobDescription;
  onEdit: (jd: JobDescription) => void;
  onDelete: (id: string) => void;
}

const JobDescriptionCard = ({
  jobDescription,
  onEdit,
  onDelete,
}: JobDescriptionCardProps) => {
  const displayRole = jobDescription.userEditedRole || jobDescription.extractedRole || '';
  const displayDomain = jobDescription.userEditedDomain || jobDescription.extractedDomain || '';

  return (
    <Card className="relative hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          {displayRole}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(jobDescription)}>
            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this job description?")) {
                onDelete(jobDescription.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
          {jobDescription.originalText || ''}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Role: {displayRole}
          </Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Domain: {displayDomain}
          </Badge>
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
            Added: {jobDescription.createdDate ? format(new Date(jobDescription.createdDate), "MMM dd, yyyy") : 'N/A'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionCard;
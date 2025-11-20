import React, { useState, useEffect } from "react";
import { Education } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EducationEditorProps {
  education?: Education; // Optional for adding new
  onSave: (updatedEducation: Education) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const EducationEditor = ({
  education,
  onSave,
  onCancel,
  isNew = false,
}: EducationEditorProps) => {
  const [editedEducation, setEditedEducation] = useState<Education>(
    education || {
      id: `edu-${Date.now()}`,
      degree: "",
      institution: "",
      graduationDate: "",
      description: [],
    },
  );

  useEffect(() => {
    if (education) {
      setEditedEducation(education);
    } else if (isNew) {
      setEditedEducation({
        id: `edu-${Date.now()}`,
        degree: "",
        institution: "",
        graduationDate: "",
        description: [],
      });
    }
  }, [education, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "description") {
      setEditedEducation((prev) => ({
        ...prev,
        description: value.split("\n").filter((line) => line.trim() !== ""),
      }));
    } else {
      setEditedEducation((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editedEducation.degree ||
      !editedEducation.institution ||
      !editedEducation.graduationDate
    ) {
      toast.error("Degree, Institution, and Graduation Date are required.");
      return;
    }
    onSave(editedEducation);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Label htmlFor="degree" className="text-sm font-medium text-gray-700 dark:text-gray-200">Degree / Field of Study</Label>
        <Input
          id="degree"
          name="degree"
          value={editedEducation.degree}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="institution" className="text-sm font-medium text-gray-700 dark:text-gray-200">Institution</Label>
        <Input
          id="institution"
          name="institution"
          value={editedEducation.institution}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="graduationDate" className="text-sm font-medium text-gray-700 dark:text-gray-200">Graduation Date</Label>
        <Input
          id="graduationDate"
          name="graduationDate"
          type="date"
          value={editedEducation.graduationDate}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">Description (Optional, one bullet point per line)</Label>
        <Textarea
          id="description"
          name="description"
          value={editedEducation.description?.join("\n") || ""}
          onChange={handleChange}
          rows={3}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default EducationEditor;
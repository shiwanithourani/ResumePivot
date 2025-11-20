import React, { useState, useEffect } from "react";
import { PersonalInfo } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PersonalInfoEditorProps {
  personalInfo: PersonalInfo;
  onSave: (updatedInfo: PersonalInfo) => void;
  onCancel: () => void;
}

const PersonalInfoEditor = ({
  personalInfo,
  onSave,
  onCancel,
}: PersonalInfoEditorProps) => {
  const [editedInfo, setEditedInfo] = useState<PersonalInfo>(personalInfo);

  useEffect(() => {
    setEditedInfo(personalInfo);
  }, [personalInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedInfo.name || !editedInfo.email || !editedInfo.phone) {
      toast.error("Name, Email, and Phone are required.");
      return;
    }
    onSave(editedInfo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</Label>
        <Input
          id="name"
          name="name"
          value={editedInfo.name}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={editedInfo.email}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={editedInfo.phone}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700 dark:text-gray-200">LinkedIn Profile URL (Optional)</Label>
        <Input
          id="linkedin"
          name="linkedin"
          placeholder="e.g., linkedin.com/in/yourprofile"
          value={editedInfo.linkedin || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-200">Personal Website (Optional)</Label>
        <Input
          id="website"
          name="website"
          placeholder="e.g., yourwebsite.com"
          value={editedInfo.website || ""}
          onChange={handleChange}
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

export default PersonalInfoEditor;
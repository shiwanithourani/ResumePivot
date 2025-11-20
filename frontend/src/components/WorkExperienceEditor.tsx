import React, { useState, useEffect } from "react";
import { WorkExperience } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface WorkExperienceEditorProps {
  workExperience: WorkExperience;
  onSave: (updatedExperience: WorkExperience) => void;
  onCancel: () => void;
}

const WorkExperienceEditor = ({
  workExperience,
  onSave,
  onCancel,
}: WorkExperienceEditorProps) => {
  const [editedExperience, setEditedExperience] =
    useState<WorkExperience>(workExperience);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setEditedExperience(workExperience);
  }, [workExperience]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedExperience((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setEditedExperience((prev) => ({
      ...prev,
      description: value.split("\n").filter((line) => line.trim() !== ""),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedExperience.tags.includes(newTag.trim())) {
      setEditedExperience((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    } else if (editedExperience.tags.includes(newTag.trim())) {
      toast.warning("Tag already exists!");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedExperience((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedExperience);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">Title</Label>
        <Input
          id="title"
          name="title"
          value={editedExperience.title}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-200">Company</Label>
        <Input
          id="company"
          name="company"
          value={editedExperience.company}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-200">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={editedExperience.startDate}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-200">End Date (or 'Present')</Label>
          <Input
            id="endDate"
            name="endDate"
            value={editedExperience.endDate || ""}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">Description (one bullet point per line)</Label>
        <Textarea
          id="description"
          name="description"
          value={editedExperience.description.join("\n")}
          onChange={handleDescriptionChange}
          rows={5}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="tags" className="text-sm font-medium text-gray-700 dark:text-gray-200">Tags (Functional Role, Industry Domain)</Label>
        <div className="flex flex-wrap gap-2 mb-2 mt-1">
          {editedExperience.tags.map((tag, index) => (
            <Badge key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-100"
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="newTag"
            placeholder="Add new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-grow"
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
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

export default WorkExperienceEditor;
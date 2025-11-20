import React, { useState, useEffect } from "react";
import { Certification } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CertificationEditorProps {
  certification?: Certification; // Optional for adding new
  onSave: (updatedCertification: Certification) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const CertificationEditor = ({
  certification,
  onSave,
  onCancel,
  isNew = false,
}: CertificationEditorProps) => {
  const [editedCertification, setEditedCertification] = useState<Certification>(
    certification || {
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      date: "",
    },
  );

  useEffect(() => {
    if (certification) {
      setEditedCertification(certification);
    } else if (isNew) {
      setEditedCertification({
        id: `cert-${Date.now()}`,
        name: "",
        issuer: "",
        date: "",
      });
    }
  }, [certification, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCertification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editedCertification.name ||
      !editedCertification.issuer ||
      !editedCertification.date
    ) {
      toast.error("Name, Issuer, and Date are required.");
      return;
    }
    onSave(editedCertification);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-200">Certification Name</Label>
        <Input
          id="name"
          name="name"
          value={editedCertification.name}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="issuer" className="text-sm font-medium text-gray-700 dark:text-gray-200">Issuing Organization</Label>
        <Input
          id="issuer"
          name="issuer"
          value={editedCertification.issuer}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-200">Date Issued / Completed</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={editedCertification.date}
          onChange={handleChange}
          required
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

export default CertificationEditor;
import React, { useState } from "react";
import { useMasterResume } from "@/context/MasterResumeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Trash2,
  Loader2,
  Edit,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import WorkExperienceEditor from "./WorkExperienceEditor";
import PersonalInfoEditor from "./PersonalInfoEditor";
import EducationEditor from "./EducationEditor";
import CertificationEditor from "./CertificationEditor";
import { WorkExperience, PersonalInfo, Education, Certification } from "@/types/resume";
import { toast } from "sonner";

const MasterResumeEditor = () => {
  const { masterResume, deleteMasterResume, updateMasterResume, isLoading } =
    useMasterResume();
  const [isWorkExperienceEditDialogOpen, setIsWorkExperienceEditDialogOpen] = useState(false);
  const [currentEditingExperience, setCurrentEditingExperience] =
    useState<WorkExperience | null>(null);
  const [isPersonalInfoEditDialogOpen, setIsPersonalInfoEditDialogOpen] = useState(false);
  const [isEducationEditDialogOpen, setIsEducationEditDialogOpen] = useState(false);
  const [currentEditingEducation, setCurrentEditingEducation] =
    useState<Education | null>(null);
  const [isCertificationEditDialogOpen, setIsCertificationEditDialogOpen] = useState(false);
  const [currentEditingCertification, setCurrentEditingCertification] =
    useState<Certification | null>(null);
  const [isAddingNewWorkExperience, setIsAddingNewWorkExperience] = useState(false);
  const [isAddingNewEducation, setIsAddingNewEducation] = useState(false);
  const [isAddingNewCertification, setIsAddingNewCertification] = useState(false);


  if (!masterResume) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p className="text-lg">No master resume found. Please upload one to get started.</p>
      </div>
    );
  }

  const { personalInfo, workHistory, education, certifications } = masterResume;

  // --- Personal Info Handlers ---
  const handleEditPersonalInfo = () => {
    setIsPersonalInfoEditDialogOpen(true);
  };

  const handleSavePersonalInfo = async (updatedInfo: PersonalInfo) => {
    await updateMasterResume({ personalInfo: updatedInfo });
    setIsPersonalInfoEditDialogOpen(false);
  };

  // --- Work Experience Handlers ---
  const handleEditWorkExperience = (experience: WorkExperience) => {
    setCurrentEditingExperience(experience);
    setIsWorkExperienceEditDialogOpen(true);
    setIsAddingNewWorkExperience(false);
  };

  const handleAddWorkExperience = () => {
    setCurrentEditingExperience(null); // Clear any previous editing state
    setIsWorkExperienceEditDialogOpen(true);
    setIsAddingNewWorkExperience(true);
  };

  const handleSaveWorkExperience = async (updatedExperience: WorkExperience) => {
    if (!masterResume) return;

    let updatedWorkHistory;
    if (isAddingNewWorkExperience) {
      updatedWorkHistory = [...masterResume.workHistory, updatedExperience];
    } else {
      updatedWorkHistory = masterResume.workHistory.map((exp) =>
        exp.id === updatedExperience.id ? updatedExperience : exp,
      );
    }

    await updateMasterResume({ workHistory: updatedWorkHistory });
    setIsWorkExperienceEditDialogOpen(false);
    setCurrentEditingExperience(null);
    setIsAddingNewWorkExperience(false);
  };

  const handleDeleteWorkExperience = async (id: string) => {
    if (!masterResume) return;
    if (window.confirm("Are you sure you want to delete this work experience entry?")) {
      const updatedWorkHistory = masterResume.workHistory.filter((exp) => exp.id !== id);
      await updateMasterResume({ workHistory: updatedWorkHistory });
      toast.success("Work experience deleted.");
    }
  };

  // --- Education Handlers ---
  const handleEditEducation = (edu: Education) => {
    setCurrentEditingEducation(edu);
    setIsEducationEditDialogOpen(true);
    setIsAddingNewEducation(false);
  };

  const handleAddEducation = () => {
    setCurrentEditingEducation(null);
    setIsEducationEditDialogOpen(true);
    setIsAddingNewEducation(true);
  };

  const handleSaveEducation = async (updatedEducation: Education) => {
    if (!masterResume) return;

    let updatedEducationList;
    if (isAddingNewEducation) {
      updatedEducationList = [...masterResume.education, updatedEducation];
    } else {
      updatedEducationList = masterResume.education.map((edu) =>
        edu.id === updatedEducation.id ? updatedEducation : edu,
      );
    }

    await updateMasterResume({ education: updatedEducationList });
    setIsEducationEditDialogOpen(false);
    setCurrentEditingEducation(null);
    setIsAddingNewEducation(false);
  };

  const handleDeleteEducation = async (id: string) => {
    if (!masterResume) return;
    if (window.confirm("Are you sure you want to delete this education entry?")) {
      const updatedEducationList = masterResume.education.filter((edu) => edu.id !== id);
      await updateMasterResume({ education: updatedEducationList });
      toast.success("Education entry deleted.");
    }
  };

  // --- Certifications Handlers ---
  const handleEditCertification = (cert: Certification) => {
    setCurrentEditingCertification(cert);
    setIsCertificationEditDialogOpen(true);
    setIsAddingNewCertification(false);
  };

  const handleAddCertification = () => {
    setCurrentEditingCertification(null);
    setIsCertificationEditDialogOpen(true);
    setIsAddingNewCertification(true);
  };

  const handleSaveCertification = async (updatedCertification: Certification) => {
    if (!masterResume) return;

    let updatedCertificationsList;
    if (isAddingNewCertification) {
      updatedCertificationsList = [...masterResume.certifications, updatedCertification];
    } else {
      updatedCertificationsList = masterResume.certifications.map((cert) =>
        cert.id === updatedCertification.id ? updatedCertification : cert,
      );
    }

    await updateMasterResume({ certifications: updatedCertificationsList });
    setIsCertificationEditDialogOpen(false);
    setCurrentEditingCertification(null);
    setIsAddingNewCertification(false);
  };

  const handleDeleteCertification = async (id: string) => {
    if (!masterResume) return;
    if (window.confirm("Are you sure you want to delete this certification entry?")) {
      const updatedCertificationsList = masterResume.certifications.filter((cert) => cert.id !== id);
      await updateMasterResume({ certifications: updatedCertificationsList });
      toast.success("Certification entry deleted.");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Your Master Resume
        </h1>
        <Button
          variant="destructive"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete your master resume? This action cannot be undone.",
              )
            ) {
              deleteMasterResume();
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Master Resume
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-semibold">
            Personal Information
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditPersonalInfo}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-gray-700 dark:text-gray-200">
          <p className="text-2xl font-bold">{personalInfo.name}</p>
          <div className="flex items-center text-base">
            <Mail className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> {personalInfo.email}
          </div>
          <div className="flex items-center text-base">
            <Phone className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> {personalInfo.phone}
          </div>
          {personalInfo.linkedin && (
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-base">
              <Linkedin className="mr-2 h-4 w-4" />
              <a
                href={`https://${personalInfo.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {personalInfo.linkedin}
              </a>
            </div>
          )}
          {personalInfo.website && (
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-base">
              <Globe className="mr-2 h-4 w-4" />
              <a
                href={`https://${personalInfo.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {personalInfo.website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-semibold">
            <Briefcase className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" /> Work History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddWorkExperience}>
            <Plus className="h-4 w-4 mr-2" /> Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {workHistory.map((job) => (
            <div
              key={job.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{job.title}</h3>
                <p className="text-gray-700 dark:text-gray-200">{job.company}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {job.startDate} - {job.endDate || "Present"}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                  {job.description.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
                {job.tags && job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 mt-2 sm:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditWorkExperience(job)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleDeleteWorkExperience(job.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-semibold">
            <GraduationCap className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" /> Education
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddEducation}>
            <Plus className="h-4 w-4 mr-2" /> Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{edu.degree}</h3>
                <p className="text-gray-700 dark:text-gray-200">
                  {edu.institution}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Graduated: {edu.graduationDate}
                </p>
                {edu.description && edu.description.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                    {edu.description.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-1 mt-2 sm:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditEducation(edu)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleDeleteEducation(edu.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-xl font-semibold">
            <Award className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" /> Certifications
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddCertification}>
            <Plus className="h-4 w-4 mr-2" /> Add Certification
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {certifications && certifications.length > 0 ? (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{cert.name}</h3>
                  <p className="text-gray-700 dark:text-gray-200">
                    Issuer: {cert.issuer}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Date: {cert.date}
                  </p>
                </div>
                <div className="flex gap-1 mt-2 sm:mt-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditCertification(cert)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleDeleteCertification(cert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4 italic">
              No certifications added yet. Click "Add Certification" to get started!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog for editing Personal Information */}
      <Dialog open={isPersonalInfoEditDialogOpen} onOpenChange={setIsPersonalInfoEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
            <DialogDescription>
              Update your contact and personal details.
            </DialogDescription>
          </DialogHeader>
          {personalInfo && (
            <PersonalInfoEditor
              personalInfo={personalInfo}
              onSave={handleSavePersonalInfo}
              onCancel={() => setIsPersonalInfoEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for editing/adding Work Experience */}
      <Dialog open={isWorkExperienceEditDialogOpen} onOpenChange={setIsWorkExperienceEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{isAddingNewWorkExperience ? "Add New Work Experience" : "Edit Work Experience"}</DialogTitle>
            <DialogDescription>
              {isAddingNewWorkExperience ? "Add a new entry to your work history." : "Make changes to your work experience here. Click save when you're done."}
            </DialogDescription>
          </DialogHeader>
          <WorkExperienceEditor
            workExperience={currentEditingExperience || {
              id: `we-${Date.now()}`,
              title: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              description: [],
              tags: [],
            }}
            onSave={handleSaveWorkExperience}
            onCancel={() => setIsWorkExperienceEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for editing/adding Education */}
      <Dialog open={isEducationEditDialogOpen} onOpenChange={setIsEducationEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isAddingNewEducation ? "Add New Education Entry" : "Edit Education Entry"}</DialogTitle>
            <DialogDescription>
              {isAddingNewEducation ? "Add a new academic qualification." : "Update your education details."}
            </DialogDescription>
          </DialogHeader>
          <EducationEditor
            education={currentEditingEducation || undefined}
            onSave={handleSaveEducation}
            onCancel={() => setIsEducationEditDialogOpen(false)}
            isNew={isAddingNewEducation}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for editing/adding Certifications */}
      <Dialog open={isCertificationEditDialogOpen} onOpenChange={setIsCertificationEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isAddingNewCertification ? "Add New Certification" : "Edit Certification"}</DialogTitle>
            <DialogDescription>
              {isAddingNewCertification ? "Add a new professional certification." : "Update your certification details."}
            </DialogDescription>
          </DialogHeader>
          <CertificationEditor
            certification={currentEditingCertification || undefined}
            onSave={handleSaveCertification}
            onCancel={() => setIsCertificationEditDialogOpen(false)}
            isNew={isAddingNewCertification}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterResumeEditor;
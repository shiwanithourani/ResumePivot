import { useMasterResume } from "@/context/MasterResumeContext";
import MasterResumeUpload from "@/components/MasterResumeUpload";
import MasterResumeEditor from "@/components/MasterResumeEditor";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { masterResume, isLoading } = useMasterResume();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
        <h1 className="text-xl font-medium text-gray-300 text-center max-w-md mt-4">
          Loading your ResumePivot workspace...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {!masterResume ? <MasterResumeUpload /> : <MasterResumeEditor />}
      </div>
    </div>
  );
};

export default Index;
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import JobDescriptionsPage from "./pages/JobDescriptionsPage";
import GenerateApplicationPage from "./pages/GenerateApplicationPage";
import MyApplicationsPage from "./pages/MyApplicationsPage"; // Import the new page
import UpgradePage from "./pages/UpgradePage";
import { MasterResumeProvider } from "./context/MasterResumeContext";
import { JobDescriptionProvider } from "./context/JobDescriptionContext";
import { ApplicationProvider } from "./context/ApplicationContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can return a global loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <MasterResumeProvider>
      <JobDescriptionProvider>
        <ApplicationProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/job-descriptions" element={<JobDescriptionsPage />} />
            <Route
              path="/generate-application"
              element={<GenerateApplicationPage />}
            />
            <Route path="/my-applications" element={<MyApplicationsPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ApplicationProvider>
      </JobDescriptionProvider>
    </MasterResumeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
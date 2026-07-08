import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/app/Dashboard";
import Companies from "./pages/app/Companies";
import OAQuestions from "./pages/app/OAQuestions";
import OADetail from "./pages/app/OADetail";
import OANew from "./pages/app/OANew";
import Experiences from "./pages/app/Experiences";
import Calendar from "./pages/app/Calendar";
import Forum from "./pages/app/Forum";
import ForumNew from "./pages/app/ForumNew";
import ForumThread from "./pages/app/ForumThread";
import MockInterview from "./pages/app/MockInterview";
import Profile from "./pages/app/Profile";
import NotFound from "./pages/NotFound.tsx";
import CompanyDetail from "./pages/app/CompanyDetail";
import ExperienceDetail from "./pages/app/ExperienceDetail";
import ExperienceNew from "./pages/app/ExperienceNew";
import AdminApprovals from "./pages/app/AdminApprovals";
import AdminDashboard from "./pages/app/AdminDashboard";
import AdminUsers from "./pages/app/AdminUsers";
import AdminReports from "./pages/app/AdminReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:slug" element={<CompanyDetail />} />
              <Route path="oa" element={<OAQuestions />} />
              <Route path="oa/new" element={<OANew />} />
              <Route path="oa/:slug" element={<OADetail />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="experiences/new" element={<ExperienceNew />} />
              <Route path="experiences/:id" element={<ExperienceDetail />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="forum" element={<Forum />} />
              <Route path="forum/new" element={<ForumNew />} />
              <Route path="forum/:id" element={<ForumThread />} />
              <Route path="mock-interview" element={<MockInterview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin/approvals" element={<AdminApprovals />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/reports" element={<AdminReports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

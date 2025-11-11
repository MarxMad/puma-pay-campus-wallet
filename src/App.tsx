import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import AuthStatus from "@/components/AuthStatus";
import Welcome from "./pages/Welcome";
import Signup from "./pages/Signup";
import Index from "./pages/Index";
import HomePage from "./pages/Home";
import SendPage from "./pages/Send";
import ReceivePage from "./pages/Receive";
import DebugPage from "./pages/Debug";
import CategoriesPage from "./pages/Categories";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import CampusMap from "./pages/CampusMap";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { JunoDemo } from "./pages/JunoDemo";
import CoursesPage from "./pages/Courses";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AuthStatus />
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
            <Route path="/receive" element={<ProtectedRoute><ReceivePage /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/campus-map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/juno-demo" element={<JunoDemo />} />
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

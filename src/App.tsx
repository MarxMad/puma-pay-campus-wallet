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
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import SignupSuccess from "./pages/SignupSuccess";
import Index from "./pages/Index";
import HomePage from "./pages/Home";
import SendPage from "./pages/Send";
import ReceivePage from "./pages/Receive";
import DebugPage from "./pages/Debug";
import CategoriesPage from "./pages/Categories";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
// Notifications: página desactivada (menú desplegable en Home en su lugar)
import CampusMap from "./pages/CampusMap";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { JunoDemo } from "./pages/JunoDemo";
import CoursesPage from "./pages/Courses";
import CategoryCoursesPage from "./pages/CategoryCourses";
import { ZKDemo } from "./pages/ZKDemo";
import { SavingsGoals } from "./pages/SavingsGoals";
import { CourseDetail } from "./pages/CourseDetail";
import { Feed } from "./pages/Feed";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Terminos from "./pages/Terminos";
import AvisoPrivacidad from "./pages/AvisoPrivacidad";
import { CookieConsent } from "@/components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AuthStatus />
        <BrowserRouter>
          <CookieConsent />
          <Routes>
            <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/signup-success" element={<PublicRoute><SignupSuccess /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
            <Route path="/receive" element={<ProtectedRoute><ReceivePage /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* Notifications desactivado: menú en Home (Cerrar sesión, Ver balance, Configuración) */}
            <Route path="/campus-map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/courses/category/:categorySlug" element={<ProtectedRoute><CategoryCoursesPage /></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            {/* Metas de ahorro: ruta oculta para usuarios (código conservado) */}
            {/* <Route path="/savings-goals" element={<ProtectedRoute><SavingsGoals /></ProtectedRoute>} /> */}
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/marketplace/:productId" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/marketplace/:productId/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/juno-demo" element={<JunoDemo />} />
            <Route path="/zk-demo" element={<ZKDemo />} />
            <Route path="/" element={<Landing />} />
            <Route path="/index" element={<Index />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/aviso-privacidad" element={<AvisoPrivacidad />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

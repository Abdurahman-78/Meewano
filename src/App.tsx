import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import HostDashboard from "./pages/HostDashboard";
import GuestDashboard from "./pages/GuestDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import SearchResults from "./pages/SearchResults";
import BookingConfirmation from "./pages/BookingConfirmation";
import Messages from "./pages/Messages";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import HostProfile from "./pages/HostProfile";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";
import AccountSettings from "./pages/AccountSettings";
import HostVerification from "./pages/HostVerification";
import GuestBookings from "./pages/GuestBookings";
import HostBookings from "./pages/HostBookings";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import HostAnalytics from "./pages/HostAnalytics";
import PricingTools from "./pages/PricingTools";
import ContactUs from "./pages/ContactUs";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import CancellationPolicy from "./pages/CancellationPolicy";
import AboutUs from "./pages/AboutUs";
import MapPage from "./pages/MapPage";
import DiscoverPage from "./pages/DiscoverPage";
import BookingConfirmationEmail from "./pages/emails/BookingConfirmationEmail";
import PaymentFailureEmail from "./pages/emails/PaymentFailureEmail";
import PasswordResetEmail from "./pages/emails/PasswordResetEmail";
import NewMessageEmail from "./pages/emails/NewMessageEmail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchResults /></PageTransition>} />
        <Route path="/map" element={<PageTransition><MapPage /></PageTransition>} />
        <Route path="/discover" element={<PageTransition><DiscoverPage /></PageTransition>} />
        <Route path="/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
        <Route path="/account-settings" element={<PageTransition><AccountSettings /></PageTransition>} />
        
        {/* Guest Routes */}
        <Route path="/guest" element={<PageTransition><GuestDashboard /></PageTransition>} />
        <Route path="/guest/bookings" element={<PageTransition><GuestBookings /></PageTransition>} />
        
        {/* Host Routes */}
        <Route path="/host" element={<PageTransition><HostDashboard /></PageTransition>} />
        <Route path="/host/add-listing" element={<PageTransition><AddListing /></PageTransition>} />
        <Route path="/host/edit-listing/:id" element={<PageTransition><EditListing /></PageTransition>} />
        <Route path="/host/verification" element={<PageTransition><HostVerification /></PageTransition>} />
        <Route path="/host/bookings" element={<PageTransition><HostBookings /></PageTransition>} />
        <Route path="/host/analytics" element={<PageTransition><HostAnalytics /></PageTransition>} />
        <Route path="/host/pricing" element={<PageTransition><PricingTools /></PageTransition>} />
        <Route path="/host/:id" element={<PageTransition><HostProfile /></PageTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
        
        {/* Booking & Payment Routes */}
        <Route path="/booking-confirmation" element={<PageTransition><BookingConfirmation /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />
        <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
        <Route path="/payment-failure" element={<PageTransition><PaymentFailure /></PageTransition>} />
        
        {/* Communication */}
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        
        {/* Help & Support */}
        <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />
        <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutUs /></PageTransition>} />

        {/* Blog */}
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/cookies" element={<PageTransition><Cookies /></PageTransition>} />
        <Route path="/cancellation" element={<PageTransition><CancellationPolicy /></PageTransition>} />
        
        {/* Email Templates (Design Reference) */}
        <Route path="/emails/booking-confirmation" element={<PageTransition><BookingConfirmationEmail /></PageTransition>} />
        <Route path="/emails/payment-failure" element={<PageTransition><PaymentFailureEmail /></PageTransition>} />
        <Route path="/emails/password-reset" element={<PageTransition><PasswordResetEmail /></PageTransition>} />
        <Route path="/emails/new-message" element={<PageTransition><NewMessageEmail /></PageTransition>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ModeToggleFloatingButton from "@/components/ModeToggleFloatingButton";
import PreLaunchHostModal from "@/components/PreLaunchHostModal";
import PreLaunchPropertyDetailModal from "@/components/PreLaunchPropertyDetailModal";

interface AppLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

const AppLayout = ({ children, hideFooter = false, hideHeader = false }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background mobile-content-padding relative">
      {!hideHeader && <Header />}
      {children}
      {!hideFooter && <div className="hidden md:block"><Footer /></div>}
      <MobileBottomNav />

      {/* Floating View Mode Switcher (Persistent Bottom-Right) */}
      <ModeToggleFloatingButton />

      {/* Global Pre-Launch Modals */}
      <PreLaunchHostModal />
      <PreLaunchPropertyDetailModal />
    </div>
  );
};

export default AppLayout;

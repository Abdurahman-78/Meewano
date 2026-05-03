import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

const AppLayout = ({ children, hideFooter = false, hideHeader = false }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background mobile-content-padding">
      {!hideHeader && <Header />}
      {children}
      {!hideFooter && <div className="hidden md:block"><Footer /></div>}
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import { cn } from "@/lib/utils";

/**
 * Renders the SearchBar in place. As the user scrolls past the threshold,
 * a compact copy slides down and docks just below the sticky Header.
 */
const CollapsibleSearch = ({ className }: { className?: string }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={cn("w-full", className)}>
        <SearchBar />
      </div>

      {/* Docked full search bar — stays above listing cards and favorite buttons when scrolled */}
      <div
        aria-hidden={!collapsed}
        className={cn(
          "fixed left-0 right-0 z-[9999] transition-all duration-300 ease-out isolate",
          "top-[52px] md:top-[76px]",
          collapsed
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "-translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background border-b border-border shadow-lg">
          <div className="container mx-auto px-3 md:px-4 py-2 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </div>
    </>
  );
};

export default CollapsibleSearch;

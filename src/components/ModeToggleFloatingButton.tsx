import React from "react";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, Eye, ArrowRightLeft } from "lucide-react";

export const ModeToggleFloatingButton: React.FC = () => {
  const { mode, setMode } = usePreLaunch();

  return (
    <aside
      aria-label="Mode switch controls"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center shadow-2xl rounded-full bg-card/95 backdrop-blur-md border-2 border-primary/30 p-1.5 transition-all duration-300 hover:border-primary/60"
    >
      <div className="flex items-center gap-2 pl-3 pr-2 py-1 text-xs font-semibold text-muted-foreground select-none">
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === "pre-launch" ? "bg-primary/80" : "bg-emerald-400"}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${mode === "pre-launch" ? "bg-primary" : "bg-emerald-500"}`} />
        </span>
        <span className="hidden sm:inline font-mono tracking-tight uppercase text-[11px] text-foreground/80">
          View:
        </span>
      </div>

      <div className="flex items-center bg-muted/60 p-1 rounded-full border border-border/50 gap-1">
        <Button
          id="toggle-live-mode-btn"
          size="sm"
          variant={mode === "live" ? "default" : "ghost"}
          className={`h-8 px-3 rounded-full text-xs font-medium transition-all ${
            mode === "live"
              ? "bg-primary text-primary-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          onClick={() => setMode("live")}
        >
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          Live Website
        </Button>

        <Button
          id="toggle-prelaunch-mode-btn"
          size="sm"
          variant={mode === "pre-launch" ? "default" : "ghost"}
          className={`h-8 px-3 rounded-full text-xs font-medium transition-all ${
            mode === "pre-launch"
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          onClick={() => setMode("pre-launch")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Pre-Launch Mode
        </Button>
      </div>
    </aside>
  );
};

export default ModeToggleFloatingButton;

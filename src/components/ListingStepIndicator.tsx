import { Home, MapPin, Image } from "lucide-react";

interface Step {
  number: number;
  label: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { number: 1, label: "Property Info", icon: <Home className="h-4 w-4" /> },
  { number: 2, label: "Location & Amenities", icon: <MapPin className="h-4 w-4" /> },
  { number: 3, label: "Photos & Documents", icon: <Image className="h-4 w-4" /> },
];

export default function ListingStepIndicator() {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />

        {steps.map((step, index) => (
          <div key={step.number} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary bg-primary text-primary-foreground font-bold text-sm shadow-sm"
            >
              {step.number}
            </div>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap hidden sm:block">
              {step.label}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap sm:hidden flex items-center gap-1">
              {step.icon}
              <span className="sr-only">{step.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

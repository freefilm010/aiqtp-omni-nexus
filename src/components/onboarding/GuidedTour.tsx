import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  steps: TourStep[];
  tourKey: string; // localStorage key to track completion
  autoStart?: boolean;
}

const GuidedTour = ({ steps, tourKey, autoStart = false }: GuidedTourProps) => {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const storageKey = `tour_completed_${tourKey}`;

  useEffect(() => {
    if (autoStart && !localStorage.getItem(storageKey)) {
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, storageKey]);

  const positionTooltip = useCallback(() => {
    if (!active || !steps[currentStep]) return;
    const el = document.querySelector(steps[currentStep].target);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for scroll to finish
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const pos = steps[currentStep].position || "bottom";

      // Highlight the target
      el.classList.add("tour-highlight");

      const style: React.CSSProperties = {
        position: "fixed",
        zIndex: 10001,
      };

      const tooltipWidth = 280;
      const tooltipHeight = 140;

      switch (pos) {
        case "bottom":
          style.top = rect.bottom + 12;
          style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8));
          break;
        case "top":
          style.top = rect.top - tooltipHeight - 12;
          style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 8));
          break;
        case "right":
          style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
          style.left = rect.right + 12;
          break;
        case "left":
          style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
          style.left = rect.left - tooltipWidth - 12;
          break;
      }

      setTooltipStyle(style);
    }, 400);
  }, [active, currentStep, steps]);

  useEffect(() => {
    positionTooltip();
    return () => {
      // Clean up highlights
      document.querySelectorAll(".tour-highlight").forEach(el =>
        el.classList.remove("tour-highlight")
      );
    };
  }, [positionTooltip]);

  const goNext = () => {
    document.querySelectorAll(".tour-highlight").forEach(el =>
      el.classList.remove("tour-highlight")
    );
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const goPrev = () => {
    document.querySelectorAll(".tour-highlight").forEach(el =>
      el.classList.remove("tour-highlight")
    );
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const endTour = () => {
    document.querySelectorAll(".tour-highlight").forEach(el =>
      el.classList.remove("tour-highlight")
    );
    setActive(false);
    setCurrentStep(0);
    localStorage.setItem(storageKey, "true");
  };

  const startTour = () => {
    setCurrentStep(0);
    setActive(true);
    localStorage.removeItem(storageKey);
  };

  if (!active) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={startTour}
        className="gap-1.5 text-xs"
      >
        <Sparkles className="h-3 w-3" />
        Quick Tour
      </Button>
    );
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[10000] transition-opacity"
        onClick={endTour}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="w-[280px] bg-card border border-primary/30 rounded-lg shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h4 className="font-semibold text-sm">{step.title}</h4>
          </div>
          <button onClick={endTour} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {step.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? "w-4 bg-primary"
                  : i < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="text-xs h-7"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
          <Button size="sm" onClick={goNext} className="text-xs h-7">
            {currentStep === steps.length - 1 ? "Done" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;

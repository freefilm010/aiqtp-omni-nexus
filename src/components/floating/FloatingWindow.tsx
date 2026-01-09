import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, X } from "lucide-react";

type Props = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  onUpdate: (patch: { x?: number; y?: number; width?: number; height?: number; minimized?: boolean }) => void;
  children: React.ReactNode;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const FloatingWindow = ({
  id,
  title,
  x,
  y,
  width,
  height,
  minimized,
  zIndex,
  onClose,
  onFocus,
  onUpdate,
  children,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const style = useMemo(() => {
    const w = clamp(width, 320, window.innerWidth - 24);
    const h = clamp(height, 200, window.innerHeight - 24);
    const left = clamp(x, 12, window.innerWidth - 12 - w);
    const top = clamp(y, 12, window.innerHeight - 12 - h);

    return {
      left,
      top,
      width: w,
      height: minimized ? undefined : h,
      zIndex,
    } as React.CSSProperties;
  }, [height, minimized, width, x, y, zIndex]);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const ro = new ResizeObserver(() => {
      if (!el || minimized) return;
      const rect = el.getBoundingClientRect();
      onUpdate({ width: rect.width, height: rect.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [minimized, onUpdate]);

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    onFocus();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: x,
      originY: y,
    };

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      onUpdate({ x: d.originX + dx, y: d.originY + dy });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-auto fixed rounded-xl border bg-background shadow-2xl overflow-hidden",
        minimized ? "w-[360px] h-auto" : ""
      )}
      style={{
        ...style,
        resize: minimized ? ("none" as const) : ("both" as const),
      }}
      onPointerDown={onFocus}
      aria-label={title}
      role="dialog"
    >
      <div
        className="h-10 flex items-center justify-between px-2 border-b bg-muted/70 select-none"
        onPointerDown={startDrag}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/70" />
          <span className="text-sm font-semibold truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ minimized: !minimized });
            }}
            aria-label={minimized ? "Restore" : "Minimize"}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <div className="h-[calc(100%-40px)] overflow-auto">
          {children}
        </div>
      )}

      {minimized && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Window minimized — click the title bar to move, click “–” to restore.
        </div>
      )}
    </div>
  );
};

export default FloatingWindow;

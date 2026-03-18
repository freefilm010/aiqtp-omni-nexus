import { useRef, useState, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Vertical margin around the root to trigger early loading */
  rootMargin?: string;
  /** Minimum height placeholder before content loads */
  minHeight?: string;
  /** CSS class for the wrapper */
  className?: string;
}

/**
 * Defers rendering of children until the section scrolls into (or near) the viewport.
 * Uses IntersectionObserver for zero-cost idle state.
 */
const LazySection = ({
  children,
  rootMargin = "200px",
  minHeight = "200px",
  className,
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
};

export default LazySection;

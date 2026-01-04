import React from 'react';

const SkipLinks: React.FC = () => {
  return (
    <nav 
      className="skip-links"
      aria-label="Skip navigation"
    >
      <a 
        href="#main-content" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <a 
        href="#main-navigation" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to navigation
      </a>
      <a 
        href="#search" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-96 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to search
      </a>
    </nav>
  );
};

export default SkipLinks;

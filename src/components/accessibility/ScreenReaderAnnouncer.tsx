import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const ScreenReaderAnnouncer: React.FC = () => {
  const location = useLocation();
  const { announce, settings } = useAccessibility();
  const [pageTitle, setPageTitle] = useState('');

  // Announce page changes
  useEffect(() => {
    const getPageName = (path: string) => {
      const routes: Record<string, string> = {
        '/': 'Home',
        '/trading': 'Trading Dashboard',
        '/analytics': 'Advanced Analytics',
        '/strategy-lab': 'Strategy Lab',
        '/nft-studio': 'NFT Studio',
        '/token-launchpad': 'Token Launchpad',
        '/advanced-trading': 'Advanced Trading Terminal',
        '/ai-lab': 'AI Research Lab',
        '/vault': 'Lightning Vault',
        '/exchange-hub': 'Exchange Hub',
        '/freqtrade-studio': 'Freqtrade Studio',
        '/ml-predictions': 'ML Predictions',
        '/defi-sniper': 'DeFi Sniper',
        '/strategy-marketplace': 'Strategy Marketplace',
        '/social-trading': 'Social Trading',
        '/risk-management': 'Risk Management',
        '/institutional': 'Institutional Services',
        '/auth': 'Authentication',
        '/admin': 'Admin Dashboard',
      };
      return routes[path] || 'Page';
    };

    const pageName = getPageName(location.pathname);
    setPageTitle(pageName);
    
    // Announce to screen readers
    if (settings.screenReaderOptimized) {
      announce(`Navigated to ${pageName}`, 'polite');
    }
  }, [location.pathname, announce, settings.screenReaderOptimized]);

  return (
    <>
      {/* Live region for dynamic announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="page-announcer"
      >
        {pageTitle && `Now viewing: ${pageTitle}`}
      </div>
      
      {/* Assertive announcements for critical updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="alert-announcer"
      />
      
      {/* Loading state announcer */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        id="loading-announcer"
      />
    </>
  );
};

export default ScreenReaderAnnouncer;

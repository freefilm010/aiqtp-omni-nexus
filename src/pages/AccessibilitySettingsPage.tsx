import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';

const AccessibilitySettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        <AccessibilityPanel />
      </main>
      <Footer />
    </div>
  );
};

export default AccessibilitySettingsPage;

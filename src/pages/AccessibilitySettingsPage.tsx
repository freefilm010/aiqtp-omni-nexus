import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import ThemeSwitcher from '@/components/settings/ThemeSwitcher';
import LanguageSelector from '@/components/settings/LanguageSelector';

const AccessibilitySettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-6">
          <AccessibilityPanel />
          <ThemeSwitcher />
          <LanguageSelector />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccessibilitySettingsPage;

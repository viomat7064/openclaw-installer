import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WizardProvider } from "@/context/WizardContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import Welcome from "@/pages/Welcome";
import ModeSelect from "@/pages/ModeSelect";
import DependencyInstall from "@/pages/DependencyInstall";
import ModelConfig from "@/pages/ModelConfig";
import PlatformConfig from "@/pages/PlatformConfig";
import Installing from "@/pages/Installing";
import Complete from "@/pages/Complete";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/Settings";
import Doctor from "@/pages/Doctor";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    // Show language selector only on first app launch
    const hasSelectedLanguage = localStorage.getItem("preferredLanguage");
    if (!hasSelectedLanguage) {
      setShowLanguageSelector(true);
    }
  }, []);

  const handleLanguageSelect = () => {
    setShowLanguageSelector(false);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <WizardProvider>
          <LanguageSelector
            open={showLanguageSelector}
            onSelect={handleLanguageSelect}
          />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/mode-select" element={<ModeSelect />} />
            <Route path="/dependency-install" element={<DependencyInstall />} />
            <Route path="/model-config" element={<ModelConfig />} />
            <Route path="/platform-config" element={<PlatformConfig />} />
            <Route path="/installing" element={<Installing />} />
            <Route path="/complete" element={<Complete />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WizardProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

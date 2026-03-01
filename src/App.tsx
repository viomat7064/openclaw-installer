import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WizardProvider } from "@/context/WizardContext";
import Welcome from "@/pages/Welcome";
import ModeSelect from "@/pages/ModeSelect";
import DependencyInstall from "@/pages/DependencyInstall";
import ModelConfig from "@/pages/ModelConfig";
import PlatformConfig from "@/pages/PlatformConfig";
import Installing from "@/pages/Installing";
import Complete from "@/pages/Complete";
import ServiceConfig from "@/pages/ServiceConfig";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/Settings";
import Doctor from "@/pages/Doctor";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <WizardProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/mode-select" element={<ModeSelect />} />
            <Route path="/dependency-install" element={<DependencyInstall />} />
            <Route path="/model-config" element={<ModelConfig />} />
            <Route path="/platform-config" element={<PlatformConfig />} />
            <Route path="/installing" element={<Installing />} />
            <Route path="/service-config" element={<ServiceConfig />} />
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

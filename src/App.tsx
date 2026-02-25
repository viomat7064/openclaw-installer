import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WizardProvider } from "@/context/WizardContext";
import Welcome from "@/pages/Welcome";
import ModeSelect from "@/pages/ModeSelect";

function App() {
  return (
    <BrowserRouter>
      <WizardProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/mode-select" element={<ModeSelect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WizardProvider>
    </BrowserRouter>
  );
}

export default App;

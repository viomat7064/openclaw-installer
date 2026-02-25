import { createContext, useContext, useState, type ReactNode } from "react";

export type InstallMode = "npm" | "docker" | null;

export type CheckStatus = "pass" | "fail" | "warn" | "checking" | "idle";

export interface EnvCheckItem {
  id: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

interface WizardState {
  installMode: InstallMode;
  setInstallMode: (mode: InstallMode) => void;
  envChecks: EnvCheckItem[];
  setEnvChecks: (checks: EnvCheckItem[]) => void;
}

const WizardContext = createContext<WizardState | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [installMode, setInstallMode] = useState<InstallMode>(null);
  const [envChecks, setEnvChecks] = useState<EnvCheckItem[]>([]);

  return (
    <WizardContext.Provider
      value={{ installMode, setInstallMode, envChecks, setEnvChecks }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

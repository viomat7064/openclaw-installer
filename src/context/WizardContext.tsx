import { createContext, useContext, useState, type ReactNode } from "react";

export type InstallMode = "npm" | "docker" | null;

export type CheckStatus = "pass" | "fail" | "warn" | "checking" | "idle";

export interface EnvCheckItem {
  id: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

export type InstallPhase = "idle" | "downloading" | "installing" | "done" | "error";

export interface DependencyStatus {
  id: string;
  needed: boolean;
  phase: InstallPhase;
  progress: number;
  speed: string;
  downloaded: string;
  total: string;
  error?: string;
  installerPath?: string;
}

export interface InstallStepStatus {
  id: string;
  status: "pending" | "running" | "done" | "error";
  message: string;
  log?: string;
}

export interface ModelConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

export interface PlatformEntry {
  platform: string;
  token: string;
}

interface WizardState {
  installMode: InstallMode;
  setInstallMode: (mode: InstallMode) => void;
  envChecks: EnvCheckItem[];
  setEnvChecks: (checks: EnvCheckItem[]) => void;
  dependencies: DependencyStatus[];
  setDependencies: (deps: DependencyStatus[]) => void;
  installSteps: InstallStepStatus[];
  setInstallSteps: (steps: InstallStepStatus[]) => void;
  installComplete: boolean;
  setInstallComplete: (v: boolean) => void;
  openclawVersion: string;
  setOpenclawVersion: (v: string) => void;
  useMirror: boolean;
  setUseMirror: (v: boolean) => void;
  modelConfig: ModelConfig;
  setModelConfig: (c: ModelConfig) => void;
  platforms: PlatformEntry[];
  setPlatforms: (p: PlatformEntry[]) => void;
  installProgress: number;
  setInstallProgress: (p: number) => void;
  currentStepOutput: string;
  setCurrentStepOutput: (o: string) => void;
  failedStepId: string | null;
  setFailedStepId: (id: string | null) => void;
  autoFixAttempts: number;
  setAutoFixAttempts: (a: number) => void;
}

const WizardContext = createContext<WizardState | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [installMode, setInstallMode] = useState<InstallMode>(null);
  const [envChecks, setEnvChecks] = useState<EnvCheckItem[]>([]);
  const [dependencies, setDependencies] = useState<DependencyStatus[]>([]);
  const [installSteps, setInstallSteps] = useState<InstallStepStatus[]>([]);
  const [installComplete, setInstallComplete] = useState(false);
  const [openclawVersion, setOpenclawVersion] = useState("");
  const [useMirror, setUseMirror] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: "",
    apiKey: "",
    endpoint: "",
    model: "",
  });
  const [platforms, setPlatforms] = useState<PlatformEntry[]>([]);
  const [installProgress, setInstallProgress] = useState(0);
  const [currentStepOutput, setCurrentStepOutput] = useState("");
  const [failedStepId, setFailedStepId] = useState<string | null>(null);
  const [autoFixAttempts, setAutoFixAttempts] = useState(0);

  return (
    <WizardContext.Provider
      value={{
        installMode, setInstallMode,
        envChecks, setEnvChecks,
        dependencies, setDependencies,
        installSteps, setInstallSteps,
        installComplete, setInstallComplete,
        openclawVersion, setOpenclawVersion,
        useMirror, setUseMirror,
        modelConfig, setModelConfig,
        platforms, setPlatforms,
        installProgress, setInstallProgress,
        currentStepOutput, setCurrentStepOutput,
        failedStepId, setFailedStepId,
        autoFixAttempts, setAutoFixAttempts,
      }}
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

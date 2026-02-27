import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useWizard, type InstallStepStatus } from "@/context/WizardContext";

interface InstallStepPayload {
  id: string;
  status: string;
  message: string;
  log: string | null;
}

export function useInstallation() {
  const {
    setInstallSteps,
    setInstallComplete,
    setOpenclawVersion,
    setInstallProgress,
    setCurrentStepOutput,
    useMirror,
    installMode
  } = useWizard();
  const stepsRef = useRef<InstallStepStatus[]>([]);
  const outputRef = useRef<string>("");

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    listen<InstallStepPayload>("install-step", (event) => {
      const p = event.payload;
      const current = stepsRef.current;
      const existing = current.find((s) => s.id === p.id);
      let updated: InstallStepStatus[];

      if (existing) {
        updated = current.map((s) =>
          s.id === p.id
            ? { ...s, status: p.status as InstallStepStatus["status"], message: p.message, log: p.log ?? undefined }
            : s
        );
      } else {
        updated = [...current, { id: p.id, status: p.status as InstallStepStatus["status"], message: p.message, log: p.log ?? undefined }];
      }

      stepsRef.current = updated;
      setInstallSteps(updated);

      // Update progress based on completed steps
      const totalSteps = updated.length;
      const completedSteps = updated.filter(s => s.status === "done" || s.status === "error").length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      setInstallProgress(progress);

      // Update current step output
      if (p.log) {
        outputRef.current += p.log + "\n";
        setCurrentStepOutput(outputRef.current);
      }

      // Extract version from verify step
      if (p.id === "verify_version" && p.status === "done") {
        const match = p.message.match(/OpenClaw\s+(.*)/);
        if (match) setOpenclawVersion(match[1]);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [setInstallSteps, setOpenclawVersion, setInstallProgress, setCurrentStepOutput]);

  const startInstall = useCallback(async () => {
    const mode = installMode ?? "npm";

    const steps: InstallStepStatus[] =
      mode === "npm"
        ? [
            { id: "npm_install", status: "pending", message: "Install OpenClaw (npm)" },
            { id: "verify_version", status: "pending", message: "Verify installation" },
            { id: "write_config", status: "pending", message: "Write configuration" },
            { id: "start_gateway", status: "pending", message: "Start Gateway" },
            { id: "verify_gateway", status: "pending", message: "Verify Gateway" },
            { id: "create_shortcut", status: "pending", message: "Create desktop shortcut" },
          ]
        : [
            { id: "docker_setup", status: "pending", message: "Setup Docker environment" },
            { id: "docker_start", status: "pending", message: "Start containers" },
            { id: "verify_gateway", status: "pending", message: "Verify Gateway" },
          ];

    stepsRef.current = steps;
    setInstallSteps(steps);

    try {
      await invoke("install_openclaw", { mode, useMirror });
      setInstallComplete(true);
    } catch (err) {
      console.error("Installation failed:", err);
    }
  }, [installMode, useMirror, setInstallSteps, setInstallComplete]);

  const retryInstall = useCallback(() => {
    stepsRef.current = [];
    outputRef.current = "";
    setInstallSteps([]);
    setInstallComplete(false);
    setInstallProgress(0);
    setCurrentStepOutput("");
    startInstall();
  }, [startInstall, setInstallSteps, setInstallComplete, setInstallProgress, setCurrentStepOutput]);

  return { startInstall, retryInstall };
}

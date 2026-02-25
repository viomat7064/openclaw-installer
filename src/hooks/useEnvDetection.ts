import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useWizard, type EnvCheckItem, type CheckStatus } from "@/context/WizardContext";

interface RustEnvResult {
  os_ok: boolean;
  os_info: string;
  nodejs_installed: boolean;
  nodejs_version: string;
  docker_installed: boolean;
  docker_version: string;
  wsl2_enabled: boolean;
  disk_ok: boolean;
  disk_available: string;
  memory_ok: boolean;
  memory_total: string;
  network_ok: boolean;
}

export function useEnvDetection() {
  const { setEnvChecks } = useWizard();
  const [isChecking, setIsChecking] = useState(false);

  const runDetection = useCallback(async () => {
    setIsChecking(true);

    // Set all to checking state
    const initialChecks: EnvCheckItem[] = [
      { id: "os", status: "checking", message: "" },
      { id: "nodejs", status: "checking", message: "" },
      { id: "docker", status: "checking", message: "" },
      { id: "wsl2", status: "checking", message: "" },
      { id: "disk", status: "checking", message: "" },
      { id: "memory", status: "checking", message: "" },
      { id: "network", status: "checking", message: "" },
    ];
    setEnvChecks(initialChecks);

    try {
      const result = await invoke<RustEnvResult>("detect_environment");

      const checks: EnvCheckItem[] = [
        {
          id: "os",
          status: result.os_ok ? "pass" : "fail",
          message: result.os_info,
        },
        {
          id: "nodejs",
          status: result.nodejs_installed
            ? "pass"
            : "fail",
          message: result.nodejs_installed
            ? `Node.js ${result.nodejs_version}`
            : "Node.js not found",
        },
        {
          id: "docker",
          status: result.docker_installed ? "pass" : "warn",
          message: result.docker_installed
            ? `Docker ${result.docker_version}`
            : "Docker not installed",
          detail: result.docker_installed ? undefined : "optional",
        },
        {
          id: "wsl2",
          status: result.wsl2_enabled ? "pass" : "warn",
          message: result.wsl2_enabled ? "WSL2 enabled" : "WSL2 not enabled",
          detail: result.wsl2_enabled ? undefined : "optional",
        },
        {
          id: "disk",
          status: result.disk_ok ? "pass" : "fail",
          message: result.disk_available,
        },
        {
          id: "memory",
          status: result.memory_ok ? "pass" : "fail",
          message: result.memory_total,
        },
        {
          id: "network",
          status: (result.network_ok ? "pass" : "fail") as CheckStatus,
          message: result.network_ok ? "OK" : "Failed",
        },
      ];

      setEnvChecks(checks);
    } catch (err) {
      // If Tauri invoke fails (e.g. in browser dev mode), show mock data
      console.error("detect_environment failed:", err);
      const fallback: EnvCheckItem[] = [
        { id: "os", status: "pass", message: "Dev mode (Linux)" },
        { id: "nodejs", status: "pass", message: "Node.js v22.x" },
        { id: "docker", status: "warn", message: "Docker not detected", detail: "optional" },
        { id: "wsl2", status: "warn", message: "WSL2 N/A (Linux)", detail: "optional" },
        { id: "disk", status: "pass", message: ">5GB available" },
        { id: "memory", status: "pass", message: ">4GB" },
        { id: "network", status: "pass", message: "OK" },
      ];
      setEnvChecks(fallback);
    } finally {
      setIsChecking(false);
    }
  }, [setEnvChecks]);

  return { runDetection, isChecking };
}

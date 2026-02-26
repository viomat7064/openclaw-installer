import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useWizard, type DependencyStatus } from "@/context/WizardContext";

interface DownloadProgressPayload {
  id: string;
  downloaded: number;
  total: number;
  speed: number;
  phase: string;
  error: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1_048_576) return `${(bytesPerSec / 1_048_576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

export function useDownload() {
  const { dependencies, setDependencies } = useWizard();
  const depsRef = useRef(dependencies);
  depsRef.current = dependencies;

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    listen<DownloadProgressPayload>("download-progress", (event) => {
      const p = event.payload;
      setDependencies(
        depsRef.current.map((dep) =>
          dep.id === p.id
            ? {
                ...dep,
                phase: p.phase as DependencyStatus["phase"],
                progress: p.total > 0 ? Math.round((p.downloaded / p.total) * 100) : 0,
                speed: formatSpeed(p.speed),
                downloaded: formatBytes(p.downloaded),
                total: formatBytes(p.total),
                error: p.error ?? undefined,
              }
            : dep
        )
      );
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [setDependencies]);

  const startDownload = useCallback(
    async (depId: string) => {
      try {
        const path = await invoke<string>("download_dependency", { depId });
        setDependencies(
          depsRef.current.map((dep) =>
            dep.id === depId
              ? { ...dep, phase: "done" as const, installerPath: path, progress: 100 }
              : dep
          )
        );
        return path;
      } catch (err) {
        console.error("Download failed:", err);
        setDependencies(
          depsRef.current.map((dep) =>
            dep.id === depId
              ? { ...dep, phase: "error" as const, error: String(err) }
              : dep
          )
        );
        return null;
      }
    },
    [setDependencies]
  );

  const installDependency = useCallback(
    async (depId: string, installerPath: string) => {
      try {
        setDependencies(
          depsRef.current.map((dep) =>
            dep.id === depId ? { ...dep, phase: "installing" as const } : dep
          )
        );
        await invoke("install_dependency", { depId, installerPath });
        setDependencies(
          depsRef.current.map((dep) =>
            dep.id === depId ? { ...dep, phase: "done" as const } : dep
          )
        );
      } catch (err) {
        console.error("Install failed:", err);
        setDependencies(
          depsRef.current.map((dep) =>
            dep.id === depId
              ? { ...dep, phase: "error" as const, error: String(err) }
              : dep
          )
        );
      }
    },
    [setDependencies]
  );

  return { startDownload, installDependency };
}

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadProgress } from "@/components/DownloadProgress";
import { ManualFallback } from "@/components/ManualFallback";
import { useWizard, type DependencyStatus } from "@/context/WizardContext";
import { useDownload } from "@/hooks/useDownload";
import { useEnvDetection } from "@/hooks/useEnvDetection";

export default function DependencyInstall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { installMode, envChecks, dependencies, setDependencies, useMirror, setUseMirror } = useWizard();
  const { startDownload, installDependency } = useDownload();
  const { runDetection } = useEnvDetection();

  // Determine which dependencies are needed
  useEffect(() => {
    if (dependencies.length > 0) return;

    const nodejsOk = envChecks.find((c) => c.id === "nodejs")?.status === "pass";
    const dockerOk = envChecks.find((c) => c.id === "docker")?.status === "pass";

    const deps: DependencyStatus[] = [];

    if (installMode === "npm") {
      deps.push({
        id: "nodejs",
        needed: !nodejsOk,
        phase: nodejsOk ? "done" : "idle",
        progress: nodejsOk ? 100 : 0,
        speed: "",
        downloaded: "",
        total: "",
      });
    } else if (installMode === "docker") {
      deps.push({
        id: "docker",
        needed: !dockerOk,
        phase: dockerOk ? "done" : "idle",
        progress: dockerOk ? 100 : 0,
        speed: "",
        downloaded: "",
        total: "",
      });
    }

    setDependencies(deps);
  }, [installMode, envChecks, dependencies.length, setDependencies]);

  // Auto-detect mirror
  useEffect(() => {
    invoke<string>("detect_npm_registry")
      .then((registry) => {
        if (registry.includes("npmmirror")) {
          setUseMirror(true);
        }
      })
      .catch(() => {});
  }, [setUseMirror]);

  const handleDownloadAll = useCallback(async () => {
    for (const dep of dependencies) {
      if (dep.needed && dep.phase === "idle") {
        const path = await startDownload(dep.id, useMirror);
        if (path) {
          await installDependency(dep.id, path);
        }
      }
    }
  }, [dependencies, startDownload, installDependency, useMirror]);

  // Auto-start downloads
  useEffect(() => {
    const hasIdle = dependencies.some((d) => d.needed && d.phase === "idle");
    if (hasIdle && dependencies.length > 0) {
      handleDownloadAll();
    }
  }, [dependencies, handleDownloadAll]);

  const handleRecheck = async () => {
    await runDetection();
    // Reset dependencies to re-evaluate
    setDependencies([]);
  };

  const allDone = dependencies.every((d) => !d.needed || d.phase === "done");
  const hasError = dependencies.some((d) => d.phase === "error");

  return (
    <WizardLayout step={3}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("depInstall.title")}</h2>
          <p className="text-muted-foreground">{t("depInstall.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              {t("depInstall.dependencies")}
              <label className="flex items-center gap-2 text-xs font-normal text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMirror}
                  onChange={(e) => setUseMirror(e.target.checked)}
                  className="rounded"
                />
                {t("depInstall.useMirror")}
              </label>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dependencies.map((dep) => (
              <div key={dep.id}>
                <DownloadProgress dep={dep} />
                {dep.phase === "error" && (
                  <ManualFallback
                    depId={dep.id}
                    error={dep.error}
                    onRecheck={handleRecheck}
                  />
                )}
              </div>
            ))}
            {dependencies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("depInstall.allInstalled")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/mode-select")}>
            <ArrowLeft className="h-4 w-4" />
            {t("depInstall.back")}
          </Button>
          <div className="flex gap-2">
            {hasError && (
              <Button variant="outline" onClick={handleRecheck}>
                <RefreshCw className="h-4 w-4" />
                {t("depInstall.fallback.recheck")}
              </Button>
            )}
            <Button onClick={() => navigate("/model-config")} disabled={!allDone}>
              {t("depInstall.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}

import { Progress } from "@/components/ui/progress";
import { StatusIcon } from "@/components/StatusIcon";
import type { DependencyStatus } from "@/context/WizardContext";
import { useTranslation } from "react-i18next";

interface DownloadProgressProps {
  dep: DependencyStatus;
}

export function DownloadProgress({ dep }: DownloadProgressProps) {
  const { t } = useTranslation();

  if (!dep.needed) return null;

  const label = dep.id === "nodejs" ? "Node.js 22" : "Docker Desktop";

  const statusMap = {
    idle: "idle" as const,
    downloading: "checking" as const,
    installing: "checking" as const,
    done: "pass" as const,
    error: "fail" as const,
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={statusMap[dep.phase]} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        {dep.phase === "done" && (
          <span className="text-xs text-green-600">{t("depInstall.done")}</span>
        )}
        {dep.phase === "error" && (
          <span className="text-xs text-red-500">{t("depInstall.error")}</span>
        )}
      </div>

      {dep.phase === "downloading" && (
        <>
          <Progress value={dep.progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{dep.downloaded} / {dep.total}</span>
            <span>{dep.speed}</span>
          </div>
        </>
      )}

      {dep.phase === "installing" && (
        <p className="text-sm text-muted-foreground">{t("depInstall.installing")}</p>
      )}
    </div>
  );
}

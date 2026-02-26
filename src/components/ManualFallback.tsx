import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";

interface ManualFallbackProps {
  depId: string;
  error?: string;
  onRecheck: () => void;
}

const downloadLinks: Record<string, { url: string; name: string }> = {
  nodejs: { url: "https://nodejs.org/", name: "Node.js" },
  docker: { url: "https://www.docker.com/products/docker-desktop/", name: "Docker Desktop" },
};

export function ManualFallback({ depId, error, onRecheck }: ManualFallbackProps) {
  const { t } = useTranslation();
  const link = downloadLinks[depId];

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4 space-y-3">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium text-sm">{t("depInstall.fallback.title")}</span>
      </div>

      {error && (
        <p className="text-xs text-muted-foreground">{t("depInstall.fallback.reason", { reason: error })}</p>
      )}

      <p className="text-sm">{t("depInstall.fallback.manual")}</p>

      {link && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openUrl(link.url)}
          className="gap-2"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("depInstall.fallback.openWebsite")} ({link.name})
        </Button>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={onRecheck}
        className="gap-2 ml-2"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {t("depInstall.fallback.recheck")}
      </Button>
    </div>
  );
}

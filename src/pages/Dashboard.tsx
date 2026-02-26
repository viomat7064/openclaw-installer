import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Activity, Square, Play, RotateCw, ExternalLink, Settings, Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useWizard } from "@/context/WizardContext";

interface GatewayStatus {
  running: boolean;
  pid: number | null;
  port: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { platforms } = useWizard();
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const s = await invoke<GatewayStatus>("gateway_status");
      setStatus(s);
    } catch {
      setStatus({ running: false, pid: null, port: 18789 });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      await invoke<string>(`gateway_${action}`);
      await new Promise((r) => setTimeout(r, 1000));
      await checkStatus();
    } catch (err) {
      console.error(`${action} failed:`, err);
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <h1 className="text-lg font-bold tracking-tight">{t("dashboard.title")}</h1>
        <LanguageSwitch />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Gateway status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("dashboard.gatewayStatus")}
              </span>
              <Badge variant={status?.running ? "success" : "destructive"}>
                {status?.running ? t("dashboard.running") : t("dashboard.stopped")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.port")}: {status?.port ?? 18789}
              </span>
              <div className="flex gap-2">
                {!status?.running && (
                  <Button size="sm" onClick={() => handleAction("start")} disabled={!!loading}>
                    <Play className="h-3 w-3" />
                    {t("dashboard.start")}
                  </Button>
                )}
                {status?.running && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleAction("stop")} disabled={!!loading}>
                      <Square className="h-3 w-3" />
                      {t("dashboard.stop")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction("restart")} disabled={!!loading}>
                      <RotateCw className="h-3 w-3" />
                      {t("dashboard.restart")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected platforms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("dashboard.connectedPlatforms")}</CardTitle>
          </CardHeader>
          <CardContent>
            {platforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <Badge key={p.platform} variant="secondary">{p.platform}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dashboard.noPlatforms")}</p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start gap-2" onClick={() => openUrl("http://127.0.0.1:18789")}>
                <ExternalLink className="h-4 w-4" />
                {t("dashboard.openWebchat")}
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" />
                {t("dashboard.openSettings")}
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/doctor")}>
                <Stethoscope className="h-4 w-4" />
                {t("dashboard.openDoctor")}
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
                {t("dashboard.backToWizard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

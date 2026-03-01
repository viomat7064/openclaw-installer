import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "@/context/WizardContext";

type Phase = "idle" | "registering" | "success" | "error";

export default function ServiceConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { installMode, setServiceRegistered } = useWizard();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isWindows, setIsWindows] = useState(true);

  // Auto-skip on non-Windows or Docker mode
  useEffect(() => {
    if (installMode === "docker") {
      navigate("/complete", { replace: true });
      return;
    }
    // Detect platform
    const platform = navigator.platform.toLowerCase();
    if (!platform.includes("win")) {
      setIsWindows(false);
      // Auto-navigate after brief delay so user sees the page flash
      const timer = setTimeout(() => navigate("/complete", { replace: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [installMode, navigate]);

  const handleRegister = async () => {
    setPhase("registering");
    setErrorMsg("");
    try {
      await invoke<string>("register_service");
      setPhase("success");
      setServiceRegistered(true);
      // Auto-navigate after showing success
      setTimeout(() => navigate("/complete"), 1500);
    } catch (err) {
      setPhase("error");
      setErrorMsg(String(err));
    }
  };

  const handleSkip = () => {
    navigate("/complete");
  };

  if (!isWindows) return null;

  return (
    <WizardLayout step={7}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Shield className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">{t("serviceConfig.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("serviceConfig.description")}
          </p>
        </div>

        {/* Service registration card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("serviceConfig.enableService")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>
                {t("serviceConfig.benefit1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>
                {t("serviceConfig.benefit2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>
                {t("serviceConfig.benefit3")}
              </li>
            </ul>

            {/* Status display */}
            {phase === "registering" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("serviceConfig.registering")}
              </div>
            )}
            {phase === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 py-2">
                <CheckCircle2 className="h-4 w-4" />
                {t("serviceConfig.success")}
              </div>
            )}
            {phase === "error" && (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  {t("serviceConfig.error")}
                </div>
                {errorMsg && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp warning */}
        {installMode === "npm" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {t("serviceConfig.whatsappWarning")}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={phase === "registering"}
          >
            {t("serviceConfig.skip")}
          </Button>
          {phase === "idle" && (
            <Button onClick={handleRegister}>
              <Shield className="h-4 w-4 mr-1" />
              {t("serviceConfig.register")}
            </Button>
          )}
          {phase === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRegister}>
                {t("serviceConfig.retry")}
              </Button>
              <Button onClick={() => navigate("/complete")}>
                {t("serviceConfig.continueAnyway")}
              </Button>
            </div>
          )}
          {phase === "success" && (
            <Button onClick={() => navigate("/complete")}>
              {t("serviceConfig.continue")}
            </Button>
          )}
        </div>
      </div>
    </WizardLayout>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallStepItem } from "@/components/InstallStepItem";
import { useWizard } from "@/context/WizardContext";
import { useInstallation } from "@/hooks/useInstallation";

export default function Installing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { installSteps, installComplete } = useWizard();
  const { startInstall, retryInstall } = useInstallation();

  useEffect(() => {
    if (installSteps.length === 0) {
      startInstall();
    }
  }, [startInstall, installSteps.length]);

  useEffect(() => {
    if (installComplete) {
      const timer = setTimeout(() => navigate("/complete"), 1500);
      return () => clearTimeout(timer);
    }
  }, [installComplete, navigate]);

  const hasError = installSteps.some((s) => s.status === "error");
  const isRunning = installSteps.some((s) => s.status === "running");

  return (
    <WizardLayout step={6}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("installing.title")}</h2>
          {isRunning && (
            <p className="text-muted-foreground">{t("installing.inProgress")}</p>
          )}
          {installComplete && (
            <p className="text-green-600">{t("installing.success")}</p>
          )}
          {hasError && (
            <p className="text-red-500">{t("installing.failed")}</p>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("installing.steps")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {installSteps.map((step) => (
                <InstallStepItem key={step.id} step={step} />
              ))}
            </div>
          </CardContent>
        </Card>

        {hasError && (
          <div className="flex justify-center">
            <Button onClick={retryInstall} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("installing.retry")}
            </Button>
          </div>
        )}
      </div>
    </WizardLayout>
  );
}

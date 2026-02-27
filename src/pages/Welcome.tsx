import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RefreshCw, ArrowRight, Languages } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { EnvCheckItem } from "@/components/EnvCheckItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWizard } from "@/context/WizardContext";
import { useEnvDetection } from "@/hooks/useEnvDetection";

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { envChecks } = useWizard();
  const { runDetection, isChecking } = useEnvDetection();

  useEffect(() => {
    runDetection();
  }, [runDetection]);

  // Required checks: os, nodejs, disk, network must pass
  const requiredIds = ["os", "nodejs", "disk", "network"];
  const allRequiredPass = requiredIds.every((id) => {
    const check = envChecks.find((c) => c.id === id);
    return check?.status === "pass";
  });

  const canProceed = allRequiredPass && !isChecking;

  const toggleLanguage = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh";
    i18n.changeLanguage(newLang);
  };

  const labelMap: Record<string, string> = {
    os: t("welcome.os.label"),
    nodejs: t("welcome.nodejs.label"),
    docker: t("welcome.docker.label"),
    wsl2: t("welcome.wsl2.label"),
    disk: t("welcome.disk.label"),
    memory: t("welcome.memory.label"),
    network: t("welcome.network.label"),
  };

  return (
    <WizardLayout step={1}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Languages className="h-4 w-4" />
            {i18n.language === "zh" ? "English" : "中文"}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("welcome.title")}</h2>
          <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("welcome.envCheck")}</CardTitle>
            <CardDescription>{t("welcome.envCheckDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {envChecks.map((check, i) => (
                <div key={check.id}>
                  {i > 0 && <Separator />}
                  <EnvCheckItem
                    label={labelMap[check.id] ?? check.id}
                    status={check.status}
                    message={check.message}
                    detail={check.detail}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={runDetection}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {t("welcome.recheck")}
          </Button>
          <Button onClick={() => navigate("/mode-select")} disabled={!canProceed}>
            {t("welcome.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}

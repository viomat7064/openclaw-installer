import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PartyPopper, ExternalLink, BookOpen, LayoutDashboard, X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "@/context/WizardContext";

export default function Complete() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openclawVersion } = useWizard();

  return (
    <WizardLayout step={8}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-3">
          <PartyPopper className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold">{t("complete.title")}</h2>
          <p className="text-muted-foreground">
            {t("complete.version", { version: openclawVersion || "latest" })}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("complete.info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("complete.gateway")}</span>
              <span className="font-mono">http://127.0.0.1:18789</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full gap-2"
            onClick={() => openUrl("http://127.0.0.1:18789")}
          >
            <ExternalLink className="h-4 w-4" />
            {t("complete.openWebchat")}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("complete.openDashboard")}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => openUrl("https://github.com/openclaw/openclaw#readme")}
          >
            <BookOpen className="h-4 w-4" />
            {t("complete.viewTutorial")}
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => window.close()}
          >
            <X className="h-4 w-4" />
            {t("complete.close")}
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}

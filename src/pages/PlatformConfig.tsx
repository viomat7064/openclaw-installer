import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "@/context/WizardContext";

const PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", tokenLabel: "Phone Number ID + Token", url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" },
  { id: "telegram", name: "Telegram", tokenLabel: "Bot Token", url: "https://core.telegram.org/bots#botfather" },
  { id: "discord", name: "Discord", tokenLabel: "Bot Token", url: "https://discord.com/developers/applications" },
  { id: "slack", name: "Slack", tokenLabel: "Bot Token", url: "https://api.slack.com/apps" },
];

export default function PlatformConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { platforms, setPlatforms, installMode } = useWizard();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(platforms.map((p) => p.platform))
  );

  const togglePlatform = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      setPlatforms(platforms.filter((p) => p.platform !== id));
    } else {
      next.add(id);
      if (!platforms.find((p) => p.platform === id)) {
        setPlatforms([...platforms, { platform: id, token: "" }]);
      }
    }
    setSelected(next);
  };

  const updateToken = (platformId: string, token: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.platform === platformId ? { ...p, token } : p
      )
    );
  };

  const getToken = (platformId: string) =>
    platforms.find((p) => p.platform === platformId)?.token ?? "";

  return (
    <WizardLayout step={5}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold">{t("platformConfig.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("platformConfig.subtitle")}</p>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                selected.has(p.id)
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-primary/50"
              } ${p.id === "whatsapp" && installMode === "npm" ? "opacity-60" : ""}`}
            >
              <span className="truncate">{p.name}</span>
              {p.id === "whatsapp" && installMode === "npm" && (
                <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0" />
              )}
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-auto text-muted-foreground hover:text-primary shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </button>
          ))}
        </div>

        {/* WhatsApp warning for npm mode */}
        {installMode === "npm" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {t("platformConfig.whatsappWarning")}
            </p>
          </div>
        )}

        {/* Token inputs for selected platforms */}
        {Array.from(selected).map((id) => {
          const plat = PLATFORMS.find((p) => p.id === id);
          if (!plat) return null;
          return (
            <Card key={id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{plat.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="text-xs text-muted-foreground mb-1 block">{plat.tokenLabel}</label>
                <input
                  type="text"
                  value={getToken(id)}
                  onChange={(e) => updateToken(id, e.target.value)}
                  placeholder={plat.tokenLabel}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
                <a
                  href={plat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1"
                >
                  {t("platformConfig.howToGet")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/model-config")}>
            <ArrowLeft className="h-4 w-4" />
            {t("platformConfig.back")}
          </Button>
          <Button onClick={() => navigate("/installing")}>
            {selected.size > 0 ? t("platformConfig.next") : t("platformConfig.skip")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitch } from "@/components/LanguageSwitch";

interface ConfigData {
  model_provider?: string;
  model_name?: string;
  api_key?: string;
  api_endpoint?: string;
  gateway_port: number;
  platforms: { platform: string; token: string }[];
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<ConfigData>("read_openclaw_config")
      .then(setConfig)
      .catch(() => setConfig({ gateway_port: 18789, platforms: [] }));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      await invoke("write_openclaw_config", { config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  if (!config) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <h1 className="text-lg font-bold tracking-tight">{t("settings.title")}</h1>
        <LanguageSwitch />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Model config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.modelSection")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.provider")}</label>
              <input
                type="text"
                value={config.model_provider ?? ""}
                onChange={(e) => setConfig({ ...config, model_provider: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.model")}</label>
              <input
                type="text"
                value={config.model_name ?? ""}
                onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.apiKey")}</label>
              <input
                type="password"
                value={config.api_key ?? ""}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.apiEndpoint")}</label>
              <input
                type="text"
                value={config.api_endpoint ?? ""}
                onChange={(e) => setConfig({ ...config, api_endpoint: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gateway config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.gatewaySection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.gatewayPort")}</label>
              <input
                type="number"
                value={config.gateway_port}
                onChange={(e) => setConfig({ ...config, gateway_port: parseInt(e.target.value) || 18789 })}
                className="w-32 px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            {t("settings.back")}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? t("settings.saved") : t("settings.save")}
          </Button>
        </div>
      </main>
    </div>
  );
}

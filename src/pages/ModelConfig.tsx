import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "@/context/WizardContext";

const PROVIDERS = [
  { id: "aliyun", name: "阿里云百炼", endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1", models: ["qwen-max", "qwen-plus", "qwen-turbo"], url: "https://bailian.console.aliyun.com/", primary: true },
  { id: "deepseek", name: "DeepSeek", endpoint: "https://api.deepseek.com/v1", models: ["deepseek-chat", "deepseek-reasoner"], url: "https://platform.deepseek.com/", primary: true },
  { id: "zhipu", name: "智谱AI", endpoint: "https://open.bigmodel.cn/api/paas/v4", models: ["glm-4-plus", "glm-4", "glm-4-flash"], url: "https://open.bigmodel.cn/", primary: true },
  { id: "baidu", name: "百度千帆", endpoint: "https://qianfan.baidubce.com/v2", models: ["ernie-4.0-8k", "ernie-3.5-8k", "ernie-speed-8k"], url: "https://console.bce.baidu.com/qianfan/", primary: true },
  { id: "moonshot", name: "月之暗面", endpoint: "https://api.moonshot.cn/v1", models: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"], url: "https://platform.moonshot.cn/", primary: true },
  { id: "ollama", name: "Ollama", endpoint: "http://localhost:11434", models: ["llama3", "qwen2", "mistral"], url: "https://ollama.com/", primary: true },
  { id: "anthropic", name: "Anthropic", endpoint: "https://api.anthropic.com/v1", models: ["claude-sonnet-4-20250514", "claude-haiku-4-20250414"], url: "https://console.anthropic.com/", primary: false },
  { id: "openai", name: "OpenAI", endpoint: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"], url: "https://platform.openai.com/", primary: false },
  { id: "google", name: "Google Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai", models: ["gemini-2.0-flash", "gemini-1.5-pro"], url: "https://aistudio.google.com/", primary: false },
  { id: "openrouter", name: "OpenRouter", endpoint: "https://openrouter.ai/api/v1", models: ["auto"], url: "https://openrouter.ai/", primary: false },
  { id: "bedrock", name: "AWS Bedrock", endpoint: "", models: [], url: "https://aws.amazon.com/bedrock/", primary: false },
  { id: "custom", name: "Custom", endpoint: "", models: [], url: "", primary: false },
];

export default function ModelConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { modelConfig, setModelConfig } = useWizard();
  const [showKey, setShowKey] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selectedProvider = PROVIDERS.find((p) => p.id === modelConfig.provider);
  const visibleProviders = showMore ? PROVIDERS : PROVIDERS.filter((p) => p.primary);

  const selectProvider = (id: string) => {
    const prov = PROVIDERS.find((p) => p.id === id);
    setModelConfig({
      provider: id,
      apiKey: modelConfig.provider === id ? modelConfig.apiKey : "",
      endpoint: prov?.endpoint ?? "",
      model: prov?.models[0] ?? "",
    });
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const msg = await invoke<string>("test_api_connection", {
        provider: modelConfig.provider,
        api_key: modelConfig.apiKey,
        endpoint: modelConfig.endpoint,
        model: modelConfig.model,
      });
      setTestResult({ ok: true, msg });
    } catch (err) {
      setTestResult({ ok: false, msg: String(err) });
    } finally {
      setTesting(false);
    }
  };

  const isOllama = modelConfig.provider === "ollama";

  return (
    <WizardLayout step={4}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold">{t("modelConfig.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("modelConfig.subtitle")}</p>
        </div>

        {/* Provider grid */}
        <div className="grid grid-cols-3 gap-2">
          {visibleProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProvider(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                modelConfig.provider === p.id
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="truncate">{p.name}</span>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto text-muted-foreground hover:text-primary shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </button>
          ))}
        </div>
        {!showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("modelConfig.showMore")}
          </button>
        )}

        {/* Config form */}
        {modelConfig.provider && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedProvider?.name} {t("modelConfig.settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* API Key */}
              {!isOllama && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={modelConfig.apiKey}
                      onChange={(e) => setModelConfig({ ...modelConfig, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Endpoint */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("modelConfig.endpoint")}</label>
                <input
                  type="text"
                  value={modelConfig.endpoint}
                  onChange={(e) => setModelConfig({ ...modelConfig, endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              {/* Model select */}
              {selectedProvider && selectedProvider.models.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("modelConfig.model")}</label>
                  <select
                    value={modelConfig.model}
                    onChange={(e) => setModelConfig({ ...modelConfig, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    {selectedProvider.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom model input for custom/bedrock */}
              {selectedProvider && selectedProvider.models.length === 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("modelConfig.model")}</label>
                  <input
                    type="text"
                    value={modelConfig.model}
                    onChange={(e) => setModelConfig({ ...modelConfig, model: e.target.value })}
                    placeholder="model-name"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              )}

              {/* Test button */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || (!isOllama && !modelConfig.apiKey)}
                >
                  {testing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("modelConfig.testConnection")}
                </Button>
                {testResult && (
                  <span className={`text-xs flex items-center gap-1 ${testResult.ok ? "text-green-600" : "text-red-500"}`}>
                    {testResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {testResult.msg}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dependency-install")}>
            <ArrowLeft className="h-4 w-4" />
            {t("modelConfig.back")}
          </Button>
          <Button onClick={() => navigate("/platform-config")}>
            {modelConfig.provider ? t("modelConfig.next") : t("modelConfig.skip")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}

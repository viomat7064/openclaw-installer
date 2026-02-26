import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitch } from "@/components/LanguageSwitch";

interface DoctorCheck {
  id: string;
  label: string;
  ok: boolean;
  message: string;
}

export default function Doctor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<DoctorCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    try {
      const result = await invoke<DoctorCheck[]>("run_doctor");
      setChecks(result);
    } catch (err) {
      console.error("Doctor failed:", err);
    } finally {
      setRunning(false);
      setHasRun(true);
    }
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.ok);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <h1 className="text-lg font-bold tracking-tight">{t("doctor.title")}</h1>
        <LanguageSwitch />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t("doctor.subtitle")}</p>
          <Button onClick={runChecks} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {running ? t("doctor.running") : t("doctor.recheck")}
          </Button>
        </div>

        {hasRun && (
          <>
            <div className="text-center">
              {allOk ? (
                <span className="text-green-600 text-sm">{t("doctor.allGood")}</span>
              ) : (
                <span className="text-red-500 text-sm">{t("doctor.hasIssues")}</span>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("doctor.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {check.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{check.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{check.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-start">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            {t("doctor.back")}
          </Button>
        </div>
      </main>
    </div>
  );
}

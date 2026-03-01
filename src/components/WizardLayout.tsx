import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "./LanguageSwitch";

interface WizardLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}

export function WizardLayout({ children, step, totalSteps = 8 }: WizardLayoutProps) {
  const { t } = useTranslation();

  const stepLabels = [
    t("wizard.steps.envCheck"),
    t("wizard.steps.installMode"),
    t("wizard.steps.depInstall"),
    t("wizard.steps.modelConfig"),
    t("wizard.steps.platformConfig"),
    t("wizard.steps.installing"),
    t("wizard.steps.serviceConfig"),
    t("wizard.steps.complete"),
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">{t("welcome.title")}</h1>
          {step !== undefined && (
            <span className="text-xs text-muted-foreground">
              {step}/{totalSteps}
            </span>
          )}
        </div>
        <LanguageSwitch />
      </header>

      {/* Step indicator */}
      {step !== undefined && (
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step
                    ? "bg-primary"
                    : i === step
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
                title={stepLabels[i]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-4 page-enter">{children}</main>
    </div>
  );
}

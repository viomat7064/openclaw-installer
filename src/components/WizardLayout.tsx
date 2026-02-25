import type { ReactNode } from "react";
import { LanguageSwitch } from "./LanguageSwitch";

interface WizardLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}

const stepLabels = ["环境检测", "安装模式", "模型配置", "平台配置", "安装", "完成"];

export function WizardLayout({ children, step, totalSteps = 6 }: WizardLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">OPENCLAW 助手</h1>
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
      <main className="flex-1 overflow-y-auto px-6 py-4">{children}</main>
    </div>
  );
}

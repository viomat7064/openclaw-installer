import { StatusIcon } from "@/components/StatusIcon";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { InstallStepStatus } from "@/context/WizardContext";

interface InstallStepItemProps {
  step: InstallStepStatus;
}

const statusToCheck = {
  pending: "idle" as const,
  running: "checking" as const,
  done: "pass" as const,
  error: "fail" as const,
};

export function InstallStepItem({ step }: InstallStepItemProps) {
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <StatusIcon status={statusToCheck[step.status]} />
        <span className="flex-1 text-sm font-medium">{step.message}</span>
        {step.log && (
          <button
            onClick={() => setShowLog(!showLog)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showLog ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {showLog && step.log && (
        <pre className="mt-2 ml-8 p-2 rounded bg-muted text-xs overflow-auto max-h-32 font-mono">
          {step.log}
        </pre>
      )}
    </div>
  );
}

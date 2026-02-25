import { StatusIcon } from "./StatusIcon";
import type { CheckStatus } from "@/context/WizardContext";

interface EnvCheckItemProps {
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

export function EnvCheckItem({ label, status, message, detail }: EnvCheckItemProps) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5">
        <StatusIcon status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        {detail && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

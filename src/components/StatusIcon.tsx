import { CheckCircle2, XCircle, AlertTriangle, Loader2, Circle } from "lucide-react";
import type { CheckStatus } from "@/context/WizardContext";

const iconMap = {
  pass: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  fail: <XCircle className="h-5 w-5 text-red-500" />,
  warn: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  checking: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  idle: <Circle className="h-5 w-5 text-muted-foreground" />,
};

export function StatusIcon({ status }: { status: CheckStatus }) {
  return iconMap[status] ?? iconMap.idle;
}

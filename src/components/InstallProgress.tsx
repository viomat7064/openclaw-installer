import { Progress } from "@/components/ui/progress";

interface InstallProgressProps {
  progress: number;
  currentStep?: string;
  elapsedTime?: number;
}

export function InstallProgress({
  progress,
  currentStep,
  elapsedTime,
}: InstallProgressProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">Installation Progress</p>
          {currentStep && (
            <p className="text-xs text-muted-foreground">{currentStep}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{progress}%</p>
          {elapsedTime !== undefined && (
            <p className="text-xs text-muted-foreground">
              {formatTime(elapsedTime)}
            </p>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

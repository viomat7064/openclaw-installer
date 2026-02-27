import { useEffect, useRef } from "react";

interface TerminalOutputProps {
  output: string;
  className?: string;
}

export function TerminalOutput({ output, className = "" }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      ref={scrollRef}
      className={`bg-black text-green-400 p-3 rounded-md font-mono text-xs overflow-y-auto max-h-64 border border-border ${className}`}
    >
      <pre className="whitespace-pre-wrap break-words">{output || "Waiting for output..."}</pre>
    </div>
  );
}

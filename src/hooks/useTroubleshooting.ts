import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export enum IssueSeverity {
  Critical = 'Critical',
  Warning = 'Warning',
  Info = 'Info',
}

export interface DiagnosticIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  fix_available: boolean;
  fix_description: string | null;
}

export interface DiagnosticResult {
  issues: DiagnosticIssue[];
  healthy: boolean;
}

export function useTroubleshooting() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const diagnostics = await invoke<DiagnosticResult>('run_diagnostics');
      setResult(diagnostics);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    setFixing(issueId);
    setError(null);
    try {
      const message = await invoke<string>('fix_issue', { issueId });
      // Re-run diagnostics after fix
      await runDiagnostics();
      return message;
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setFixing(null);
    }
  };

  return {
    result,
    loading,
    fixing,
    error,
    runDiagnostics,
    fixIssue,
  };
}

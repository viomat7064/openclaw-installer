import { useEffect } from 'react';
import { useTroubleshooting, IssueSeverity } from '../hooks/useTroubleshooting';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Wrench } from 'lucide-react';

export function Troubleshooting() {
  const { result, loading, fixing, error, runDiagnostics, fixIssue } = useTroubleshooting();

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.Critical:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case IssueSeverity.Warning:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case IssueSeverity.Info:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.Critical:
        return 'border-red-200 bg-red-50';
      case IssueSeverity.Warning:
        return 'border-yellow-200 bg-yellow-50';
      case IssueSeverity.Info:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Health Status */}
      <div className={`border rounded-md p-4 ${result.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center space-x-3">
          {result.healthy ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <h3 className="font-semibold">
              {result.healthy ? 'System Healthy' : 'Issues Detected'}
            </h3>
            <p className="text-sm text-gray-600">
              {result.healthy
                ? 'All systems are functioning normally'
                : `Found ${result.issues.length} issue(s) that need attention`}
            </p>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {result.issues.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Detected Issues</h3>
          {result.issues.map((issue) => (
            <div
              key={issue.id}
              className={`border rounded-md p-4 ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    {issue.fix_description && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        Fix: {issue.fix_description}
                      </p>
                    )}
                  </div>
                </div>
                {issue.fix_available && (
                  <button
                    onClick={() => fixIssue(issue.id)}
                    disabled={fixing === issue.id}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>{fixing === issue.id ? 'Fixing...' : 'Fix'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        Re-run Diagnostics
      </button>
    </div>
  );
}

interface JoinErrorDisplayProps {
  error: string | null;
}

export function JoinErrorDisplay({ error }: JoinErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="font-medium text-destructive mb-1">Error</p>
          <p className="text-sm text-foreground">{error}</p>
        </div>
      </div>
    </div>
  );
}

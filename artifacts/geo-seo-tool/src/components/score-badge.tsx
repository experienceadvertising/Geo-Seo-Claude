import React from "react";

export function ScoreBadge({ score, className = "" }: { score: number, className?: string }) {
  let colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
  if (score >= 70) colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
  else if (score >= 40) colorClass = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400";

  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${colorClass} ${className}`}>
      {score}
    </span>
  );
}

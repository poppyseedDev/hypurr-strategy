"use client";

import React, { useMemo } from "react";

interface HealthFactorIndicatorProps {
  healthFactor: bigint;
  className?: string;
}

/**
 * Visual health factor gauge component
 * Shows a circular progress indicator with color coding based on risk level
 */
export const HealthFactorIndicator: React.FC<HealthFactorIndicatorProps> = ({ healthFactor, className = "" }) => {
  // Convert health factor to a decimal number (assuming 18 decimals)
  const healthFactorValue = useMemo(() => {
    return Number(healthFactor) / 1e18;
  }, [healthFactor]);

  // Determine risk level and color
  const { riskLevel, color, progressColor, percentage } = useMemo(() => {
    if (healthFactorValue >= 2) {
      return {
        riskLevel: "Safe",
        color: "text-success",
        progressColor: "progress-success",
        percentage: Math.min(100, (healthFactorValue / 3) * 100),
      };
    } else if (healthFactorValue >= 1.5) {
      return {
        riskLevel: "Moderate",
        color: "text-warning",
        progressColor: "progress-warning",
        percentage: ((healthFactorValue - 1) / 2) * 100,
      };
    } else if (healthFactorValue >= 1) {
      return {
        riskLevel: "Risky",
        color: "text-orange-500",
        progressColor: "progress-warning",
        percentage: ((healthFactorValue - 0.5) / 1.5) * 100,
      };
    } else if (healthFactorValue > 0) {
      return {
        riskLevel: "Critical",
        color: "text-error",
        progressColor: "progress-error",
        percentage: (healthFactorValue / 1) * 100,
      };
    } else {
      return {
        riskLevel: "No Position",
        color: "text-base-content",
        progressColor: "progress-primary",
        percentage: 0,
      };
    }
  }, [healthFactorValue]);

  // Show warning message if approaching liquidation
  const showWarning = healthFactorValue > 0 && healthFactorValue < 1.5;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-base-content/70">Health Factor</span>
        <span className={`text-lg font-bold ${color}`}>{healthFactorValue.toFixed(2)}</span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <progress className={`progress ${progressColor} w-full`} value={percentage} max="100"></progress>
      </div>

      {/* Risk level indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-base-content/50">Risk Level</span>
        <span className={`badge badge-sm ${color === "text-success" ? "badge-success" : ""} ${
          color === "text-warning" ? "badge-warning" : ""
        } ${color === "text-error" ? "badge-error" : ""}`}>
          {riskLevel}
        </span>
      </div>

      {/* Warning message */}
      {showWarning && (
        <div className="alert alert-warning py-2 px-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-xs">Health factor is low. Consider rebalancing to avoid liquidation.</span>
        </div>
      )}

      {/* Info tooltip */}
      <div className="text-xs text-base-content/50">
        <p>A health factor below 1.0 may result in liquidation.</p>
        <p className="mt-1">Safe: &gt; 2.0 | Moderate: 1.5-2.0 | Risky: 1.0-1.5</p>
      </div>
    </div>
  );
};

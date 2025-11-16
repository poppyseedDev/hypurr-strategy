"use client";

import React from "react";
import { HealthFactorIndicator } from "./HealthFactorIndicator";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useVaultPosition } from "~~/hooks/vault";

/**
 * Display user's current vault position
 * Shows shares, value, leverage ratio, and health factor
 */
export const PositionCard: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const { shares, positionValue, leverageRatio, healthFactor, hasPosition, isLoading } =
    useVaultPosition(connectedAddress);

  // Calculate leverage multiplier for display
  const leverageMultiplier = Number(leverageRatio) / 1e18;

  if (!connectedAddress) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Position</h2>
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Connect your wallet to view your position</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Position</h2>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-base-300 rounded w-1/2"></div>
            <div className="h-8 bg-base-300 rounded w-3/4"></div>
            <div className="h-4 bg-base-300 rounded w-2/3"></div>
            <div className="h-4 bg-base-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPosition) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Position</h2>
          <div className="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">No Position Yet</h3>
              <div className="text-xs">Deposit assets to start earning leveraged yields</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Your Position</h2>

        {/* Shares Balance */}
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-sm">Vault Shares</div>
          <div className="stat-value text-2xl">{formatEther(shares)}</div>
          <div className="stat-desc">Your share balance</div>
        </div>

        {/* Position Value */}
        <div className="stat bg-base-200 rounded-lg p-4 mt-3">
          <div className="stat-title text-sm">Position Value</div>
          <div className="stat-value text-2xl text-primary">{formatEther(positionValue as bigint)} ETH</div>
          <div className="stat-desc">Current underlying value</div>
        </div>

        {/* Leverage Ratio */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-base-content/70">Your Leverage</span>
            <span className="text-lg font-bold text-accent">{leverageMultiplier.toFixed(2)}x</span>
          </div>
          <progress className="progress progress-accent w-full" value={leverageMultiplier * 20} max="100"></progress>
          <div className="flex justify-between text-xs text-base-content/50 mt-1">
            <span>1x</span>
            <span>5x</span>
          </div>
        </div>

        <div className="divider"></div>

        {/* Health Factor */}
        <HealthFactorIndicator healthFactor={healthFactor} />
      </div>
    </div>
  );
};

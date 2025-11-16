"use client";

import React, { useCallback, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useVaultPosition } from "~~/hooks/vault";
import { notification } from "~~/utils/scaffold-eth";

type WithdrawType = "partial" | "full";

/**
 * Withdraw form component
 * Handles partial and full withdrawals from the vault
 */
export const WithdrawForm: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const { shares, hasPosition } = useVaultPosition(connectedAddress);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawType, setWithdrawType] = useState<WithdrawType>("partial");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate estimated assets amount
  const estimatedAssetsAmount = useMemo(() => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return undefined;
    try {
      return parseEther(withdrawAmount);
    } catch {
      return undefined;
    }
  }, [withdrawAmount]);

  // Fetch estimated assets for withdrawal amount
  const { data: estimatedAssets } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "convertToAssets",
    args: [estimatedAssetsAmount],
    query: {
      enabled: estimatedAssetsAmount !== undefined,
    },
  });

  // Write hook for withdrawal
  const { writeContractAsync: withdrawAsync } = useScaffoldWriteContract("HypurrFiVault");

  // Calculate withdrawal amount based on type
  const actualWithdrawAmount = useMemo(() => {
    if (withdrawType === "full") {
      return shares;
    }
    try {
      return withdrawAmount ? parseEther(withdrawAmount) : 0n;
    } catch {
      return 0n;
    }
  }, [withdrawType, withdrawAmount, shares]);

  // Validate withdrawal amount
  const { isValid, errorMessage } = useMemo(() => {
    if (withdrawType === "full") {
      return { isValid: true, errorMessage: "" };
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return { isValid: false, errorMessage: "Enter an amount" };
    }

    try {
      const amount = parseEther(withdrawAmount);
      if (amount > shares) {
        return { isValid: false, errorMessage: "Insufficient shares" };
      }
      return { isValid: true, errorMessage: "" };
    } catch {
      return { isValid: false, errorMessage: "Invalid amount" };
    }
  }, [withdrawAmount, withdrawType, shares]);

  // Handle withdrawal
  const handleWithdraw = useCallback(async () => {
    if (!connectedAddress || actualWithdrawAmount === 0n) return;

    try {
      setIsWithdrawing(true);

      await withdrawAsync({
        functionName: "withdraw",
        args: [actualWithdrawAmount, connectedAddress, connectedAddress], // ERC-4626 withdraw requires (assets, receiver, owner)
      });

      notification.success("Withdrawal successful!");
      setWithdrawAmount("");
      setShowConfirmation(false);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      notification.error(error?.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  }, [connectedAddress, actualWithdrawAmount, withdrawAsync]);

  // Handle max button
  const handleMaxClick = useCallback(() => {
    if (shares) {
      setWithdrawAmount(formatEther(shares));
      setWithdrawType("partial");
    }
  }, [shares]);

  // Handle withdraw type change
  const handleTypeChange = useCallback((type: WithdrawType) => {
    setWithdrawType(type);
    if (type === "full") {
      setWithdrawAmount("");
    }
  }, []);

  // Confirmation dialog
  const ConfirmationModal = () => (
    <div className={`modal ${showConfirmation ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Confirm Withdrawal</h3>
        <div className="py-4 space-y-2">
          <p>You are about to withdraw:</p>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-sm">Shares to Withdraw</div>
            <div className="stat-value text-xl">{formatEther(actualWithdrawAmount)}</div>
          </div>
          {estimatedAssets && (
            <div className="stat bg-base-200 rounded-lg p-3">
              <div className="stat-title text-sm">Estimated Assets Received</div>
              <div className="stat-value text-xl text-primary">{formatEther(estimatedAssets)} ETH</div>
            </div>
          )}
          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
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
            <span className="text-sm">This action cannot be undone</span>
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => setShowConfirmation(false)} disabled={isWithdrawing}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleWithdraw} disabled={isWithdrawing}>
            {isWithdrawing && <span className="loading loading-spinner"></span>}
            {isWithdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={() => !isWithdrawing && setShowConfirmation(false)}></div>
    </div>
  );

  if (!connectedAddress) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Withdraw Assets</h2>
          <div className="alert alert-warning">
            <span>Please connect your wallet to withdraw</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPosition) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Withdraw Assets</h2>
          <div className="alert">
            <span>No position to withdraw from</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Withdraw Assets</h2>

          {/* Withdraw Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              className={`btn btn-sm flex-1 ${withdrawType === "partial" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => handleTypeChange("partial")}
            >
              Partial
            </button>
            <button
              className={`btn btn-sm flex-1 ${withdrawType === "full" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => handleTypeChange("full")}
            >
              Full Withdrawal
            </button>
          </div>

          {/* Amount Input (only for partial) */}
          {withdrawType === "partial" && (
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Shares to Withdraw</span>
                <span className="label-text-alt">Available: {formatEther(shares)}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className={`input input-bordered w-full ${errorMessage ? "input-error" : ""}`}
                  disabled={isWithdrawing}
                />
                <button className="btn btn-secondary" onClick={handleMaxClick} disabled={isWithdrawing}>
                  MAX
                </button>
              </div>
              {errorMessage && (
                <label className="label">
                  <span className="label-text-alt text-error">{errorMessage}</span>
                </label>
              )}
            </div>
          )}

          {/* Full Withdrawal Info */}
          {withdrawType === "full" && (
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
              <span>You will withdraw all {formatEther(shares)} shares</span>
            </div>
          )}

          {/* Estimated Assets */}
          {((withdrawType === "partial" && estimatedAssets && withdrawAmount) || withdrawType === "full") && (
            <div className="stat bg-base-200 rounded-lg p-4 mt-2">
              <div className="stat-title text-sm">Estimated Assets Received</div>
              <div className="stat-value text-xl text-primary">
                {estimatedAssets ? formatEther(estimatedAssets) : "..."} ETH
              </div>
              <div className="stat-desc">Approximate value</div>
            </div>
          )}

          {/* Action Button */}
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-error w-full"
              onClick={() => setShowConfirmation(true)}
              disabled={!isValid || isWithdrawing}
            >
              {withdrawType === "full" ? "Withdraw All" : "Withdraw"}
            </button>
          </div>

          {/* Info */}
          <div className="divider"></div>
          <div className="text-xs text-base-content/50 space-y-1">
            <p>Partial withdrawal: Specify the amount of shares to withdraw</p>
            <p>Full withdrawal: Withdraw all shares and close your position</p>
            <p>Withdrawals are processed immediately on-chain</p>
          </div>
        </div>
      </div>

      <ConfirmationModal />
    </>
  );
};

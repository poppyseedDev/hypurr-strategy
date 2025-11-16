"use client";

import React, { useCallback, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Deposit form component
 * Handles token approval and deposit flow for USDC (6 decimals)
 */
export const DepositForm: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Get vault address dynamically
  const { data: vaultInfo } = useDeployedContractInfo("HypurrFiVault");
  const VAULT_ADDRESS = vaultInfo?.address;

  const USDC_DECIMALS = 6; // MockERC20 uses 6 decimals like real USDC

  // Fetch user's USDC token balance
  const { data: tokenBalance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "MockERC20",
    functionName: "balanceOf",
    args: [connectedAddress],
    query: {
      enabled: !!connectedAddress,
    },
  });

  // Compute allowance args
  const allowanceArgs = useMemo(
    () => [connectedAddress, VAULT_ADDRESS] as readonly [string | undefined, string | undefined],
    [connectedAddress, VAULT_ADDRESS],
  );

  // Fetch current allowance
  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "MockERC20",
    functionName: "allowance",
    args: allowanceArgs,
    query: {
      enabled: !!connectedAddress && !!VAULT_ADDRESS,
      refetchInterval: 3000, // Refetch every 3 seconds to catch approval updates
    },
  });

  // Fetch estimated shares for deposit amount
  const estimatedSharesAmount = useMemo(() => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return undefined;
    try {
      return parseUnits(depositAmount, USDC_DECIMALS);
    } catch {
      return undefined;
    }
  }, [depositAmount]);

  const { data: estimatedShares } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "convertToShares",
    args: [estimatedSharesAmount],
    query: {
      enabled: estimatedSharesAmount !== undefined,
    },
  });

  // Write hooks for approval, deposit, and minting
  const { writeContractAsync: approveAsync } = useScaffoldWriteContract("MockERC20");
  const { writeContractAsync: depositAsync } = useScaffoldWriteContract("HypurrFiVault");
  const { writeContractAsync: mintAsync } = useScaffoldWriteContract("MockERC20");

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!depositAmount || !allowance) return true;
    try {
      const amount = parseUnits(depositAmount, USDC_DECIMALS);
      return allowance < amount;
    } catch {
      return true;
    }
  }, [depositAmount, allowance]);

  // Validate deposit amount
  const { isValid, errorMessage } = useMemo(() => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return { isValid: false, errorMessage: "Enter an amount" };
    }
    try {
      const amount = parseUnits(depositAmount, USDC_DECIMALS);
      if (tokenBalance && amount > tokenBalance) {
        return { isValid: false, errorMessage: "Insufficient balance" };
      }
      return { isValid: true, errorMessage: "" };
    } catch {
      return { isValid: false, errorMessage: "Invalid amount" };
    }
  }, [depositAmount, tokenBalance]);

  // Handle minting USDC
  const handleMint = useCallback(async () => {
    if (!connectedAddress) return;

    try {
      setIsMinting(true);

      // Mint 10,000 USDC (10,000 * 10^6 = 10,000,000,000)
      const mintAmount = parseUnits("10000", USDC_DECIMALS);

      await mintAsync({
        functionName: "mint",
        args: [connectedAddress, mintAmount],
      });

      notification.success("Minted 10,000 USDC successfully!");

      // Wait a bit for the transaction to be mined, then refetch balance
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetchBalance();
    } catch (error: any) {
      console.error("Mint error:", error);
      notification.error(error?.shortMessage || error?.message || "Mint failed");
    } finally {
      setIsMinting(false);
    }
  }, [connectedAddress, mintAsync, refetchBalance]);

  // Handle approval
  const handleApprove = useCallback(async () => {
    if (!connectedAddress || !depositAmount || !VAULT_ADDRESS) return;

    try {
      setIsApproving(true);

      // Use max uint256 for infinite approval (common DeFi pattern)
      const MAX_UINT256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

      await approveAsync({
        functionName: "approve",
        args: [VAULT_ADDRESS, MAX_UINT256],
      });

      notification.success("Approval successful! You can now deposit.");

      // Wait a bit for the transaction to be mined, then refetch
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetchAllowance();
    } catch (error: any) {
      console.error("Approval error:", error);
      notification.error(error?.shortMessage || error?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  }, [connectedAddress, depositAmount, approveAsync, refetchAllowance, VAULT_ADDRESS]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!connectedAddress || !depositAmount) return;

    // Double-check allowance before depositing
    if (needsApproval) {
      notification.error("Please approve the token first");
      return;
    }

    try {
      setIsDepositing(true);
      const amount = parseUnits(depositAmount, USDC_DECIMALS);

      await depositAsync({
        functionName: "deposit",
        args: [amount, connectedAddress], // ERC-4626 deposit requires (assets, receiver)
      });

      notification.success("Deposit successful! Your shares are earning yield.");
      setDepositAmount("");

      // Refetch balance and allowance
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetchBalance();
      await refetchAllowance();
    } catch (error: any) {
      console.error("Deposit error:", error);
      notification.error(error?.shortMessage || error?.message || "Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  }, [connectedAddress, depositAmount, depositAsync, needsApproval, refetchBalance, refetchAllowance]);

  // Handle max button
  const handleMaxClick = useCallback(() => {
    if (tokenBalance) {
      setDepositAmount(formatUnits(tokenBalance, USDC_DECIMALS));
    }
  }, [tokenBalance]);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Deposit Assets</h2>

        {/* Mint USDC Button */}
        {connectedAddress && (
          <div className="alert alert-info">
            <div className="flex items-center gap-2">
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
                />
              </svg>
              <span className="flex-1">Need test USDC?</span>
              <button className="btn btn-sm btn-primary" onClick={handleMint} disabled={isMinting}>
                {isMinting && <span className="loading loading-spinner loading-xs"></span>}
                {isMinting ? "Minting..." : "Mint 10,000 USDC"}
              </button>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Deposit Amount</span>
            <span className="label-text-alt">
              Balance: {tokenBalance ? formatUnits(tokenBalance, USDC_DECIMALS) : "0"} USDC
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className={`input input-bordered w-full ${errorMessage ? "input-error" : ""}`}
              disabled={!connectedAddress || isApproving || isDepositing}
            />
            <button
              className="btn btn-secondary"
              onClick={handleMaxClick}
              disabled={!connectedAddress || !tokenBalance || isApproving || isDepositing}
            >
              MAX
            </button>
          </div>
          {errorMessage && (
            <label className="label">
              <span className="label-text-alt text-error">{errorMessage}</span>
            </label>
          )}
        </div>

        {/* Allowance Status */}
        {connectedAddress && allowance !== undefined && (
          <div className={`alert ${needsApproval ? "alert-warning" : "alert-success"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              {needsApproval ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span>
              {needsApproval
                ? "Approval required before deposit"
                : `Approved: ${allowance > 1000000000000n ? "Unlimited" : formatUnits(allowance, USDC_DECIMALS)} USDC`}
            </span>
          </div>
        )}

        {/* Estimated Shares */}
        {estimatedShares && depositAmount && parseFloat(depositAmount) > 0 && (
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
            <span>You will receive approximately {formatUnits(estimatedShares, 18)} shares</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="card-actions justify-end mt-4">
          {!connectedAddress ? (
            <div className="alert alert-warning">
              <span>Please connect your wallet to deposit</span>
            </div>
          ) : needsApproval ? (
            <button className="btn btn-primary w-full" onClick={handleApprove} disabled={!isValid || isApproving}>
              {isApproving && <span className="loading loading-spinner"></span>}
              {isApproving ? "Approving..." : "Approve Token"}
            </button>
          ) : (
            <button className="btn btn-primary w-full" onClick={handleDeposit} disabled={!isValid || isDepositing}>
              {isDepositing && <span className="loading loading-spinner"></span>}
              {isDepositing ? "Depositing..." : "Deposit"}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="divider"></div>
        <div className="text-xs text-base-content/50 space-y-1">
          <p>💡 How it works:</p>
          <p>1. Mint test USDC tokens (for testing)</p>
          <p>2. Approve the vault to spend your USDC (one-time)</p>
          <p>3. Deposit USDC to receive vault shares</p>
          <p>4. Your shares earn leveraged yields automatically</p>
        </div>
      </div>
    </div>
  );
};

# HypurrFi Vault Frontend - Quick Reference Guide

## Quick Links & Components

### Component Import Paths
```typescript
// Read contract data
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Write to contracts
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Account info
import { useAccount } from "wagmi";

// UI Components from Scaffold-UI
import { Address, Balance, EtherInput } from "@scaffold-ui/components";

// Custom vault hooks
import { useVaultPosition } from "~~/hooks/useVaultPosition";
import { useVaultStats } from "~~/hooks/useVaultStats";
import { useHealthMetrics } from "~~/hooks/useHealthMetrics";
```

---

## Component Quick Start Templates

### Template 1: Deposit Form

```typescript
"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const DepositForm = () => {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Check balance
  const { data: userBalance } = useScaffoldReadContract({
    contractName: "UnderlyingToken",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  // Check allowance
  const { data: allowance } = useScaffoldReadContract({
    contractName: "UnderlyingToken",
    functionName: "allowance",
    args: [connectedAddress, "VAULT_ADDRESS"], // Replace with actual vault address
    watch: true,
  });

  // Get shares output
  const { data: estimatedShares } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "convertToShares",
    args: [amount ? parseEther(amount) : BigInt(0)],
  });

  const { writeContractAsync: approveAsync } = useScaffoldWriteContract("UnderlyingToken");
  const { writeContractAsync: depositAsync } = useScaffoldWriteContract("VaultContract");

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveAsync({
        functionName: "approve",
        args: ["VAULT_ADDRESS", parseEther(amount)],
      });
      setIsApproved(true);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    try {
      await depositAsync({
        functionName: "deposit",
        args: [parseEther(amount)],
      });
      setAmount("");
      setIsApproved(false);
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const needsApproval = !allowance || allowance < parseEther(amount || "0");

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="card-title mb-4">Deposit Assets</h2>

      <label className="form-control w-full mb-4">
        <div className="label">
          <span className="label-text">Amount</span>
          <span className="label-text-alt">
            Balance: {userBalance ? formatEther(userBalance) : "0"}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input input-bordered flex-1"
          />
          <button
            className="btn btn-ghost"
            onClick={() => setAmount(userBalance ? formatEther(userBalance) : "")}
          >
            Max
          </button>
        </div>
      </label>

      {amount && (
        <div className="mb-4 p-3 bg-base-300 rounded-lg text-sm">
          <div className="flex justify-between">
            <span>Estimated Shares:</span>
            <span className="font-bold">{estimatedShares ? formatEther(estimatedShares) : "0"}</span>
          </div>
        </div>
      )}

      {needsApproval ? (
        <button
          className="btn btn-primary w-full"
          disabled={!amount || isApproving}
          onClick={handleApprove}
        >
          {isApproving && <span className="loading loading-spinner"></span>}
          {isApproving ? "Approving..." : "Approve"}
        </button>
      ) : (
        <button
          className="btn btn-primary w-full"
          disabled={!amount || !isApproved}
          onClick={handleDeposit}
        >
          Deposit
        </button>
      )}
    </div>
  );
};
```

---

### Template 2: Position Display Card

```typescript
"use client";

import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useVaultPosition } from "~~/hooks/useVaultPosition";
import { useHealthMetrics } from "~~/hooks/useHealthMetrics";

export const PositionCard = () => {
  const { address: connectedAddress } = useAccount();
  const { shares, positionValue } = useVaultPosition(connectedAddress);
  const { healthFactor, riskLevel } = useHealthMetrics(connectedAddress);

  const { data: leverage } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "getCurrentLeverageRatio",
    watch: true,
  });

  const getRiskColor = (risk: string) => {
    const colors = {
      safe: "text-success",
      moderate: "text-warning",
      risky: "text-error",
      critical: "text-error",
    };
    return colors[risk as keyof typeof colors] || "text-neutral";
  };

  if (!connectedAddress) {
    return (
      <div className="card bg-base-200 shadow-xl p-6">
        <p className="text-center">Connect wallet to view position</p>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="card-title mb-6">Your Position</h2>

      <div className="space-y-4">
        <div className="stat bg-base-100 rounded-lg p-3">
          <div className="stat-title text-sm">Share Balance</div>
          <div className="stat-value text-2xl">{shares ? formatEther(shares) : "0"}</div>
        </div>

        <div className="stat bg-base-100 rounded-lg p-3">
          <div className="stat-title text-sm">Position Value</div>
          <div className="stat-value text-2xl">${positionValue ? formatEther(positionValue) : "0"}</div>
        </div>

        <div className="stat bg-base-100 rounded-lg p-3">
          <div className="stat-title text-sm">Current Leverage</div>
          <div className="stat-value text-2xl">{leverage ? formatEther(leverage) : "0"}x</div>
        </div>

        <div className="stat bg-base-100 rounded-lg p-3">
          <div className="stat-title text-sm">Health Factor</div>
          <div className={`stat-value text-2xl ${getRiskColor(riskLevel)}`}>
            {healthFactor ? formatEther(healthFactor) : "0"}
          </div>
          <div className={`stat-desc text-xs ${getRiskColor(riskLevel)}`}>{riskLevel}</div>
        </div>

        {/* Health Factor Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold">Health Status</span>
            <span className="text-xs">{healthFactor ? parseFloat(formatEther(healthFactor)).toFixed(2) : "0"}</span>
          </div>
          <progress
            className="progress w-full"
            value={healthFactor ? Math.min(parseFloat(formatEther(healthFactor)) * 50, 100) : 0}
            max="100"
          ></progress>
        </div>
      </div>
    </div>
  );
};
```

---

### Template 3: Vault Stats Display

```typescript
"use client";

import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useVaultStats } from "~~/hooks/useVaultStats";

export const VaultStats = () => {
  const { tvl, apy, leverage, utilization } = useVaultStats();

  const statCards = [
    { label: "Total Value Locked", value: tvl, suffix: "$", loading: !tvl },
    { label: "Current APY", value: apy, suffix: "%", loading: !apy },
    { label: "Avg Leverage", value: leverage, suffix: "x", loading: !leverage },
    { label: "Utilization", value: utilization, suffix: "%", loading: !utilization },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {statCards.map((stat, idx) => (
        <div key={idx} className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-sm">{stat.label}</div>
          <div className="stat-value text-2xl">
            {stat.loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                {stat.suffix === "$" && "$"}
                {typeof stat.value === "bigint" ? formatEther(stat.value) : stat.value}
                {stat.suffix && stat.suffix !== "$" && stat.suffix}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

### Template 4: Withdraw Form

```typescript
"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useVaultPosition } from "~~/hooks/useVaultPosition";

export const WithdrawForm = () => {
  const { address: connectedAddress } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawType, setWithdrawType] = useState<"partial" | "full">("partial");

  const { shares } = useVaultPosition(connectedAddress);

  // Get assets output
  const { data: estimatedAssets } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "convertToAssets",
    args: [withdrawAmount ? parseEther(withdrawAmount) : BigInt(0)],
  });

  const { writeContractAsync: withdrawAsync } = useScaffoldWriteContract("VaultContract");

  const handleWithdraw = async () => {
    try {
      const amount = withdrawType === "full" && shares ? shares : parseEther(withdrawAmount);
      await withdrawAsync({
        functionName: "withdraw",
        args: [amount],
      });
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="card-title mb-4">Withdraw Assets</h2>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Withdrawal Type</span>
        </label>
        <div className="flex gap-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="withdraw-type"
              className="radio"
              checked={withdrawType === "partial"}
              onChange={() => setWithdrawType("partial")}
            />
            <span className="label-text ml-2">Partial</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="withdraw-type"
              className="radio"
              checked={withdrawType === "full"}
              onChange={() => setWithdrawType("full")}
            />
            <span className="label-text ml-2">Full</span>
          </label>
        </div>
      </div>

      {withdrawType === "partial" && (
        <label className="form-control w-full mb-4">
          <div className="label">
            <span className="label-text">Shares to Withdraw</span>
            <span className="label-text-alt">Available: {shares ? formatEther(shares) : "0"}</span>
          </div>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            className="input input-bordered w-full"
          />
        </label>
      )}

      {(withdrawType === "full" || withdrawAmount) && (
        <div className="mb-4 p-3 bg-base-300 rounded-lg text-sm">
          <div className="flex justify-between">
            <span>Estimated Assets:</span>
            <span className="font-bold">
              {estimatedAssets ? formatEther(estimatedAssets) : "0"}
            </span>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary w-full"
        disabled={!shares || (withdrawType === "partial" && !withdrawAmount)}
        onClick={handleWithdraw}
      >
        Withdraw
      </button>
    </div>
  );
};
```

---

### Template 5: Custom Hook - useVaultPosition

```typescript
// packages/nextjs/hooks/useVaultPosition.ts

import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const useVaultPosition = (userAddress?: string) => {
  const { data: shares, isLoading: sharesLoading } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "balanceOf",
    args: [userAddress],
    watch: true,
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: totalAssets, isLoading: totalAssetsLoading } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "totalAssets",
    watch: true,
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "totalSupply",
    watch: true,
  });

  const positionValue = useMemo(() => {
    if (!shares || !totalAssets || !totalSupply || totalSupply === BigInt(0)) {
      return BigInt(0);
    }
    return (shares * totalAssets) / totalSupply;
  }, [shares, totalAssets, totalSupply]);

  const isLoading = sharesLoading || totalAssetsLoading || totalSupplyLoading;

  return {
    shares: shares || BigInt(0),
    positionValue,
    totalSupply: totalSupply || BigInt(0),
    isLoading,
  };
};
```

---

### Template 6: Health Factor Indicator

```typescript
"use client";

import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const HealthFactorIndicator = () => {
  const { address: connectedAddress } = useAccount();

  const { data: healthFactor, isLoading } = useScaffoldReadContract({
    contractName: "VaultContract",
    functionName: "getHealthFactor",
    args: [connectedAddress],
    watch: true,
    query: {
      enabled: !!connectedAddress,
    },
  });

  const getHealthStatus = (hf: bigint | undefined) => {
    if (!hf) return { label: "Unknown", color: "text-neutral", bgColor: "bg-neutral" };
    const hfValue = parseFloat(formatEther(hf));
    if (hfValue >= 2) return { label: "Safe", color: "text-success", bgColor: "bg-success" };
    if (hfValue >= 1.5) return { label: "Moderate", color: "text-warning", bgColor: "bg-warning" };
    if (hfValue >= 1) return { label: "Risky", color: "text-error", bgColor: "bg-error" };
    return { label: "Critical", color: "text-error", bgColor: "bg-error" };
  };

  const status = getHealthStatus(healthFactor);
  const hfValue = healthFactor ? parseFloat(formatEther(healthFactor)) : 0;

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h3 className="text-lg font-bold mb-4">Health Status</h3>

      <div className="flex items-center justify-center mb-4">
        <div className="radial-progress" style={{ "--value": Math.min(hfValue * 50, 100) } as any}>
          <span className={`font-bold text-2xl ${status.color}`}>{hfValue.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center">
        <p className={`text-lg font-bold mb-2 ${status.color}`}>{status.label}</p>
        {hfValue < 1.2 && (
          <div className="alert alert-warning mt-4">
            <svg className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your position is at risk. Consider rebalancing.</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Key Values to Track

### User Position
```typescript
interface UserPosition {
  shares: bigint;              // User's vault shares
  underlyingValue: bigint;     // Value in underlying assets
  leverageRatio: bigint;       // User's leverage (1x minimum)
  healthFactor: bigint;        // Liquidation safety metric
  unrealizedPnL: bigint;       // Profit/loss from positions
}
```

### Vault Statistics
```typescript
interface VaultStats {
  tvl: bigint;                 // Total value locked
  apy: bigint;                 // Annual percentage yield
  currentLeverage: bigint;     // Vault's average leverage
  utilization: bigint;         // Capital utilization %
  rebalanceNeeded: boolean;    // Should rebalance
}
```

---

## Common Patterns

### Handle Approval Flow
```typescript
const needsApproval = !allowance || allowance < requiredAmount;

if (needsApproval) {
  // Show approve button first
  await approveAsync({ functionName: "approve", args: [spender, amount] });
}

// Then execute main transaction
await transactionAsync({...});
```

### Calculate Share Value
```typescript
// Shares to Assets
const assets = (shares * totalAssets) / totalSupply;

// Assets to Shares
const shares = (assets * totalSupply) / totalAssets;
```

### Format Display Values
```typescript
import { formatEther, formatUnits } from "viem";

const displayValue = formatEther(bigintValue);      // For 18 decimals
const displayValue = formatUnits(bigintValue, 6);   // For 6 decimals (USDC)
```

---

## Error Messages to Handle

```typescript
const errorMessages: { [key: string]: string } = {
  "insufficient balance": "Your balance is too low",
  "allowance": "Please approve the token spending first",
  "execution reverted": "Transaction failed. Check your position",
  "user rejected": "You cancelled the transaction",
  "network": "Wrong network. Please switch chains",
  "contract": "Contract error. Try again later",
};
```

---

## Testing the Components

### Local Testing
```bash
# Start local Hardhat node
yarn hardhat node

# Deploy contracts
yarn deploy

# Start Next.js dev server
yarn start

# Visit http://localhost:3000/vault
```

### Contract Interactions
```typescript
// Test deposit
await vault.deposit(parseEther("10"));

// Check balance
const balance = await vault.balanceOf(userAddress);

// Check shares
const shares = await vault.totalSupply();
```

---

## DaisyUI CSS Classes Cheat Sheet

```typescript
// Buttons
className="btn btn-primary"        // Primary action
className="btn btn-secondary"      // Secondary action
className="btn btn-accent"         // Accent button
className="btn btn-ghost"          // Ghost style
className="btn btn-sm"             // Small button
className="btn loading"            // Loading state

// Cards
className="card bg-base-200 shadow-xl"  // Standard card
className="card-title"                   // Card title
className="card-body"                    // Card body

// Forms
className="form-control"           // Form container
className="input input-bordered"   // Text input
className="label"                  // Form label
className="label-text"             // Label text

// Alerts
className="alert alert-info"       // Info alert
className="alert alert-warning"    // Warning alert
className="alert alert-error"      // Error alert
className="alert alert-success"    // Success alert

// Layout
className="grid grid-cols-1 md:grid-cols-2 gap-4"  // Responsive grid
className="flex items-center justify-between"       // Flex layout

// Typography
className="text-lg font-bold"      // Large bold text
className="text-sm text-gray-500"  // Small muted text
```

---

## Next Steps

1. Copy the component templates and customize for your vault contract
2. Update contract function names and parameter types to match your ABI
3. Add more hooks as needed for complex data calculations
4. Test each component independently before integration
5. Implement error handling and loading states
6. Add transaction notifications and confirmations
7. Style with DaisyUI and your brand colors

---

## Resources

- Scaffold-ETH Docs: https://docs.scaffoldeth.io
- Wagmi Hooks: https://wagmi.sh/react/hooks
- DaisyUI Components: https://daisyui.com/components
- Viem Documentation: https://viem.sh
- React Best Practices: https://react.dev

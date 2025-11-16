# HypurrFi Leverage Loop Vault - Frontend UI Architecture Plan

## Overview
This document provides a comprehensive frontend architecture plan for the HypurrFi leverage loop vault UI using Scaffold-ETH 2 with Next.js App Router, React, and DaisyUI.

---

## 1. Page Structure

### Recommended Approach: Create New `/vault` Page

Since this is a distinct feature from the existing pages (Home, ERC-20, Debug), create a new dedicated page structure:

```
packages/nextjs/app/
├── page.tsx                          (Home - existing)
├── erc20/
│   └── page.tsx                      (ERC-20 - existing)
├── debug/
│   └── page.tsx                      (Debug Contracts - existing)
├── vault/
│   ├── layout.tsx                    (Vault layout wrapper)
│   ├── page.tsx                      (Main vault dashboard)
│   ├── _components/
│   │   ├── VaultHeader.tsx           (Title and network info)
│   │   ├── DepositForm.tsx           (Deposit asset input form)
│   │   ├── WithdrawForm.tsx          (Partial/full withdrawal form)
│   │   ├── PositionCard.tsx          (User position display)
│   │   ├── VaultStats.tsx            (TVL, APY, leverage metrics)
│   │   ├── HealthFactorIndicator.tsx (Health factor visual)
│   │   ├── RebalanceButton.tsx       (Rebalance trigger)
│   │   ├── TransactionHistory.tsx    (Recent vault actions)
│   │   └── LoadingSkeletons.tsx      (Placeholder UI)
```

### Header Menu Update

Add a new menu link in `/packages/nextjs/components/Header.tsx`:

```typescript
// Add to menuLinks array
{
  label: "Vault",
  href: "/vault",
  icon: <BuildingLibraryIcon className="h-4 w-4" />,
}
```

---

## 2. Key React Components Architecture

### Component Hierarchy

```
VaultPage (page.tsx)
├── VaultHeader
├── MainLayout (two-column or stacked grid)
│   ├── LeftColumn
│   │   ├── DepositForm
│   │   └── WithdrawForm (Tab-based or Modal)
│   └── RightColumn
│       ├── PositionCard
│       │   ├── SharesDisplay
│       │   ├── UnderlyingValueDisplay
│       │   ├── LeverageRatioDisplay
│       │   ├── HealthFactorIndicator
│       │   └── RebalanceButton
│       └── VaultStats
│           ├── TVLDisplay
│           ├── APYDisplay
│           ├── CurrentLeverageDisplay
│           ├── UtilizationRateDisplay
│           └── VaultAgeDisplay
└── TransactionHistory (collapsible or full width below)
```

### Component Specifications

#### 1. **VaultHeader Component**
- **Purpose**: Display vault title, network info, and basic stats
- **Props**: None (uses hooks for data)
- **Features**:
  - Vault name and description
  - Connected network indicator
  - Last update timestamp
  - Risk warning banner (if health factor < threshold)

#### 2. **DepositForm Component**
- **Purpose**: Allow users to deposit assets into the vault
- **State**:
  - `depositAmount: string`
  - `approvalState: 'idle' | 'approving' | 'approved'`
  - `isLoading: boolean`
- **Features**:
  - Asset selection (dropdown if multi-asset vault)
  - Amount input with "Max" button
  - Estimated shares output (calculated from deposit amount)
  - Approval flow (approve → deposit)
  - Gas estimate display
  - Transaction status indicators

#### 3. **WithdrawForm Component**
- **Purpose**: Handle partial and full withdrawals
- **State**:
  - `withdrawAmount: string`
  - `withdrawType: 'partial' | 'full'`
  - `isLoading: boolean`
- **Features**:
  - Toggle between partial/full withdrawal
  - Slider or input for amount selection
  - Estimated assets received calculation
  - Withdrawal fee display (if applicable)
  - Confirmation dialog before withdrawal

#### 4. **PositionCard Component**
- **Purpose**: Display user's current vault position
- **Dynamic Data**:
  - User's share balance
  - Underlying asset value
  - Current leverage ratio
  - Health factor
  - Entry price/APY earned
- **Features**:
  - Real-time value updates
  - Health factor color coding (green/yellow/red)
  - Leverage ratio visualization (progress bar)
  - Unrealized PnL display (if applicable)

#### 5. **HealthFactorIndicator Component**
- **Purpose**: Visual representation of account health
- **Features**:
  - Circular progress indicator
  - Color gradient (green → yellow → red)
  - Numerical value display
  - Risk level text
  - Warning message if approaching liquidation

#### 6. **VaultStats Component**
- **Purpose**: Display vault-wide statistics
- **Metrics**:
  - Total Value Locked (TVL)
  - Current APY
  - Current Leverage Level
  - Vault Utilization Rate
  - Vault Age / Creation Date
  - Number of active positions
- **Features**:
  - Grid layout with stat cards
  - Comparison to previous period (if historical data available)
  - Trend indicators (up/down arrows)

#### 7. **RebalanceButton Component**
- **Purpose**: Trigger vault rebalancing if needed
- **State**:
  - `isRebalanceNeeded: boolean`
  - `isRebalancing: boolean`
- **Features**:
  - Shows when rebalance is needed (based on deviation threshold)
  - Disabled state when not needed
  - Loading spinner during rebalancing
  - Success/error notification

#### 8. **TransactionHistory Component**
- **Purpose**: Display recent vault transactions
- **Features**:
  - List of deposits, withdrawals, rebalances
  - Timestamp, amount, hash
  - Status badges (pending, confirmed, failed)
  - Filter/search capabilities
  - Link to block explorer

#### 9. **LoadingSkeletons Component**
- **Purpose**: Placeholder UI while data loads
- **Includes**:
  - Skeleton loaders for position card
  - Skeleton loaders for stats
  - Skeleton loaders for forms

---

## 3. Scaffold-ETH Hooks Usage

### Required Hooks Strategy

#### A. **useScaffoldReadContract** (Read-Only Operations)

Used for fetching vault state without modifications:

```typescript
// Get user's vault shares balance
const { data: userShares } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "balanceOf",
  args: [userAddress],
  watch: true, // Re-fetch on block changes
});

// Get total vault TVL
const { data: totalAssets } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "totalAssets",
  watch: true,
});

// Get vault current leverage ratio
const { data: currentLeverage } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "getCurrentLeverageRatio",
  watch: true,
});

// Get user's health factor
const { data: healthFactor } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "getHealthFactor",
  args: [userAddress],
  watch: true,
});

// Get vault APY
const { data: currentAPY } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "getCurrentAPY",
  watch: true,
});

// Check if rebalance is needed
const { data: isRebalanceNeeded } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "isRebalanceNeeded",
  watch: true,
});
```

#### B. **useScaffoldWriteContract** (Write Operations)

Used for state-modifying transactions:

```typescript
// For deposits
const { writeContractAsync: depositAsync } = useScaffoldWriteContract("VaultContract");

// For withdrawals
const { writeContractAsync: withdrawAsync } = useScaffoldWriteContract("VaultContract");

// For rebalancing
const { writeContractAsync: rebalanceAsync } = useScaffoldWriteContract("VaultContract");

// For token approvals (if needed)
const { writeContractAsync: approveAsync } = useScaffoldWriteContract("UnderlyingToken");
```

#### C. **useAccount** (Wagmi Hook)

Get connected wallet information:

```typescript
const { address: connectedAddress, isConnected, chain } = useAccount();
```

#### D. **useContractEvent** (Event Listening)

Listen for vault events (optional, for real-time updates):

```typescript
const { data: deposits } = useScaffoldWatchContractEvent({
  contractName: "VaultContract",
  eventName: "Deposit",
  fromBlock: startBlock,
  listener: (logs) => {
    // Handle new deposit events
  },
});
```

### Read Operations Reference Table

| Function | Purpose | Watch | Args |
|----------|---------|-------|------|
| `balanceOf(address)` | User's share balance | true | User address |
| `totalAssets()` | Total vault TVL | true | None |
| `totalSupply()` | Total shares issued | true | None |
| `convertToAssets(shares)` | Convert shares to underlying | false | Share amount |
| `convertToShares(assets)` | Convert assets to shares | false | Asset amount |
| `getCurrentLeverageRatio()` | Current vault leverage | true | None |
| `getHealthFactor(address)` | User health factor | true | User address |
| `getCurrentAPY()` | Current APY | true | None |
| `isRebalanceNeeded()` | Rebalance status | true | None |
| `getVaultStats()` | Aggregate stats | true | None |
| `getPositionDetails(address)` | User position details | true | User address |

### Write Operations Reference Table

| Function | Purpose | Args | Requires Approval |
|----------|---------|------|-------------------|
| `deposit(assets)` | Deposit assets | Asset amount | Yes (if ERC20) |
| `withdraw(shares)` | Withdraw shares | Share amount | No |
| `rebalance()` | Trigger rebalancing | None | No |
| `approve(spender, amount)` | Approve token spending | Contract address, amount | No |

---

## 4. Data Display & Fetching Strategy

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│ Smart Contract (On-Chain State)                    │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ useScaffoldReadContract Hooks (Primary Data Source)│
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ Custom Hooks (Data Transformation & Calculation)   │
│ - useVaultPosition                                  │
│ - useVaultStats                                     │
│ - useHealthMetrics                                  │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│ React Components (UI Rendering)                    │
└─────────────────────────────────────────────────────┘
```

### Custom Hooks to Create

#### 1. **useVaultPosition** Hook
```typescript
// packages/nextjs/hooks/useVaultPosition.ts
export const useVaultPosition = (userAddress?: string) => {
  const { data: shares } = useScaffoldReadContract({...});
  const { data: totalAssets } = useScaffoldReadContract({...});
  const { data: totalSupply } = useScaffoldReadContract({...});

  const positionValue = useMemo(() => {
    if (!shares || !totalAssets || !totalSupply) return 0;
    return (shares * totalAssets) / totalSupply;
  }, [shares, totalAssets, totalSupply]);

  return { shares, positionValue, underlyingAssets: ... };
};
```

#### 2. **useVaultStats** Hook
```typescript
// packages/nextjs/hooks/useVaultStats.ts
export const useVaultStats = () => {
  const { data: tvl } = useScaffoldReadContract({...});
  const { data: apy } = useScaffoldReadContract({...});
  const { data: leverage } = useScaffoldReadContract({...});

  return { tvl, apy, leverage, ... };
};
```

#### 3. **useHealthMetrics** Hook
```typescript
// packages/nextjs/hooks/useHealthMetrics.ts
export const useHealthMetrics = (userAddress?: string) => {
  const { data: healthFactor } = useScaffoldReadContract({...});

  const riskLevel = useMemo(() => {
    if (!healthFactor) return 'unknown';
    if (healthFactor >= 2) return 'safe';
    if (healthFactor >= 1.5) return 'moderate';
    if (healthFactor >= 1) return 'risky';
    return 'critical';
  }, [healthFactor]);

  return { healthFactor, riskLevel };
};
```

### Data Update Strategy

| Data Type | Update Frequency | Method | Rationale |
|-----------|------------------|--------|-----------|
| User Position | Per block | useScaffoldReadContract with watch: true | Changes on deposits/rebalances |
| Vault Stats | Per block | useScaffoldReadContract with watch: true | TVL, APY change over time |
| Health Factor | Per block | useScaffoldReadContract with watch: true | Critical for risk management |
| Transaction History | On demand | Manual refetch + event listeners | Historical data, not real-time critical |
| Market Prices | 10-30 sec | Custom hook or price feed | External data, less critical |

---

## 5. UI/UX Flow Diagrams

### 5.1 Deposit Flow

```
┌─ User Visits Vault Page
│
├─ Check if wallet connected
│  ├─ YES → Load user position
│  └─ NO → Show connect wallet prompt
│
├─ Check if user has approved vault contract
│  ├─ YES → Show deposit amount input
│  └─ NO → Show "Approve" button first
│
├─ User enters deposit amount
│  ├─ Show estimated shares received (real-time calculation)
│  ├─ Show estimated APY earnings
│  └─ Show gas estimate
│
├─ User clicks "Deposit"
│  ├─ If not approved: Approve token first (wait for confirmation)
│  ├─ Then: Submit deposit transaction
│  └─ Show loading spinner with tx hash link
│
└─ Transaction confirmed
   ├─ Update user position display
   ├─ Update vault stats
   └─ Show success toast notification
```

### 5.2 Withdrawal Flow

```
┌─ User on vault page with active position
│
├─ User toggles withdrawal mode (partial/full)
│
├─ If PARTIAL withdrawal:
│  ├─ Show slider or input for withdrawal amount
│  ├─ Max value = user's current share balance
│  └─ Show estimated assets received
│
├─ If FULL withdrawal:
│  ├─ Auto-populate with 100% of shares
│  └─ Show all assets will be withdrawn
│
├─ Show withdrawal details:
│  ├─ Current position value
│  ├─ Estimated value after withdrawal
│  ├─ Any withdrawal fees
│  └─ Gas estimate
│
├─ User clicks "Withdraw"
│  ├─ Show confirmation dialog
│  ├─ Submit withdrawal transaction
│  └─ Show loading spinner
│
└─ Transaction confirmed
   ├─ Update user position
   ├─ Update vault stats
   ├─ Show success toast
   └─ Clear form inputs
```

### 5.3 Rebalancing Flow

```
┌─ Monitor vault state
│
├─ Check if rebalance needed
│  ├─ YES → Highlight rebalance button
│  └─ NO → Disable rebalance button with tooltip
│
├─ If rebalance needed, show reason:
│  ├─ Leverage ratio drifted X%
│  ├─ Collateral dropped below threshold
│  └─ Market conditions changed
│
├─ User clicks "Rebalance" button
│  ├─ Show confirmation with rebalancing details
│  ├─ Show estimated gas cost
│  └─ Estimate impact on leverage ratio
│
├─ Submit rebalance transaction
│  ├─ Show detailed steps (liquidation, re-lending, etc.)
│  ├─ Monitor transaction progress
│  └─ Disable button while rebalancing
│
└─ Rebalance complete
   ├─ Update health factor display
   ├─ Update leverage ratio
   └─ Show success notification
```

### 5.4 Position Monitoring

```
┌─ Real-time Updates
│
├─ Every block (~12 seconds on Ethereum)
│  ├─ Fetch user shares balance
│  ├─ Fetch vault total assets (TVL)
│  ├─ Fetch current leverage ratio
│  └─ Calculate position value
│
├─ Health Factor Changes
│  ├─ Color indicator updates:
│  │  ├─ Green: HF > 2.0
│  │  ├─ Yellow: 1.5 < HF < 2.0
│  │  ├─ Orange: 1.0 < HF < 1.5
│  │  └─ Red: HF < 1.0
│  └─ Show warning if approaching liquidation
│
└─ Display Updates
   ├─ Position value animation
   ├─ Unrealized PnL
   └─ APY earnings tracker
```

---

## 6. Layout Design

### Desktop Layout (>1024px)

```
┌─────────────────────────────────────────────────────────┐
│                      Header (Navbar)                    │
├─────────────────────────────────────────────────────────┤
│                    Vault Header                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   LEFT COLUMN        │  │   RIGHT COLUMN           │ │
│  │                      │  │                          │ │
│  │  ┌────────────────┐  │  │  ┌─────────────────────┐ │ │
│  │  │  Deposit Form  │  │  │  │ Position Card       │ │ │
│  │  └────────────────┘  │  │  │ - Shares            │ │ │
│  │                      │  │  │ - Value             │ │ │
│  │  ┌────────────────┐  │  │  │ - Leverage Ratio    │ │ │
│  │  │ Withdraw Form  │  │  │  │ - Health Factor     │ │ │
│  │  └────────────────┘  │  │  │ - Rebalance Button  │ │ │
│  │                      │  │  └─────────────────────┘ │ │
│  │                      │  │                          │ │
│  │                      │  │  ┌─────────────────────┐ │ │
│  │                      │  │  │ Vault Stats         │ │ │
│  │                      │  │  │ - TVL               │ │ │
│  │                      │  │  │ - APY               │ │ │
│  │                      │  │  │ - Leverage          │ │ │
│  │                      │  │  └─────────────────────┘ │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                 Transaction History                      │
├──────────────────────────────────────────────────────────┤
│                      Footer                              │
└──────────────────────────────────────────────────────────┘
```

### Mobile Layout (<1024px)

```
┌──────────────────────────┐
│     Header (Navbar)      │
├──────────────────────────┤
│   Vault Header           │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │  Position Card     │  │
│  │  - Shares          │  │
│  │  - Value           │  │
│  │  - Health Factor   │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  Deposit Form      │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  Withdraw Form     │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  Vault Stats       │  │
│  │  - TVL             │  │
│  │  - APY             │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  Transaction       │  │
│  │  History           │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│      Footer              │
└──────────────────────────┘
```

---

## 7. DaisyUI Components to Use

### Form Components
- `input` - For amount inputs
- `label` - For form labels
- `button` - Action buttons (primary, accent, ghost)
- `toggle` - For withdrawal type toggle
- `range` - For withdrawal amount slider
- `select` - For asset selection dropdown

### Display Components
- `card` - For position and stats cards
- `divider` - Section separators
- `badge` - Status badges (confirmed, pending, failed)
- `progress` - Health factor and leverage visualizations
- `stat` - For stat displays (TVL, APY, etc.)

### Feedback Components
- `loading` - Loading spinners during transactions
- `modal` - Confirmation dialogs
- `alert` - For warnings and important messages
- `toast` - Notifications for transaction success/failure

### Layout Components
- `navbar` - Already implemented in Header
- `footer` - Already implemented in Footer
- `drawer` - For mobile menu (already used)
- `tabs` - For deposit/withdraw toggle or transaction history filters
- `grid` / `flex` - For responsive layout

### Example Usage

```typescript
// Stat Display
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="stat bg-base-200 rounded-lg p-4">
    <div className="stat-title">Total Value Locked</div>
    <div className="stat-value">${tvl}</div>
    <div className="stat-desc">Vault size</div>
  </div>
</div>

// Form Input
<label className="form-control w-full">
  <div className="label">
    <span className="label-text">Deposit Amount</span>
    <span className="label-text-alt">Max: {maxAmount}</span>
  </div>
  <input
    type="number"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    className="input input-bordered w-full"
  />
</label>

// Button with Loading State
<button
  className="btn btn-primary"
  disabled={isLoading}
  onClick={handleDeposit}
>
  {isLoading && <span className="loading loading-spinner"></span>}
  {isLoading ? 'Processing...' : 'Deposit'}
</button>

// Alert
<div className="alert alert-warning">
  <svg className="stroke-current shrink-0 h-6 w-6">...</svg>
  <span>Health factor is getting low. Consider rebalancing.</span>
</div>

// Progress Indicator
<div className="flex items-center gap-2">
  <div className="flex-1">
    <progress
      className="progress progress-success"
      value={healthFactor * 50}
      max="100"
    ></progress>
  </div>
  <span className="text-sm font-bold">{healthFactor.toFixed(2)}</span>
</div>
```

---

## 8. State Management

### Component-Level State (useState)

Use for local form inputs and UI interactions:

```typescript
const [depositAmount, setDepositAmount] = useState<string>("");
const [isApproved, setIsApproved] = useState<boolean>(false);
const [selectedWithdrawType, setSelectedWithdrawType] = useState<"partial" | "full">("partial");
```

### Contract State (useScaffoldReadContract)

Use hooks for on-chain data that should update automatically:

```typescript
const { data: userShares, isLoading } = useScaffoldReadContract({...});
const { data: vaultTVL, isLoading } = useScaffoldReadContract({...});
```

### No Redux/Context Needed

Scaffold-ETH's hook-based approach with React Query (TanStack Query) is sufficient. The framework handles:
- Query caching
- Automatic refetching on block changes
- Request deduplication
- Error states

---

## 9. Error Handling & Validation

### Input Validation

```typescript
// Deposit amount validation
const validateDepositAmount = (amount: string, maxBalance: bigint) => {
  if (!amount || Number(amount) <= 0) return "Enter a valid amount";
  if (parseEther(amount) > maxBalance) return "Amount exceeds balance";
  return null;
};

// Withdrawal amount validation
const validateWithdrawAmount = (amount: string, maxShares: bigint) => {
  if (!amount || Number(amount) <= 0) return "Enter a valid amount";
  if (parseEther(amount) > maxShares) return "Amount exceeds your shares";
  return null;
};
```

### Error States

```typescript
// Show user-friendly errors
try {
  await depositAsync({...});
} catch (error) {
  if (error.message.includes("insufficient balance")) {
    showError("Insufficient balance");
  } else if (error.message.includes("allowance")) {
    showError("Please approve the vault first");
  } else {
    showError("Transaction failed. Try again.");
  }
}
```

### Transaction Status Tracking

```typescript
enum TxStatus {
  Idle = "idle",
  Pending = "pending",
  Confirming = "confirming",
  Confirmed = "confirmed",
  Failed = "failed",
}

const getTxStatusColor = (status: TxStatus) => {
  const colors = {
    idle: "badge-secondary",
    pending: "badge-warning",
    confirming: "badge-info",
    confirmed: "badge-success",
    failed: "badge-error",
  };
  return colors[status];
};
```

---

## 10. Performance Optimization

### Key Optimizations

1. **Lazy Loading**: Import components dynamically for vault page

```typescript
const PositionCard = dynamic(() => import('./PositionCard'), { loading: () => <Skeleton /> });
```

2. **Memoization**: Use React.memo for expensive components

```typescript
const VaultStats = React.memo(({ tvl, apy, leverage }) => {...});
```

3. **useCallback**: Memoize handler functions

```typescript
const handleDeposit = useCallback(async (amount: string) => {
  // Deposit logic
}, [writeContractAsync]);
```

4. **useMemo**: Memoize calculations

```typescript
const positionValue = useMemo(() => {
  return (shares * totalAssets) / totalSupply;
}, [shares, totalAssets, totalSupply]);
```

5. **Conditional Data Fetching**: Only fetch what's needed

```typescript
const { data } = useScaffoldReadContract({
  contractName: "Vault",
  functionName: "getStats",
  query: {
    enabled: isConnected && address !== undefined,
  },
});
```

---

## 11. File Structure Summary

```
packages/nextjs/
├── app/
│   └── vault/
│       ├── layout.tsx                    (Vault page layout)
│       ├── page.tsx                      (Main vault page)
│       └── _components/
│           ├── VaultHeader.tsx           (100 lines)
│           ├── DepositForm.tsx           (250 lines)
│           ├── WithdrawForm.tsx          (250 lines)
│           ├── PositionCard.tsx          (200 lines)
│           ├── VaultStats.tsx            (200 lines)
│           ├── HealthFactorIndicator.tsx (150 lines)
│           ├── RebalanceButton.tsx       (120 lines)
│           ├── TransactionHistory.tsx    (200 lines)
│           └── LoadingSkeletons.tsx      (150 lines)
├── hooks/
│   ├── useVaultPosition.ts               (50 lines)
│   ├── useVaultStats.ts                  (50 lines)
│   └── useHealthMetrics.ts               (50 lines)
└── components/
    └── Header.tsx                        (Add vault menu link)
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (1-2 days)
- [ ] Create `/vault` page structure
- [ ] Add vault menu link to Header
- [ ] Create VaultHeader component
- [ ] Setup useVaultPosition custom hook
- [ ] Create PositionCard component

### Phase 2: User Interactions (2-3 days)
- [ ] Implement DepositForm component
- [ ] Implement WithdrawForm component
- [ ] Add approval flow handling
- [ ] Add transaction status tracking

### Phase 3: Vault Information (1-2 days)
- [ ] Create VaultStats component
- [ ] Create HealthFactorIndicator
- [ ] Setup useVaultStats custom hook
- [ ] Setup useHealthMetrics custom hook

### Phase 4: Advanced Features (2-3 days)
- [ ] Implement RebalanceButton
- [ ] Add TransactionHistory component
- [ ] Implement event listeners for real-time updates
- [ ] Add LoadingSkeletons

### Phase 5: Polish & Testing (1-2 days)
- [ ] Error handling and validation
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## 13. Contract Function Assumptions

This plan assumes the vault contract implements (adjust based on actual contract):

### Read Functions
- `balanceOf(address)` → uint256 (user shares)
- `totalAssets()` → uint256 (TVL)
- `totalSupply()` → uint256 (total shares)
- `convertToAssets(uint256 shares)` → uint256
- `convertToShares(uint256 assets)` → uint256
- `getCurrentLeverageRatio()` → uint256
- `getHealthFactor(address)` → uint256
- `getCurrentAPY()` → uint256
- `isRebalanceNeeded()` → bool
- `getVaultStats()` → tuple (struct with stats)
- `getPositionDetails(address)` → tuple (struct with position info)

### Write Functions
- `deposit(uint256 assets)` → uint256 (shares returned)
- `withdraw(uint256 shares)` → uint256 (assets returned)
- `rebalance()` → bool
- `approve(address spender, uint256 amount)` → bool (ERC20 standard)

---

## 14. Testing Considerations

### Unit Tests
- Form validation functions
- Calculation functions (convertToAssets, convertToShares)
- Status enum and color mapping

### Integration Tests
- Deposit flow (approval + deposit)
- Withdrawal flow
- Rebalancing flow
- Event listeners

### E2E Tests
- Complete user journey from deposit to withdrawal
- Mobile responsiveness
- Error scenarios (insufficient balance, failed transactions)

---

## 15. Security Considerations

1. **Input Validation**: Always validate user inputs before contract calls
2. **Approval Limits**: Show and confirm approval amounts
3. **Slippage Protection**: Include slippage tolerance for swaps (if applicable)
4. **Transaction Confirmation**: Always show confirmation dialogs for significant transactions
5. **Health Factor Warnings**: Alert users when approaching liquidation
6. **Contract Verification**: Verify contract deployment and ABIs match deployed bytecode

---

## Conclusion

This architecture provides a comprehensive, scalable frontend for the HypurrFi leverage loop vault that:

- Leverages Scaffold-ETH 2's proven patterns and hooks
- Maintains clean separation of concerns
- Implements responsive design for all devices
- Uses DaisyUI for consistent, accessible styling
- Handles complex data flows with custom hooks
- Provides excellent user feedback and error handling
- Scales efficiently with performance optimizations

The modular component structure allows for easy testing, maintenance, and future extensions.

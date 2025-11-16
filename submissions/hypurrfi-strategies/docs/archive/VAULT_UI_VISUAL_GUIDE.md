# HypurrFi Vault Frontend - Visual Design & Flow Guide

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                          VaultPage                              │
│                  /app/vault/page.tsx                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  VaultHeader     │  │  MainContent     │  │   ErrorBoundary  │
│  Component       │  │  Grid Container  │  │   (Optional)     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ LEFT PANEL  │  │  MIDDLE PANEL    │  │  RIGHT PANEL     │
   │             │  │  (or stacked)    │  │  (Desktop only)  │
   └─────────────┘  └──────────────────┘  └──────────────────┘
        │                    │                     │
   ┌────┴────┐          ┌────┴──────┐         ┌────┴──────┐
   │          │          │           │         │           │
   ▼          ▼          ▼           ▼         ▼           ▼
Deposit   Withdraw   Position    Health    Vault      Rebalance
Form      Form       Card        Factor    Stats      Button
                     Component   Indicator Component
                                          Component
```

---

## Data Flow Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      USER INTERACTIONS                        │
│  (Input Amount, Click Deposit, Click Withdraw, etc.)         │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    COMPONENT STATE (useState)                 │
│  depositAmount, isApproving, withdrawType, etc.              │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│              CUSTOM HOOKS (Data Transformation)               │
│  useVaultPosition() → { shares, positionValue }               │
│  useVaultStats()    → { tvl, apy, leverage }                  │
│  useHealthMetrics() → { healthFactor, riskLevel }             │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│         SCAFFOLD-ETH HOOKS (Contract Calls)                   │
│  useScaffoldReadContract()  ← Read-only operations            │
│  useScaffoldWriteContract() ← State changes                   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│              WAGMI & VIEM (Blockchain Layer)                  │
│  Contract ABI + Address + Web3 Provider                       │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│            SMART CONTRACT (On-Chain State)                    │
│  VaultContract: balanceOf, totalAssets, deposit(), etc.       │
└───────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

### Deposit Transaction Flow

```
User Enters Amount
        │
        ▼
Check Balance
│
├─ Balance < Amount
│  └─ Show Error: "Insufficient Balance"
│     Stop
│
└─ Balance ≥ Amount
   └─ Continue
        │
        ▼
Check Allowance
│
├─ Allowance = 0 or < Amount
│  └─ Show "Approve" Button
│     User Clicks Approve
│     │
│     ▼
│     Call approve() → useScaffoldWriteContract
│     │
│     ├─ Pending:  Show "Approving..." spinner
│     ├─ Success:  Enable Deposit Button
│     └─ Failed:   Show Error Message
│
└─ Allowance ≥ Amount
   └─ Show "Deposit" Button
        │
        User Clicks Deposit
        │
        ▼
        Call deposit() → useScaffoldWriteContract
        │
        ├─ Pending:  Show "Processing..." spinner, disable button
        ├─ Success:
        │   ├─ Clear form
        │   ├─ Show success toast
        │   ├─ Refetch user position
        │   ├─ Refetch vault stats
        │   └─ Update UI
        │
        └─ Failed:
            ├─ Show error toast
            ├─ Suggest action (retry, check balance, etc.)
            └─ Keep form intact for retry
```

---

## Component-Specific UI States

### DepositForm States

```
STATE: INITIAL
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [_______] [Max]                     │
│                                     │
│ Balance: 100.50 ETH                 │
│                                     │
│ [Approve] (disabled until amount)  │
└─────────────────────────────────────┘

STATE: READY TO APPROVE
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [10.5] [Max]                        │
│                                     │
│ Balance: 100.50 ETH                 │
│ Estimated Shares: 10.23             │
│                                     │
│ [Approve]  ← Enabled, blue          │
└─────────────────────────────────────┘

STATE: APPROVING
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [10.5] [Max]                        │
│                                     │
│ Balance: 100.50 ETH                 │
│ Estimated Shares: 10.23             │
│                                     │
│ [◌ Approving...] ← Disabled, loading│
└─────────────────────────────────────┘

STATE: APPROVED, READY TO DEPOSIT
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [10.5] [Max]                        │
│                                     │
│ Balance: 100.50 ETH                 │
│ Estimated Shares: 10.23             │
│                                     │
│ [Deposit]  ← Enabled, green         │
└─────────────────────────────────────┘

STATE: DEPOSITING
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [10.5] [Max]                        │
│                                     │
│ Balance: 100.50 ETH                 │
│ Estimated Shares: 10.23             │
│ Tx Hash: 0x123...                   │
│                                     │
│ [◌ Depositing...] ← Disabled        │
└─────────────────────────────────────┘

STATE: SUCCESS
┌─────────────────────────────────────┐
│ DEPOSIT FORM                        │
├─────────────────────────────────────┤
│ Amount:                             │
│ [_______] [Max] (cleared)           │
│                                     │
│ New Balance: 90.00 ETH              │
│                                     │
│ [Approve]  ← Re-enabled             │
│                                     │
│ ✓ Deposit successful!               │
└─────────────────────────────────────┘
```

---

## Responsive Layout Breakdown

### Desktop (>1024px) Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                          VAULT HEADER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │   LEFT COLUMN           │  │  RIGHT COLUMN (2/3 width)  │  │
│  │   (1/3 width)           │  │                             │  │
│  │                         │  │  ┌─────────────────────────┐│  │
│  │ ┌─────────────────────┐ │  │  │  POSITION CARD          ││  │
│  │ │  DEPOSIT FORM       │ │  │  │  ┌─────────────────────┐││  │
│  │ │                     │ │  │  │  │ Shares: 100         │││  │
│  │ │ [Input] [Max]       │ │  │  │  │ Value: $50k         │││  │
│  │ │ [Approve/Deposit]   │ │  │  │  │ Leverage: 3.5x      │││  │
│  │ │                     │ │  │  │  │ Health: 2.1         │││  │
│  │ │ Estimated: 10 shares│ │  │  │  │ [Rebalance]         │││  │
│  │ └─────────────────────┘ │  │  │  └─────────────────────┘││  │
│  │                         │  │  │                             │  │
│  │ ┌─────────────────────┐ │  │  │  ┌─────────────────────┐│  │
│  │ │ WITHDRAW FORM       │ │  │  │  │ VAULT STATS         ││  │
│  │ │                     │ │  │  │  │ ┌──────┬──────────────┤│  │
│  │ │ ◯ Partial ◯ Full   │ │  │  │  │ │ TVL  │ $5.2M        ││  │
│  │ │ [Input] [Max]       │ │  │  │  │ ├──────┼──────────────┤│  │
│  │ │ [Withdraw]          │ │  │  │  │ │ APY  │ 15.3%        ││  │
│  │ │                     │ │  │  │  │ ├──────┼──────────────┤│  │
│  │ │ Estimated: $5k     │ │  │  │  │ │ Lev. │ 2.8x         ││  │
│  │ └─────────────────────┘ │  │  │  │ └──────┴──────────────┘│  │
│  │                         │  │  │                             │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    TRANSACTION HISTORY                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Date       │ Type       │ Amount   │ Status  │ Hash        │ │
│  │ 12:34 PM   │ Deposit    │ 10.5 ETH │ ✓ Done  │ 0x123...    │ │
│  │ 11:20 AM   │ Rebalance  │ -        │ ✓ Done  │ 0x456...    │ │
│  │ 10:15 AM   │ Deposit    │ 5.0 ETH  │ ✓ Done  │ 0x789...    │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                           FOOTER                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px) Layout

```
┌───────────────────────────────────────────────┐
│              VAULT HEADER                     │
├───────────────────────────────────────────────┤
│                                               │
│ ┌─────────────────────────────────────────┐  │
│ │  POSITION CARD (full width)             │  │
│ │  Shares: 100 | Value: $50k | HF: 2.1  │  │
│ └─────────────────────────────────────────┘  │
│                                               │
│ ┌─────────────────────────────────────────┐  │
│ │  VAULT STATS (full width)               │  │
│ │  TVL: $5.2M | APY: 15.3% | Lev: 2.8x  │  │
│ └─────────────────────────────────────────┘  │
│                                               │
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ DEPOSIT FORM     │ │ WITHDRAW FORM    │   │
│ │                  │ │                  │   │
│ │ [Input] [Max]    │ │ ◯ Partial/Full  │   │
│ │ [Approve]        │ │ [Input] [Max]    │   │
│ │                  │ │ [Withdraw]       │   │
│ └──────────────────┘ └──────────────────┘   │
│                                               │
├───────────────────────────────────────────────┤
│ TRANSACTION HISTORY (scrollable)              │
├───────────────────────────────────────────────┤
│             FOOTER                            │
└───────────────────────────────────────────────┘
```

### Mobile (<768px) Layout

```
┌─────────────────────────┐
│    VAULT HEADER         │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ POSITION CARD       │ │
│ │ Shares: 100         │ │
│ │ Value: $50k         │ │
│ │ Leverage: 3.5x      │ │
│ │ Health: 2.1         │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ DEPOSIT FORM        │ │
│ │                     │ │
│ │ [Input]     [Max]   │ │
│ │ [Approve/Deposit]   │ │
│ │                     │ │
│ │ Shares: 10          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ WITHDRAW FORM       │ │
│ │                     │ │
│ │ ◯ Partial ◯ Full   │ │
│ │ [Input]     [Max]   │ │
│ │ [Withdraw]          │ │
│ │                     │ │
│ │ Assets: $5k         │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ VAULT STATS         │ │
│ │ TVL: $5.2M          │ │
│ │ APY: 15.3%          │ │
│ │ Leverage: 2.8x      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ TX HISTORY (collapsed)│
│ │ [Show More >]        │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│       FOOTER            │
└─────────────────────────┘
```

---

## Color Coding System

### Health Factor Colors
```
┌────────────────────────────────────────────────────────────┐
│ Health Factor Status Visualization                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ HF ≥ 2.0 (Safe)          HF: 2.5                          │
│ ████████████████████     Progress: ■■■■■■■░░░░░░░░░░░░  │
│ Color: #10B981 (Green)   Background: bg-success            │
│                                                             │
│ 1.5 ≤ HF < 2.0 (Moderate) HF: 1.8                         │
│ ████████████████░░░░     Progress: ■■■■■■░░░░░░░░░░░░    │
│ Color: #FBBF24 (Amber)    Background: bg-warning           │
│                                                             │
│ 1.0 ≤ HF < 1.5 (Risky)   HF: 1.2                          │
│ ████████░░░░░░░░░░░░     Progress: ■■■■░░░░░░░░░░░░░░░░  │
│ Color: #EF4444 (Red)      Background: bg-error             │
│                                                             │
│ HF < 1.0 (Critical)      HF: 0.8                          │
│ ████░░░░░░░░░░░░░░░░░    Progress: ■■░░░░░░░░░░░░░░░░░░  │
│ Color: #DC2626 (Dark Red) Background: bg-error + pulse    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Transaction Status Colors
```
Pending   ◌ Yellow  (#FCD34D) - badge-warning
Confirming ⟳ Blue  (#3B82F6) - badge-info
Confirmed ✓ Green  (#10B981) - badge-success
Failed    ✗ Red    (#EF4444) - badge-error
```

---

## Button States

```
ENABLED STATE
┌─────────────────────┐
│    Deposit          │  ← Cursor: pointer
│   Blue bg           │  ← bg-primary
│ Hover: darker blue  │  ← hover:bg-primary-focus
└─────────────────────┘

DISABLED STATE
┌─────────────────────┐
│    Deposit          │  ← Cursor: not-allowed
│   Gray bg           │  ← opacity-50
│ No hover effect     │  ← pointer-events-none
└─────────────────────┘

LOADING STATE
┌─────────────────────┐
│  ◌ Processing...    │  ← Loading spinner
│   Blue bg           │
│   Disabled          │
└─────────────────────┘

ACTIVE STATE
┌─────────────────────┐
│    Approve          │  ← Currently executing
│ Darker blue bg      │  ← bg-primary-focus
│ Disabled            │
└─────────────────────┘
```

---

## Input Validation Visual States

```
EMPTY/INITIAL
┌──────────────────────┐
│ [__________________ ] │  ← Gray border
│                      │  ← Placeholder text
│ Balance: 100.50 ETH  │
└──────────────────────┘

VALID INPUT
┌──────────────────────┐
│ [10.5             ✓ ] │  ← Green border
│                      │  ← Check icon
│ Balance: 100.50 ETH  │
└──────────────────────┘

INVALID INPUT (Too Much)
┌──────────────────────┐
│ [150              ✗ ] │  ← Red border
│                      │  ← X icon
│ Balance: 100.50 ETH  │
│ ⚠ Insufficient       │  ← Red error message
└──────────────────────┘

INVALID INPUT (Decimals)
┌──────────────────────┐
│ [10.55555          ✗ ] │  ← Red border
│                      │  ← X icon
│ Balance: 100.50 ETH  │
│ ⚠ Too many decimals  │  ← Red error message
└──────────────────────┘

FOCUS STATE
┌──────────────────────┐
│ [10.5             | ] │  ← Blue border
│                      │  ← Cursor active
│ Balance: 100.50 ETH  │
│ Estimated: 9.87 sh. │  ← Live calculation
└──────────────────────┘
```

---

## Loading States Skeleton

```
LOADING POSITION CARD
┌─────────────────────────────────┐
│ Your Position                   │
├─────────────────────────────────┤
│ Shares: ▓▓▓▓▓▓▓▓ (shimmer)      │
│ Value: ▓▓▓▓▓▓▓▓▓ (shimmer)      │
│ Leverage: ▓▓▓▓ (shimmer)        │
│ Health: ▓▓▓ (shimmer)           │
│ Progress ▓▓▓▓▓░░░░░            │
└─────────────────────────────────┘

LOADING VAULT STATS
┌─────────────────────────────────┐
│ TVL        │ APY        │ Lev    │
│ ▓▓▓▓▓▓▓▓  │ ▓▓▓▓▓▓▓   │ ▓▓▓▓  │
│ (shimmer)  │ (shimmer)  │ (shim) │
└─────────────────────────────────┘

LOADING FORM
┌──────────────────────┐
│ Amount               │
│ ▓▓▓▓▓▓▓▓▓▓ (shimmer) │
│ [▓▓▓▓▓▓▓▓▓▓▓ max]   │
│ ▓▓▓▓▓▓▓▓▓ (shimmer) │
│ [▓▓▓▓▓▓▓▓▓▓▓▓]      │
└──────────────────────┘
```

---

## Alert & Notification Messages

### Success Toast (Top-right, auto-dismiss 5s)
```
┌──────────────────────────────────────┐
│ ✓ Deposit successful!                │
│   Tx: 0x123abc... [View on Explorer] │
└──────────────────────────────────────┘
```

### Error Toast (Top-right, manual dismiss)
```
┌──────────────────────────────────────┐
│ ✗ Deposit failed                     │
│   Insufficient balance. Need 10.5 ETH│
│   [Dismiss] [Retry]                  │
└──────────────────────────────────────┘
```

### Warning Alert (Persistent)
```
┌──────────────────────────────────────┐
│ ⚠ Health factor is low               │
│   HF: 1.1 - Consider rebalancing to  │
│   avoid liquidation                  │
│ [Rebalance Now]                      │
└──────────────────────────────────────┘
```

### Info Alert (Persistent)
```
┌──────────────────────────────────────┐
│ ⓘ Rebalance needed                   │
│   Leverage drifted 0.5x from target  │
│   [Rebalance] [Dismiss]              │
└──────────────────────────────────────┘
```

---

## Modal/Dialog Layouts

### Approval Modal
```
╔════════════════════════════════════════╗
║        APPROVE TOKEN SPENDING          ║
╠════════════════════════════════════════╣
║                                        ║
║  Allow Vault to use your tokens?      ║
║                                        ║
║  Amount: 10.5 ETH                      ║
║  Spender: 0xVault...                   ║
║  Chain: Ethereum Mainnet               ║
║                                        ║
║  This transaction will not move your   ║
║  tokens. You are only granting access  ║
║  to the vault contract.                ║
║                                        ║
║  [Cancel]  [Approve]                   ║
║                                        ║
╚════════════════════════════════════════╝
```

### Withdrawal Confirmation Modal
```
╔════════════════════════════════════════╗
║      CONFIRM WITHDRAWAL                ║
╠════════════════════════════════════════╣
║                                        ║
║  Withdraw 50 shares?                  ║
║                                        ║
║  You will receive:                     ║
║  ~$5,240.50 (may vary)                 ║
║                                        ║
║  Withdrawal Fee: $10 (0.19%)           ║
║                                        ║
║  New Position:                         ║
║  Shares: 50                            ║
║  Value: ~$5,240                        ║
║  Leverage: 3.2x                        ║
║                                        ║
║  [Cancel]  [Confirm Withdrawal]        ║
║                                        ║
╚════════════════════════════════════════╝
```

### Rebalance Confirmation Modal
```
╔════════════════════════════════════════╗
║       CONFIRM REBALANCING              ║
╠════════════════════════════════════════╣
║                                        ║
║  Rebalance vault position?             ║
║                                        ║
║  Current Leverage: 3.2x                ║
║  Target Leverage: 3.0x                 ║
║  Deviation: 6.7%                       ║
║                                        ║
║  Estimated Gas: 0.025 ETH (~$50)      ║
║  Impact: Low                           ║
║                                        ║
║  Steps:                                ║
║  1. Liquidate excess collateral        ║
║  2. Repay borrowed amount              ║
║  3. Re-borrow at target ratio          ║
║  4. Redeploy to yield strategy         ║
║                                        ║
║  [Cancel]  [Confirm Rebalance]         ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## Transaction Status Flow Visualization

```
TRANSACTION LIFECYCLE

User Submits TX
        │
        ▼
    PENDING
    (Awaiting mempool)
    ⏱ Countdown: 60s
        │
        ▼
    CONFIRMING
    (In blockchain)
    [████░░░░░░░] 1/12 confirmations
        │
        ▼
    CONFIRMED
    (Finalized)
    ✓ 12 confirmations
        │
        ├─ Success: Update UI, show success toast
        │
        └─ Failed: Show error toast, keep form
```

---

## Typography & Spacing System

### Font Sizes
- Page Title: 2.25rem (36px) - text-4xl
- Section Title: 1.875rem (30px) - text-3xl
- Card Title: 1.5rem (24px) - text-2xl
- Body Text: 1rem (16px) - text-base
- Small Text: 0.875rem (14px) - text-sm
- Tiny Text: 0.75rem (12px) - text-xs

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Component Spacing Examples
```
Card padding: p-6 (1.5rem)
Gap between cards: gap-4 (1rem)
Section margin: mt-8 (2rem)
List item padding: p-3 (0.75rem)
Form control spacing: mb-4 (1rem)
```

---

## Animation Specifications

### Smooth Transitions
- State changes: 150-200ms ease-in-out
- Loading spinners: 1000ms linear
- Loading skeletons: 1500ms shimmer effect
- Value updates: 300ms ease-out

### Examples
```css
/* Form input focus */
transition: border-color 200ms ease-in-out;

/* Loading spinner */
animation: spin 1s linear infinite;

/* Toast notification */
animation: slideInRight 300ms ease-out,
           slideOutRight 300ms ease-out 4700ms;

/* Health factor progress update */
transition: width 300ms ease-out;
```

---

## Accessibility Features

### Color Contrast
- Text on background: 4.5:1 minimum (WCAG AA)
- UI components: 3:1 minimum (WCAG AA)
- Focus indicators: Always visible (3px outline)

### Keyboard Navigation
- Tab order: Logical flow (left to right, top to bottom)
- Focus visible: Blue outline on all interactive elements
- Enter/Space: Activates buttons
- Escape: Closes modals

### Screen Reader Support
- All inputs have associated labels
- Buttons have descriptive text
- Loading states announced
- Error messages associated with inputs
- Icons have aria-label attributes

### Example Implementation
```tsx
<label htmlFor="deposit-amount" className="label">
  <span className="label-text">Deposit Amount</span>
</label>
<input
  id="deposit-amount"
  type="number"
  aria-label="Amount to deposit in ETH"
  aria-invalid={!!error}
  aria-describedby="deposit-error"
  className="input"
/>
{error && (
  <p id="deposit-error" className="text-error text-sm">
    {error}
  </p>
)}
```

---

## Performance Optimization Indicators

### Loading Optimization Checklist
- [ ] Show skeleton loaders immediately (no blank state)
- [ ] Progressive enhancement (show available data while loading rest)
- [ ] Lazy load non-critical components (transaction history)
- [ ] Debounce input changes (calculations)
- [ ] Cache contract data appropriately

### Example: Progressive Loading
```
1. Show page shell immediately (header, layout)
2. Show position card skeleton while fetching
3. Show vault stats skeleton while fetching
4. Show forms with disabled state while loading
5. Gradually unlock as data arrives
```

---

## Mobile-First Design Principles

### Thumb-Friendly Zones
```
┌─────────────────────────┐
│  Top (easy - top 1/3)   │  ← Good for important info
├─────────────────────────┤
│ Middle (medium)         │  ← Main interaction area
├─────────────────────────┤
│ Bottom (hard - bottom/4) │  ← Secondary actions
└─────────────────────────┘
```

### Button Sizing
- Minimum touch target: 44x44px
- Recommended: 48x48px
- Spacing between buttons: 16px minimum
- Primary buttons: Full width on mobile
- Secondary buttons: Side by side if space

### Font Sizing Mobile
- Minimum body text: 16px (prevents zoom on iOS)
- Form labels: 14px minimum
- Error messages: 12px minimum

---

## DaisyUI Component Combinations

### Success Card
```tsx
<div className="card bg-success/20 border border-success">
  <div className="card-body">
    <h2 className="card-title text-success">✓ Success</h2>
    <p>Your transaction was successful</p>
  </div>
</div>
```

### Error Alert
```tsx
<div className="alert alert-error">
  <svg className="stroke-current shrink-0 h-6 w-6">...</svg>
  <span>Something went wrong</span>
</div>
```

### Loading Spinner Button
```tsx
<button className="btn" disabled={isLoading}>
  {isLoading ? (
    <>
      <span className="loading loading-spinner"></span>
      Processing...
    </>
  ) : (
    'Submit'
  )}
</button>
```

---

## Summary

This visual guide provides comprehensive UI/UX specifications for implementing the HypurrFi vault frontend. Key takeaways:

1. **Responsive Design**: Mobile-first approach with clear breakpoints
2. **Color Coding**: Consistent health status visualization
3. **State Management**: Clear visual feedback for all states
4. **Accessibility**: WCAG AA compliant with keyboard navigation
5. **Performance**: Skeleton loaders and progressive enhancement
6. **DaisyUI**: Leverage existing components for consistency

All designs can be implemented using DaisyUI classes and Tailwind CSS utilities.

# HypurrFi Leverage Loop Vault - Frontend UI Architecture Plan

## Overview

This is a comprehensive frontend architecture plan for the HypurrFi leverage loop vault UI using **Scaffold-ETH 2** with **Next.js App Router**, **React**, and **DaisyUI**.

The plan includes everything needed to implement a professional, production-ready vault interface that allows users to deposit, withdraw, monitor positions, and rebalance their leveraged assets.

---

## What's Included

### 📋 5 Complete Planning Documents (~3,700 lines, 120+ KB)

1. **VAULT_UI_ARCHITECTURE_PLAN.md** (32KB)
   - Complete technical specification
   - Component architecture and hierarchy
   - Scaffold-ETH hooks integration strategy
   - Data flow and state management
   - UI/UX flow diagrams
   - Layout specifications
   - Performance optimization guide

2. **VAULT_UI_QUICK_REFERENCE.md** (20KB)
   - Developer's handbook with code templates
   - 6 ready-to-use component examples
   - Custom hooks implementation
   - Common patterns and solutions
   - DaisyUI CSS cheat sheet
   - Testing guide

3. **VAULT_UI_IMPLEMENTATION_CHECKLIST.md** (17KB)
   - Step-by-step task breakdown
   - 8 implementation phases
   - 100+ checkboxes for progress tracking
   - Quality assurance criteria
   - Timeline estimates (11-14 days)
   - Common issues and solutions

4. **VAULT_UI_VISUAL_GUIDE.md** (39KB)
   - UI/UX design specifications
   - ASCII diagrams and layout mockups
   - Color coding system
   - Component state visualizations
   - Responsive design breakdowns
   - Accessibility guidelines
   - Animation specifications

5. **VAULT_UI_PLANNING_SUMMARY.md** (15KB)
   - High-level overview of all documents
   - Quick navigation guide
   - Architecture decisions with rationale
   - Component summary table
   - Timeline and milestones
   - Success criteria

---

## Quick Start

### For Project Managers
1. Start with **VAULT_UI_PLANNING_SUMMARY.md** for overview
2. Use **VAULT_UI_IMPLEMENTATION_CHECKLIST.md** to track progress
3. Reference timeline estimates for project scheduling

### For Developers
1. Read **VAULT_UI_ARCHITECTURE_PLAN.md** sections 1-3 for architecture
2. Use **VAULT_UI_QUICK_REFERENCE.md** for code templates
3. Follow **VAULT_UI_IMPLEMENTATION_CHECKLIST.md** checklist
4. Reference **VAULT_UI_VISUAL_GUIDE.md** for styling decisions

### For Designers
1. Review **VAULT_UI_VISUAL_GUIDE.md** for complete specs
2. Check **VAULT_UI_ARCHITECTURE_PLAN.md** section 6 for layouts
3. Reference component specifications for dimensions and spacing

### For QA/Testers
1. Review **VAULT_UI_IMPLEMENTATION_CHECKLIST.md** Phase 6 (Testing)
2. Use **VAULT_UI_QUICK_REFERENCE.md** for local testing setup
3. Check **VAULT_UI_VISUAL_GUIDE.md** for accessibility requirements

---

## Key Features Planned

### User Capabilities
- ✅ Deposit assets into the vault
- ✅ View current position (shares, value, leverage, health factor)
- ✅ Withdraw funds (partial or full)
- ✅ See vault statistics (TVL, APY, leverage, utilization)
- ✅ Trigger rebalancing when needed

### Component Breakdown
- **Display Components** (8): Header, Position Card, Vault Stats, Health Indicator, Rebalance Button, Transaction History, Loading Skeletons
- **Form Components** (2): Deposit Form (with approval flow), Withdraw Form (partial/full)
- **Custom Hooks** (3): useVaultPosition, useVaultStats, useHealthMetrics

### Technology Stack
- **Framework:** Scaffold-ETH 2 (Next.js App Router)
- **State Management:** React hooks + Scaffold-ETH's useScaffoldReadContract/useScaffoldWriteContract
- **Data Fetching:** React Query (automatic caching, refetching)
- **Styling:** Tailwind CSS + DaisyUI components
- **Blockchain:** Wagmi + Viem
- **Type Safety:** TypeScript with strict mode

---

## Architecture at a Glance

```
/app/vault/
├── page.tsx                    Main vault page
├── layout.tsx                  Vault page layout
└── _components/
    ├── VaultHeader             Title, network info, warnings
    ├── DepositForm             Asset deposit with approval
    ├── WithdrawForm            Partial/full withdrawal
    ├── PositionCard            User position display
    ├── VaultStats              TVL, APY, leverage metrics
    ├── HealthFactorIndicator   Health status visualization
    ├── RebalanceButton         Rebalance trigger
    ├── TransactionHistory      Recent transactions
    └── LoadingSkeletons        Placeholder UI
```

---

## Implementation Timeline

| Phase | Duration | Tasks | Status |
|-------|----------|-------|--------|
| 1. Foundation | 1 day | Setup directories, layout, header | Planned |
| 2. Display Components | 2 days | 8 UI components | Planned |
| 3. Form Components | 2-3 days | Deposit & withdraw forms | Planned |
| 4. Custom Hooks | 1 day | Data hooks (position, stats, health) | Planned |
| 5. Integration | 1-2 days | Error handling, notifications | Planned |
| 6. Testing | 2-3 days | Unit, integration, E2E tests | Planned |
| 7. Optimization | 1 day | Performance tuning | Planned |
| 8. Deployment | 1 day | Documentation, deployment | Planned |
| **Total** | **11-14 days** | Full implementation | - |

---

## Document Navigation

### If you need to...

| Need | Document | Section |
|------|----------|---------|
| Understand overall architecture | ARCHITECTURE_PLAN | Sections 1-3 |
| Start coding a component | QUICK_REFERENCE | Component Templates |
| Track project progress | IMPLEMENTATION_CHECKLIST | Phase-by-phase |
| Make design decisions | VISUAL_GUIDE | All sections |
| Setup data fetching | ARCHITECTURE_PLAN | Section 3 (Hooks) |
| Understand user flows | ARCHITECTURE_PLAN | Section 5 (Flows) |
| Optimize performance | ARCHITECTURE_PLAN | Section 10 |
| Learn about testing | IMPLEMENTATION_CHECKLIST | Phase 6 |
| Get quick code snippets | QUICK_REFERENCE | Templates |
| See UI mockups | VISUAL_GUIDE | Layout sections |

---

## Key Decisions

### 1. Page Structure
- **Decision:** Create new `/app/vault` page
- **Why:** Keeps vault isolated, organized, and easy to maintain

### 2. Component Organization
- **Decision:** 9 focused components + 3 custom hooks
- **Why:** Modularity improves testability and reusability

### 3. Data Fetching
- **Decision:** useScaffoldReadContract with watch: true
- **Why:** Framework-native, automatic refetching, no Redux needed

### 4. Real-time Updates
- **Decision:** Watch enabled on critical data (health factor, position)
- **Why:** Users need immediate liquidation risk awareness

### 5. State Management
- **Decision:** Local useState + React Query caching
- **Why:** Keeps state close to usage, leverages framework features

### 6. Styling
- **Decision:** Tailwind + DaisyUI
- **Why:** Consistent with Scaffold-ETH 2, responsive by default

---

## Code Example Preview

### Reading Contract Data
```typescript
const { data: userShares } = useScaffoldReadContract({
  contractName: "VaultContract",
  functionName: "balanceOf",
  args: [userAddress],
  watch: true, // Re-fetch on block changes
});
```

### Writing to Contract (with Approval)
```typescript
const { writeContractAsync: approveAsync } = useScaffoldWriteContract("Token");
const { writeContractAsync: depositAsync } = useScaffoldWriteContract("Vault");

// First approve
await approveAsync({ functionName: "approve", args: [vaultAddress, amount] });

// Then deposit
await depositAsync({ functionName: "deposit", args: [amount] });
```

### Custom Hook for Position
```typescript
export const useVaultPosition = (userAddress?: string) => {
  const { data: shares } = useScaffoldReadContract({...});
  const { data: totalAssets } = useScaffoldReadContract({...});
  const { data: totalSupply } = useScaffoldReadContract({...});

  const positionValue = useMemo(() => {
    return (shares * totalAssets) / totalSupply;
  }, [shares, totalAssets, totalSupply]);

  return { shares, positionValue };
};
```

---

## Success Criteria

✅ All components implement without TypeScript errors
✅ Scaffold-ETH hooks properly integrated
✅ Deposit/withdraw flows work end-to-end
✅ Health factor displays with correct colors
✅ Rebalancing can be triggered
✅ Mobile responsive (320px - 4K)
✅ WCAG AA accessibility compliant
✅ < 3 second page load time
✅ Zero console errors/warnings
✅ All tests passing

---

## Getting Started

### Before You Start
1. [ ] Review **VAULT_UI_PLANNING_SUMMARY.md** (5 min overview)
2. [ ] Read **VAULT_UI_ARCHITECTURE_PLAN.md** (30 min deep dive)
3. [ ] Bookmark **VAULT_UI_QUICK_REFERENCE.md** (for copy-paste)
4. [ ] Print **VAULT_UI_IMPLEMENTATION_CHECKLIST.md** (for tracking)
5. [ ] Reference **VAULT_UI_VISUAL_GUIDE.md** (for design decisions)

### Day 1: Foundation
- Create `/app/vault` directory structure
- Create `layout.tsx` and `page.tsx`
- Update Header.tsx with vault link
- Verify Scaffold-ETH setup

### Day 2-3: Components
- Implement 8 display components (using templates from QUICK_REFERENCE)
- Add loading skeletons
- Test each component in isolation

### Day 4-5: Forms
- Implement deposit form with approval flow
- Implement withdraw form with validation
- Test form submissions

### Day 6: Hooks
- Create useVaultPosition hook
- Create useVaultStats hook
- Create useHealthMetrics hook
- Test hook return values

### Day 7-8: Integration
- Wire components together
- Add error handling
- Add loading states
- Add notifications

### Day 9-11: Testing
- Unit tests for logic
- Integration tests for flows
- E2E tests for full journeys
- Edge case testing

### Day 12: Optimization
- Performance review
- Bundle size check
- Code optimization

### Day 13: Deployment
- Documentation
- Final testing
- Deployment

---

## Common Questions

### Q: Do I need to modify existing Scaffold-ETH files?
**A:** Only Header.tsx needs a small change (add vault menu link). Everything else is in new files.

### Q: What if the contract has different function names?
**A:** Update the function names in hooks and components. The structure remains the same.

### Q: Can I use different styling?
**A:** Yes! The architecture works with any styling. DaisyUI is just recommended.

### Q: How many developers do I need?
**A:** 1-2 developers for 11-14 days. Parallel work possible: one on components, one on hooks.

### Q: Do I need to write tests?
**A:** Testing phase is 2-3 days. Critical for production quality. Skip for MVP.

### Q: What about mobile optimization?
**A:** Already built-in with responsive DaisyUI classes. Mobile-first approach throughout.

---

## Resource Links

### Scaffold-ETH 2
- Docs: https://docs.scaffoldeth.io
- GitHub: https://github.com/scaffold-eth/scaffold-eth-2

### Technology
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Wagmi: https://wagmi.sh/react/hooks
- Viem: https://viem.sh
- DaisyUI: https://daisyui.com/components
- Tailwind: https://tailwindcss.com/docs

### Related
- ERC-20 Example: `/packages/nextjs/app/erc20/page.tsx` (in this repo)
- Header Component: `/packages/nextjs/components/Header.tsx` (in this repo)

---

## Support & Contact

For questions about this plan:

1. **Architecture questions** → VAULT_UI_ARCHITECTURE_PLAN.md
2. **Code examples** → VAULT_UI_QUICK_REFERENCE.md
3. **Task tracking** → VAULT_UI_IMPLEMENTATION_CHECKLIST.md
4. **Design questions** → VAULT_UI_VISUAL_GUIDE.md
5. **Overview/summary** → VAULT_UI_PLANNING_SUMMARY.md

---

## Final Notes

This is a **production-ready architecture plan** that:
- ✅ Leverages proven Scaffold-ETH 2 patterns
- ✅ Scales efficiently with performance optimizations
- ✅ Maintains clean separation of concerns
- ✅ Implements accessibility standards (WCAG AA)
- ✅ Provides complete user feedback and error handling
- ✅ Is fully responsive (mobile-first design)
- ✅ Includes comprehensive testing strategy
- ✅ Can be executed by 1-2 developers in 11-14 days

All the technical specifications, code templates, UI mockups, and task checklists needed for successful implementation are included in the accompanying documents.

---

## Version & Metadata

**Project:** HypurrFi Leverage Loop Vault Frontend
**Framework:** Scaffold-ETH 2 (Next.js App Router)
**Date Created:** November 15, 2025
**Total Documentation:** 5 comprehensive documents, 3,700+ lines, 120+ KB
**Status:** COMPLETE & READY FOR IMPLEMENTATION

---

**Next Step:** Read VAULT_UI_PLANNING_SUMMARY.md for a quick overview, then start with VAULT_UI_IMPLEMENTATION_CHECKLIST.md to begin development.

Good luck with your HypurrFi vault implementation! 🚀

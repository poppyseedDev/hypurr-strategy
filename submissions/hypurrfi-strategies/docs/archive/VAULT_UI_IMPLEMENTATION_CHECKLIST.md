# HypurrFi Vault Frontend - Implementation Checklist

## Pre-Implementation Setup

### Project Configuration
- [ ] Verify Scaffold-ETH 2 is properly set up
- [ ] Confirm Next.js App Router is configured
- [ ] Check that DaisyUI is installed in `tailwind.config.ts`
- [ ] Verify Wagmi and Viem are installed
- [ ] Confirm React Query (TanStack Query) is available

### Contract Preparation
- [ ] Obtain vault contract ABI
- [ ] Get deployed vault contract address
- [ ] Get underlying token address (if separate from vault)
- [ ] Document all contract function signatures
- [ ] Verify contract deployment matches network config
- [ ] Add contract to `deployedContracts.ts` (if using hardhat)

### Team Setup
- [ ] Set up git workflow and branch naming
- [ ] Define component naming conventions
- [ ] Agree on styling approach (Tailwind + DaisyUI)
- [ ] Set up linting rules (ESLint/Prettier)

---

## Phase 1: Foundation & Layout

### Directory Structure
- [ ] Create `/app/vault` directory
- [ ] Create `/app/vault/_components` directory
- [ ] Create `/app/vault/layout.tsx`
- [ ] Create `/app/vault/page.tsx`

### Page Layout
- [ ] Design and implement `vault/layout.tsx`
  - [ ] Add metadata/title
  - [ ] Set up page wrapper structure
  - [ ] Import global styles

- [ ] Create `vault/page.tsx`
  - [ ] Add "use client" directive
  - [ ] Set up main container
  - [ ] Import and arrange components
  - [ ] Add responsive grid layout

### Header Integration
- [ ] Update `/components/Header.tsx`
  - [ ] Import icon for vault (e.g., `BuildingLibraryIcon`)
  - [ ] Add vault link to `menuLinks` array
  - [ ] Test navigation to /vault page

### Basic Styling
- [ ] Create color scheme for vault theme
- [ ] Define spacing and gaps
- [ ] Set up responsive breakpoints (mobile, tablet, desktop)
- [ ] Test dark mode compatibility

---

## Phase 2: Components - Display

### VaultHeader Component
- [ ] Create `/app/vault/_components/VaultHeader.tsx`
- [ ] Display:
  - [ ] Vault name/title
  - [ ] Connected network display
  - [ ] Last update timestamp
  - [ ] Risk warning banner (if needed)
- [ ] Add styling with DaisyUI classes
- [ ] Handle loading states
- [ ] Add responsive design

### PositionCard Component
- [ ] Create `/app/vault/_components/PositionCard.tsx`
- [ ] Display user position data:
  - [ ] Share balance
  - [ ] Underlying asset value
  - [ ] Current leverage ratio
  - [ ] Health factor
  - [ ] PnL (if applicable)
- [ ] Show "Connect wallet" message if not connected
- [ ] Use `useVaultPosition()` custom hook
- [ ] Use `useHealthMetrics()` custom hook
- [ ] Add color-coded health status
- [ ] Implement health factor progress bar
- [ ] Add loading skeleton fallback

### VaultStats Component
- [ ] Create `/app/vault/_components/VaultStats.tsx`
- [ ] Display vault metrics:
  - [ ] Total Value Locked (TVL)
  - [ ] Current APY
  - [ ] Current Leverage Level
  - [ ] Vault Utilization Rate
  - [ ] Number of active positions
- [ ] Use grid layout for stats cards
- [ ] Use `useVaultStats()` custom hook
- [ ] Format large numbers with commas
- [ ] Show percentage values appropriately
- [ ] Add trend indicators (optional)

### HealthFactorIndicator Component
- [ ] Create `/app/vault/_components/HealthFactorIndicator.tsx`
- [ ] Display health factor:
  - [ ] Circular progress indicator
  - [ ] Numerical value
  - [ ] Risk level text (Safe/Moderate/Risky/Critical)
  - [ ] Color coding (green/yellow/orange/red)
- [ ] Show warning alert when HF < 1.2
- [ ] Add "Rebalance Now" button link when critical
- [ ] Implement radial progress CSS

### TransactionHistory Component
- [ ] Create `/app/vault/_components/TransactionHistory.tsx`
- [ ] Display recent transactions:
  - [ ] Transaction type (Deposit/Withdraw/Rebalance)
  - [ ] Amount
  - [ ] Timestamp
  - [ ] Status (Pending/Confirmed/Failed)
  - [ ] Block explorer link
- [ ] Use transaction event listeners (optional)
- [ ] Implement collapsible/expandable view
- [ ] Add filtering capabilities (optional)
- [ ] Show "No transactions" message if empty

### LoadingSkeletons Component
- [ ] Create `/app/vault/_components/LoadingSkeletons.tsx`
- [ ] Create skeleton for:
  - [ ] Position card
  - [ ] Stats cards
  - [ ] Forms
- [ ] Use DaisyUI skeleton patterns
- [ ] Match actual component heights/widths
- [ ] Implement smooth fade-in animation

---

## Phase 3: Components - Forms

### DepositForm Component
- [ ] Create `/app/vault/_components/DepositForm.tsx`
- [ ] Implement form elements:
  - [ ] Amount input field
  - [ ] "Max" button
  - [ ] Asset selector (if multi-asset)
  - [ ] Estimated shares output display
  - [ ] Gas estimate
  - [ ] Approval button (if needed)
  - [ ] Deposit button
- [ ] State management:
  - [ ] `depositAmount` state
  - [ ] `isApproving` state
  - [ ] `isApproved` state
  - [ ] `isLoading` state
- [ ] Contract interactions:
  - [ ] Check allowance with `useScaffoldReadContract`
  - [ ] Check balance
  - [ ] Call `approve()` via `useScaffoldWriteContract`
  - [ ] Call `deposit()` via `useScaffoldWriteContract`
- [ ] Input validation:
  - [ ] Check amount is positive
  - [ ] Check amount <= balance
  - [ ] Handle decimal precision
- [ ] User feedback:
  - [ ] Loading spinner during approval
  - [ ] Loading spinner during deposit
  - [ ] Success toast notification
  - [ ] Error handling with user messages
  - [ ] Clear form after successful deposit
- [ ] Responsive design:
  - [ ] Full width on mobile
  - [ ] Card layout on desktop

### WithdrawForm Component
- [ ] Create `/app/vault/_components/WithdrawForm.tsx`
- [ ] Implement form elements:
  - [ ] Radio buttons (Partial/Full)
  - [ ] Amount input (for partial)
  - [ ] Slider (optional, for partial)
  - [ ] Estimated assets output
  - [ ] Withdrawal fee display
  - [ ] Gas estimate
  - [ ] Confirmation dialog
  - [ ] Withdraw button
- [ ] State management:
  - [ ] `withdrawAmount` state
  - [ ] `withdrawType` state
  - [ ] `isLoading` state
- [ ] Contract interactions:
  - [ ] Check user shares balance
  - [ ] Call `convertToAssets()` for preview
  - [ ] Call `withdraw()` via `useScaffoldWriteContract`
- [ ] Input validation:
  - [ ] Check amount is positive
  - [ ] Check amount <= user shares
  - [ ] Prevent full withdrawal if in rebalance
- [ ] User feedback:
  - [ ] Show confirmation before withdrawal
  - [ ] Loading state during transaction
  - [ ] Success notification
  - [ ] Error handling
  - [ ] Clear form after withdrawal
- [ ] Edge cases:
  - [ ] Handle zero shares
  - [ ] Handle very small withdrawals
  - [ ] Show minimum withdrawal amount (if applicable)

### RebalanceButton Component
- [ ] Create `/app/vault/_components/RebalanceButton.tsx`
- [ ] Implement button logic:
  - [ ] Check if rebalance is needed
  - [ ] Show button when needed
  - [ ] Disable when not needed
  - [ ] Show tooltip explaining why disabled
- [ ] Contract interactions:
  - [ ] Call `isRebalanceNeeded()`
  - [ ] Call `rebalance()` when clicked
- [ ] State management:
  - [ ] `isRebalancing` state
  - [ ] `isNeeded` state
- [ ] User feedback:
  - [ ] Show "Rebalancing..." during transaction
  - [ ] Disable button while rebalancing
  - [ ] Show loading spinner
  - [ ] Success notification
  - [ ] Error message if fails
- [ ] Display information:
  - [ ] Current leverage ratio
  - [ ] Target leverage ratio
  - [ ] Deviation percentage
  - [ ] Estimated gas cost

---

## Phase 4: Custom Hooks

### useVaultPosition Hook
- [ ] Create `/hooks/useVaultPosition.ts`
- [ ] Implement data fetching:
  - [ ] `balanceOf()` - user shares
  - [ ] `totalAssets()` - TVL
  - [ ] `totalSupply()` - total shares
- [ ] Calculate derived values:
  - [ ] Position value = (shares * TVL) / totalShares
  - [ ] Underlying assets = position value
- [ ] Handle loading states
- [ ] Return useMemo-memoized values
- [ ] Enable/disable queries based on user address
- [ ] Test with sample data

### useVaultStats Hook
- [ ] Create `/hooks/useVaultStats.ts`
- [ ] Implement data fetching:
  - [ ] `totalAssets()` - TVL
  - [ ] `getCurrentAPY()` - APY
  - [ ] `getCurrentLeverageRatio()` - Leverage
  - [ ] `getTotalSupply()` - Total shares
  - [ ] Other stats as available
- [ ] Calculate utilization rate (if applicable)
- [ ] Handle loading states
- [ ] Return object with all stats
- [ ] Test with sample data

### useHealthMetrics Hook
- [ ] Create `/hooks/useHealthMetrics.ts`
- [ ] Implement data fetching:
  - [ ] `getHealthFactor(address)` - HF
  - [ ] Optional: liquidation price
  - [ ] Optional: time to liquidation
- [ ] Implement risk level mapping:
  - [ ] HF >= 2.0 → "Safe"
  - [ ] 1.5 <= HF < 2.0 → "Moderate"
  - [ ] 1.0 <= HF < 1.5 → "Risky"
  - [ ] HF < 1.0 → "Critical"
- [ ] Calculate color mapping
- [ ] Return both HF and risk level
- [ ] Test with various HF values

### Additional Hooks (Optional)
- [ ] Create `/hooks/useVaultEvents.ts`
  - [ ] Listen for Deposit events
  - [ ] Listen for Withdraw events
  - [ ] Listen for Rebalance events
- [ ] Create `/hooks/useAllowance.ts`
  - [ ] Check ERC20 allowance
  - [ ] Return approval needed boolean
- [ ] Create `/hooks/useTxStatus.ts`
  - [ ] Track transaction states
  - [ ] Map states to UI messages

---

## Phase 5: Integration & Polish

### Page Integration
- [ ] Import all components in `vault/page.tsx`
- [ ] Arrange components in proper layout
- [ ] Add proper spacing and gaps
- [ ] Implement responsive grid for desktop
- [ ] Stack components for mobile
- [ ] Test component interoperability

### Error Handling
- [ ] Add try-catch blocks in all hooks
- [ ] Implement user-friendly error messages
- [ ] Add error boundaries (optional)
- [ ] Test with invalid inputs
- [ ] Test with network errors
- [ ] Test with contract errors

### Loading States
- [ ] Add loading states to all data fetches
- [ ] Show skeletons while loading
- [ ] Animate state transitions
- [ ] Prevent interactions during loading
- [ ] Clear old data on refetch

### Notifications
- [ ] Set up toast notifications
- [ ] Show success messages on transactions
- [ ] Show error messages on failures
- [ ] Show info messages for warnings
- [ ] Add transaction hash links
- [ ] Auto-dismiss notifications after 5s

### Validation
- [ ] Validate all numeric inputs
- [ ] Check for overflow/underflow
- [ ] Validate address inputs (if needed)
- [ ] Show validation error messages
- [ ] Disable buttons when invalid
- [ ] Provide helpful error guidance

### Mobile Responsiveness
- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Test on large desktop screens
- [ ] Adjust component heights for mobile
- [ ] Make buttons touch-friendly (min 44px)
- [ ] Hide/show elements appropriately
- [ ] Test in landscape orientation
- [ ] Verify form inputs are accessible

---

## Phase 6: Testing

### Component Testing
- [ ] Test DepositForm submission
- [ ] Test WithdrawForm submission
- [ ] Test RebalanceButton functionality
- [ ] Test PositionCard data display
- [ ] Test VaultStats calculations
- [ ] Test HealthFactorIndicator colors
- [ ] Test form validation
- [ ] Test error states

### Hook Testing
- [ ] Test useVaultPosition calculations
- [ ] Test useVaultStats data fetching
- [ ] Test useHealthMetrics risk mapping
- [ ] Test with various contract states
- [ ] Test with null/undefined values
- [ ] Test with zero values
- [ ] Test with very large numbers

### Integration Testing
- [ ] Test full deposit flow
- [ ] Test full withdrawal flow
- [ ] Test rebalancing flow
- [ ] Test with insufficient balance
- [ ] Test with network switch
- [ ] Test with wallet disconnect
- [ ] Test with contract errors

### User Experience Testing
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test with different wallets (MetaMask, WalletConnect, etc.)
- [ ] Test network switching
- [ ] Test wallet connection/disconnection
- [ ] Test with slow network
- [ ] Test with transaction failures
- [ ] Verify all text is readable
- [ ] Check color contrast for accessibility

### Edge Cases
- [ ] Test with zero balance
- [ ] Test with zero shares
- [ ] Test with max value inputs
- [ ] Test with minimum inputs
- [ ] Test with invalid amounts
- [ ] Test rapid successive transactions
- [ ] Test page refresh during transaction
- [ ] Test browser back/forward during transactions

---

## Phase 7: Optimization

### Performance
- [ ] Implement React.memo for expensive components
- [ ] Use useCallback for event handlers
- [ ] Use useMemo for calculations
- [ ] Lazy load non-critical components
- [ ] Optimize images (if any)
- [ ] Check bundle size
- [ ] Implement code splitting

### Data Fetching
- [ ] Optimize query frequencies
- [ ] Implement query deduplication
- [ ] Cache appropriate data
- [ ] Implement pagination for history (if needed)
- [ ] Cancel queries on component unmount
- [ ] Avoid refetching on every render

### Watch Options
- [ ] Set appropriate watch intervals
- [ ] Disable watch when not needed
- [ ] Only watch necessary data
- [ ] Batch related watches together
- [ ] Test network load with monitoring

---

## Phase 8: Deployment Preparation

### Documentation
- [ ] Document component APIs
- [ ] Document custom hooks
- [ ] Add JSDoc comments
- [ ] Create usage examples
- [ ] Document error handling
- [ ] Document state management

### Configuration
- [ ] Verify contract addresses in config
- [ ] Check network configuration
- [ ] Verify environment variables
- [ ] Test with different networks
- [ ] Prepare production addresses

### Security
- [ ] Review code for vulnerabilities
- [ ] Check for XSS issues
- [ ] Verify input sanitization
- [ ] Check for unsafe operations
- [ ] Review contract calls
- [ ] Test with malicious inputs

### Build & Deployment
- [ ] Run production build
- [ ] Test production build locally
- [ ] Check for console warnings
- [ ] Verify no broken links
- [ ] Test all functionality in production build
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Quality Assurance Checklist

### Code Quality
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] All variables used
- [ ] No dead code
- [ ] Consistent formatting
- [ ] ESLint passes
- [ ] TypeScript strict mode passes
- [ ] No any types (unless necessary)

### Accessibility
- [ ] All inputs have labels
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Focus states visible
- [ ] Error messages associated with inputs
- [ ] Loading states announced

### Performance
- [ ] Page load time < 3s
- [ ] Smooth animations at 60fps
- [ ] No layout shifts during loading
- [ ] Minimal re-renders
- [ ] Efficient query usage
- [ ] Mobile performance acceptable

### Browser Compatibility
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Functionality
- [ ] All buttons work
- [ ] All forms work
- [ ] All calculations correct
- [ ] Error handling works
- [ ] Success notifications work
- [ ] Links work correctly
- [ ] Responsive design works

---

## Deployment Checklist

### Before Going Live
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit done
- [ ] Performance benchmarks met
- [ ] Staging environment tested
- [ ] Backup plan documented
- [ ] Rollback procedure ready
- [ ] Monitoring set up

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check transaction success rates
- [ ] Monitor network performance
- [ ] Collect user feedback
- [ ] Be ready to hotfix issues
- [ ] Document any issues found
- [ ] Plan improvements for next release

---

## Common Issues & Solutions

### Issue: Data not updating
**Solution:**
- Check watch: true in useScaffoldReadContract
- Verify query is enabled
- Check contract is returning correct value
- Monitor network tab for failed requests

### Issue: Form submission fails silently
**Solution:**
- Add try-catch blocks
- Log errors to console
- Show error toast to user
- Check contract balance/allowance

### Issue: Slow load times
**Solution:**
- Reduce number of contracts calls
- Implement pagination
- Cache data where appropriate
- Lazy load components
- Check bundle size

### Issue: Mobile layout broken
**Solution:**
- Test on actual device
- Use Chrome DevTools device emulation
- Check responsive breakpoints
- Adjust card widths
- Test with different font sizes

---

## Timeline Estimate

- Phase 1 (Foundation): 1 day
- Phase 2 (Display Components): 2 days
- Phase 3 (Form Components): 2-3 days
- Phase 4 (Custom Hooks): 1 day
- Phase 5 (Integration): 1-2 days
- Phase 6 (Testing): 2-3 days
- Phase 7 (Optimization): 1 day
- Phase 8 (Deployment): 1 day

**Total Estimated Time: 11-14 days for full implementation and testing**

---

## Sign-Off

- [ ] Project Manager approves plan
- [ ] Lead Developer reviews architecture
- [ ] QA reviews test cases
- [ ] Security team reviews for vulnerabilities
- [ ] Stakeholders approve timeline

**Approval Date:** ___________
**Lead Developer:** ___________
**Project Manager:** ___________

import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * Custom hook to fetch and calculate user's vault position
 * @param userAddress - The address of the user
 * @returns User's position data including shares, value, and underlying assets
 */
export const useVaultPosition = (userAddress?: string) => {
  // Fetch user's share balance
  const { data: shares, isLoading: sharesLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "balanceOf",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });

  // Fetch total vault assets (TVL)
  const { data: totalAssets, isLoading: totalAssetsLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalAssets",
    watch: true,
  });

  // Fetch total shares supply
  const { data: totalSupply, isLoading: totalSupplyLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalSupply",
    watch: true,
  });

  // Fetch vault position details (includes health factor)
  const { data: positionDetails, isLoading: positionDetailsLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "getPositionDetails",
    watch: true,
  });

  // Calculate position value based on shares and total assets
  const positionValue = useMemo(() => {
    if (!shares || !totalAssets || !totalSupply || totalSupply === 0n) return 0n;
    return (shares * totalAssets) / totalSupply;
  }, [shares, totalAssets, totalSupply]);

  // Calculate underlying assets (same as position value for standard vaults)
  const underlyingAssets = useMemo(() => {
    return positionValue;
  }, [positionValue]);

  // Extract health factor from position details
  const healthFactor = useMemo(() => {
    if (!positionDetails) return 0n;
    return positionDetails[2]; // healthFactor is the 3rd element in the tuple
  }, [positionDetails]);

  // Calculate leverage ratio from position details
  const leverageRatio = useMemo(() => {
    if (!positionDetails) return 0n;
    const totalCollateral = positionDetails[0];
    const totalDebt = positionDetails[1];
    if (totalCollateral === 0n) return 0n;
    // Leverage = (Collateral + Debt) / Collateral
    return ((totalCollateral + totalDebt) * BigInt(1e18)) / totalCollateral;
  }, [positionDetails]);

  const isLoading = sharesLoading || totalAssetsLoading || totalSupplyLoading || positionDetailsLoading;

  return {
    shares: shares || 0n,
    positionValue,
    underlyingAssets,
    healthFactor,
    leverageRatio,
    totalAssets: totalAssets || 0n,
    totalSupply: totalSupply || 0n,
    isLoading,
    hasPosition: shares ? shares > 0n : false,
  };
};

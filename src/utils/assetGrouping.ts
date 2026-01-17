// Utility functions for grouping computer peripheral assets into Desktop Sets

export interface PeripheralInfo {
  type: 'Mo' | 'Ko' | 'Ro' | 'Co' | null; // Monitor, Keyboard, Mouse, CPU
  financialYear: string | null; // e.g., "2025-26"
  setId: string | null; // e.g., "T01"
  isPeripheral: boolean;
}

export interface Asset {
  assetTagging: string;
  assetClass?: string;
  assetSubClass?: string;
  description?: string;
  srNo?: string;
  serialNumber?: string;
  location?: string;
  dateOfPurchase?: string;
  taxInvoiceNo?: string;
  vendorSupplierNameAddress?: string;
  originalCost?: string;
  depreciationRate?: string;
  wdvAsMarch31?: string;
  transferredDisposalDetails?: string;
  valuationAtTransferDisposal?: string;
  scrapValueRealised?: string;
  remarksAuthorisedSignatory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesktopSet {
  setId: string; // e.g., "T01"
  financialYear: string; // e.g., "2025-26"
  displayName: string; // e.g., "Desktop Set 1 (2025-26)"
  components: {
    monitor?: Asset;
    keyboard?: Asset;
    mouse?: Asset;
    cpu?: Asset;
  };
  allAssets: Asset[]; // All component assets
  completeness: number; // Percentage of components present (0-100)
  location?: string; // Common location if all match
  totalCost: number; // Sum of all component costs
  isGrouped: true; // Flag to identify grouped items
}

/**
 * Parse an asset tag to extract peripheral information
 * Format: SSBAS/{Type}/YYYY-YY/TXX
 * Example: SSBAS/Mo/2025-26/T01
 */
export function parseAssetTag(assetTagging: string): PeripheralInfo {
  const normalizedTag = assetTagging.trim();
  
  // Regex pattern for SSBAS/{Type}/YYYY-YY/TXX
  const pattern = /^SSBAS\/(Mo|Ko|Ro|Co)\/(\d{4}-\d{2})\/(T\d+)$/i;
  const match = normalizedTag.match(pattern);
  
  if (!match) {
    return {
      type: null,
      financialYear: null,
      setId: null,
      isPeripheral: false,
    };
  }
  
  return {
    type: match[1] as 'Mo' | 'Ko' | 'Ro' | 'Co',
    financialYear: match[2],
    setId: match[3],
    isPeripheral: true,
  };
}

/**
 * Group assets into desktop sets based on their peripheral info
 */
export function groupAssetsIntoDesktopSets(assets: Asset[]): {
  desktopSets: DesktopSet[];
  ungroupedAssets: Asset[];
} {
  const peripheralAssets: Asset[] = [];
  const ungroupedAssets: Asset[] = [];
  
  // Separate peripheral assets from others
  assets.forEach((asset) => {
    const info = parseAssetTag(asset.assetTagging);
    if (info.isPeripheral) {
      peripheralAssets.push(asset);
    } else {
      ungroupedAssets.push(asset);
    }
  });
  
  // Group peripherals by setId and financialYear
  const setsMap = new Map<string, Asset[]>();
  
  peripheralAssets.forEach((asset) => {
    const info = parseAssetTag(asset.assetTagging);
    if (info.isPeripheral && info.setId && info.financialYear) {
      const key = `${info.financialYear}-${info.setId}`;
      if (!setsMap.has(key)) {
        setsMap.set(key, []);
      }
      setsMap.get(key)!.push(asset);
    }
  });
  
  // Convert grouped peripherals into DesktopSet objects
  const desktopSets: DesktopSet[] = [];
  
  setsMap.forEach((components, key) => {
    // The key format is "YYYY-YY-TXX" (e.g., "2025-26-T01")
    // We need to properly extract financialYear and setId
    const lastDashIndex = key.lastIndexOf('-');
    const financialYear = key.substring(0, lastDashIndex); // e.g., "2025-26"
    const setId = key.substring(lastDashIndex + 1); // e.g., "T01"
    const setNumber = setId.replace('T', '');
    
    const set: DesktopSet = {
      setId,
      financialYear,
      displayName: `Desktop Set ${setNumber} (${financialYear})`,
      components: {},
      allAssets: components,
      completeness: 0,
      isGrouped: true,
      totalCost: 0,
    };
    
    // Organize components by type
    components.forEach((asset) => {
      const info = parseAssetTag(asset.assetTagging);
      if (info.type) {
        const typeKey = getComponentKey(info.type);
        set.components[typeKey] = asset;
      }
    });
    
    // Calculate total cost - use the cost from any one component since they all share the same total set cost
    // (The original cost is for the entire desktop set, not individual components)
    if (components.length > 0 && components[0].originalCost) {
      set.totalCost = parseFloat(components[0].originalCost) || 0;
    }
    
    // Calculate completeness (how many of 4 components are present)
    const componentCount = Object.keys(set.components).length;
    set.completeness = (componentCount / 4) * 100;
    
    // Determine common location
    const locations = components
      .map((a) => a.location)
      .filter((loc): loc is string => !!loc);
    if (locations.length > 0) {
      const uniqueLocations = [...new Set(locations)];
      if (uniqueLocations.length === 1) {
        set.location = uniqueLocations[0];
      } else {
        set.location = 'Mixed Locations';
      }
    }
    
    desktopSets.push(set);
  });
  
  // Sort desktop sets by financial year and set ID
  desktopSets.sort((a, b) => {
    const yearCompare = b.financialYear.localeCompare(a.financialYear);
    if (yearCompare !== 0) return yearCompare;
    return a.setId.localeCompare(b.setId);
  });
  
  return {
    desktopSets,
    ungroupedAssets,
  };
}

/**
 * Get the component key for a peripheral type
 */
function getComponentKey(type: 'Mo' | 'Ko' | 'Ro' | 'Co'): keyof DesktopSet['components'] {
  const mapping: Record<string, keyof DesktopSet['components']> = {
    Mo: 'monitor',
    Ko: 'keyboard',
    Ro: 'mouse',
    Co: 'cpu',
  };
  return mapping[type];
}

/**
 * Get a display name for a peripheral type
 */
export function getPeripheralTypeName(type: 'Mo' | 'Ko' | 'Ro' | 'Co' | null): string {
  const mapping: Record<string, string> = {
    Mo: 'Monitor',
    Ko: 'Keyboard',
    Ro: 'Mouse',
    Co: 'CPU',
  };
  return type ? mapping[type] : 'Unknown';
}

/**
 * Check if an asset is part of a desktop set
 */
export function isDesktopPeripheral(assetTagging: string): boolean {
  return parseAssetTag(assetTagging).isPeripheral;
}

/**
 * Get the set identifier for a peripheral asset
 */
export function getSetIdentifier(assetTagging: string): string | null {
  const info = parseAssetTag(assetTagging);
  if (!info.isPeripheral || !info.setId || !info.financialYear) {
    return null;
  }
  return `${info.financialYear}-${info.setId}`;
}
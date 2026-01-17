import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

interface AssetData {
  srNo?: string;
  assetClass?: string;
  assetSubClass?: string;
  description?: string;
  assetTagging: string;
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

function validateAsset(data: any): { valid: boolean; errors: string[]; asset?: AssetData } {
  const errors: string[] = [];
  
  if (!data.assetTagging || String(data.assetTagging).trim() === "") {
    errors.push("Asset Tagging is required");
  }
  
  const numericFields = [
    "originalCost",
    "depreciationRate",
    "wdvAsMarch31",
    "valuationAtTransferDisposal",
    "scrapValueRealised"
  ];
  
  numericFields.forEach(field => {
    if (data[field] && data[field] !== "") {
      const value = String(data[field]).replace(/,/g, "");
      if (isNaN(parseFloat(value))) {
        errors.push(`${field} must be a valid number`);
      }
    }
  });
  
  if (data.dateOfPurchase && data.dateOfPurchase !== "") {
    const dateStr = String(data.dateOfPurchase);
    if (!isValidDate(dateStr)) {
      errors.push("Date of Purchase must be a valid date");
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  const asset: AssetData = {
    srNo: data.srNo ? String(data.srNo).trim() : "",
    assetClass: data.assetClass ? String(data.assetClass).trim() : "",
    assetSubClass: data.assetSubClass ? String(data.assetSubClass).trim() : "",
    description: data.description ? String(data.description).trim() : "",
    assetTagging: String(data.assetTagging).trim(),
    serialNumber: data.serialNumber ? String(data.serialNumber).trim() : "",
    location: data.location ? String(data.location).trim() : "",
    dateOfPurchase: data.dateOfPurchase ? String(data.dateOfPurchase).trim() : "",
    taxInvoiceNo: data.taxInvoiceNo ? String(data.taxInvoiceNo).trim() : "",
    vendorSupplierNameAddress: data.vendorSupplierNameAddress ? String(data.vendorSupplierNameAddress).trim() : "",
    originalCost: data.originalCost ? String(data.originalCost).replace(/,/g, "").trim() : "",
    depreciationRate: data.depreciationRate ? String(data.depreciationRate).replace(/,/g, "").trim() : "",
    wdvAsMarch31: data.wdvAsMarch31 ? String(data.wdvAsMarch31).replace(/,/g, "").trim() : "",
    transferredDisposalDetails: data.transferredDisposalDetails ? String(data.transferredDisposalDetails).trim() : "",
    valuationAtTransferDisposal: data.valuationAtTransferDisposal ? String(data.valuationAtTransferDisposal).replace(/,/g, "").trim() : "",
    scrapValueRealised: data.scrapValueRealised ? String(data.scrapValueRealised).replace(/,/g, "").trim() : "",
    remarksAuthorisedSignatory: data.remarksAuthorisedSignatory ? String(data.remarksAuthorisedSignatory).trim() : "",
  };
  
  return { valid: true, errors: [], asset };
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return true;
  }
  
  const patterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{4}-\d{1,2}-\d{1,2}$/,
  ];
  
  return patterns.some(pattern => pattern.test(dateStr));
}

app.get("/make-server-8862d32b/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/make-server-8862d32b/assets", async (c) => {
  try {
    const assets = await kv.getByPrefix("asset:");
    
    const assetClass = c.req.query("assetClass");
    const location = c.req.query("location");
    const search = c.req.query("search")?.toLowerCase();
    
    let filtered = assets;
    
    if (assetClass) {
      filtered = filtered.filter((a) => a.assetClass === assetClass);
    }
    
    if (location) {
      filtered = filtered.filter((a) => a.location === location);
    }
    
    if (search) {
      filtered = filtered.filter((a) => 
        (a.assetTagging && a.assetTagging.toLowerCase().includes(search)) ||
        (a.description && a.description.toLowerCase().includes(search)) ||
        (a.assetClass && a.assetClass.toLowerCase().includes(search)) ||
        (a.assetSubClass && a.assetSubClass.toLowerCase().includes(search)) ||
        (a.location && a.location.toLowerCase().includes(search)) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(search)) ||
        (a.vendorSupplierNameAddress && a.vendorSupplierNameAddress.toLowerCase().includes(search))
      );
    }
    
    return c.json({ assets: filtered });
  } catch (error) {
    console.log("Error fetching assets:", error);
    return c.json({ error: `Error fetching assets: ${error.message}` }, 500);
  }
});

app.get("/make-server-8862d32b/assets/:code{.+}", async (c) => {
  try {
    const code = decodeURIComponent(c.req.param("code"));
    const asset = await kv.get(`asset:${code}`);
    
    if (!asset) {
      return c.json({ error: "Asset not found" }, 404);
    }
    
    return c.json({ asset });
  } catch (error) {
    console.log("Error fetching asset:", error);
    return c.json({ error: `Error fetching asset: ${error.message}` }, 500);
  }
});

app.post("/make-server-8862d32b/assets", async (c) => {
  try {
    const body = await c.req.json();
    const validation = validateAsset(body);
    
    if (!validation.valid) {
      return c.json({ error: validation.errors.join(", ") }, 400);
    }
    
    const existing = await kv.get(`asset:${validation.asset.assetTagging}`);
    if (existing) {
      return c.json({ error: "Asset tagging already exists" }, 400);
    }
    
    const asset = {
      ...validation.asset,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`asset:${asset.assetTagging}`, asset);
    
    return c.json({ asset, message: "Asset created successfully" });
  } catch (error) {
    console.log("Error creating asset:", error);
    return c.json({ error: `Error creating asset: ${error.message}` }, 500);
  }
});

app.put("/make-server-8862d32b/assets/:code{.+}", async (c) => {
  try {
    const code = decodeURIComponent(c.req.param("code"));
    const body = await c.req.json();
    
    const existing = await kv.get(`asset:${code}`);
    if (!existing) {
      return c.json({ error: "Asset not found" }, 404);
    }
    
    const validation = validateAsset({ ...body, assetTagging: code });
    
    if (!validation.valid) {
      return c.json({ error: validation.errors.join(", ") }, 400);
    }
    
    const asset = {
      ...validation.asset,
      assetTagging: code,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`asset:${code}`, asset);
    
    return c.json({ asset, message: "Asset updated successfully" });
  } catch (error) {
    console.log("Error updating asset:", error);
    return c.json({ error: `Error updating asset: ${error.message}` }, 500);
  }
});

app.delete("/make-server-8862d32b/assets/:code{.+}", async (c) => {
  try {
    const code = decodeURIComponent(c.req.param("code"));
    console.log("Deleting asset with code:", code);
    
    const existing = await kv.get(`asset:${code}`);
    if (!existing) {
      console.log("Asset not found:", code);
      return c.json({ error: "Asset not found" }, 404);
    }
    
    await kv.del(`asset:${code}`);
    console.log("Asset deleted successfully:", code);
    
    return c.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.log("Error deleting asset:", error);
    return c.json({ error: `Error deleting asset: ${error.message}` }, 500);
  }
});

app.post("/make-server-8862d32b/assets/bulk-import", async (c) => {
  try {
    const body = await c.req.json();
    const { assets } = body;
    
    if (!Array.isArray(assets) || assets.length === 0) {
      return c.json({ error: "Invalid assets array" }, 400);
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };
    
    for (const asset of assets) {
      try {
        const validation = validateAsset(asset);
        
        if (!validation.valid) {
          results.failed++;
          results.errors.push({ asset, error: validation.errors.join(", ") });
          continue;
        }
        
        const assetData = {
          ...validation.asset,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await kv.set(`asset:${assetData.assetTagging}`, assetData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ asset, error: error.message });
      }
    }
    
    return c.json({ 
      message: `Imported ${results.success} assets successfully, ${results.failed} failed`,
      results 
    });
  } catch (error) {
    console.log("Error bulk importing assets:", error);
    return c.json({ error: `Error bulk importing assets: ${error.message}` }, 500);
  }
});

app.get("/make-server-8862d32b/dashboard/stats", async (c) => {
  try {
    const assets = await kv.getByPrefix("asset:");
    
    const stats = {
      totalAssets: assets.length,
      byAssetClass: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      totalOriginalCost: 0,
      totalWDV: 0,
      recentUpdates: [] as any[],
    };
    
    assets.forEach((asset) => {
      if (asset.assetClass) {
        stats.byAssetClass[asset.assetClass] = (stats.byAssetClass[asset.assetClass] || 0) + 1;
      }
      
      if (asset.location) {
        stats.byLocation[asset.location] = (stats.byLocation[asset.location] || 0) + 1;
      }
      
      if (asset.originalCost) {
        stats.totalOriginalCost += parseFloat(asset.originalCost) || 0;
      }
      
      if (asset.wdvAsMarch31) {
        stats.totalWDV += parseFloat(asset.wdvAsMarch31) || 0;
      }
    });
    
    stats.recentUpdates = assets
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
    
    return c.json({ stats });
  } catch (error) {
    console.log("Error fetching dashboard stats:", error);
    return c.json({ error: `Error fetching dashboard stats: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);

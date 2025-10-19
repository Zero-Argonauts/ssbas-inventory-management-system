import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Health check endpoint
app.get("/make-server-8862d32b/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all assets with optional filters
app.get("/make-server-8862d32b/assets", async (c) => {
  try {
    const assets = await kv.getByPrefix("asset:");
    
    // Get query parameters for filtering
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
        (a.location && a.location.toLowerCase().includes(search)) ||
        (a.vendorsSuppliers && a.vendorsSuppliers.toLowerCase().includes(search))
      );
    }
    
    return c.json({ assets: filtered });
  } catch (error) {
    console.log("Error fetching assets:", error);
    return c.json({ error: `Error fetching assets: ${error.message}` }, 500);
  }
});

// Get single asset by code (using wildcard to handle slashes in asset tagging)
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

// Create new asset
app.post("/make-server-8862d32b/assets", async (c) => {
  try {
    const body = await c.req.json();
    const { assetTagging } = body;
    
    if (!assetTagging) {
      return c.json({ error: "Asset tagging is required" }, 400);
    }
    
    // Check if asset already exists
    const existing = await kv.get(`asset:${assetTagging}`);
    if (existing) {
      return c.json({ error: "Asset tagging already exists" }, 400);
    }
    
    const asset = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`asset:${assetTagging}`, asset);
    
    return c.json({ asset, message: "Asset created successfully" });
  } catch (error) {
    console.log("Error creating asset:", error);
    return c.json({ error: `Error creating asset: ${error.message}` }, 500);
  }
});

// Update existing asset (using wildcard to handle slashes in asset tagging)
app.put("/make-server-8862d32b/assets/:code{.+}", async (c) => {
  try {
    const code = decodeURIComponent(c.req.param("code"));
    const body = await c.req.json();
    
    const existing = await kv.get(`asset:${code}`);
    if (!existing) {
      return c.json({ error: "Asset not found" }, 404);
    }
    
    const asset = {
      ...existing,
      ...body,
      assetTagging: code, // Ensure asset tagging doesn't change
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

// Delete asset (using wildcard to handle slashes in asset tagging)
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

// Bulk import assets
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
        if (!asset.assetTagging) {
          results.failed++;
          results.errors.push({ asset, error: "Missing asset tagging" });
          continue;
        }
        
        const assetData = {
          ...asset,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await kv.set(`asset:${asset.assetTagging}`, assetData);
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

// Get dashboard statistics
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
    
    // Calculate statistics
    assets.forEach((asset) => {
      // Asset class counts
      if (asset.assetClass) {
        stats.byAssetClass[asset.assetClass] = (stats.byAssetClass[asset.assetClass] || 0) + 1;
      }
      
      // Location counts
      if (asset.location) {
        stats.byLocation[asset.location] = (stats.byLocation[asset.location] || 0) + 1;
      }
      
      // Total original cost
      if (asset.originalCost) {
        stats.totalOriginalCost += parseFloat(asset.originalCost) || 0;
      }
      
      // Total WDV
      if (asset.wdvMarch2022) {
        stats.totalWDV += parseFloat(asset.wdvMarch2022) || 0;
      }
    });
    
    // Get recent updates (last 5)
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

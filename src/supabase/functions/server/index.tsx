import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();
// Enable logger
app.use('*', logger(console.log));
// Enable CORS for all routes and methods
app.use("/*", cors({
  origin: "*",
  allowHeaders: [
    "Content-Type",
    "Authorization"
  ],
  allowMethods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],
  exposeHeaders: [
    "Content-Length"
  ],
  maxAge: 600
}));
// Health check endpoint
app.get("/make-server-8862d32b/health", (c)=>{
  return c.json({
    status: "ok"
  });
});
// Get all assets with optional filters
app.get("/make-server-8862d32b/assets", async (c)=>{
  try {
    const assets = await kv.getByPrefix("asset:");
    // Get query parameters for filtering
    const department = c.req.query("department");
    const condition = c.req.query("condition");
    const status = c.req.query("status");
    const search = c.req.query("search")?.toLowerCase();
    let filtered = assets;
    if (department) {
      filtered = filtered.filter((a)=>a.department === department);
    }
    if (condition) {
      filtered = filtered.filter((a)=>a.condition === condition);
    }
    if (status) {
      filtered = filtered.filter((a)=>a.status === status);
    }
    if (search) {
      filtered = filtered.filter((a)=>a.assetCode.toLowerCase().includes(search) || a.assetName.toLowerCase().includes(search) || a.department.toLowerCase().includes(search) || a.supplier.toLowerCase().includes(search));
    }
    return c.json({
      assets: filtered
    });
  } catch (error) {
    console.log("Error fetching assets:", error);
    return c.json({
      error: `Error fetching assets: ${error.message}`
    }, 500);
  }
});
// Get single asset by code
app.get("/make-server-8862d32b/assets/:code", async (c)=>{
  try {
    const code = c.req.param("code");
    const asset = await kv.get(`asset:${code}`);
    if (!asset) {
      return c.json({
        error: "Asset not found"
      }, 404);
    }
    return c.json({
      asset
    });
  } catch (error) {
    console.log("Error fetching asset:", error);
    return c.json({
      error: `Error fetching asset: ${error.message}`
    }, 500);
  }
});
// Create new asset
app.post("/make-server-8862d32b/assets", async (c)=>{
  try {
    const body = await c.req.json();
    const { assetCode } = body;
    if (!assetCode) {
      return c.json({
        error: "Asset code is required"
      }, 400);
    }
    // Check if asset already exists
    const existing = await kv.get(`asset:${assetCode}`);
    if (existing) {
      return c.json({
        error: "Asset code already exists"
      }, 400);
    }
    const asset = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await kv.set(`asset:${assetCode}`, asset);
    return c.json({
      asset,
      message: "Asset created successfully"
    });
  } catch (error) {
    console.log("Error creating asset:", error);
    return c.json({
      error: `Error creating asset: ${error.message}`
    }, 500);
  }
});
// Update existing asset
app.put("/make-server-8862d32b/assets/:code", async (c)=>{
  try {
    const code = c.req.param("code");
    const body = await c.req.json();
    const existing = await kv.get(`asset:${code}`);
    if (!existing) {
      return c.json({
        error: "Asset not found"
      }, 404);
    }
    const asset = {
      ...existing,
      ...body,
      assetCode: code,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };
    await kv.set(`asset:${code}`, asset);
    return c.json({
      asset,
      message: "Asset updated successfully"
    });
  } catch (error) {
    console.log("Error updating asset:", error);
    return c.json({
      error: `Error updating asset: ${error.message}`
    }, 500);
  }
});
// Delete asset
app.delete("/make-server-8862d32b/assets/:code", async (c)=>{
  try {
    const code = c.req.param("code");
    const existing = await kv.get(`asset:${code}`);
    if (!existing) {
      return c.json({
        error: "Asset not found"
      }, 404);
    }
    await kv.del(`asset:${code}`);
    return c.json({
      message: "Asset deleted successfully"
    });
  } catch (error) {
    console.log("Error deleting asset:", error);
    return c.json({
      error: `Error deleting asset: ${error.message}`
    }, 500);
  }
});
// Bulk import assets
app.post("/make-server-8862d32b/assets/bulk-import", async (c)=>{
  try {
    const body = await c.req.json();
    const { assets } = body;
    if (!Array.isArray(assets) || assets.length === 0) {
      return c.json({
        error: "Invalid assets array"
      }, 400);
    }
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    for (const asset of assets){
      try {
        if (!asset.assetCode) {
          results.failed++;
          results.errors.push({
            asset,
            error: "Missing asset code"
          });
          continue;
        }
        const assetData = {
          ...asset,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await kv.set(`asset:${asset.assetCode}`, assetData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          asset,
          error: error.message
        });
      }
    }
    return c.json({
      message: `Imported ${results.success} assets successfully, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.log("Error bulk importing assets:", error);
    return c.json({
      error: `Error bulk importing assets: ${error.message}`
    }, 500);
  }
});
// Get dashboard statistics
app.get("/make-server-8862d32b/dashboard/stats", async (c)=>{
  try {
    const assets = await kv.getByPrefix("asset:");
    const stats = {
      totalAssets: assets.length,
      byDepartment: {},
      byCondition: {},
      byStatus: {},
      totalValue: 0,
      recentUpdates: []
    };
    // Calculate statistics
    assets.forEach((asset)=>{
      // Department counts
      stats.byDepartment[asset.department] = (stats.byDepartment[asset.department] || 0) + 1;
      // Condition counts
      stats.byCondition[asset.condition] = (stats.byCondition[asset.condition] || 0) + 1;
      // Status counts
      stats.byStatus[asset.status] = (stats.byStatus[asset.status] || 0) + 1;
      // Total value
      if (asset.cost) {
        stats.totalValue += parseFloat(asset.cost) || 0;
      }
    });
    // Get recent updates (last 5)
    stats.recentUpdates = assets.sort((a, b)=>new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    return c.json({
      stats
    });
  } catch (error) {
    console.log("Error fetching dashboard stats:", error);
    return c.json({
      error: `Error fetching dashboard stats: ${error.message}`
    }, 500);
  }
});
Deno.serve(app.fetch);

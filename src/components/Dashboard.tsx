import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Package, TrendingUp, DollarSign, TrendingDown } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DashboardStats {
  totalAssets: number;
  byAssetClass: Record<string, number>;
  byLocation: Record<string, number>;
  totalOriginalCost: number;
  totalWDV: number;
  recentUpdates: any[];
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Failed to load dashboard statistics
        </div>
      </div>
    );
  }

  const totalDepreciation = stats.totalOriginalCost - stats.totalWDV;
  const depreciationPercentage = stats.totalOriginalCost > 0 
    ? ((totalDepreciation / stats.totalOriginalCost) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracked across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Original Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalOriginalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total purchase value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Current WDV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalWDV.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Written down value (31st March 2022)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Depreciation</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {depreciationPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{totalDepreciation.toLocaleString('en-IN', { maximumFractionDigits: 0 })} total depreciation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Class & Location Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Class</CardTitle>
            <CardDescription>Distribution across asset classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byAssetClass).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No asset class data available
                </p>
              ) : (
                Object.entries(stats.byAssetClass)
                  .sort(([, a], [, b]) => b - a)
                  .map(([assetClass, count]) => (
                    <div key={assetClass} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span>{assetClass}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({Math.round((count / stats.totalAssets) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${(count / stats.totalAssets) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
            <CardDescription>Distribution across locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byLocation).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No location data available
                </p>
              ) : (
                Object.entries(stats.byLocation)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([location, count]) => {
                    return (
                      <div key={location} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="truncate">{location}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {count} ({Math.round((count / stats.totalAssets) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${(count / stats.totalAssets) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Last 5 modified assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent updates
              </p>
            ) : (
              stats.recentUpdates.map((asset) => (
                <div
                  key={asset.assetTagging}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div>{asset.description || asset.assetSubClass || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {asset.assetTagging} • {asset.assetClass || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {new Date(asset.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

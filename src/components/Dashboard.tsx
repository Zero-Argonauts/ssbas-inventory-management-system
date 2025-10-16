import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DashboardStats {
  totalAssets: number;
  byDepartment: Record<string, number>;
  byCondition: Record<string, number>;
  byStatus: Record<string, number>;
  totalValue: number;
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
              Tracked across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined asset value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Assets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus["Active"] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byStatus["Under Repair"] || 0) + (stats.byCondition["Poor"] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Under repair or poor condition
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Department</CardTitle>
            <CardDescription>Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byDepartment)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span>{dept}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({Math.round(((count as number) / stats.totalAssets) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${((count as number) / stats.totalAssets) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Condition</CardTitle>
            <CardDescription>Overall condition status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byCondition)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([condition, count]) => {
                  const color =
                    condition === "Excellent"
                      ? "bg-green-500"
                      : condition === "Good"
                      ? "bg-blue-500"
                      : condition === "Fair"
                      ? "bg-yellow-500"
                      : "bg-red-500";

                  return (
                    <div key={condition} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span>{condition}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({Math.round(((count as number) / stats.totalAssets) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all`}
                            style={{
                              width: `${((count as number) / stats.totalAssets) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  key={asset.assetCode}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div>{asset.assetName}</div>
                    <div className="text-sm text-muted-foreground">
                      {asset.assetCode} • {asset.department}
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

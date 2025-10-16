import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Camera, Search, X } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Html5Qrcode } from "html5-qrcode";

interface Asset {
  assetCode: string;
  assetName: string;
  department: string;
  category: string;
  supplier: string;
  purchaseDate: string;
  cost: string;
  condition: string;
  status: string;
  location: string;
  serialNumber: string;
  warrantyExpiry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fetchAsset = async (code: string) => {
    setLoading(true);
    setAsset(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${code}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Asset not found");
          return;
        }
        throw new Error("Failed to fetch asset");
      }

      const data = await response.json();
      setAsset(data.asset);
      toast.success("Asset found!");
    } catch (error) {
      console.error("Error fetching asset:", error);
      toast.error("Failed to fetch asset information");
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code successfully scanned
          fetchAsset(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning in progress, errors here are normal
        }
      );

      setScanning(true);
    } catch (error: any) {
      console.error("Error starting scanner:", error);
      setCameraError(error.message || "Failed to access camera");
      toast.error("Failed to start camera. Please check permissions.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      fetchAsset(manualCode.trim());
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Fair":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Poor":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "Under Repair":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan an asset QR code or manually enter the asset code to view details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Camera Scanner</Label>
              {scanning ? (
                <Button onClick={stopScanning} variant="destructive" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
              ) : (
                <Button onClick={startScanning} size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              )}
            </div>

            <div
              id="qr-reader"
              className="rounded-lg overflow-hidden border"
              style={{ minHeight: scanning ? "300px" : "0px" }}
            ></div>

            {cameraError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {cameraError}
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="space-y-4 pt-4 border-t">
            <Label>Manual Asset Code Entry</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter asset code (e.g., AST-001)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSearch();
                  }
                }}
              />
              <Button onClick={handleManualSearch} disabled={!manualCode.trim() || loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Details */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading asset details...</div>
          </CardContent>
        </Card>
      )}

      {asset && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>Details for {asset.assetCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Asset Code</div>
                  <div>{asset.assetCode}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Asset Name</div>
                  <div>{asset.assetName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Department</div>
                  <div>{asset.department}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div>{asset.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Supplier</div>
                  <div>{asset.supplier || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Purchase Date</div>
                  <div>{asset.purchaseDate || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                  <div>${parseFloat(asset.cost || "0").toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Condition</div>
                  <Badge className={getConditionColor(asset.condition)} variant="secondary">
                    {asset.condition}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={getStatusColor(asset.status)} variant="secondary">
                    {asset.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{asset.location || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Serial Number</div>
                  <div>{asset.serialNumber || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Warranty Expiry</div>
                  <div>{asset.warrantyExpiry || "N/A"}</div>
                </div>
              </div>

              {asset.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Notes</div>
                  <div className="p-4 bg-muted rounded-lg">{asset.notes}</div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Created At</div>
                  <div className="text-sm">{new Date(asset.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm">{new Date(asset.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

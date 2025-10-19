import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Camera, Search, X } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Html5Qrcode } from "html5-qrcode";

interface Asset {
  assetTagging: string;
  assetClass: string;
  assetSubClass: string;
  description: string;
  dateOfPurchase: string;
  taxInvoice: string;
  vendorsSuppliers: string;
  location: string;
  originalCost: string;
  depreciationRate: string;
  wdvMarch2022: string;
  transferredDisposalDetails: string;
  valuationAtTransfer: string;
  scrapValueRealised: string;
  remarks: string;
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
      // URL-encode the asset code to handle special characters like slashes
      const encodedCode = encodeURIComponent(code);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${encodedCode}`,
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
        (_errorMessage) => {
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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan an asset QR code or manually enter the asset tagging code to view details
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
            <Label>Manual Asset Tagging Entry</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter asset tagging (e.g., /3B-26/01)"
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
            <CardDescription>Details for {asset.assetTagging}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Asset Tagging</div>
                  <div>{asset.assetTagging}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Asset Class</div>
                  <div>{asset.assetClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Asset Sub Class</div>
                  <div>{asset.assetSubClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div>{asset.description || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Purchase</div>
                  <div>{asset.dateOfPurchase || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tax Invoice</div>
                  <div>{asset.taxInvoice || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Vendors/Suppliers Name & Address</div>
                  <div>{asset.vendorsSuppliers || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{asset.location || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Original Cost</div>
                  <div>₹{parseFloat(asset.originalCost || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Depreciation Rate</div>
                  <div>{asset.depreciationRate ? `${asset.depreciationRate}%` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">WDV as 31st March 2022</div>
                  <div>₹{parseFloat(asset.wdvMarch2022 || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transferred/Disposal Details</div>
                  <div>{asset.transferredDisposalDetails || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valuation at Transfer/Disposal</div>
                  <div>{asset.valuationAtTransfer ? `₹${parseFloat(asset.valuationAtTransfer).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Scrap Value Realised</div>
                  <div>{asset.scrapValueRealised ? `₹${parseFloat(asset.scrapValueRealised).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
              </div>

              {asset.remarks && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Remarks & Authorised Signatory</div>
                  <div className="p-4 bg-muted rounded-lg">{asset.remarks}</div>
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

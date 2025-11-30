import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Camera, Search, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
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

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
          <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">Scan QR Code</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Scan an asset QR code or manually enter the asset tagging code to view details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-4 sm:space-y-6 lg:space-y-4">
          {/* Camera Scanner */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <Label className="text-xs sm:text-sm">Camera Scanner</Label>
              {scanning ? (
                <Button onClick={stopScanning} variant="destructive" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 lg:h-8 w-full sm:w-auto">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                  Stop Scanning
                </Button>
              ) : (
                <Button onClick={startScanning} size="sm" className="text-xs sm:text-sm h-8 sm:h-9 lg:h-8 w-full sm:w-auto">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
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
              <div className="p-3 sm:p-4 lg:p-3 bg-destructive/10 text-destructive rounded-lg text-xs sm:text-sm">
                {cameraError}
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-3 pt-3 sm:pt-4 lg:pt-3 border-t">
            <Label className="text-xs sm:text-sm">Manual Asset Tagging Entry</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter asset tagging (e.g., /3B-26/01)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSearch();
                  }
                }}
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9 flex-1"
              />
              <Button onClick={handleManualSearch} disabled={!manualCode.trim() || loading} className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9 w-full sm:w-auto">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Details */}
      {loading && (
        <Card>
          <CardContent className="py-8 sm:py-12 lg:py-8 p-3 sm:p-4 md:p-6 lg:p-4">
            <div className="text-center text-muted-foreground text-xs sm:text-sm">Loading asset details...</div>
          </CardContent>
        </Card>
      )}

      {asset && !loading && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">Asset Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Details for {asset.assetTagging}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4">
            <div className="space-y-4 sm:space-y-6 lg:space-y-4">
              <div className="grid gap-3 sm:gap-4 lg:gap-3 grid-cols-1 sm:grid-cols-2">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Asset Tagging</div>
                  <div className="text-xs sm:text-sm">{asset.assetTagging}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Asset Class</div>
                  <div className="text-xs sm:text-sm">{asset.assetClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Asset Sub Class</div>
                  <div className="text-xs sm:text-sm">{asset.assetSubClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Description</div>
                  <div className="text-xs sm:text-sm">{asset.description || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Date of Purchase</div>
                  <div className="text-xs sm:text-sm">{asset.dateOfPurchase || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Tax Invoice</div>
                  <div className="text-xs sm:text-sm">{asset.taxInvoice || 'N/A'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">Vendors/Suppliers Name & Address</div>
                  <div className="text-xs sm:text-sm">{asset.vendorsSuppliers || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Location</div>
                  <div className="text-xs sm:text-sm">{asset.location || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Original Cost</div>
                  <div className="text-xs sm:text-sm">₹{parseFloat(asset.originalCost || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Depreciation Rate</div>
                  <div className="text-xs sm:text-sm">{asset.depreciationRate ? `${asset.depreciationRate}%` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">WDV as 31st March 2022</div>
                  <div className="text-xs sm:text-sm">₹{parseFloat(asset.wdvMarch2022 || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Transferred/Disposal Details</div>
                  <div className="text-xs sm:text-sm">{asset.transferredDisposalDetails || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Valuation at Transfer/Disposal</div>
                  <div className="text-xs sm:text-sm">{asset.valuationAtTransfer ? `₹${parseFloat(asset.valuationAtTransfer).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Scrap Value Realised</div>
                  <div className="text-xs sm:text-sm">{asset.scrapValueRealised ? `₹${parseFloat(asset.scrapValueRealised).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
              </div>

              {asset.remarks && (
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">Remarks & Authorised Signatory</div>
                  <div className="p-3 sm:p-4 lg:p-3 bg-muted rounded-lg text-xs sm:text-sm">{asset.remarks}</div>
                </div>
              )}

              <div className="grid gap-3 sm:gap-4 lg:gap-3 grid-cols-1 sm:grid-cols-2 pt-3 sm:pt-4 lg:pt-3 border-t">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Created At</div>
                  <div className="text-xs sm:text-sm">{new Date(asset.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-xs sm:text-sm">{new Date(asset.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
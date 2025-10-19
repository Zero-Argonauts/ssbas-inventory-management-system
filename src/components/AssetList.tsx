import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Search, Edit, Trash2, Eye, QrCode, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { AssetForm } from "./AssetForm";
import QRCodeLib from "qrcode";
import { jsPDF } from "jspdf";

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

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetClassFilter, setAssetClassFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, searchTerm, assetClassFilter, locationFilter]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(data.assets);
      setFilteredAssets(data.assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          (asset.assetTagging && asset.assetTagging.toLowerCase().includes(search)) ||
          (asset.description && asset.description.toLowerCase().includes(search)) ||
          (asset.assetClass && asset.assetClass.toLowerCase().includes(search)) ||
          (asset.location && asset.location.toLowerCase().includes(search)) ||
          (asset.vendorsSuppliers && asset.vendorsSuppliers.toLowerCase().includes(search))
      );
    }

    if (assetClassFilter && assetClassFilter !== "all") {
      filtered = filtered.filter((asset) => asset.assetClass === assetClassFilter);
    }

    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter((asset) => asset.location === locationFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;

    try {
      // URL-encode the asset tagging to handle special characters like slashes
      const encodedAssetTagging = encodeURIComponent(selectedAsset.assetTagging);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${encodedAssetTagging}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete asset");
      }

      toast.success("Asset deleted successfully");
      fetchAssets();
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error((error as Error).message || "Failed to delete asset");
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Asset Tagging",
        "Asset Class",
        "Asset Sub Class",
        "Description",
        "Date of Purchase",
        "Tax Invoice",
        "Vendors/Suppliers",
        "Location",
        "Original Cost",
        "Depreciation Rate",
        "WDV as 31st March 2022",
        "Transferred/Disposal Details",
        "Valuation at Transfer",
        "Scrap Value Realised",
        "Remarks",
      ],
      ...filteredAssets.map((asset) => [
        asset.assetTagging,
        asset.assetClass,
        asset.assetSubClass,
        asset.description,
        asset.dateOfPurchase,
        asset.taxInvoice,
        asset.vendorsSuppliers,
        asset.location,
        asset.originalCost,
        asset.depreciationRate,
        asset.wdvMarch2022,
        asset.transferredDisposalDetails,
        asset.valuationAtTransfer,
        asset.scrapValueRealised,
        asset.remarks,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell || ''}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Assets exported successfully");
  };

  const handleExportQRCodesPDF = async () => {
    try {
      toast.info("Generating QR codes PDF...");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // PDF settings
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15;
      const qrSize = 40; // QR code size in mm
      const labelHeight = 12; // Height for label text
      const cellWidth = 60; // Width of each cell (QR + label)
      const cellHeight = 60; // Height of each cell (QR + label + spacing)
      const cols = 3; // 3 QR codes per row
      const rows = 4; // 4 rows per page
      const perPage = cols * rows; // 12 QR codes per page

      let currentPage = 0;
      
      // Add title to first page
      pdf.setFontSize(16);
      pdf.text("Asset QR Codes", pageWidth / 2, margin, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        margin + 6,
        { align: "center" }
      );

      for (let i = 0; i < filteredAssets.length; i++) {
        const asset = filteredAssets[i];
        const indexInPage = i % perPage;

        // Add new page if needed (but not for the first item)
        if (i > 0 && indexInPage === 0) {
          pdf.addPage();
          currentPage++;
        }

        // Calculate position
        const row = Math.floor(indexInPage / cols);
        const col = indexInPage % cols;
        const x = margin + col * cellWidth;
        const y = margin + 15 + row * cellHeight; // 15mm offset for title on first page

        // Generate QR code
        const qrDataUrl = await QRCodeLib.toDataURL(asset.assetTagging, {
          width: 400,
          margin: 1,
        });

        // Add QR code image
        pdf.addImage(qrDataUrl, "PNG", x + (cellWidth - qrSize) / 2, y, qrSize, qrSize);

        // Add asset tagging label below QR code
        pdf.setFontSize(9);
        pdf.text(
          asset.assetTagging,
          x + cellWidth / 2,
          y + qrSize + 5,
          { align: "center" }
        );

        // Add description/sub-class if available (smaller text)
        if (asset.description || asset.assetSubClass) {
          pdf.setFontSize(7);
          const label = asset.description || asset.assetSubClass;
          const maxWidth = cellWidth - 4;
          const lines = pdf.splitTextToSize(label, maxWidth);
          pdf.text(
            lines[0], // Just show first line to avoid overflow
            x + cellWidth / 2,
            y + qrSize + 9,
            { align: "center" }
          );
        }
      }

      // Add page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      pdf.save(`asset_qr_codes_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`Generated PDF with ${filteredAssets.length} QR codes`);
    } catch (error) {
      console.error("Error generating QR codes PDF:", error);
      toast.error("Failed to generate QR codes PDF");
    }
  };

  const handleShowQR = async (asset: Asset) => {
    setSelectedAsset(asset);
    try {
      const qrUrl = await QRCodeLib.toDataURL(asset.assetTagging, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrUrl);
      setQrDialogOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const handleDownloadQR = () => {
    if (!selectedAsset || !qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `qr_${selectedAsset.assetTagging.replace(/\//g, '_')}.png`;
    a.click();
    toast.success("QR code downloaded");
  };

  const uniqueAssetClasses = Array.from(new Set(assets.map((a) => a.assetClass).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading assets...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between sm:flex-col md:flex-row">
            <CardTitle>Asset Inventory</CardTitle>
            <div className="flex gap-2 sm:flex-col lg:flex-row sm:mt-5 md:mt-0">
              <Button onClick={handleExportQRCodesPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export QR Codes PDF
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Asset Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Classes</SelectItem>
                {uniqueAssetClasses.map((assetClass) => (
                  <SelectItem key={assetClass} value={assetClass}>
                    {assetClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>

          {/* Assets Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tagging</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Sub Class</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Original Cost</TableHead>
                  <TableHead>WDV</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.assetTagging}>
                      <TableCell>{asset.assetTagging}</TableCell>
                      <TableCell>{asset.assetClass || 'N/A'}</TableCell>
                      <TableCell>{asset.assetSubClass || 'N/A'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{asset.description || 'N/A'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{asset.location || 'N/A'}</TableCell>
                      <TableCell>₹{parseFloat(asset.originalCost || "0").toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{parseFloat(asset.wdvMarch2022 || "0").toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowQR(asset)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>Complete information about this asset</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Asset Tagging</div>
                  <div>{selectedAsset.assetTagging}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Asset Class</div>
                  <div>{selectedAsset.assetClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Asset Sub Class</div>
                  <div>{selectedAsset.assetSubClass || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div>{selectedAsset.description || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Purchase</div>
                  <div>{selectedAsset.dateOfPurchase || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tax Invoice</div>
                  <div>{selectedAsset.taxInvoice || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Vendors/Suppliers Name & Address</div>
                  <div>{selectedAsset.vendorsSuppliers || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{selectedAsset.location || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Original Cost</div>
                  <div>₹{parseFloat(selectedAsset.originalCost || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Depreciation Rate</div>
                  <div>{selectedAsset.depreciationRate ? `${selectedAsset.depreciationRate}%` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">WDV as 31st March 2022</div>
                  <div>₹{parseFloat(selectedAsset.wdvMarch2022 || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transferred/Disposal Details</div>
                  <div>{selectedAsset.transferredDisposalDetails || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valuation at Transfer/Disposal</div>
                  <div>{selectedAsset.valuationAtTransfer ? `₹${parseFloat(selectedAsset.valuationAtTransfer).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Scrap Value Realised</div>
                  <div>{selectedAsset.scrapValueRealised ? `₹${parseFloat(selectedAsset.scrapValueRealised).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
              </div>
              {selectedAsset.remarks && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Remarks & Authorised Signatory</div>
                  <div className="p-3 bg-muted rounded-md">{selectedAsset.remarks}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Created At</div>
                  <div className="text-sm">{new Date(selectedAsset.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm">{new Date(selectedAsset.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <AssetForm
              assetTagging={selectedAsset.assetTagging}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchAssets();
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              {selectedAsset?.description || selectedAsset?.assetSubClass} ({selectedAsset?.assetTagging})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="border rounded-lg" />
            )}
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the asset "{selectedAsset?.description || selectedAsset?.assetSubClass}" (
              {selectedAsset?.assetTagging}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

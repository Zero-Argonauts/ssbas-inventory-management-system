import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Search, Edit, Trash2, Eye, QrCode, Download, FileText, Layers, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { AssetForm } from "./AssetForm";
import QRCodeLib from "qrcode";
import { jsPDF } from "jspdf";
import { groupAssetsIntoDesktopSets, type Asset as GroupAsset, type DesktopSet } from "../utils/assetGrouping";
import { DesktopSetCard } from "./DesktopSetCard";
import { List } from "react-window";    

interface Asset {
  srNo?: string;
  assetTagging: string;
  assetClass?: string;
  assetSubClass?: string;
  description?: string;
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

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetClassFilter, setAssetClassFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]); // For bulk selection
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false); // For bulk delete confirmation
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showGroupedView, setShowGroupedView] = useState(false); // Toggle for desktop set grouping
  const [sortField, setSortField] = useState<"assetTagging" | "originalCost">("assetTagging");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      let allAssets: any[] = [];
      let offset = 0;
      const limit = 1000;
      let total = 0;

      while (true) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets?limit=${limit}&offset=${offset}`,
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

        total = data.total;

        const mapped = data.assets.map((a: any) => ({
          srNo: a.sr_no,

          assetTagging: a.asset_tagging,
          assetClass: a.asset_class,
          assetSubClass: a.asset_sub_class,
          description: a.description,

          serialNumber: a.serial_number,
          location: a.location,
          dateOfPurchase: a.date_of_purchase,

          taxInvoiceNo: a.tax_invoice_no,
          vendorSupplierNameAddress: a.vendor_supplier_name_address,

          originalCost: a.original_cost !== null ? String(a.original_cost) : "",
          depreciationRate: a.depreciation_rate !== null ? String(a.depreciation_rate) : "",
          wdvAsMarch31: a.wdv_as_march_31 !== null ? String(a.wdv_as_march_31) : "",

          transferredDisposalDetails: a.transferred_disposal_details,
          valuationAtTransferDisposal:
            a.valuation_at_transfer_disposal !== null
              ? String(a.valuation_at_transfer_disposal)
              : "",

          scrapValueRealised:
            a.scrap_value_realised !== null
              ? String(a.scrap_value_realised)
              : "",

          remarksAuthorisedSignatory: a.remarks_authorised_signatory,

          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));


        allAssets.push(...mapped);

        if (allAssets.length >= total) break;

        offset += limit;
      }

      setAssets(allAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);


  // Memoize unique values for filters
  const uniqueAssetClasses = useMemo(
    () => Array.from(new Set(assets.map((a) => a.assetClass).filter(Boolean))),
    [assets]
  );

  const uniqueLocations = useMemo(
    () => Array.from(new Set(assets.map((a) => a.location).filter(Boolean))),
    [assets]
  );

  // Memoize filtered assets to avoid recalculation on every render
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          (asset.assetTagging && asset.assetTagging.toLowerCase().includes(search)) ||
          (asset.description && asset.description.toLowerCase().includes(search)) ||
          (asset.assetClass && asset.assetClass.toLowerCase().includes(search)) ||
          (asset.location && asset.location.toLowerCase().includes(search)) ||
          (asset.vendorSupplierNameAddress && asset.vendorSupplierNameAddress.toLowerCase().includes(search))
      );
    }

    if (assetClassFilter && assetClassFilter !== "all") {
      filtered = filtered.filter((asset) => asset.assetClass === assetClassFilter);
    }

    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter((asset) => asset.location === locationFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "assetTagging") {
        const aValue = a.assetTagging || "";
        const bValue = b.assetTagging || "";
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (sortField === "originalCost") {
        const aValue = parseFloat(a.originalCost || "0");
        const bValue = parseFloat(b.originalCost || "0");
        return sortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return 0;
    });

    return filtered;
  }, [assets, searchTerm, assetClassFilter, locationFilter, sortField, sortDirection]);

  const handleDelete = useCallback(async () => {
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
  }, [selectedAsset, fetchAssets]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedAssets.length === 0) return;
  
    try {
      // 🔴 delete from backend
      await Promise.all(
        selectedAssets.map(async (assetTagging) => {
          const encoded = encodeURIComponent(assetTagging);
  
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${encoded}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
  
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to delete asset");
          }
        })
      );
  
      // 🟢 FAST UI UPDATE (NO REFETCH)
      setAssets(prev =>
        prev.filter(asset => !selectedAssets.includes(asset.assetTagging))
      );
  
      // 🟢 reset UI state
      setSelectedAssets([]);
      setAssetClassFilter("all");
      setLocationFilter("all");
      setSearchTerm("");
      setBulkDeleteDialogOpen(false);
  
      toast.success(`Deleted ${selectedAssets.length} assets successfully`);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete assets"
      );
    }
  }, [selectedAssets, projectId, publicAnonKey]);

  const handleExport = useCallback(() => {
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
        asset.taxInvoiceNo,
        asset.vendorSupplierNameAddress,
        asset.location,
        asset.originalCost,
        asset.depreciationRate,
        asset.wdvAsMarch31,
        asset.transferredDisposalDetails,
        asset.valuationAtTransferDisposal,
        asset.scrapValueRealised,
        asset.remarksAuthorisedSignatory,
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
  }, [filteredAssets]);

  const handleExportQRCodesPDF = useCallback(async () => {
    try {
      toast.info("Generating QR codes PDF...");
  
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
  
      // PDF layout config
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const qrSize = 40;
      const cellWidth = 60;
      const cellHeight = 60;
      const cols = 3;
      const rows = 4;
      const perPage = cols * rows;
  
      const CHUNK_SIZE = 25; // 🔑 performance key
  
      // Title (first page)
      pdf.setFontSize(16);
      pdf.text("Asset QR Codes", pageWidth / 2, margin, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        margin + 6,
        { align: "center" }
      );
  
      let currentIndex = 0;
  
      // 🔁 Process assets in chunks
      for (let start = 0; start < filteredAssets.length; start += CHUNK_SIZE) {
        const chunk = filteredAssets.slice(start, start + CHUNK_SIZE);
  
        // Generate QR codes for this chunk only
        const qrCodes = await Promise.all(
          chunk.map(asset =>
            QRCodeLib.toDataURL(asset.assetTagging, {
              width: 400,
              margin: 1,
            })
          )
        );
  
        for (let i = 0; i < chunk.length; i++) {
          const asset = chunk[i];
          const qrDataUrl = qrCodes[i];
  
          const indexInPage = currentIndex % perPage;
  
          // New page when needed
          if (currentIndex > 0 && indexInPage === 0) {
            pdf.addPage();
          }
  
          const row = Math.floor(indexInPage / cols);
          const col = indexInPage % cols;
  
          const x = margin + col * cellWidth;
          const y = margin + 15 + row * cellHeight;
  
          // QR image
          pdf.addImage(
            qrDataUrl,
            "PNG",
            x + (cellWidth - qrSize) / 2,
            y,
            qrSize,
            qrSize
          );
  
          // Label
          pdf.setFontSize(9);
          pdf.text(
            asset.assetTagging,
            x + cellWidth / 2,
            y + qrSize + 5,
            { align: "center" }
          );
  
          currentIndex++;
        }
      }
  
      // Page numbers
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
  
      pdf.save(`asset_qr_codes_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`Generated PDF with ${filteredAssets.length} QR codes`);
    } catch (error) {
      console.error("QR PDF generation failed:", error);
      toast.error("Failed to generate QR codes PDF");
    }
  }, [filteredAssets]);

  const handleShowQR = useCallback(async (asset: Asset) => {
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
  }, []);

  const handleDownloadQR = useCallback(() => {
    if (!selectedAsset || !qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `qr_${selectedAsset.assetTagging.replace(/\//g, '_')}.png`;
    a.click();
    toast.success("QR code downloaded");
  }, [selectedAsset, qrCodeUrl]);

  // Handle select all checkbox
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredAssets.map((asset) => asset.assetTagging));
    } else {
      setSelectedAssets([]);
    }
  }, [filteredAssets]);

  const formatExcelDate = (value?: string) => {
    if (!value) return "N/A";

    const v = value.trim();

    // ✅ If it's only year like "2022"
    if (/^\d{4}$/.test(v)) return v;

    // ✅ If it's excel serial date like "44851"
    if (/^\d+$/.test(v)) {
      const serial = Number(v);

      // ✅ only convert if it looks like a real excel serial date
      if (serial > 20000) {
        const date = new Date((serial - 25569) * 86400 * 1000);
        return date.toLocaleDateString("en-IN");
      }

      return v; // small numbers shouldn't be converted
    }

    return v;
  };

  // Handle individual checkbox
  const handleSelectAsset = useCallback((assetTagging: string, checked: boolean) => {
    setSelectedAssets(prev => {
      if (checked) {
        return [...prev, assetTagging];
      } else {
        return prev.filter((id) => id !== assetTagging);
      }
    });
  }, []);

  // Handle sorting column click
  const handleSort = useCallback((field: "assetTagging" | "originalCost") => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  // Check if all assets are selected
  const allSelected = filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length;
  const someSelected = selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length;

  // Group assets into desktop sets
  const { desktopSets, ungroupedAssets } = useMemo(() => {
    return groupAssetsIntoDesktopSets(filteredAssets as GroupAsset[]);
  }, [filteredAssets]);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-4">
        <Card>
          <CardContent className="py-8 sm:py-12 lg:py-8">
            <div className="text-center text-muted-foreground text-sm">Loading assets...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 lg:gap-3">
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">Asset Inventory</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportQRCodesPDF} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm lg:h-8">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                <span className="truncate">Export QR PDF</span>
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm lg:h-8">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                <span className="truncate">Export CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-3 sm:space-y-4 lg:space-y-3">
          {/* Search and Filters */}
          <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 lg:left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 sm:pl-9 lg:pl-8 text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
              <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9">
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
              <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9">
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

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Showing {filteredAssets.length} of {assets.length} assets
              {desktopSets.length > 0 && ` (${desktopSets.length} Desktop Sets detected)`}
            </div>
            <div className="flex items-center gap-2">
              {desktopSets.length > 0 && (
                <Button
                  variant={showGroupedView ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGroupedView(!showGroupedView)}
                  className="text-xs sm:text-sm h-8 sm:h-9 lg:h-8"
                >
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                  {showGroupedView ? "Show All Assets" : "Group Desktop Sets"}
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Delete Button */}
          {selectedAssets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="text-xs sm:text-sm h-8 sm:h-9 lg:h-8"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                <span className="truncate">Delete Selected ({selectedAssets.length})</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAssets([])}
                className="text-xs sm:text-sm h-8 sm:h-9 lg:h-8"
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Grouped View - Desktop Sets */}
          {showGroupedView && desktopSets.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 lg:space-y-3">
              {/* Desktop Sets */}
              <div>
                <h3 className="text-sm font-medium mb-2 sm:mb-3 lg:mb-2">Desktop Sets ({desktopSets.length})</h3>
                {/* Full width layout for desktop sets */}
                <div className="grid gap-3 sm:gap-4 lg:gap-3 grid-cols-1">
                  {desktopSets.map((set) => (
                    <DesktopSetCard
                      key={`${set.financialYear}-${set.setId}`}
                      desktopSet={set}
                      onViewComponent={(assetTagging) => {
                        const asset = filteredAssets.find((a) => a.assetTagging === assetTagging);
                        if (asset) {
                          setSelectedAsset(asset);
                          setViewDialogOpen(true);
                        }
                      }}
                      onViewQRCode={(assetTagging) => {
                        const asset = filteredAssets.find((a) => a.assetTagging === assetTagging);
                        if (asset) {
                          handleShowQR(asset);
                        }
                      }}
                      onEditComponent={(assetTagging) => {
                        const asset = filteredAssets.find((a) => a.assetTagging === assetTagging);
                        if (asset) {
                          setSelectedAsset(asset);
                          setEditDialogOpen(true);
                        }
                      }}
                      onDeleteComponent={(assetTagging) => {
                        const asset = filteredAssets.find((a) => a.assetTagging === assetTagging);
                        if (asset) {
                          setSelectedAsset(asset);
                          setDeleteDialogOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Ungrouped Assets */}
              {ungroupedAssets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 sm:mb-3 lg:mb-2">Other Assets ({ungroupedAssets.length})</h3>
                  <div className="border rounded-lg overflow-x-auto -mx-3 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm">Asset Tagging</TableHead>
                          <TableHead className="min-w-[80px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden md:table-cell">Class</TableHead>
                          <TableHead className="min-w-[120px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden sm:table-cell">Description</TableHead>
                          <TableHead className="min-w-[100px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell">Location</TableHead>
                          <TableHead className="text-right px-2 sm:px-4 lg:px-3 text-xs sm:text-sm sticky right-0 bg-background">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ungroupedAssets.map((asset) => (
                          <TableRow key={asset.assetTagging}>
                            <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm font-mono">{asset.assetTagging}</TableCell>
                            <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden md:table-cell">{asset.assetClass || 'N/A'}</TableCell>
                            <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden sm:table-cell max-w-[150px] sm:max-w-[200px] truncate">{asset.description || 'N/A'}</TableCell>
                            <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell max-w-[120px] truncate">{asset.location || 'N/A'}</TableCell>
                            <TableCell className="text-right px-2 sm:px-4 lg:px-3 sticky right-0 bg-background">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setViewDialogOpen(true);
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowQR(asset)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setEditDialogOpen(true);
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:inline-flex"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:inline-flex"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 sm:w-10 lg:w-9 px-2 sm:px-4 lg:px-3">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </TableHead>
                    <TableHead
                      className="min-w-[100px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("assetTagging")}
                    >
                      <div className="flex items-center gap-1">
                        Asset Tagging
                        {sortField === "assetTagging" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[80px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden md:table-cell">Class</TableHead>
                    <TableHead className="min-w-[80px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell">Sub Class</TableHead>
                    <TableHead className="min-w-[120px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden sm:table-cell">Description</TableHead>
                    <TableHead className="min-w-[100px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell">Location</TableHead>
                    <TableHead
                      className="min-w-[80px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden xl:table-cell cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("originalCost")}
                    >
                      <div className="flex items-center gap-1">
                        Original Cost
                        {sortField === "originalCost" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[80px] px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden xl:table-cell">WDV</TableHead>
                    <TableHead className="text-right px-2 sm:px-4 lg:px-3 text-xs sm:text-sm sticky right-0 bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 sm:py-8 lg:py-6 text-muted-foreground text-xs sm:text-sm">
                        No assets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset) => (
                      <TableRow key={asset.assetTagging}>
                        <TableCell className="px-2 sm:px-4 lg:px-3">
                          <Checkbox
                            checked={selectedAssets.includes(asset.assetTagging)}
                            onCheckedChange={(checked) =>
                              handleSelectAsset(asset.assetTagging, checked as boolean)
                            }
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          />
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm font-mono">{asset.assetTagging}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden md:table-cell">{asset.assetClass || 'N/A'}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell max-w-[120px] truncate">{asset.assetSubClass || 'N/A'}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden sm:table-cell max-w-[150px] sm:max-w-[200px] truncate">{asset.description || 'N/A'}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden lg:table-cell max-w-[120px] truncate">{asset.location || 'N/A'}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden xl:table-cell">₹{parseFloat(asset.originalCost || "0").toLocaleString('en-IN')}</TableCell>
                        <TableCell className="px-2 sm:px-4 lg:px-3 text-xs sm:text-sm hidden xl:table-cell">₹{parseFloat(asset.wdvAsMarch31 || "0").toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right px-2 sm:px-4 lg:px-3 sticky right-0 bg-background">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setViewDialogOpen(true);
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowQR(asset)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setEditDialogOpen(true);
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:inline-flex"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:inline-flex"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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
                {selectedAsset.srNo && (
                  <div>
                    <div className="text-sm text-muted-foreground">Sr No.</div>
                    <div>{selectedAsset.srNo}</div>
                  </div>
                )}
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
                {selectedAsset.serialNumber && (
                  <div>
                    <div className="text-sm text-muted-foreground">Serial Number</div>
                    <div>{selectedAsset.serialNumber}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div>{selectedAsset.location || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Purchase</div>
                  <div>{formatExcelDate(selectedAsset.dateOfPurchase)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tax Invoice</div>
                  <div>{selectedAsset.taxInvoiceNo || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Vendors/Suppliers Name & Address</div>
                  <div>{selectedAsset.vendorSupplierNameAddress || 'N/A'}</div>
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
                  <div>₹{parseFloat(selectedAsset.wdvAsMarch31 || "0").toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transferred/Disposal Details</div>
                  <div>{selectedAsset.transferredDisposalDetails || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valuation at Transfer/Disposal</div>
                  <div>{selectedAsset.valuationAtTransferDisposal ? `₹${parseFloat(selectedAsset.valuationAtTransferDisposal).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Scrap Value Realised</div>
                  <div>{selectedAsset.scrapValueRealised ? `₹${parseFloat(selectedAsset.scrapValueRealised).toLocaleString('en-IN')}` : 'N/A'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Remarks & Authorised Signatory</div>
                <div className="p-3 bg-muted rounded-md">{selectedAsset.remarksAuthorisedSignatory || 'N/A'}</div>
              </div>
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
            <DialogDescription>
              Update the information for {selectedAsset?.assetTagging}
            </DialogDescription>
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
            <AlertDialogAction onClick={handleDelete}>Delete Asset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedAssets.length} selected asset{selectedAssets.length !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
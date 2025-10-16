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
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Search, Filter, Edit, Trash2, Eye, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { AssetForm } from "./AssetForm";
import QRCodeLib from "qrcode";

interface Asset {
  // Core Identification
  assetTagging: string; // Asset Tag / Code → Asset Tagging (e.g., SSBAS/M-EVS/25-26/01)
  assetClass: string; // Asset Class / (BLOCK No as per IT) (e.g., Machine, HP)
  assetSubClass: string; // Asset Sub-Class (e.g., Laboratory oven, Monitor, CPU)
  description: string; // Description (detailed asset description)
  serialNumber: string; // Serial No (manufacturer serial number)
  
  // Purchase & Vendor Information
  dateOfPurchase: string; // Date of Purchase
  taxInvoiceNo: string; // Tax Invoice No./(File no.)
  supplierVendor: string; // Vendors/ Suppliers Name & Address
  
  // Financial Information
  originalCost: string; // Cost / Value ($) → Original Cost
  depreciationRate: string; // Depreciation Rate
  wdvAs31stMarch2022: string; // WDV as 31st March 2022 (Written Down Value)
  
  // Current Status
  location: string; // Location (e.g., Environmental Science Lab, IT LAB III)
  department: string; // Department (from Excel: Environmental Science, IT, etc.)
  condition: string; // Can be derived from remarks
  status: string; // Active/Inactive (based on transfer/disposal details)
  
  // Additional Tracking
  transferDisposalDetails: string; // Transfer/Disposal Details
  valuationAtTransferDisposal: string; // Valuation at Transfer/Disposal
  scrapValueRealised: string; // Scrap Value Realised
  scrapRecord: string; // Scrap Record (from Sheet3)
  remarksAuthorisedSignatory: string; // Remarks & Authorised Signatory
  
  // Legacy fields for backward compatibility
  assetCode: string;
  assetName: string;
  category: string;
  supplier: string;
  purchaseDate: string;
  cost: string;
  warrantyExpiry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
  }, [assets, searchTerm, departmentFilter, conditionFilter, statusFilter]);

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
          asset.assetTagging.toLowerCase().includes(search) ||
          asset.assetClass.toLowerCase().includes(search) ||
          asset.assetSubClass.toLowerCase().includes(search) ||
          asset.description.toLowerCase().includes(search) ||
          asset.serialNumber.toLowerCase().includes(search) ||
          asset.supplierVendor.toLowerCase().includes(search) ||
          asset.location.toLowerCase().includes(search) ||
          asset.department.toLowerCase().includes(search) ||
          // Legacy fields for backward compatibility
          asset.assetCode.toLowerCase().includes(search) ||
          asset.assetName.toLowerCase().includes(search) ||
          asset.supplier.toLowerCase().includes(search)
      );
    }

    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter((asset) => asset.department === departmentFilter);
    }

    if (conditionFilter && conditionFilter !== "all") {
      filtered = filtered.filter((asset) => asset.condition === conditionFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${selectedAsset.assetCode}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      toast.success("Asset deleted successfully");
      fetchAssets();
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        // Core Identification
        "Asset Tagging",
        "Asset Class",
        "Asset Sub-Class",
        "Description",
        "Serial Number",
        // Purchase & Vendor Information
        "Date of Purchase",
        "Tax Invoice No.",
        "Supplier/Vendor",
        // Financial Information
        "Original Cost",
        "Depreciation Rate",
        "WDV as 31st March 2022",
        // Current Status
        "Location",
        "Department",
        "Condition",
        "Status",
        // Additional Tracking
        "Transfer/Disposal Details",
        "Valuation at Transfer/Disposal",
        "Scrap Value Realised",
        "Scrap Record",
        "Remarks & Authorised Signatory",
        // Legacy fields
        "Asset Code",
        "Asset Name",
        "Category",
        "Supplier",
        "Purchase Date",
        "Cost",
        "Warranty Expiry",
        "Notes",
      ],
      ...filteredAssets.map((asset) => [
        // Core Identification
        asset.assetTagging || "",
        asset.assetClass || "",
        asset.assetSubClass || "",
        asset.description || "",
        asset.serialNumber || "",
        // Purchase & Vendor Information
        asset.dateOfPurchase || "",
        asset.taxInvoiceNo || "",
        asset.supplierVendor || "",
        // Financial Information
        asset.originalCost || "",
        asset.depreciationRate || "",
        asset.wdvAs31stMarch2022 || "",
        // Current Status
        asset.location || "",
        asset.department || "",
        asset.condition || "",
        asset.status || "",
        // Additional Tracking
        asset.transferDisposalDetails || "",
        asset.valuationAtTransferDisposal || "",
        asset.scrapValueRealised || "",
        asset.scrapRecord || "",
        asset.remarksAuthorisedSignatory || "",
        // Legacy fields
        asset.assetCode || "",
        asset.assetName || "",
        asset.category || "",
        asset.supplier || "",
        asset.purchaseDate || "",
        asset.cost || "",
        asset.warrantyExpiry || "",
        asset.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
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

  const handleShowQR = async (asset: Asset) => {
    setSelectedAsset(asset);
    try {
      const qrUrl = await QRCodeLib.toDataURL(asset.assetCode, {
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
    a.download = `qr_${selectedAsset.assetCode}.png`;
    a.click();
    toast.success("QR code downloaded");
  };

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

  const uniqueDepartments = Array.from(new Set(assets.map((a) => a.department)));
  const uniqueConditions = Array.from(new Set(assets.map((a) => a.condition)));
  const uniqueStatuses = Array.from(new Set(assets.map((a) => a.status)));

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
          <div className="flex items-center justify-between">
            <CardTitle>Asset Inventory</CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {uniqueConditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>

          {/* Assets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tagging</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Original Cost</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.assetTagging || asset.assetCode}>
                      <TableCell>{asset.assetTagging || asset.assetCode}</TableCell>
                      <TableCell>{asset.assetClass}</TableCell>
                      <TableCell className="max-w-xs truncate">{asset.description}</TableCell>
                      <TableCell>{asset.department}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>${parseFloat(asset.originalCost || asset.cost || "0").toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getConditionColor(asset.condition)} variant="secondary">
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)} variant="secondary">
                          {asset.status}
                        </Badge>
                      </TableCell>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>Complete information about this asset</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-4">
              {/* Core Identification */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Core Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Asset Tagging</div>
                    <div>{selectedAsset.assetTagging || selectedAsset.assetCode || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Asset Class</div>
                    <div>{selectedAsset.assetClass || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Asset Sub-Class</div>
                    <div>{selectedAsset.assetSubClass || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Serial Number</div>
                    <div>{selectedAsset.serialNumber || "N/A"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="p-3 bg-muted rounded-md">{selectedAsset.description || selectedAsset.assetName || "N/A"}</div>
                </div>
              </div>

              {/* Purchase & Vendor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Purchase & Vendor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Date of Purchase</div>
                    <div>{selectedAsset.dateOfPurchase || selectedAsset.purchaseDate || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tax Invoice No.</div>
                    <div>{selectedAsset.taxInvoiceNo || "N/A"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Supplier/Vendor</div>
                    <div>{selectedAsset.supplierVendor || selectedAsset.supplier || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Original Cost</div>
                    <div>${parseFloat(selectedAsset.originalCost || selectedAsset.cost || "0").toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Depreciation Rate</div>
                    <div>{selectedAsset.depreciationRate || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">WDV as 31st March 2022</div>
                    <div>{selectedAsset.wdvAs31stMarch2022 || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div>{selectedAsset.location || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Department</div>
                    <div>{selectedAsset.department || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Condition</div>
                    <Badge className={getConditionColor(selectedAsset.condition)} variant="secondary">
                      {selectedAsset.condition}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className={getStatusColor(selectedAsset.status)} variant="secondary">
                      {selectedAsset.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Tracking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Tracking</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Transfer/Disposal Details</div>
                    <div>{selectedAsset.transferDisposalDetails || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Valuation at Transfer/Disposal</div>
                    <div>{selectedAsset.valuationAtTransferDisposal || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Scrap Value Realised</div>
                    <div>{selectedAsset.scrapValueRealised || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Scrap Record</div>
                    <div>{selectedAsset.scrapRecord || "N/A"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Remarks & Authorised Signatory</div>
                  <div className="p-3 bg-muted rounded-md">{selectedAsset.remarksAuthorisedSignatory || selectedAsset.notes || "N/A"}</div>
                </div>
              </div>

              {/* Legacy fields and metadata */}
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
              assetCode={selectedAsset.assetCode}
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
              {selectedAsset?.assetName} ({selectedAsset?.assetCode})
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
              This will permanently delete the asset "{selectedAsset?.assetName}" (
              {selectedAsset?.assetCode}). This action cannot be undone.
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

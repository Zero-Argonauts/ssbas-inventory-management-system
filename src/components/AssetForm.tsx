import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AssetFormProps {
  assetCode?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AssetForm({ assetCode, onSuccess, onCancel }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Core Identification
    assetTagging: "",
    assetClass: "",
    assetSubClass: "",
    description: "",
    serialNumber: "",
    
    // Purchase & Vendor Information
    dateOfPurchase: "",
    taxInvoiceNo: "",
    supplierVendor: "",
    
    // Financial Information
    originalCost: "",
    depreciationRate: "",
    wdvAs31stMarch2022: "",
    
    // Current Status
    location: "",
    department: "",
    condition: "Good",
    status: "Active",
    
    // Additional Tracking
    transferDisposalDetails: "",
    valuationAtTransferDisposal: "",
    scrapValueRealised: "",
    scrapRecord: "",
    remarksAuthorisedSignatory: "",
    
    // Legacy fields for backward compatibility
    assetCode: "",
    assetName: "",
    category: "",
    supplier: "",
    purchaseDate: "",
    cost: "",
    warrantyExpiry: "",
    notes: "",
  });

  const isEditMode = !!assetCode;

  useEffect(() => {
    if (assetCode) {
      fetchAsset();
    }
  }, [assetCode]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${assetCode}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch asset");
      }

      const data = await response.json();
      setFormData(data.asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      toast.error("Failed to load asset data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode
        ? `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${assetCode}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save asset");
      }

      toast.success(data.message || "Asset saved successfully");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast.error(error.message || "Failed to save asset");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Asset" : "Add New Asset"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Core Identification Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Core Identification</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Asset Tagging */}
              <div className="space-y-2">
                <Label htmlFor="assetTagging">
                  Asset Tagging <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="assetTagging"
                  value={formData.assetTagging}
                  onChange={(e) => handleChange("assetTagging", e.target.value)}
                  disabled={isEditMode}
                  required
                  placeholder="e.g., SSBAS/M-EVS/25-26/01"
                />
              </div>

              {/* Asset Class */}
              <div className="space-y-2">
                <Label htmlFor="assetClass">
                  Asset Class <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.assetClass}
                  onValueChange={(value) => handleChange("assetClass", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Machine">Machine</SelectItem>
                    <SelectItem value="HP">HP</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Laboratory Equipment">Laboratory Equipment</SelectItem>
                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Vehicles">Vehicles</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Asset Sub-Class */}
              <div className="space-y-2">
                <Label htmlFor="assetSubClass">Asset Sub-Class</Label>
                <Input
                  id="assetSubClass"
                  value={formData.assetSubClass}
                  onChange={(e) => handleChange("assetSubClass", e.target.value)}
                  placeholder="e.g., Laboratory oven, Monitor, CPU"
                />
              </div>

              {/* Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange("serialNumber", e.target.value)}
                  placeholder="e.g., SN123456789"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                placeholder="Detailed asset description..."
                rows={3}
              />
            </div>
          </div>

          {/* Purchase & Vendor Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Purchase & Vendor Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Date of Purchase */}
              <div className="space-y-2">
                <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
                <Input
                  id="dateOfPurchase"
                  type="date"
                  value={formData.dateOfPurchase}
                  onChange={(e) => handleChange("dateOfPurchase", e.target.value)}
                />
              </div>

              {/* Tax Invoice No. */}
              <div className="space-y-2">
                <Label htmlFor="taxInvoiceNo">Tax Invoice No./(File no.)</Label>
                <Input
                  id="taxInvoiceNo"
                  value={formData.taxInvoiceNo}
                  onChange={(e) => handleChange("taxInvoiceNo", e.target.value)}
                  placeholder="e.g., INV-2024-001"
                />
              </div>

              {/* Supplier/Vendor */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplierVendor">Vendors/Suppliers Name & Address</Label>
                <Textarea
                  id="supplierVendor"
                  value={formData.supplierVendor}
                  onChange={(e) => handleChange("supplierVendor", e.target.value)}
                  placeholder="Supplier name and complete address..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Original Cost */}
              <div className="space-y-2">
                <Label htmlFor="originalCost">Original Cost ($)</Label>
                <Input
                  id="originalCost"
                  type="number"
                  step="0.01"
                  value={formData.originalCost}
                  onChange={(e) => handleChange("originalCost", e.target.value)}
                  placeholder="e.g., 1200.00"
                />
              </div>

              {/* Depreciation Rate */}
              <div className="space-y-2">
                <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
                <Input
                  id="depreciationRate"
                  type="number"
                  step="0.01"
                  value={formData.depreciationRate}
                  onChange={(e) => handleChange("depreciationRate", e.target.value)}
                  placeholder="e.g., 10.00"
                />
              </div>

              {/* WDV as 31st March 2022 */}
              <div className="space-y-2">
                <Label htmlFor="wdvAs31stMarch2022">WDV as 31st March 2022 ($)</Label>
                <Input
                  id="wdvAs31stMarch2022"
                  type="number"
                  step="0.01"
                  value={formData.wdvAs31stMarch2022}
                  onChange={(e) => handleChange("wdvAs31stMarch2022", e.target.value)}
                  placeholder="e.g., 800.00"
                />
              </div>
            </div>
          </div>

          {/* Current Status Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Current Status</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g., Environmental Science Lab, IT LAB III"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleChange("department", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Library">Library</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">
                  Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleChange("condition", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Under Repair">Under Repair</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Tracking Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Additional Tracking</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Transfer/Disposal Details */}
              <div className="space-y-2">
                <Label htmlFor="transferDisposalDetails">Transfer/Disposal Details</Label>
                <Textarea
                  id="transferDisposalDetails"
                  value={formData.transferDisposalDetails}
                  onChange={(e) => handleChange("transferDisposalDetails", e.target.value)}
                  placeholder="Details about transfer or disposal..."
                  rows={2}
                />
              </div>

              {/* Valuation at Transfer/Disposal */}
              <div className="space-y-2">
                <Label htmlFor="valuationAtTransferDisposal">Valuation at Transfer/Disposal ($)</Label>
                <Input
                  id="valuationAtTransferDisposal"
                  type="number"
                  step="0.01"
                  value={formData.valuationAtTransferDisposal}
                  onChange={(e) => handleChange("valuationAtTransferDisposal", e.target.value)}
                  placeholder="e.g., 500.00"
                />
              </div>

              {/* Scrap Value Realised */}
              <div className="space-y-2">
                <Label htmlFor="scrapValueRealised">Scrap Value Realised ($)</Label>
                <Input
                  id="scrapValueRealised"
                  type="number"
                  step="0.01"
                  value={formData.scrapValueRealised}
                  onChange={(e) => handleChange("scrapValueRealised", e.target.value)}
                  placeholder="e.g., 100.00"
                />
              </div>

              {/* Scrap Record */}
              <div className="space-y-2">
                <Label htmlFor="scrapRecord">Scrap Record</Label>
                <Input
                  id="scrapRecord"
                  value={formData.scrapRecord}
                  onChange={(e) => handleChange("scrapRecord", e.target.value)}
                  placeholder="Reference to scrap record..."
                />
              </div>
            </div>

            {/* Remarks & Authorised Signatory */}
            <div className="space-y-2">
              <Label htmlFor="remarksAuthorisedSignatory">Remarks & Authorised Signatory</Label>
              <Textarea
                id="remarksAuthorisedSignatory"
                value={formData.remarksAuthorisedSignatory}
                onChange={(e) => handleChange("remarksAuthorisedSignatory", e.target.value)}
                placeholder="Additional remarks and authorised signatory information..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

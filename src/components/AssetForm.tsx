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
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AssetFormProps {
  assetTagging?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AssetForm({ assetTagging, onSuccess, onCancel }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assetTagging: "",
    assetClass: "",
    assetSubClass: "",
    description: "",
    dateOfPurchase: "",
    taxInvoice: "",
    vendorsSuppliers: "",
    location: "",
    originalCost: "",
    depreciationRate: "",
    wdvMarch2022: "",
    transferredDisposalDetails: "",
    valuationAtTransfer: "",
    scrapValueRealised: "",
    remarks: "",
  });

  const isEditMode = !!assetTagging;

  useEffect(() => {
    if (assetTagging) {
      fetchAsset();
    }
  }, [assetTagging]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${assetTagging}`,
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
      // URL-encode the asset tagging to handle special characters like slashes
      const url = isEditMode
        ? `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/${encodeURIComponent(assetTagging)}`
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
      <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
        <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">{isEditMode ? "Edit Asset" : "Add New Asset"}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-4">
          <div className="grid gap-4 sm:gap-6 lg:gap-4 grid-cols-1 md:grid-cols-2">
            {/* Asset Tagging */}
            <div className="space-y-2">
              <Label htmlFor="assetTagging" className="text-xs sm:text-sm">
                Asset Tagging <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetTagging"
                value={formData.assetTagging}
                onChange={(e) => handleChange("assetTagging", e.target.value)}
                disabled={isEditMode}
                required
                placeholder="e.g., /3B-26/01"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Asset Class */}
            <div className="space-y-2">
              <Label htmlFor="assetClass" className="text-xs sm:text-sm">
                Asset Class / (BLOCK NO as per IT)
              </Label>
              <Select
                value={formData.assetClass}
                onValueChange={(value) => handleChange("assetClass", value)}
              >
                <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9">
                  <SelectValue placeholder="Select asset class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Machine">Machine</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Building">Building</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Sub Class */}
            <div className="space-y-2">
              <Label htmlFor="assetSubClass" className="text-xs sm:text-sm">Asset Sub Class</Label>
              <Input
                id="assetSubClass"
                value={formData.assetSubClass}
                onChange={(e) => handleChange("assetSubClass", e.target.value)}
                placeholder="e.g., Laboratory Level, Meter, Digital"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g., Transfer from 3B-AS/M-FY5 SKSC"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Date of Purchase */}
            <div className="space-y-2">
              <Label htmlFor="dateOfPurchase" className="text-xs sm:text-sm">Date of Purchase</Label>
              <Input
                id="dateOfPurchase"
                type="date"
                value={formData.dateOfPurchase}
                onChange={(e) => handleChange("dateOfPurchase", e.target.value)}
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Tax Invoice */}
            <div className="space-y-2">
              <Label htmlFor="taxInvoice" className="text-xs sm:text-sm">Tax Invoice Yes / (If No 23)</Label>
              <Input
                id="taxInvoice"
                value={formData.taxInvoice}
                onChange={(e) => handleChange("taxInvoice", e.target.value)}
                placeholder="e.g., 508/23/03/20"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Vendors/Suppliers Name & Address */}
            <div className="space-y-2">
              <Label htmlFor="vendorsSuppliers" className="text-xs sm:text-sm">Vendors/Suppliers Name & Address</Label>
              <Input
                id="vendorsSuppliers"
                value={formData.vendorsSuppliers}
                onChange={(e) => handleChange("vendorsSuppliers", e.target.value)}
                placeholder="e.g., N.N.Scientific Traders"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g., Environmental Science Lab"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Original Cost */}
            <div className="space-y-2">
              <Label htmlFor="originalCost" className="text-xs sm:text-sm">Original Cost</Label>
              <Input
                id="originalCost"
                type="number"
                step="0.01"
                value={formData.originalCost}
                onChange={(e) => handleChange("originalCost", e.target.value)}
                placeholder="e.g., 9,500.00"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Depreciation Rate */}
            <div className="space-y-2">
              <Label htmlFor="depreciationRate" className="text-xs sm:text-sm">Depreciation Rate (%)</Label>
              <Input
                id="depreciationRate"
                type="number"
                step="0.01"
                value={formData.depreciationRate}
                onChange={(e) => handleChange("depreciationRate", e.target.value)}
                placeholder="e.g., 15"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* WDV as 31st March 2022 */}
            <div className="space-y-2">
              <Label htmlFor="wdvMarch2022" className="text-xs sm:text-sm">WDV as 31st March 2022</Label>
              <Input
                id="wdvMarch2022"
                type="number"
                step="0.01"
                value={formData.wdvMarch2022}
                onChange={(e) => handleChange("wdvMarch2022", e.target.value)}
                placeholder="e.g., 8,075.00"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Transferred/Disposal details */}
            <div className="space-y-2">
              <Label htmlFor="transferredDisposalDetails" className="text-xs sm:text-sm">Transferred/Disposal Details</Label>
              <Input
                id="transferredDisposalDetails"
                value={formData.transferredDisposalDetails}
                onChange={(e) => handleChange("transferredDisposalDetails", e.target.value)}
                placeholder="Details if transferred or disposed"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Valuation at time of Transfer/Disposal */}
            <div className="space-y-2">
              <Label htmlFor="valuationAtTransfer" className="text-xs sm:text-sm">Valuation at Time of Transfer/Disposal</Label>
              <Input
                id="valuationAtTransfer"
                type="number"
                step="0.01"
                value={formData.valuationAtTransfer}
                onChange={(e) => handleChange("valuationAtTransfer", e.target.value)}
                placeholder="Valuation amount"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>

            {/* Scrap Value realised */}
            <div className="space-y-2">
              <Label htmlFor="scrapValueRealised" className="text-xs sm:text-sm">Scrap Value Realised</Label>
              <Input
                id="scrapValueRealised"
                type="number"
                step="0.01"
                value={formData.scrapValueRealised}
                onChange={(e) => handleChange("scrapValueRealised", e.target.value)}
                placeholder="Scrap value amount"
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
            </div>
          </div>

          {/* Remarks & Authorised Signatory */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-xs sm:text-sm">Remarks & Authorised Signatory</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Additional remarks and authorized signatory details..."
              rows={3}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 lg:gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9 w-full sm:w-auto">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9 w-full sm:w-auto">
              {loading ? "Saving..." : isEditMode ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
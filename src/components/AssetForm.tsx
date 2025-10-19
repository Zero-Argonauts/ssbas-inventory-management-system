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
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Asset" : "Add New Asset"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="e.g., /3B-26/01"
              />
            </div>

            {/* Asset Class */}
            <div className="space-y-2">
              <Label htmlFor="assetClass">
                Asset Class / (BLOCK NO as per IT)
              </Label>
              <Select
                value={formData.assetClass}
                onValueChange={(value: string) => handleChange("assetClass", value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="assetSubClass">Asset Sub Class</Label>
              <Input
                id="assetSubClass"
                value={formData.assetSubClass}
                onChange={(e) => handleChange("assetSubClass", e.target.value)}
                placeholder="e.g., Laboratory Level, Meter, Digital"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g., Transfer from 3B-AS/M-FY5 SKSC"
              />
            </div>

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

            {/* Tax Invoice */}
            <div className="space-y-2">
              <Label htmlFor="taxInvoice">Tax Invoice Yes / (If No 23)</Label>
              <Input
                id="taxInvoice"
                value={formData.taxInvoice}
                onChange={(e) => handleChange("taxInvoice", e.target.value)}
                placeholder="e.g., 508/23/03/20"
              />
            </div>

            {/* Vendors/Suppliers Name & Address */}
            <div className="space-y-2">
              <Label htmlFor="vendorsSuppliers">Vendors/Suppliers Name & Address</Label>
              <Input
                id="vendorsSuppliers"
                value={formData.vendorsSuppliers}
                onChange={(e) => handleChange("vendorsSuppliers", e.target.value)}
                placeholder="e.g., N.N.Scientific Traders"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g., Environmental Science Lab"
              />
            </div>

            {/* Original Cost */}
            <div className="space-y-2">
              <Label htmlFor="originalCost">Original Cost</Label>
              <Input
                id="originalCost"
                type="number"
                step="0.01"
                value={formData.originalCost}
                onChange={(e) => handleChange("originalCost", e.target.value)}
                placeholder="e.g., 9,500.00"
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
                placeholder="e.g., 15"
              />
            </div>

            {/* WDV as 31st March 2022 */}
            <div className="space-y-2">
              <Label htmlFor="wdvMarch2022">WDV as 31st March 2022</Label>
              <Input
                id="wdvMarch2022"
                type="number"
                step="0.01"
                value={formData.wdvMarch2022}
                onChange={(e) => handleChange("wdvMarch2022", e.target.value)}
                placeholder="e.g., 8,075.00"
              />
            </div>

            {/* Transferred/Disposal details */}
            <div className="space-y-2">
              <Label htmlFor="transferredDisposalDetails">Transferred/Disposal Details</Label>
              <Input
                id="transferredDisposalDetails"
                value={formData.transferredDisposalDetails}
                onChange={(e) => handleChange("transferredDisposalDetails", e.target.value)}
                placeholder="Details if transferred or disposed"
              />
            </div>

            {/* Valuation at time of Transfer/Disposal */}
            <div className="space-y-2">
              <Label htmlFor="valuationAtTransfer">Valuation at Time of Transfer/Disposal</Label>
              <Input
                id="valuationAtTransfer"
                type="number"
                step="0.01"
                value={formData.valuationAtTransfer}
                onChange={(e) => handleChange("valuationAtTransfer", e.target.value)}
                placeholder="Valuation amount"
              />
            </div>

            {/* Scrap Value realised */}
            <div className="space-y-2">
              <Label htmlFor="scrapValueRealised">Scrap Value Realised</Label>
              <Input
                id="scrapValueRealised"
                type="number"
                step="0.01"
                value={formData.scrapValueRealised}
                onChange={(e) => handleChange("scrapValueRealised", e.target.value)}
                placeholder="Scrap value amount"
              />
            </div>
          </div>

          {/* Remarks & Authorised Signatory */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks & Authorised Signatory</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Additional remarks and authorized signatory details..."
              rows={3}
            />
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

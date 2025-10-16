import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import * as XLSX from "xlsx";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ asset: any; error: string }>;
}

export function ExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Show preview of first 5 rows
      setPreview(jsonData.slice(0, 5));
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const normalizeAssetData = (row: any): any => {
    // Map various possible column names to our standard format
    const mapping: Record<string, string[]> = {
      // Core Identification - prioritize assetTagging
      assetTagging: ["assetTagging", "asset_tagging", "assetCode", "asset_code", "code", "tag", "asset_tag", "Asset Tagging", "Asset Code", "Asset Tag"],
      assetClass: ["assetClass", "asset_class", "class", "Class", "Asset Class"],
      assetSubClass: ["assetSubClass", "asset_sub_class", "sub_class", "subClass", "Sub Class", "Asset Sub-Class"],
      description: ["description", "assetName", "asset_name", "name", "Description", "Asset Name", "Name"],
      serialNumber: ["serialNumber", "serial_number", "serial", "Serial Number", "Serial"],
      
      // Purchase & Vendor Information
      dateOfPurchase: ["dateOfPurchase", "date_of_purchase", "purchaseDate", "purchase_date", "date", "Date of Purchase", "Purchase Date"],
      taxInvoiceNo: ["taxInvoiceNo", "tax_invoice_no", "invoice_no", "invoice", "Tax Invoice No.", "Invoice No."],
      supplierVendor: ["supplierVendor", "supplier_vendor", "supplier", "vendor", "Supplier/Vendor", "Supplier", "Vendor"],
      
      // Financial Information
      originalCost: ["originalCost", "original_cost", "cost", "price", "value", "amount", "Original Cost", "Cost", "Price", "Value"],
      depreciationRate: ["depreciationRate", "depreciation_rate", "depreciation", "Depreciation Rate"],
      wdvAs31stMarch2022: ["wdvAs31stMarch2022", "wdv_as_31st_march_2022", "wdv", "WDV as 31st March 2022"],
      
      // Current Status
      location: ["location", "Location"],
      department: ["department", "dept", "Department"],
      condition: ["condition", "Condition"],
      status: ["status", "Status"],
      
      // Additional Tracking
      transferDisposalDetails: ["transferDisposalDetails", "transfer_disposal_details", "transfer_details", "Transfer/Disposal Details"],
      valuationAtTransferDisposal: ["valuationAtTransferDisposal", "valuation_at_transfer_disposal", "valuation", "Valuation at Transfer/Disposal"],
      scrapValueRealised: ["scrapValueRealised", "scrap_value_realised", "scrap_value", "Scrap Value Realised"],
      scrapRecord: ["scrapRecord", "scrap_record", "scrap", "Scrap Record"],
      remarksAuthorisedSignatory: ["remarksAuthorisedSignatory", "remarks_authorised_signatory", "remarks", "Remarks & Authorised Signatory"],
      
      // Legacy fields for backward compatibility
      assetCode: ["assetCode", "asset_code", "code", "tag", "asset_tag", "Asset Code", "Asset Tag"],
      assetName: ["assetName", "asset_name", "name", "description", "Asset Name", "Name"],
      category: ["category", "type", "Category", "Type"],
      supplier: ["supplier", "vendor", "Supplier", "Vendor"],
      purchaseDate: ["purchaseDate", "purchase_date", "date", "Purchase Date"],
      cost: ["cost", "price", "value", "amount", "Cost", "Price", "Value"],
      warrantyExpiry: ["warrantyExpiry", "warranty_expiry", "warranty", "Warranty Expiry"],
      notes: ["notes", "remarks", "comments", "Notes", "Remarks"],
    };

    const normalized: any = {};

    for (const [key, possibleNames] of Object.entries(mapping)) {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
          normalized[key] = String(row[name]);
          break;
        }
      }
    }


    return normalized;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      // Normalize and prepare asset data
      const assets = jsonData.map((row) => normalizeAssetData(row));

      // Send to server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/bulk-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ assets }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to import assets");
      }

      setResult(responseData.results);
      toast.success(responseData.message);
    } catch (error: any) {
      console.error("Error importing assets:", error);
      toast.error(error.message || "Failed to import assets");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Assets from Excel</CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx or .xls) containing your asset data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload">Select Excel File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="min-w-[120px]"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Your Excel file should contain columns for asset information. The following
                  column names are recognized (case-insensitive):
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Asset Tagging/Code</strong> (required) - Unique identifier (e.g., SSBAS/M-EVS/25-26/01)
                  </li>
                  <li>
                    <strong>Description</strong> (required) - Detailed asset description
                  </li>
                  <li>
                    <strong>Department</strong> (required) - Department name
                  </li>
                  <li><strong>Core Fields:</strong> Asset Class, Asset Sub-Class, Serial Number</li>
                  <li><strong>Purchase Info:</strong> Date of Purchase, Tax Invoice No., Supplier/Vendor</li>
                  <li><strong>Financial:</strong> Original Cost, Depreciation Rate, WDV as 31st March 2022</li>
                  <li><strong>Status:</strong> Location, Condition, Status</li>
                  <li><strong>Tracking:</strong> Transfer/Disposal Details, Scrap Value, Remarks</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 5 rows)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((value: any, vidx) => (
                          <td key={vidx} className="px-4 py-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl">{result.success}</div>
                  <div className="text-sm text-muted-foreground">Successfully imported</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl">{result.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed to import</div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Errors</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="p-3 border-b last:border-0">
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {error.error}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Asset: {JSON.stringify(error.asset).slice(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

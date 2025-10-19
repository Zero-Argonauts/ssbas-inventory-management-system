import { useState } from "react";
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
    // First, log the actual column names to help debug
    console.log("Excel row columns:", Object.keys(row));
    console.log("Excel row data:", row);
    
    // Create a normalized version of column names for case-insensitive matching
    const normalizedRow: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Normalize: trim whitespace, convert to lowercase, remove extra spaces
      const normalizedKey = key.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      normalizedRow[normalizedKey] = value;
    }
    
    console.log("Normalized columns:", Object.keys(normalizedRow));
    
    // Map various possible column names to our standard format
    const mapping: Record<string, string[]> = {
      assetTagging: [
        "asset tagging",
        "assettagging", 
        "asset_tagging",
        "asset tag",
        "assettag",
        "tagging"
      ],
      assetClass: [
        "asset class / (block no as per it)",
        "asset class",
        "assetclass",
        "asset_class",
        "class",
        "block no"
      ],
      assetSubClass: [
        "asset sub class",
        "assetsubclass",
        "asset_sub_class",
        "sub_class",
        "sub class",
        "subclass"
      ],
      description: ["description", "desc"],
      dateOfPurchase: [
        "date of purchase",
        "dateofpurchase",
        "date_of_purchase",
        "purchase_date",
        "purchasedate",
        "date"
      ],
      taxInvoice: [
        "tax invoice yes / (if no 23)",
        "tax invoice",
        "taxinvoice",
        "tax_invoice",
        "invoice"
      ],
      vendorsSuppliers: [
        "vendors/ suppliers name & address",
        "vendors/suppliers name & address",
        "vendors suppliers name & address",
        "vendorssuppliers",
        "vendors_suppliers",
        "vendor",
        "supplier",
        "vendors",
        "suppliers"
      ],
      location: ["location"],
      originalCost: [
        "original cost",
        "originalcost",
        "original_cost",
        "cost"
      ],
      depreciationRate: [
        "depreciation rate",
        "depreciationrate",
        "depreciation_rate",
        "depreciation"
      ],
      wdvMarch2022: [
        "wdv as 31st march 2022",
        "wdv as 31 march 2022",
        "wdv",
        "wdvmarch2022",
        "wdv_march_2022"
      ],
      transferredDisposalDetails: [
        "transferred/ disposal details",
        "transferred/disposal details",
        "transferred disposal details",
        "transferreddisposaldetails",
        "transferred_disposal_details",
        "disposal"
      ],
      valuationAtTransfer: [
        "valuation at time of transfer/ disposal",
        "valuation at time of transfer/disposal",
        "valuation at transfer",
        "valuationattransfer",
        "valuation_at_transfer",
        "valuation"
      ],
      scrapValueRealised: [
        "scrap value realised",
        "scrap value realized",
        "scrapvalue",
        "scrap_value_realised",
        "scrap_value",
        "scrap value"
      ],
      remarks: [
        "remarks & authorised signatory",
        "remarks and authorised signatory",
        "remarks",
        "notes",
        "comments"
      ],
    };

    const normalized: any = {};

    for (const [key, possibleNames] of Object.entries(mapping)) {
      for (const name of possibleNames) {
        const normalizedName = name.toLowerCase().trim();
        if (normalizedRow[normalizedName] !== undefined && 
            normalizedRow[normalizedName] !== null && 
            normalizedRow[normalizedName] !== "") {
          // Convert to string and handle special cases
          let value = String(normalizedRow[normalizedName]).trim();
          
          // Remove commas from numeric values
          if (["originalCost", "wdvMarch2022", "valuationAtTransfer", "scrapValueRealised", "depreciationRate"].includes(key)) {
            value = value.replace(/,/g, "");
          }
          
          normalized[key] = value;
          break;
        }
      }
    }
    
    console.log("Normalized asset data:", normalized);

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

      console.log("Total rows to import:", jsonData.length);
      
      // Show the actual column names from the first row
      if (jsonData.length > 0) {
        console.log("Excel columns detected:", Object.keys(jsonData[0]));
        toast.info(`Found ${jsonData.length} rows with columns: ${Object.keys(jsonData[0]).join(", ")}`);
      }

      // Normalize and prepare asset data
      const assets = jsonData.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);
        return normalizeAssetData(row);
      });

      console.log("Normalized assets to import:", assets);

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
                  Your Excel file should contain columns matching the asset management format. The following
                  column names are recognized:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Asset Tagging</strong> (required) - Unique asset identifier
                  </li>
                  <li>
                    <strong>Asset Class / (BLOCK NO as per IT)</strong> - Classification
                  </li>
                  <li>
                    <strong>Asset Sub Class</strong> - Sub-classification
                  </li>
                  <li>
                    <strong>Description</strong> - Asset description
                  </li>
                  <li>
                    <strong>Date of Purchase</strong> - Purchase date
                  </li>
                  <li>
                    <strong>Tax Invoice Yes / (If No 23)</strong> - Invoice details
                  </li>
                  <li>
                    <strong>Vendors/Suppliers Name & Address</strong> - Supplier information
                  </li>
                  <li>
                    <strong>Location</strong> - Physical location
                  </li>
                  <li>
                    <strong>Original Cost</strong> - Purchase cost
                  </li>
                  <li>
                    <strong>Depreciation Rate</strong> - Depreciation percentage
                  </li>
                  <li>
                    <strong>WDV as 31st March 2022</strong> - Written down value
                  </li>
                  <li>
                    <strong>Transferred/Disposal details</strong> - Transfer/disposal info
                  </li>
                  <li>
                    <strong>Valuation at time of Transfer/Disposal</strong> - Valuation amount
                  </li>
                  <li>
                    <strong>Scrap Value realised</strong> - Scrap value
                  </li>
                  <li>
                    <strong>Remarks & Authorised Signatory</strong> - Additional notes
                  </li>
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
                        <th key={key} className="px-4 py-2 text-left whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((value: any, vidx) => (
                          <td key={vidx} className="px-4 py-2 whitespace-nowrap">
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

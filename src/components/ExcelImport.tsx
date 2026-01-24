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

      setPreview(jsonData.slice(0, 5));
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const normalizeHeader = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ");

  const normalizeAssetData = (row: any): any => {
    console.log("Excel row columns:", Object.keys(row));
    console.log("Excel row data:", row);
    
    const normalizedRow: any = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = normalizeHeader(key.toString());
      normalizedRow[normalizedKey] = value;
    }
    
    console.log("Normalized columns:", Object.keys(normalizedRow));
    
    const mapping: Record<string, string[]> = {
      srNo: [
        "sr no",
        "sr no.",
        "srno",
        "sr_no",
        "serial no",
        "s.no",
        "s no",
        "sno"
      ],
      assetClass: [
        "asset class / (block no as per it)",
        "asset class / (block no as per it)",
        "asset class",
        "assetclass",
        "asset_class",
        "class",
        "block no",
        "block no as per it"
      ],
      assetSubClass: [
        "asset sub class",
        "assetsubclass",
        "asset_sub_class",
        "sub_class",
        "sub class",
        "subclass"
      ],
      description: [
        "description", 
        "desc"
      ],
      assetTagging: [
        "asset tagging",
        "assettagging", 
        "asset_tagging",
        "asset tag",
        "assettag",
        "tagging"
      ],
      serialNumber: [
        "serial number",
        "serialnumber",
        "serial_number",
        "serial no",
        "serial no.",
        "sn"
      ],
      location: [
        "location",
        "loc"
      ],
      dateOfPurchase: [
        "date of purchase",
        "dateofpurchase",
        "date_of_purchase",
        "purchase_date",
        "purchasedate",
        "purchase date",
        "date"
      ],
      taxInvoiceNo: [
        "tax invoice no. / (file no.)",
        "tax invoice no. /( file no.)",
        "tax invoice no / (file no)",
        "tax invoice no.",
        "tax invoice no",
        "tax invoice yes / (if no 23)",
        "tax invoice",
        "taxinvoice",
        "tax_invoice",
        "invoice no",
        "invoice",
        "file no"
      ],
      vendorSupplierNameAddress: [
        "vendor / supplier name & address",
        "vendor supplier name & address",
        "vendors/ suppliers name & address",
        "vendors/suppliers name & address",
        "vendors suppliers name & address",
        "vendor supplier name address",
        "vendorssuppliers",
        "vendors_suppliers",
        "vendor",
        "supplier",
        "vendors",
        "suppliers"
      ],
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
      wdvAsMarch31: [
        "wdv as on 31st march",
        "wdv as 31st march 2022",
        "wdv as 31 march 2022",
        "wdv as on 31st march 2022",
        "wdv",
        "wdvmarch2022",
        "wdv_march_2022"
      ],
      transferredDisposalDetails: [
        "transferred / disposal details",
        "transferred/ disposal details",
        "transferred/disposal details",
        "transferred disposal details",
        "transferreddisposaldetails",
        "transferred_disposal_details",
        "disposal details",
        "disposal"
      ],
      valuationAtTransferDisposal: [
        "valuation at time of transfer / disposal",
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
      remarksAuthorisedSignatory: [
        "remarks & authorised signatory",
        "remarks and authorised signatory",
        "remarks & authorized signatory",
        "remarks and authorized signatory",
        "remarks",
        "notes",
        "comments"
      ],
    };

    const normalized: any = {};

    for (const [key, possibleNames] of Object.entries(mapping)) {
      for (const name of possibleNames) {
        const normalizedName = normalizeHeader(name);
        if (normalizedRow[normalizedName] !== undefined && 
            normalizedRow[normalizedName] !== null && 
            normalizedRow[normalizedName] !== "") {
          let value = String(normalizedRow[normalizedName]).trim();
          
          if (["originalCost", "wdvAsMarch31", "valuationAtTransferDisposal", "scrapValueRealised", "depreciationRate"].includes(key)) {
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
      
      if (jsonData.length > 0) {
        console.log("Excel columns detected:", Object.keys(jsonData[0]));
        toast.info(`Found ${jsonData.length} rows with columns: ${Object.keys(jsonData[0]).join(", ")}`);
      }

      const assets = jsonData.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);
        return normalizeAssetData(row);
      });

      console.log("Normalized assets to import:", assets);

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
    <div className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
          <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">Import Assets from Excel</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Upload an Excel file (.xlsx or .xls) containing your asset data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-4 sm:space-y-6 lg:space-y-4">
          <div className="space-y-3 sm:space-y-4 lg:space-y-3">
            <Label htmlFor="file-upload" className="text-xs sm:text-sm">Select Excel File</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 lg:gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10 lg:h-9"
              />
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="text-xs sm:text-sm h-9 sm:h-10 lg:h-9 w-full sm:w-auto sm:min-w-[120px]"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 mr-1 sm:mr-2 lg:mr-1.5 shrink-0" />
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>

          <Alert className="p-3 sm:p-4 lg:p-3">
            <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
            <AlertDescription className="text-xs sm:text-sm">
              <div className="space-y-2">
                <p>
                  Your Excel file should contain columns matching the asset management format. The following
                  column names are recognized:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                  <li>
                    <strong>Sr No.</strong> - Serial number
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
                    <strong>Asset Tagging</strong> (required) - Unique asset identifier
                  </li>
                  <li>
                    <strong>Serial Number</strong> - Manufacturer's serial number
                  </li>
                  <li>
                    <strong>Location</strong> - Physical location
                  </li>
                  <li>
                    <strong>Date of Purchase</strong> - Purchase date
                  </li>
                  <li>
                    <strong>Tax Invoice No. / (File No.)</strong> - Invoice or file number
                  </li>
                  <li>
                    <strong>Vendor / Supplier Name & Address</strong> - Supplier information
                  </li>
                  <li>
                    <strong>Original Cost</strong> - Purchase cost
                  </li>
                  <li>
                    <strong>Depreciation Rate</strong> - Depreciation percentage
                  </li>
                  <li>
                    <strong>WDV as on 31st March</strong> - Written down value
                  </li>
                  <li>
                    <strong>Transferred / Disposal Details</strong> - Transfer/disposal info
                  </li>
                  <li>
                    <strong>Valuation at Time of Transfer / Disposal</strong> - Valuation amount
                  </li>
                  <li>
                    <strong>Scrap Value Realised</strong> - Scrap value
                  </li>
                  <li>
                    <strong>Remarks & Authorised Signatory</strong> - Additional notes
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Preview (First 5 rows)</Label>
              <div className="border rounded-lg overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-2 sm:px-4 lg:px-3 py-1.5 sm:py-2 text-left whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((value: any, vidx) => (
                          <td key={vidx} className="px-2 sm:px-4 lg:px-3 py-1.5 sm:py-2 whitespace-nowrap">
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

      {result && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6 lg:p-4">
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-lg">Import Results</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-4 space-y-3 sm:space-y-4 lg:space-y-3">
            <div className="grid gap-3 sm:gap-4 lg:gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-2.5 p-3 sm:p-4 lg:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl lg:text-xl">{result.success}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Successfully imported</div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 lg:gap-2.5 p-3 sm:p-4 lg:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl lg:text-xl">{result.failed}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Failed to import</div>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Errors</Label>
                <div className="border rounded-lg max-h-48 sm:max-h-64 overflow-y-auto">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="p-2 sm:p-3 lg:p-2.5 border-b last:border-0">
                      <div className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {error.error}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
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

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Sheet } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import * as XLSX from "xlsx";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ asset: any; error: string }>;
}

interface SheetData {
  name: string;
  data: any[];
  assetTaggingColumn: string | null;
  totalRows: number;
  validRows: number;
}

export function ExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<SheetData[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setSelectedSheets([]);
      parseExcelFile(selectedFile);
    }
  };

  const findDataStartRow = (sheet: XLSX.WorkSheet): number => {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    // Look for the first row that looks like headers (contains text in multiple columns)
    for (let row = range.s.r; row <= Math.min(range.s.r + 20, range.e.r); row++) {
      let textColumns = 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v && typeof cell.v === 'string' && cell.v.trim() !== '') {
          textColumns++;
        }
      }
      // If we find a row with 3+ text columns, it's likely the header row
      if (textColumns >= 3) {
        return row;
      }
    }
    
    // Fallback: return the first row
    return range.s.r;
  };

  const parseExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetData: SheetData[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        // Find the data start row
        const dataStartRow = findDataStartRow(sheet);
        
        // Get all data from the sheet
        const allData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1,
          range: dataStartRow,
          defval: null
        });

        if (allData.length === 0) {
          continue;
        }

        // First row should be headers
        const headers = allData[0] as string[];
        
        // Clean headers (remove null/undefined values)
        const cleanHeaders = headers.filter(header => header && header.toString().trim() !== '');
        
        if (cleanHeaders.length === 0) {
          console.warn(`Sheet "${sheetName}" has no valid headers`);
          continue;
        }

        // Process data rows (skip header)
        const dataRows = allData.slice(1);
        
        // Filter out completely empty rows
        const validRows = dataRows.filter(row => {
          return row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '');
        });

        // Convert to objects with proper headers
        const jsonData = dataRows.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header && header.toString().trim() !== '') {
              obj[header] = row[index];
            }
          });
          return obj;
        });

        sheetData.push({
          name: sheetName,
          data: jsonData,
          assetTaggingColumn: null, // No longer required
          totalRows: dataRows.length,
          validRows: validRows.length
        });
      }

      if (sheetData.length === 0) {
        toast.error("No valid sheets found in the Excel file");
        return;
      }

      setPreview(sheetData);
      setSelectedSheets(sheetData.map(s => s.name));
      
      toast.success(`Found ${sheetData.length} sheet(s) with data`);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };

  const normalizeAssetData = (row: any): any => {
    // Use the actual field titles from the Excel sheet
    // Clean and normalize the data while preserving original field names
    const normalized: any = {};

    for (const [key, value] of Object.entries(row)) {
      if (value !== null && value !== undefined && value.toString().trim() !== '') {
        // Clean up the value
        let cleanValue = value.toString().trim();
        
        // Clean up cost values (remove commas)
        if (typeof cleanValue === 'string' && /^[\d,]+\.?\d*$/.test(cleanValue)) {
          cleanValue = cleanValue.replace(/,/g, '');
        }
        
        normalized[key] = cleanValue;
      }
    }

    return normalized;
  };

  const handleSheetToggle = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleImport = async () => {
    if (!file || selectedSheets.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const allAssets: any[] = [];

      // Process only selected sheets
      for (const sheetName of selectedSheets) {
        const sheet = workbook.Sheets[sheetName];
        const dataStartRow = findDataStartRow(sheet);
        
        const allData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1,
          range: dataStartRow,
          defval: null
        });

        if (allData.length === 0) continue;

        const headers = allData[0] as string[];
        
        // Clean headers (remove null/undefined values)
        const cleanHeaders = headers.filter(header => header && header.toString().trim() !== '');
        
        if (cleanHeaders.length === 0) continue;

        // Process data rows (skip header)
        const dataRows = allData.slice(1);
        
        // Convert to objects with proper headers
        const jsonData = dataRows.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header && header.toString().trim() !== '') {
              obj[header] = row[index];
            }
          });
          return obj;
        });

        // Filter out completely empty rows
        const validAssets = jsonData
          .filter(row => {
            return Object.values(row).some(value => 
              value !== null && value !== undefined && value.toString().trim() !== ''
            );
          })
          .map(row => normalizeAssetData(row));

        allAssets.push(...validAssets);
      }

      if (allAssets.length === 0) {
        toast.error("No valid assets found in selected sheets");
        return;
      }

      // Send to server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8862d32b/assets/bulk-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ assets: allAssets }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to import assets");
      }

      setResult(responseData.results);
      toast.success(`Successfully imported ${allAssets.length} assets from ${selectedSheets.length} sheet(s)`);
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
            Upload an Excel file (.xlsx or .xls) containing your asset data across multiple sheets
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
                disabled={!file || importing || selectedSheets.length === 0}
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
                  Your Excel file should contain columns for asset information. The system will use the actual column names from your Excel sheets.
                  Common asset information includes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Asset Identification:</strong> Asset Tag, Asset Code, Serial Number, etc.
                  </li>
                  <li>
                    <strong>Description:</strong> Asset Name, Description, Details
                  </li>
                  <li>
                    <strong>Location:</strong> Department, Location, Building, Room
                  </li>
                  <li><strong>Purchase Info:</strong> Date of Purchase, Invoice No., Supplier/Vendor</li>
                  <li><strong>Financial:</strong> Cost, Price, Value, Depreciation</li>
                  <li><strong>Status:</strong> Condition, Status, Maintenance</li>
                  <li><strong>Additional:</strong> Any other relevant asset information</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Sheet Selection */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <Label>Select Sheets to Import</Label>
              <div className="grid gap-3">
                {preview.map((sheet) => (
                  <div key={sheet.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sheet className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{sheet.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {sheet.validRows} valid rows out of {sheet.totalRows} total rows
                          <span className="ml-2 text-green-600">
                            ✓ Ready to import
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={selectedSheets.includes(sheet.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSheetToggle(sheet.name)}
                    >
                      {selectedSheets.includes(sheet.name) ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && selectedSheets.length > 0 && (
            <div className="space-y-4">
              <Label>Preview (First 3 rows from selected sheets)</Label>
              {preview
                .filter(sheet => selectedSheets.includes(sheet.name))
                .map((sheet) => (
                  <div key={sheet.name} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Sheet: {sheet.name}
                    </h4>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(sheet.data[0] || {}).map((key) => (
                              <th key={key} className="px-4 py-2 text-left">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.data.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {Object.values(row).map((value: any, vidx) => (
                                <td key={vidx} className="px-4 py-2">
                                  {String(value || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
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

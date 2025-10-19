import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { AssetForm } from "./components/AssetForm";
import { AssetList } from "./components/AssetList";
import { QRScanner } from "./components/QRScanner";
import { ExcelImport } from "./components/ExcelImport";
import { Toaster } from "./components/ui/sonner";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  QrCode,
  Upload,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* <Package className="h-8 w-8 text-primary" /> */}
            <div className="flex justify-between w-full items-center">
              {/* <h1 className="text-2xl font-bold">Asset Management System</h1>
              <p className="text-sm text-muted-foreground">
                QR Code-based tracking for college properties
              </p> */}
              <img src="/ssbas.svg" alt="" className="h-15" />
              <img src="/Trust.svg" alt="" className="h-15" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add New</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="assets">
            <AssetList />
          </TabsContent>

          <TabsContent value="add">
            <div className="p-6">
              <AssetForm
                onSuccess={() => {
                  setActiveTab("assets");
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="scan">
            <QRScanner />
          </TabsContent>

          <TabsContent value="import">
            <ExcelImport />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>College Asset Management System - Efficient tracking with QR codes</p>
        </div>
      </footer>
    </div>
  );
}

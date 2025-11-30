import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { AssetForm } from "./components/AssetForm";
import { AssetList } from "./components/AssetList";
import { QRScanner } from "./components/QRScanner";
import { ExcelImport } from "./components/ExcelImport";
import { Toaster } from "./components/ui/sonner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SignOutButton } from "@clerk/clerk-react";
import { Button } from "./components/ui/button";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  QrCode,
  Upload,
  LogOut,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("assets");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Toaster />

        {/* Header */}
        <header className="border-b bg-card shrink-0">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 lg:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center justify-between gap-2 sm:gap-3 flex-row w-full">
                <img src="/ssbas.svg" alt="" className="h-15" />
                <img src="/Trust.svg" alt="" className="h-15" />
                {/* <Package className="h-6 w-6 sm:h-8 sm:w-8 lg:h-7 lg:w-7 text-primary shrink-0" /> */}
                {/* <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl truncate">Asset Management System</h1>
                  <p className="text-xs sm:text-sm lg:text-xs text-muted-foreground truncate">
                    QR Code-based tracking for college properties
                  </p>
                </div> */}
              </div>
              <SignOutButton redirectUrl="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </SignOutButton>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-4 flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-4">
            <TabsList className="grid w-full max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto grid-cols-4 h-auto p-1 lg:p-0.5">
              {/* Dashboard tab disabled - uncomment to enable
            <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
              <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">Dashboard</span>
            </TabsTrigger>
            */}
              <TabsTrigger value="assets" className="flex items-center gap-1 sm:gap-2 lg:gap-1.5 px-2 sm:px-3 lg:px-4 py-2 lg:py-1.5">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm lg:text-xs">Assets</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1 sm:gap-2 lg:gap-1.5 px-2 sm:px-3 lg:px-4 py-2 lg:py-1.5">
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm lg:text-xs">Add New</span>
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-1 sm:gap-2 lg:gap-1.5 px-2 sm:px-3 lg:px-4 py-2 lg:py-1.5">
                <QrCode className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm lg:text-xs">Scan QR</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-1 sm:gap-2 lg:gap-1.5 px-2 sm:px-3 lg:px-4 py-2 lg:py-1.5">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 shrink-0" />
                <span className="hidden xs:inline text-xs sm:text-sm lg:text-xs">Import</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard tab content disabled - uncomment to enable
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          */}

            <TabsContent value="assets" className="flex-1 overflow-auto m-0">
              <AssetList />
            </TabsContent>

            <TabsContent value="add" className="flex-1 overflow-auto m-0">
              <div className="p-3 sm:p-4 md:p-6 lg:p-4">
                <AssetForm
                  onSuccess={() => {
                    setActiveTab("assets");
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="scan" className="flex-1 overflow-auto m-0">
              <QRScanner />
            </TabsContent>

            <TabsContent value="import" className="flex-1 overflow-auto m-0">
              <ExcelImport />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t mt-auto shrink-0">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-3 text-center text-xs sm:text-sm text-muted-foreground">
            <p className="truncate">College Asset Management System - Efficient tracking with QR codes</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
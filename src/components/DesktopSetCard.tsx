import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Monitor, Keyboard, Mouse, Cpu, Eye, Edit, Trash2, MapPin, ChevronDown, ChevronUp, QrCode } from "lucide-react";
import type { DesktopSet } from "../utils/assetGrouping";
import { useState } from "react";

interface DesktopSetCardProps {
  desktopSet: DesktopSet;
  onViewComponent?: (assetTagging: string) => void;
  onEditComponent?: (assetTagging: string) => void;
  onDeleteComponent?: (assetTagging: string) => void;
  onViewSet?: (setId: string) => void;
  onViewQRCode?: (assetTagging: string) => void;
}

export function DesktopSetCard({
  desktopSet,
  onViewComponent,
  onEditComponent,
  onDeleteComponent,
  onViewSet,
  onViewQRCode,
}: DesktopSetCardProps) {
  const { components, displayName, location, totalCost, completeness, setId } = desktopSet;
  const [isExpanded, setIsExpanded] = useState(true);

  const getCompletenessColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600 dark:text-green-400";
    if (percentage >= 75) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const componentIcons = {
    monitor: Monitor,
    keyboard: Keyboard,
    mouse: Mouse,
    cpu: Cpu,
  };

  const componentLabels = {
    monitor: "Monitor",
    keyboard: "Keyboard",
    mouse: "Mouse",
    cpu: "CPU",
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 lg:p-3 bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base lg:text-sm truncate">{setId}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <CardDescription className="text-xs mt-1 flex items-center gap-2 flex-wrap">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              )}
              <Badge
                variant={completeness === 100 ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {completeness.toFixed(0)}% Complete
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Total Cost</div>
            <div className="text-sm font-semibold">₹{totalCost.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-3 sm:p-4 lg:p-3">
          {/* Desktop Layout (1x4 horizontal) - hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-4 gap-2 sm:gap-3 lg:gap-2">
            {Object.entries(componentLabels).map(([key, label]) => {
              const Icon = componentIcons[key as keyof typeof componentIcons];
              const component = components[key as keyof typeof components];
              const isPresent = !!component;

              return (
                <div
                  key={key}
                  className={`border rounded-lg p-2 sm:p-3 lg:p-2 ${
                    isPresent ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isPresent ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
                    {!isPresent && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto shrink-0">
                        Missing
                      </Badge>
                    )}
                  </div>
                  {isPresent && component ? (
                    <div className="space-y-1">
                      <div className="text-[10px] sm:text-xs font-mono text-muted-foreground truncate">
                        {component.assetTagging}
                      </div>
                      {component.serialNumber && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          SN: {component.serialNumber}
                        </div>
                      )}
                      <div className="text-[10px] sm:text-xs text-muted-foreground italic">
                        Included in Set
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {onViewComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewComponent(component.assetTagging)}
                            className="h-6 px-2 text-[10px]"
                            title="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {onViewQRCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewQRCode(component.assetTagging)}
                            className="h-6 px-2 text-[10px]"
                            title="QR Code"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                        )}
                        {onEditComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditComponent(component.assetTagging)}
                            className="h-6 px-2 text-[10px]"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {onDeleteComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteComponent(component.assetTagging)}
                            className="h-6 px-2 text-[10px]"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground italic">Not assigned</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Layout (2x2 grid) - visible only on mobile */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {Object.entries(componentLabels).map(([key, label]) => {
              const Icon = componentIcons[key as keyof typeof componentIcons];
              const component = components[key as keyof typeof components];
              const isPresent = !!component;

              return (
                <div
                  key={key}
                  className={`border rounded-lg p-2 ${
                    isPresent ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isPresent ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium truncate">{label}</span>
                    {!isPresent && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto shrink-0">
                        N/A
                      </Badge>
                    )}
                  </div>
                  {isPresent && component ? (
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {component.assetTagging}
                      </div>
                      {component.serialNumber && (
                        <div className="text-[9px] text-muted-foreground truncate">
                          SN: {component.serialNumber}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground italic">
                        In Set
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        {onViewComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewComponent(component.assetTagging)}
                            className="h-6 px-1 text-[10px]"
                            title="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {onViewQRCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewQRCode(component.assetTagging)}
                            className="h-6 px-1 text-[10px]"
                            title="QR"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                        )}
                        {onEditComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditComponent(component.assetTagging)}
                            className="h-6 px-1 text-[10px]"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {onDeleteComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteComponent(component.assetTagging)}
                            className="h-6 px-1 text-[10px]"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground italic">Not assigned</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
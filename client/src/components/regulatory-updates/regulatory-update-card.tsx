import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertTriangle, Bell, Calendar, Check, Clock, FileText, MoreHorizontal, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipovi podataka za regulatorna ažuriranja
export type RegulatoryUpdateStatus = "pending" | "in-progress" | "completed" | "ignored";
export type RegulatoryUpdateSeverity = "critical" | "important" | "info";

export interface AffectedDocument {
  id: string;
  name: string;
  type: string;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  status: RegulatoryUpdateStatus;
  severity: RegulatoryUpdateSeverity;
  affectedDocuments: AffectedDocument[];
  source: string;
  legalReference: string;
  complianceDeadline: string;
  requiredChanges: string;
}

interface RegulatoryUpdateCardProps {
  update: RegulatoryUpdate;
  onStatusChange: (id: string, status: RegulatoryUpdateStatus) => void;
  onViewDetails: (id: string) => void;
}

export function RegulatoryUpdateCard({ update, onStatusChange, onViewDetails }: RegulatoryUpdateCardProps) {
  const [open, setOpen] = useState(false);
  
  // Funkcije za formatiranje datuma
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS');
  };
  
  // Računamo preostalo vreme do roka
  const deadline = new Date(update.complianceDeadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Ikonica i boja na osnovu ozbiljnosti
  const getSeverityDetails = () => {
    switch (update.severity) {
      case "critical":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          color: "text-red-500"
        };
      case "important":
        return {
          icon: <Bell className="h-4 w-4 text-amber-500" />,
          color: "text-amber-500"
        };
      case "info":
      default:
        return {
          icon: <FileText className="h-4 w-4 text-blue-500" />,
          color: "text-blue-500"
        };
    }
  };
  
  // Status badge
  const getStatusBadge = () => {
    switch (update.status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-600 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
            <Check className="h-3 w-3 mr-1" />
            Završeno
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            U toku
          </Badge>
        );
      case "ignored":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700">
            <XIcon className="h-3 w-3 mr-1" />
            Ignorisano
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Na čekanju
          </Badge>
        );
    }
  };
  
  const severityDetails = getSeverityDetails();
  
  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200",
      update.severity === "critical" && "border-red-200 dark:border-red-900",
      update.severity === "important" && "border-amber-200 dark:border-amber-900",
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5">
            {severityDetails.icon}
            <span className={cn("text-xs font-medium", severityDetails.color)}>
              {update.severity === "critical" ? "Kritično" : update.severity === "important" ? "Važno" : "Informativno"}
            </span>
          </div>
          <div className="flex gap-2">
            {getStatusBadge()}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {update.status === "pending" && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange(update.id, "in-progress")}>
                      Počni sa ažuriranjem
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(update.id, "ignored")}>
                      Ignoriši
                    </DropdownMenuItem>
                  </>
                )}
                {update.status === "in-progress" && (
                  <DropdownMenuItem onClick={() => onStatusChange(update.id, "completed")}>
                    Označi kao završeno
                  </DropdownMenuItem>
                )}
                {update.status === "ignored" && (
                  <DropdownMenuItem onClick={() => onStatusChange(update.id, "pending")}>
                    Vrati na čekanje
                  </DropdownMenuItem>
                )}
                {update.status === "completed" && (
                  <DropdownMenuItem onClick={() => onStatusChange(update.id, "in-progress")}>
                    Označi kao u toku
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <h3 className="text-base font-semibold mt-2 line-clamp-2">{update.title}</h3>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-muted-foreground">
            {formatDate(update.date)}
          </div>
          <div className="text-xs text-muted-foreground">
            {update.source}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {update.description}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <FileText className="h-4 w-4 text-muted-foreground mr-1.5" />
            <span className="text-xs text-muted-foreground">
              {update.affectedDocuments.length} {update.affectedDocuments.length === 1 ? "dokument" : "dokumenta"}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span className={cn(
              "text-xs font-medium",
              daysLeft < 7 ? "text-red-500" : daysLeft < 14 ? "text-amber-500" : "text-green-500"
            )}>
              {daysLeft > 0 ? `${daysLeft} dana do roka` : "Rok istekao"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pb-4 pt-2">
        <Button variant="secondary" size="sm" className="w-full" onClick={() => onViewDetails(update.id)}>
          Pregledaj detalje
        </Button>
      </CardFooter>
    </Card>
  );
}
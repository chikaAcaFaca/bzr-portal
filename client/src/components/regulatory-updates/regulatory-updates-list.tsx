import { useState } from "react";
import { RegulatoryUpdate, RegulatoryUpdateCard, RegulatoryUpdateStatus } from "./regulatory-update-card";
import { RegulatoryUpdateDetailDialog } from "./regulatory-update-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Filter, Search, SlidersHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RegulatoryUpdatesListProps {
  updates: RegulatoryUpdate[];
  onUpdateStatusChange: (id: string, status: RegulatoryUpdateStatus) => void;
}

export function RegulatoryUpdatesList({ updates, onUpdateStatusChange }: RegulatoryUpdatesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<RegulatoryUpdateStatus[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  
  // Filtriranje ažuriranja na osnovu tabova, pretrage i filtera
  const filteredUpdates = updates.filter((update) => {
    // Filter po tabu
    if (selectedTab !== "all" && update.status !== selectedTab) {
      return false;
    }
    
    // Filter po pretrazi
    if (
      searchQuery &&
      !update.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !update.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    
    // Filter po statusima
    if (
      selectedStatuses.length > 0 &&
      !selectedStatuses.includes(update.status)
    ) {
      return false;
    }
    
    // Filter po ozbiljnosti
    if (
      selectedSeverities.length > 0 &&
      !selectedSeverities.includes(update.severity)
    ) {
      return false;
    }
    
    return true;
  });
  
  // Sortiranje ažuriranja tako da kritična i važna budu na vrhu
  const sortedUpdates = [...filteredUpdates].sort((a, b) => {
    // Prvo po ozbiljnosti
    const severityOrder = { critical: 0, important: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Zatim po roku (najbliži rok prvi)
    const aDeadline = new Date(a.complianceDeadline).getTime();
    const bDeadline = new Date(b.complianceDeadline).getTime();
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;
    
    // Na kraju po datumu izdavanja (noviji prvi)
    const aDate = new Date(a.date).getTime();
    const bDate = new Date(b.date).getTime();
    return bDate - aDate;
  });
  
  // Računanje broja ažuriranja po statusu za bedževe
  const statusCounts = updates.reduce(
    (acc, update) => {
      acc[update.status] = (acc[update.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  
  // Nalaženje odabranog ažuriranja za modalni dijalog
  const selectedUpdate = updates.find((update) => update.id === selectedUpdateId) || null;
  
  // Funkcija za promenu statusa ažuriranja
  const handleStatusChange = (id: string, status: RegulatoryUpdateStatus) => {
    onUpdateStatusChange(id, status);
  };
  
  // Toggle za status filter
  const toggleStatus = (status: RegulatoryUpdateStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };
  
  // Toggle za severity filter
  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };
  
  // Resetovanje filtera
  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedSeverities([]);
    setSearchQuery("");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              type="search"
              placeholder="Pretraga regulatornih ažuriranja..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filteri</span>
                {(selectedStatuses.length > 0 || selectedSeverities.length > 0) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {selectedStatuses.length + selectedSeverities.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("pending")}
                onCheckedChange={() => toggleStatus("pending")}
              >
                Na čekanju
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("in-progress")}
                onCheckedChange={() => toggleStatus("in-progress")}
              >
                U toku
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("completed")}
                onCheckedChange={() => toggleStatus("completed")}
              >
                Završeno
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("ignored")}
                onCheckedChange={() => toggleStatus("ignored")}
              >
                Ignorisano
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuLabel className="mt-2">Ozbiljnost</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedSeverities.includes("critical")}
                onCheckedChange={() => toggleSeverity("critical")}
              >
                Kritično
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSeverities.includes("important")}
                onCheckedChange={() => toggleSeverity("important")}
              >
                Važno
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSeverities.includes("info")}
                onCheckedChange={() => toggleSeverity("info")}
              >
                Informativno
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs"
                  onClick={resetFilters}
                  disabled={selectedStatuses.length === 0 && selectedSeverities.length === 0}
                >
                  Resetuj filtere
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" variant="default" className="flex gap-1.5">
            <Bell className="h-4 w-4" />
            <span>Prijavi se na obaveštenja</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all" className="relative">
            Sve
            <Badge variant="secondary" className="ml-1.5">
              {updates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Na čekanju
            <Badge variant="secondary" className="ml-1.5">
              {statusCounts["pending"] || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            U toku
            <Badge variant="secondary" className="ml-1.5">
              {statusCounts["in-progress"] || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Završeno
            <Badge variant="secondary" className="ml-1.5">
              {statusCounts["completed"] || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          {sortedUpdates.length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-md">
              <Filter className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-medium">Nema rezultata</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || selectedStatuses.length > 0 || selectedSeverities.length > 0
                  ? "Pokušajte da promenite filtere"
                  : "Trenutno nema regulatornih ažuriranja"}
              </p>
              {(searchQuery || selectedStatuses.length > 0 || selectedSeverities.length > 0) && (
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Resetuj filtere
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedUpdates.map((update) => (
                <RegulatoryUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={handleStatusChange}
                  onViewDetails={(id) => setSelectedUpdateId(id)}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
      
      <RegulatoryUpdateDetailDialog
        update={selectedUpdate}
        open={!!selectedUpdateId}
        onOpenChange={(open) => {
          if (!open) setSelectedUpdateId(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
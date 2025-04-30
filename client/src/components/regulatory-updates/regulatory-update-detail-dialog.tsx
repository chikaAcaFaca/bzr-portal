import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Check, Clock, FileText, XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RegulatoryUpdate, RegulatoryUpdateSeverity, RegulatoryUpdateStatus } from "./regulatory-update-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RegulatoryUpdateDetailDialogProps {
  update: RegulatoryUpdate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: RegulatoryUpdateStatus) => void;
}

export function RegulatoryUpdateDetailDialog({
  update,
  open,
  onOpenChange,
  onStatusChange,
}: RegulatoryUpdateDetailDialogProps) {
  if (!update) return null;
  
  // Funkcije za davanje konteksta ozbiljnosti i statusa ažuriranja
  const getSeverityContext = (severity: RegulatoryUpdateSeverity) => {
    switch (severity) {
      case "critical":
        return {
          color: "bg-red-500",
          text: "text-red-500",
          border: "border-red-500",
          label: "Kritično",
          icon: <AlertTriangle className="h-4 w-4 mr-1" />
        };
      case "important":
        return {
          color: "bg-amber-500",
          text: "text-amber-500",
          border: "border-amber-500",
          label: "Važno",
          icon: <Bell className="h-4 w-4 mr-1" />
        };
      case "info":
      default:
        return {
          color: "bg-blue-500",
          text: "text-blue-500",
          border: "border-blue-500",
          label: "Informativno",
          icon: <FileText className="h-4 w-4 mr-1" />
        };
    }
  };
  
  const getStatusContext = (status: RegulatoryUpdateStatus) => {
    switch (status) {
      case "completed":
        return {
          color: "bg-green-500",
          text: "text-green-500",
          label: "Završeno",
          icon: <Check className="h-4 w-4 mr-1" />
        };
      case "in-progress":
        return {
          color: "bg-blue-500",
          text: "text-blue-500",
          label: "U toku",
          icon: <Clock className="h-4 w-4 mr-1" />
        };
      case "ignored":
        return {
          color: "bg-gray-500",
          text: "text-gray-500",
          label: "Ignorisano",
          icon: <XIcon className="h-4 w-4 mr-1" />
        };
      case "pending":
      default:
        return {
          color: "bg-amber-500",
          text: "text-amber-500",
          label: "Na čekanju",
          icon: <Clock className="h-4 w-4 mr-1" />
        };
    }
  };
  
  const severityContext = getSeverityContext(update.severity);
  const statusContext = getStatusContext(update.status);
  
  // Računamo preostalo vreme do roka
  const deadline = new Date(update.complianceDeadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">{update.title}</DialogTitle>
              <DialogDescription className="mt-1.5">
                Izdato: {new Date(update.date).toLocaleDateString('sr-RS')} • {update.source}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-1 text-xs font-semibold flex items-center",
                  severityContext.text
                )}
              >
                {severityContext.icon}
                {severityContext.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-1 text-xs font-semibold flex items-center",
                  statusContext.text
                )}
              >
                {statusContext.icon}
                {statusContext.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full overflow-hidden flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Pregled</TabsTrigger>
            <TabsTrigger value="affected-documents">Dokumenti ({update.affectedDocuments.length})</TabsTrigger>
            <TabsTrigger value="changes">Potrebne izmene</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 px-1">
            <TabsContent value="overview" className="mt-0 p-1">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Opis izmene propisa</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.description}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Informacije o propisu</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pravna referenca:</span>
                        <span className="font-medium">{update.legalReference}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rok za usklađivanje:</span>
                        <span className="font-medium">{new Date(update.complianceDeadline).toLocaleDateString('sr-RS')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Preostalo vreme:</span>
                        <span className={cn(
                          "font-medium",
                          daysLeft < 7 ? "text-red-500" : daysLeft < 14 ? "text-amber-500" : "text-green-500"
                        )}>
                          {daysLeft > 0 ? `${daysLeft} dana` : "Istekao rok"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Status usklađenosti</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ukupno dokumenata:</span>
                        <span className="font-medium">{update.affectedDocuments.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status ažuriranja:</span>
                        <span className={cn("font-medium", statusContext.text)}>
                          {statusContext.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Koraci za usklađivanje</h3>
                  <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                    <li>Pregledajte sve dokumente navedene u sekciji "Dokumenti"</li>
                    <li>Identifikujte delove koji zahtevaju ažuriranje</li>
                    <li>Primenjte izmene prema uputstvima iz sekcije "Potrebne izmene"</li>
                    <li>Proverite usklađenost finalnih verzija dokumenata sa novim propisima</li>
                    <li>Arhivirajte stare verzije i objavite ažurirane dokumente</li>
                  </ol>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Brzo ažuriranje</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Koristite opciju automatskog ažuriranja da biste brzo uskladili sve dokumente sa novim propisima.
                    AI će analizirati promene propisa i primeniti ih na sve pogođene dokumente.
                  </p>
                  
                  {update.status === "pending" && (
                    <Button>Ažuriraj jednim klikom</Button>
                  )}
                  
                  {update.status === "completed" && (
                    <div className="flex items-center text-green-500 font-medium">
                      <Check className="h-5 w-5 mr-2" />
                      Dokumenti su uspešno ažurirani
                    </div>
                  )}
                  
                  {update.status === "in-progress" && (
                    <div className="flex items-center text-blue-500 font-medium">
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Ažuriranje je u toku...
                    </div>
                  )}
                  
                  {update.status === "ignored" && (
                    <Button 
                      variant="outline"
                      onClick={() => onStatusChange(update.id, "pending")}
                    >
                      Vrati na čekanje
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="affected-documents" className="mt-0 p-1">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dokumenti koji zahtevaju ažuriranje</h3>
                  <div className="space-y-3">
                    {update.affectedDocuments.map(doc => (
                      <div key={doc.id} className="p-3 bg-muted rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">{doc.type}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Pregledaj</Button>
                          {update.status === "pending" && (
                            <Button size="sm">Ažuriraj</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="changes" className="mt-0 p-1">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Potrebne izmene</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">
                    {update.requiredChanges}
                  </p>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Važne napomene</h4>
                    <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                      <li>Svi postojeći dokumenti moraju biti ažurirani do {new Date(update.complianceDeadline).toLocaleDateString('sr-RS')}</li>
                      <li>Novi dokumenti moraju biti u skladu sa novim propisima od trenutka kreiranja</li>
                      <li>Čuvajte prethodne verzije dokumenata u arhivi zbog evidencije</li>
                      <li>Nakon ažuriranja, dokumenti moraju biti potpisani od strane odgovornog lica</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="pt-2">
          {update.status === "pending" && (
            <>
              <Button 
                variant="outline"
                onClick={() => onStatusChange(update.id, "ignored")}
              >
                Ignoriši ovo ažuriranje
              </Button>
              <Button onClick={() => onStatusChange(update.id, "in-progress")}>
                Ažuriraj jednim klikom
              </Button>
            </>
          )}
          
          {update.status === "ignored" && (
            <Button 
              onClick={() => onStatusChange(update.id, "pending")}
            >
              Vrati na čekanje
            </Button>
          )}
          
          {update.status === "completed" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zatvori
            </Button>
          )}
          
          {update.status === "in-progress" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zatvori
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
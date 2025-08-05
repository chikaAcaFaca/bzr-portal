import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RegulatoryUpdatesList } from "@/components/regulatory-updates/regulatory-updates-list";
import { RegulatoryUpdateStatus } from "@/components/regulatory-updates/regulatory-update-card";
import { 
  getRegulatoryUpdates, 
  updateRegulatoryUpdateStatus 
} from "@/services/regulatory-update-service";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Book, Calendar, CalendarCheck, FileText, Loader2 } from "lucide-react";

export default function RegulatoryUpdatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dohvati regulatorna ažuriranja
  const { 
    data: regulatoryUpdates, 
    isLoading,
    isError 
  } = useQuery({
    queryKey: ['/api/regulatory-updates'],
    queryFn: getRegulatoryUpdates
  });
  
  // Mutacija za promenu statusa regulatornog ažuriranja
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: RegulatoryUpdateStatus }) => 
      updateRegulatoryUpdateStatus(id, status),
    onSuccess: () => {
      // Ponovo dohvati regulatorna ažuriranja nakon uspešne promene
      queryClient.invalidateQueries({ queryKey: ['/api/regulatory-updates'] });
      toast({
        title: "Status ažuriran",
        description: "Status regulatornog ažuriranja je uspešno promenjen.",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja statusa. Pokušajte ponovo.",
        variant: "destructive",
      });
    }
  });
  
  // Handler za promenu statusa
  const handleStatusChange = (id: string, status: RegulatoryUpdateStatus) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  // Dohvatanje statistike
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    ignored: 0,
    critical: 0,
    important: 0,
    info: 0,
    upcomingDeadlines: 0
  });
  
  // Ažuriranje statistike kada se promene podaci
  useEffect(() => {
    if (regulatoryUpdates) {
      // Inicijalizujemo brojače
      let pending = 0;
      let inProgress = 0;
      let completed = 0;
      let ignored = 0;
      let critical = 0;
      let important = 0;
      let info = 0;
      let upcomingDeadlines = 0;
      
      // Računamo statistike
      for (const update of regulatoryUpdates) {
        // Brojimo po statusu
        if (update.status === "pending") pending++;
        if (update.status === "in-progress") inProgress++;
        if (update.status === "completed") completed++;
        if (update.status === "ignored") ignored++;
        
        // Brojimo po ozbiljnosti
        if (update.severity === "critical") critical++;
        if (update.severity === "important") important++;
        if (update.severity === "info") info++;
        
        // Brojimo nadolazeće rokove (u narednih 30 dana)
        const deadline = new Date(update.complianceDeadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline > 0 && daysUntilDeadline <= 30 && update.status !== "completed") {
          upcomingDeadlines++;
        }
      }
      
      // Ažuriramo stanje
      setStats({
        pending,
        inProgress,
        completed,
        ignored,
        critical,
        important,
        info,
        upcomingDeadlines
      });
    }
  }, [regulatoryUpdates]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Regulatorna ažuriranja</h1>
        <p className="text-muted-foreground max-w-3xl">
          Pratite najnovije promene propisa u oblasti bezbednosti i zdravlja na radu. 
          Koristite opciju "Ažuriraj jednim klikom" da automatski prilagodite dokumentaciju
          novim zahtevima.
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg p-4 shadow-sm border border-amber-200 dark:border-amber-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Na čekanju</p>
              <h3 className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-300">{stats.pending}</h3>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Regulatorna ažuriranja koja čekaju primenu</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg p-4 shadow-sm border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Kritična</p>
              <h3 className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">{stats.critical}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">Hitna ažuriranja koja zahtevaju pažnju</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 shadow-sm border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">U toku</p>
              <h3 className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-300">{stats.inProgress}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Book className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Ažuriranja koja su trenutno u procesu primene</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg p-4 shadow-sm border border-amber-200 dark:border-amber-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Nadolazeći rokovi</p>
              <h3 className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-300">{stats.upcomingDeadlines}</h3>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Ažuriranja sa rokom u narednih 30 dana</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Učitavanje regulatornih ažuriranja...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="mt-4 text-destructive">Došlo je do greške prilikom dohvatanja regulatornih ažuriranja.</p>
            <button
              className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/regulatory-updates'] })}
            >
              Pokušaj ponovo
            </button>
          </div>
        ) : regulatoryUpdates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Nema novih regulatornih ažuriranja.</p>
          </div>
        ) : (
          <ScrollArea className="p-6">
            <RegulatoryUpdatesList
              updates={regulatoryUpdates || []}
              onUpdateStatusChange={handleStatusChange}
            />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
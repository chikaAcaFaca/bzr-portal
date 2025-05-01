
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getRegulatoryUpdates } from "@/services/regulatory-update-service";
import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function RegulatoryUpdatesWidget() {
  const navigate = useNavigate();
  const { data: updates } = useQuery({
    queryKey: ['/api/regulatory-updates'],
    queryFn: getRegulatoryUpdates
  });

  const criticalUpdates = updates?.filter(u => u.severity === "critical" && u.status === "pending");
  
  if (!criticalUpdates?.length) return null;

  return (
    <Card className="p-4 border-red-200 dark:border-red-900">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Važna regulatorna ažuriranja</h3>
          <p className="text-sm text-muted-foreground">
            Imate {criticalUpdates.length} kritičnih ažuriranja koja čekaju pregled
          </p>
        </div>
        <Button 
          variant="secondary"
          onClick={() => navigate("/regulatory-updates")}
        >
          Pregledaj
        </Button>
      </div>
    </Card>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TrainingForm } from "@/components/forms/training-form";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EmployeeTraining, Employee, TrainingType, Risk, SafetyMeasure } from "@shared/schema";

export default function EmployeeTraining() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<EmployeeTraining | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [trainingToDelete, setTrainingToDelete] = useState<EmployeeTraining | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const { data: trainings, isLoading: isLoadingTrainings } = useQuery({
    queryKey: ['/api/employee-trainings'],
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: trainingTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/training-types'],
  });

  const { data: risks, isLoading: isLoadingRisks } = useQuery({
    queryKey: ['/api/risks'],
  });

  const { data: safetyMeasures, isLoading: isLoadingSafetyMeasures } = useQuery({
    queryKey: ['/api/safety-measures'],
  });

  const { data: jobPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const isLoading = isLoadingTrainings || isLoadingEmployees || isLoadingTypes || 
                   isLoadingRisks || isLoadingSafetyMeasures || isLoadingPositions;

  const handleAddTraining = () => {
    setSelectedTraining(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditTraining = (training: EmployeeTraining) => {
    setSelectedTraining(training);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleViewDetails = (training: EmployeeTraining) => {
    setSelectedTraining(training);
    setOpenDetailsDialog(true);
  };

  const handleDeleteTraining = async () => {
    if (!trainingToDelete) return;

    try {
      await apiRequest("DELETE", `/api/employee-trainings/${trainingToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/employee-trainings'] });
      toast({
        title: "Uspešno brisanje",
        description: `Obuka zaposlenog je uspešno obrisana.`
      });
      setTrainingToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja obuke: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  // Helper functions to get related data
  const getEmployeeName = (employeeId: number) => {
    if (!employees) return "Nepoznato";
    const employee = employees.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Nepoznato";
  };

  const getEmployeeJobPosition = (employeeId: number) => {
    if (!employees || !jobPositions) return "Nepoznato";
    const employee = employees.find((emp: Employee) => emp.id === employeeId);
    if (!employee) return "Nepoznato";
    
    const position = jobPositions.find(pos => pos.id === employee.jobPositionId);
    return position ? position.title : "Nepoznato";
  };

  const getTrainingTypeName = (typeId: number) => {
    if (!trainingTypes) return "Nepoznato";
    const type = trainingTypes.find((t: TrainingType) => t.id === typeId);
    return type ? `${type.code} - ${type.name}` : "Nepoznato";
  };

  const getRiskNames = (riskIds: number[]) => {
    if (!risks || !riskIds) return [];
    return risks
      .filter((risk: Risk) => riskIds.includes(risk.id))
      .map((risk: Risk) => risk.description);
  };

  const getSafetyMeasureNames = (measureIds: number[]) => {
    if (!safetyMeasures || !measureIds) return [];
    return safetyMeasures
      .filter((measure: SafetyMeasure) => measureIds.includes(measure.id))
      .map((measure: SafetyMeasure) => measure.title);
  };

  const columns = [
    {
      header: "Zaposleni",
      accessorKey: "employeeId",
      cell: (item: EmployeeTraining) => getEmployeeName(item.employeeId),
    },
    {
      header: "Radno mesto",
      cell: (item: EmployeeTraining) => getEmployeeJobPosition(item.employeeId),
    },
    {
      header: "Tip obuke",
      accessorKey: "trainingTypeId",
      cell: (item: EmployeeTraining) => getTrainingTypeName(item.trainingTypeId),
    },
    {
      header: "Datum obuke",
      accessorKey: "trainingDate",
      cell: (item: EmployeeTraining) => formatDate(item.trainingDate),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: EmployeeTraining) => {
        const statusColors = getStatusColor(item.status);
        return (
          <Badge className={`${statusColors.bgColor} ${statusColors.textColor}`}>
            {item.status}
          </Badge>
        );
      },
    },
    {
      header: "Rizici",
      cell: (item: EmployeeTraining) => (
        <div>{item.trainedRisks?.length || 0} rizika</div>
      ),
    },
    {
      header: "Akcije",
      cell: (item: EmployeeTraining) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(item);
            }}
          >
            Detalji
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTraining(item);
            }}
          >
            Izmeni
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrainingToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati obuku zaposlenog: <strong>{getEmployeeName(trainingToDelete?.employeeId || 0)}</strong>. 
                  Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTrainingToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTraining}>Obriši</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Obuke zaposlenih"
        description="Upravljanje obukama i osposobljavanjem zaposlenih za bezbedan i zdrav rad"
      />

      <div className="mb-6">
        <Button onClick={handleAddTraining} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj novu obuku</span>
        </Button>
      </div>

      <DataTable
        data={trainings}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleViewDetails}
        searchPlaceholder="Pretraži obuke..."
        emptyMessage="Nema definisanih obuka zaposlenih"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Dodaj novu obuku" : "Izmeni obuku"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TrainingForm
              defaultValues={selectedTraining || undefined}
              isEditMode={sheetMode === "edit"}
              onSuccess={() => setOpenSheet(false)}
              onCancel={() => setOpenSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalji obuke zaposlenog</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Zaposleni</h3>
                <p className="mt-1 font-medium">{selectedTraining && getEmployeeName(selectedTraining.employeeId)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Radno mesto</h3>
                <p className="mt-1">{selectedTraining && getEmployeeJobPosition(selectedTraining.employeeId)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tip obuke</h3>
                <p className="mt-1">{selectedTraining && getTrainingTypeName(selectedTraining.trainingTypeId)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  {selectedTraining && (
                    <Badge className={`${getStatusColor(selectedTraining.status).bgColor} ${getStatusColor(selectedTraining.status).textColor}`}>
                      {selectedTraining.status}
                    </Badge>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Datum obuke</h3>
                <p className="mt-1">{selectedTraining && formatDate(selectedTraining.trainingDate)}</p>
              </div>
              
              {selectedTraining?.completedDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Datum završetka</h3>
                  <p className="mt-1">{formatDate(selectedTraining.completedDate)}</p>
                </div>
              )}
            </div>
            
            {selectedTraining?.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Napomene</h3>
                <p className="mt-1 bg-gray-50 p-3 rounded-md">{selectedTraining.notes}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Obuhvaćeni rizici</h3>
              {selectedTraining?.trainedRisks && selectedTraining.trainedRisks.length > 0 ? (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {getRiskNames(selectedTraining.trainedRisks).map((riskName, index) => (
                    <li key={index}>{riskName}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">Nema definisanih rizika u obuci</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Mere zaštite</h3>
              {selectedTraining?.safetyMeasures && selectedTraining.safetyMeasures.length > 0 ? (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {getSafetyMeasureNames(selectedTraining.safetyMeasures).map((measureName, index) => (
                    <li key={index}>{measureName}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">Nema definisanih mera zaštite u obuci</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => {
              setOpenDetailsDialog(false);
              handleEditTraining(selectedTraining!);
            }}>
              Izmeni
            </Button>
            <Button onClick={() => setOpenDetailsDialog(false)}>Zatvori</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

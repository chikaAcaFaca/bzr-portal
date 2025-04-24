import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SafetyMeasureForm } from "@/components/forms/safety-measure-form";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SafetyMeasure, RiskCategory } from "@shared/schema";

export default function SafetyMeasures() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedMeasure, setSelectedMeasure] = useState<SafetyMeasure | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [measureToDelete, setMeasureToDelete] = useState<SafetyMeasure | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const { data: safetyMeasures, isLoading: isLoadingMeasures } = useQuery({
    queryKey: ['/api/safety-measures'],
  });

  const { data: riskCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/risk-categories'],
  });

  const isLoading = isLoadingMeasures || isLoadingCategories;

  const handleAddMeasure = () => {
    setSelectedMeasure(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditMeasure = (measure: SafetyMeasure) => {
    setSelectedMeasure(measure);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleViewDetails = (measure: SafetyMeasure) => {
    setSelectedMeasure(measure);
    setOpenDetailsDialog(true);
  };

  const handleDeleteMeasure = async () => {
    if (!measureToDelete) return;

    try {
      await apiRequest("DELETE", `/api/safety-measures/${measureToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/safety-measures'] });
      toast({
        title: "Uspešno brisanje",
        description: `Mera zaštite "${measureToDelete.title}" je uspešno obrisana.`
      });
      setMeasureToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja mere zaštite: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  // Get risk category names by IDs
  const getCategoryNames = (categoryIds: number[]) => {
    if (!riskCategories || !categoryIds) return "Nije dodeljeno";
    const categories = riskCategories.filter(cat => categoryIds.includes(cat.id));
    if (categories.length === 0) return "Nije dodeljeno";
    if (categories.length === 1) return categories[0].name;
    return `${categories[0].name} i još ${categories.length - 1}`;
  };

  const columns = [
    {
      header: "Naziv mere",
      accessorKey: "title",
    },
    {
      header: "Opis",
      accessorKey: "description",
      cell: (item: SafetyMeasure) => (
        <div className="max-w-xs truncate">{item.description}</div>
      ),
    },
    {
      header: "Kategorije rizika",
      accessorKey: "applicableRiskCategories",
      cell: (item: SafetyMeasure) => (
        <div className="max-w-xs truncate">
          {getCategoryNames(item.applicableRiskCategories)}
        </div>
      ),
    },
    {
      header: "Potrebna oprema",
      accessorKey: "requiredEquipment",
      cell: (item: SafetyMeasure) => (
        <div>{item.requiredEquipment?.length || 0} stavki</div>
      ),
    },
    {
      header: "Akcije",
      cell: (item: SafetyMeasure) => (
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
              handleEditMeasure(item);
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
                  setMeasureToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati meru zaštite: <strong>{measureToDelete?.title}</strong>. 
                  Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMeasureToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMeasure}>Obriši</AlertDialogAction>
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
        title="Mere zaštite"
        description="Definisanje i upravljanje merama zaštite na radu"
      />

      <div className="mb-6">
        <Button onClick={handleAddMeasure} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj novu meru zaštite</span>
        </Button>
      </div>

      <DataTable
        data={safetyMeasures}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleViewDetails}
        searchPlaceholder="Pretraži mere zaštite..."
        emptyMessage="Nema definisanih mera zaštite"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Dodaj novu meru zaštite" : "Izmeni meru zaštite"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SafetyMeasureForm
              defaultValues={selectedMeasure || undefined}
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
            <DialogTitle>{selectedMeasure?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Opis mere zaštite</h3>
              <p className="mt-1">{selectedMeasure?.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Detaljna uputstva</h3>
              <div className="mt-1 bg-gray-50 p-3 rounded-md">
                <p className="whitespace-pre-line">{selectedMeasure?.instructions}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Potrebna oprema/sredstva</h3>
              {selectedMeasure?.requiredEquipment && selectedMeasure.requiredEquipment.length > 0 ? (
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {selectedMeasure.requiredEquipment.map((equipment, index) => (
                    <li key={index}>{equipment}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">Nije definisana potrebna oprema</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Primenjive kategorije rizika</h3>
              {selectedMeasure?.applicableRiskCategories && selectedMeasure.applicableRiskCategories.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedMeasure.applicableRiskCategories.map((categoryId) => {
                    const category = riskCategories?.find((cat: RiskCategory) => cat.id === categoryId);
                    return category ? (
                      <div key={categoryId} className="bg-blue-50 p-2 rounded">
                        <span className="font-medium">{category.name}</span> - {category.description}
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="mt-1 text-gray-400">Nije dodeljena kategorija rizika</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setOpenDetailsDialog(false)}>Zatvori</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { JobDescriptionForm } from "@/components/forms/job-description-form";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { JobDescription } from "@shared/schema";

export default function JobDescriptions() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<JobDescription | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [descriptionToDelete, setDescriptionToDelete] = useState<JobDescription | null>(null);

  const { data: descriptions, isLoading: isLoadingDescriptions } = useQuery({
    queryKey: ['/api/job-descriptions'],
  });

  const { data: positions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const isLoading = isLoadingDescriptions || isLoadingPositions;

  const handleAddDescription = () => {
    setSelectedDescription(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditDescription = (description: JobDescription) => {
    setSelectedDescription(description);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleDeleteDescription = async () => {
    if (!descriptionToDelete) return;

    try {
      await apiRequest("DELETE", `/api/job-descriptions/${descriptionToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions'] });
      toast({
        title: "Uspešno brisanje",
        description: `Opis posla je uspešno obrisan.`
      });
      setDescriptionToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja opisa posla: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  // Get job position title by ID
  const getPositionTitle = (positionId: number) => {
    if (!positions) return "Nepoznato";
    const position = positions.find(pos => pos.id === positionId);
    return position ? position.title : "Nepoznato";
  };

  const columns = [
    {
      header: "Radno mesto",
      accessorKey: "jobPositionId",
      cell: (item: JobDescription) => getPositionTitle(item.jobPositionId),
    },
    {
      header: "Opis",
      accessorKey: "description",
      cell: (item: JobDescription) => (
        <div className="max-w-xs truncate">{item.description}</div>
      ),
    },
    {
      header: "Dužnosti",
      accessorKey: "duties",
      cell: (item: JobDescription) => (
        <div>{item.duties?.length || 0} stavki</div>
      ),
    },
    {
      header: "Poslednje ažuriranje",
      accessorKey: "updatedAt",
      cell: (item: JobDescription) => formatDate(item.updatedAt),
    },
    {
      header: "Akcije",
      cell: (item: JobDescription) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditDescription(item);
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
                  setDescriptionToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati opis posla za radno mesto: <strong>{getPositionTitle(descriptionToDelete?.jobPositionId || 0)}</strong>. 
                  Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDescriptionToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDescription}>Obriši</AlertDialogAction>
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
        title="Opisi poslova"
        description="Detaljan opis i dužnosti za svako radno mesto"
      />

      <div className="mb-6">
        <Button onClick={handleAddDescription} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj opis posla</span>
        </Button>
      </div>

      <DataTable
        data={descriptions}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleEditDescription}
        searchPlaceholder="Pretraži opise poslova..."
        emptyMessage="Nema definisanih opisa poslova"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Dodaj novi opis posla" : "Izmeni opis posla"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <JobDescriptionForm
              defaultValues={selectedDescription || undefined}
              isEditMode={sheetMode === "edit"}
              onSuccess={() => setOpenSheet(false)}
              onCancel={() => setOpenSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

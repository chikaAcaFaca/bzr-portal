import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { JobPositionForm } from "@/components/forms/job-position-form";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JobPosition } from "@shared/schema";

export default function JobPositions() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [positionToDelete, setPositionToDelete] = useState<JobPosition | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const handleAddPosition = () => {
    setSelectedPosition(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditPosition = (position: JobPosition) => {
    setSelectedPosition(position);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleDeletePosition = async () => {
    if (!positionToDelete) return;

    try {
      await apiRequest("DELETE", `/api/job-positions/${positionToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/job-positions'] });
      toast({
        title: "Uspešno brisanje",
        description: `Radno mesto "${positionToDelete.title}" je uspešno obrisano.`
      });
      setPositionToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja radnog mesta: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      header: "Naziv radnog mesta",
      accessorKey: "title",
    },
    {
      header: "Odeljenje",
      accessorKey: "department",
    },
    {
      header: "Opis",
      accessorKey: "description",
      cell: (item: JobPosition) => (
        <div className="max-w-xs truncate">{item.description || "-"}</div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (item: JobPosition) => (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Aktivno" : "Neaktivno"}
        </Badge>
      ),
    },
    {
      header: "Akcije",
      cell: (item: JobPosition) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditPosition(item);
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
                  setPositionToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati radno mesto: <strong>{positionToDelete?.title}</strong>. 
                  Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPositionToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePosition}>Obriši</AlertDialogAction>
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
        title="Sistematizacija radnih mesta"
        description="Upravljanje radnim mestima bez imena zaposlenih"
      />

      <div className="mb-6">
        <Button onClick={handleAddPosition} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj radno mesto</span>
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleEditPosition}
        searchPlaceholder="Pretraži radna mesta..."
        emptyMessage="Nema definisanih radnih mesta"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Dodaj novo radno mesto" : "Izmeni radno mesto"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <JobPositionForm
              defaultValues={selectedPosition || undefined}
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

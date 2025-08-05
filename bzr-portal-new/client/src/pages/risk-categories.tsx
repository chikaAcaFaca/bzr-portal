import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RiskCategoryForm } from "@/components/forms/risk-category-form";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RiskForm } from "@/components/forms/risk-form";
import type { RiskCategory, Risk } from "@shared/schema";

export default function RiskCategories() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [categoryToDelete, setCategoryToDelete] = useState<RiskCategory | null>(null);
  const [openRiskDialog, setOpenRiskDialog] = useState(false);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<RiskCategory | null>(null);

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/risk-categories'],
  });

  const { data: risks, isLoading: isLoadingRisks } = useQuery({
    queryKey: ['/api/risks'],
  });

  const { data: jobPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const isLoading = isLoadingCategories || isLoadingRisks || isLoadingPositions;

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditCategory = (category: RiskCategory) => {
    setSelectedCategory(category);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await apiRequest("DELETE", `/api/risk-categories/${categoryToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/risk-categories'] });
      toast({
        title: "Uspešno brisanje",
        description: `Kategorija rizika "${categoryToDelete.name}" je uspešno obrisana.`
      });
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja kategorije rizika: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  const handleAddRisk = (category: RiskCategory) => {
    setSelectedRiskCategory(category);
    setOpenRiskDialog(true);
  };

  // Get count of risks for a category
  const getRiskCount = (categoryId: number) => {
    if (!risks) return 0;
    return risks.filter((risk: Risk) => risk.categoryId === categoryId).length;
  };

  // Get job position titles by IDs
  const getPositionTitles = (positionIds: number[]) => {
    if (!jobPositions || !positionIds) return "Nije dodeljeno";
    const positions = jobPositions.filter(pos => positionIds.includes(pos.id));
    if (positions.length === 0) return "Nije dodeljeno";
    if (positions.length === 1) return positions[0].title;
    return `${positions[0].title} i još ${positions.length - 1}`;
  };

  const getSeverityBadge = (severity: string) => {
    const colorMap: Record<string, string> = {
      "Niska": "bg-green-100 text-green-800",
      "Srednja": "bg-yellow-100 text-yellow-800",
      "Visoka": "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colorMap[severity] || "bg-gray-100 text-gray-800"}>
        {severity}
      </Badge>
    );
  };

  const getLikelihoodBadge = (likelihood: string) => {
    const colorMap: Record<string, string> = {
      "Malo verovatna": "bg-blue-100 text-blue-800",
      "Moguća": "bg-purple-100 text-purple-800", 
      "Verovatna": "bg-orange-100 text-orange-800"
    };

    return (
      <Badge className={colorMap[likelihood] || "bg-gray-100 text-gray-800"}>
        {likelihood}
      </Badge>
    );
  };

  const columns = [
    {
      header: "Naziv kategorije",
      accessorKey: "name",
    },
    {
      header: "Opis",
      accessorKey: "description",
      cell: (item: RiskCategory) => (
        <div className="max-w-xs truncate">{item.description || "-"}</div>
      ),
    },
    {
      header: "Težina",
      accessorKey: "severity",
      cell: (item: RiskCategory) => getSeverityBadge(item.severity),
    },
    {
      header: "Verovatnoća",
      accessorKey: "likelihood",
      cell: (item: RiskCategory) => getLikelihoodBadge(item.likelihood),
    },
    {
      header: "Radna mesta",
      accessorKey: "jobPositions",
      cell: (item: RiskCategory) => (
        <div className="max-w-xs truncate">
          {getPositionTitles(item.jobPositions)}
        </div>
      ),
    },
    {
      header: "Broj rizika",
      cell: (item: RiskCategory) => (
        <div>{getRiskCount(item.id)}</div>
      ),
    },
    {
      header: "Akcije",
      cell: (item: RiskCategory) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddRisk(item);
            }}
          >
            Dodaj rizik
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCategory(item);
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
                  setCategoryToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati kategoriju rizika: <strong>{categoryToDelete?.name}</strong>. 
                  Svi povezani rizici će takođe biti obrisani. Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCategory}>Obriši</AlertDialogAction>
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
        title="Kategorije rizika"
        description="Upravljanje kategorijama rizika i pojedinačnim rizicima"
      />

      <div className="mb-6">
        <Button onClick={handleAddCategory} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj kategoriju rizika</span>
        </Button>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleEditCategory}
        searchPlaceholder="Pretraži kategorije rizika..."
        emptyMessage="Nema definisanih kategorija rizika"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Dodaj novu kategoriju rizika" : "Izmeni kategoriju rizika"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <RiskCategoryForm
              defaultValues={selectedCategory || undefined}
              isEditMode={sheetMode === "edit"}
              onSuccess={() => setOpenSheet(false)}
              onCancel={() => setOpenSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={openRiskDialog} onOpenChange={setOpenRiskDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dodaj novi rizik</DialogTitle>
          </DialogHeader>
          <RiskForm
            defaultValues={{ categoryId: selectedRiskCategory?.id }}
            onSuccess={() => setOpenRiskDialog(false)}
            onCancel={() => setOpenRiskDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

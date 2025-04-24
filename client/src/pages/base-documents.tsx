import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/data-table";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/components/forms/document-upload-form";
import { PlusCircle, FileText, Download } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatFileSize, getFileIconClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { BaseDocument } from "@shared/schema";

export default function BaseDocuments() {
  const { toast } = useToast();
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BaseDocument | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [documentToDelete, setDocumentToDelete] = useState<BaseDocument | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  const handleEditDocument = (document: BaseDocument) => {
    setSelectedDocument(document);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      await apiRequest("DELETE", `/api/documents/${documentToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Uspešno brisanje",
        description: `Dokument "${documentToDelete.title}" je uspešno obrisan.`
      });
      setDocumentToDelete(null);
    } catch (error) {
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom brisanja dokumenta: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        variant: "destructive"
      });
    }
  };

  const handleDownload = (document: BaseDocument) => {
    // In a real application, this would download the actual file
    // Here we'll just show a toast notification
    toast({
      title: "Preuzimanje dokumenta",
      description: `Preuzimanje dokumenta "${document.title}" je započeto.`
    });
  };

  const columns = [
    {
      header: "Naziv dokumenta",
      accessorKey: "title",
      cell: (item: BaseDocument) => (
        <div className="flex items-center gap-2">
          <i className={`${getFileIconClass(item.fileType)} text-lg`}></i>
          <span>{item.title}</span>
        </div>
      ),
    },
    {
      header: "Kategorija",
      accessorKey: "category",
      cell: (item: BaseDocument) => (
        <Badge variant="outline">{item.category}</Badge>
      ),
    },
    {
      header: "Opis",
      accessorKey: "description",
      cell: (item: BaseDocument) => (
        <div className="max-w-xs truncate">{item.description || "-"}</div>
      ),
    },
    {
      header: "Veličina",
      accessorKey: "fileSize",
      cell: (item: BaseDocument) => formatFileSize(item.fileSize),
    },
    {
      header: "Datum otpremanja",
      accessorKey: "uploadDate",
      cell: (item: BaseDocument) => formatDate(item.uploadDate),
    },
    {
      header: "Akcije",
      cell: (item: BaseDocument) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(item);
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Preuzmi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditDocument(item);
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
                  setDocumentToDelete(item);
                }}
              >
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija će trajno obrisati dokument: <strong>{documentToDelete?.title}</strong>. 
                  Ova akcija se ne može poništiti.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDocument}>Obriši</AlertDialogAction>
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
        title="Bazna dokumenta"
        description="Otpremanje i upravljanje dokumentima"
      />

      <div className="mb-6">
        <Button onClick={handleAddDocument} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Otpremi dokument</span>
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleEditDocument}
        searchPlaceholder="Pretraži dokumente..."
        emptyMessage="Nema otpremljenih dokumenata"
      />

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Otpremi novi dokument" : "Izmeni podatke o dokumentu"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <DocumentUploadForm
              defaultValues={selectedDocument || undefined}
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

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Edit, Trash, ExternalLink, Check, X, Download, Link2, Upload } from "lucide-react";

import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type KnowledgeReference = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type KnowledgeReferenceFormData = {
  title: string;
  url: string;
  description: string;
  category: string;
  isActive: boolean;
};

const initialFormData: KnowledgeReferenceFormData = {
  title: "",
  url: "",
  description: "",
  category: "general",
  isActive: true,
};

// Validaciona šema za reference znanja
const formSchema = z.object({
  title: z.string().min(3, { message: "Naslov mora imati najmanje 3 karaktera" }),
  url: z.string().url({ message: "URL mora biti validna web adresa" }),
  description: z.string().optional(),
  category: z.string(),
  isActive: z.boolean().default(true),
});

// Komponenta forme za unos/izmenu reference znanja
function KnowledgeReferenceForm({ 
  onSave, 
  initialData = initialFormData,
  onCancel
}: { 
  onSave: (data: KnowledgeReferenceFormData) => void;
  initialData?: KnowledgeReferenceFormData;
  onCancel: () => void;
}) {
  const form = useForm<KnowledgeReferenceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const onSubmit = (data: KnowledgeReferenceFormData) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naslov</FormLabel>
              <FormControl>
                <Input placeholder="Unesite naslov reference" {...field} />
              </FormControl>
              <FormDescription>
                Naslov reference koji jasno opisuje sadržaj
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/dokument" {...field} />
              </FormControl>
              <FormDescription>
                Unesite validnu URL adresu ka resursu
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Kratak opis sadržaja reference" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Opis sadržaja i relevantnosti ovog izvora informacija
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorija</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite kategoriju" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">Opšte informacije</SelectItem>
                  <SelectItem value="law">Zakoni</SelectItem>
                  <SelectItem value="regulation">Pravilnici</SelectItem>
                  <SelectItem value="guideline">Uputstva</SelectItem>
                  <SelectItem value="standard">Standardi</SelectItem>
                  <SelectItem value="research">Istraživanja</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Odaberite kategoriju kojoj referenca pripada
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aktivno</FormLabel>
                <FormDescription>
                  Aktivne reference koristi AI asistent u svojim odgovorima
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Otkaži
          </Button>
          <Button type="submit">Sačuvaj</Button>
        </div>
      </form>
    </Form>
  );
}

// Glavna komponenta stranice za reference znanja
export default function KnowledgeReferences() {
  const [openSheet, setOpenSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedReference, setSelectedReference] = useState<KnowledgeReference | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Učitavanje referenci znanja
  const { data: references = [], isLoading } = useQuery({
    queryKey: ['/api/knowledge-references'],
    select: (data: KnowledgeReference[]) => data,
  });

  // Sanitizacija opisa - uklanjanje HTML/XML tagova
  const sanitizeDescription = (description: string): string => {
    // Uklanja DOCTYPE deklaracije i druge HTML/XML tagove
    return description
      .replace(/<!DOCTYPE[^>]*>/i, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Kreiranje nove reference
  const createMutation = useMutation({
    mutationFn: (data: KnowledgeReferenceFormData) => {
      // Sanitizacija opisa pre slanja
      const sanitizedData = {
        ...data,
        description: data.description ? sanitizeDescription(data.description) : data.description
      };
      console.log("Sending data:", sanitizedData);
      return apiRequest('/api/knowledge-references', {
        method: 'POST',
        body: sanitizedData as any
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-references'] });
      setOpenSheet(false);
      toast({
        title: "Referenca znanja je kreirana",
        description: "Nova referenca znanja je uspešno dodata.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri kreiranju: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Ažuriranje postojeće reference
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; reference: KnowledgeReferenceFormData }) => {
      // Sanitizacija opisa pre slanja
      const sanitizedData = {
        ...data.reference,
        description: data.reference.description ? sanitizeDescription(data.reference.description) : data.reference.description
      };
      console.log("Updating data:", sanitizedData);
      return apiRequest(`/api/knowledge-references/${data.id}`, {
        method: 'PUT',
        body: sanitizedData as any
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-references'] });
      setOpenSheet(false);
      toast({
        title: "Referenca znanja je ažurirana",
        description: "Referenca znanja je uspešno ažurirana.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri ažuriranju: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Brisanje reference
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/knowledge-references/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-references'] });
      setDeleteDialogOpen(false);
      toast({
        title: "Referenca znanja je obrisana",
        description: "Referenca znanja je uspešno obrisana.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri brisanju: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Rukovanje dodavanjem nove reference
  const handleCreateReference = (data: KnowledgeReferenceFormData) => {
    createMutation.mutate(data);
  };

  // Rukovanje ažuriranjem reference
  const handleUpdateReference = (data: KnowledgeReferenceFormData) => {
    if (selectedReference) {
      updateMutation.mutate({
        id: selectedReference.id,
        reference: data
      });
    }
  };

  // Otvaranje forme za dodavanje nove reference
  const handleAddReference = () => {
    setSelectedReference(null);
    setSheetMode("create");
    setOpenSheet(true);
  };

  // Otvaranje forme za izmenu reference
  const handleEditClick = (reference: KnowledgeReference) => {
    setSelectedReference(reference);
    setSheetMode("edit");
    setOpenSheet(true);
  };

  // Otvaranje dijaloga za potvrdu brisanja
  const handleDeleteClick = (reference: KnowledgeReference) => {
    setSelectedReference(reference);
    setDeleteDialogOpen(true);
  };

  // Kategorije referenci
  const categoryLabels: Record<string, string> = {
    'general': 'Opšte informacije',
    'law': 'Zakoni',
    'regulation': 'Pravilnici',
    'guideline': 'Uputstva',
    'standard': 'Standardi',
    'research': 'Istraživanja'
  };
  
  // Dobijanje boje za bedž kategorije
  const getCategoryBadgeVariant = (category: string) => {
    switch(category) {
      case 'law': return 'destructive';
      case 'regulation': return 'yellow';
      case 'guideline': return 'blue';
      case 'standard': return 'green';
      case 'research': return 'purple';
      default: return 'default';
    }
  };

  // Definicija kolona tabele
  const columns = [
    {
      header: "Naslov",
      accessorKey: "title" as keyof KnowledgeReference,
      cell: (item: KnowledgeReference) => {
        return (
          <div className="flex flex-col">
            <div className="font-medium">{item.title}</div>
            {item.description && (
              <div className="text-muted-foreground text-sm line-clamp-1">
                {item.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Kategorija",
      accessorKey: "category" as keyof KnowledgeReference,
      cell: (item: KnowledgeReference) => {
        const category = item.category;
        return (
          <Badge variant={getCategoryBadgeVariant(category) as any}>
            {categoryLabels[category] || category}
          </Badge>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive" as keyof KnowledgeReference,
      cell: (item: KnowledgeReference) => {
        const isActive = item.isActive;
        return (
          <div className="flex items-center">
            {isActive ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Aktivno</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1">
                <X className="h-3 w-3" />
                <span>Neaktivno</span>
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Link",
      accessorKey: "url" as keyof KnowledgeReference,
      cell: (item: KnowledgeReference) => {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Otvori link</span>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Otvori u novom prozoru</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      header: "Akcije",
      accessorKey: "id" as keyof KnowledgeReference,
      cell: (item: KnowledgeReference) => {
        return (
          <div className="flex space-x-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditClick(item)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Izmeni</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteClick(item)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Obriši</span>
            </Button>
          </div>
        );
      },
    },
  ];

  // Stanje za dijalog za masovni uvoz
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [bulkImportUrl, setBulkImportUrl] = useState("");
  const [bulkImportCategory, setBulkImportCategory] = useState("regulation");
  const [isImporting, setIsImporting] = useState(false);
  const [foundFiles, setFoundFiles] = useState<{title: string, url: string}[]>([]);

  // Funkcija za preuzimanje svih PDF-ova sa stranice
  const handleBulkImport = async () => {
    if (!bulkImportUrl) {
      toast({
        title: "Greška",
        description: "URL je obavezan",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      // Slanje zahteva na server za preuzimanje svih PDF-ova sa navedenog URL-a
      const response = await apiRequest('/api/scrape-pdfs', {
        method: 'POST',
        body: JSON.stringify({ url: bulkImportUrl }) as any
      });
      
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        setFoundFiles(data.files);
        toast({
          title: "Uspešno",
          description: `Pronađeno ${data.files.length} PDF dokumenata`,
        });
      } else {
        toast({
          title: "Informacija",
          description: "Nisu pronađeni PDF dokumenti na navedenoj stranici",
        });
      }
    } catch (error: any) {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri uvozu: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Funkcija za dodavanje svih pronađenih dokumenata u bazu znanja
  const handleAddAllDocuments = async () => {
    if (foundFiles.length === 0) return;
    
    setIsImporting(true);
    
    try {
      // Dodaj svaki pronađeni dokument u bazu znanja
      for (const file of foundFiles) {
        await createMutation.mutateAsync({
          title: file.title,
          url: file.url,
          description: `PDF dokument: ${file.title}`,
          category: bulkImportCategory,
          isActive: true
        });
      }
      
      toast({
        title: "Uspešno",
        description: `Dodato ${foundFiles.length} dokumenata u bazu znanja`,
      });
      
      setBulkImportDialogOpen(false);
      setFoundFiles([]);
      setBulkImportUrl("");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri dodavanju dokumenata: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reference znanja"
        description="Upravljanje bazom znanja za AI asistenta"
      />

      <div className="mb-6 flex gap-2">
        <Button onClick={handleAddReference} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj novu referencu</span>
        </Button>
        
        <Button 
          onClick={() => setBulkImportDialogOpen(true)} 
          variant="outline" 
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          <span>Masovni uvoz PDF dokumenata</span>
        </Button>
      </div>

      {/* Definišemo DataTable za KnowledgeReference tipizaciju */}
      <DataTable
        data={references}
        columns={columns as any}
        isLoading={isLoading}
        searchPlaceholder="Pretraži reference znanja..."
        emptyMessage="Nema definisanih referenci znanja"
      />

      {/* Forma za dodavanje/izmenu reference */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "create" ? "Dodaj novu referencu znanja" : "Izmeni referencu znanja"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <KnowledgeReferenceForm
              initialData={selectedReference ? {
                title: selectedReference.title,
                url: selectedReference.url,
                description: selectedReference.description || "",
                category: selectedReference.category,
                isActive: selectedReference.isActive,
              } : initialFormData}
              onSave={sheetMode === "create" ? handleCreateReference : handleUpdateReference}
              onCancel={() => setOpenSheet(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Dijalog za potvrdu brisanja */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrda brisanja</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete referencu znanja "{selectedReference?.title}"?
              Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Otkaži
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReference && deleteMutation.mutate(selectedReference.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Brisanje..." : "Obriši"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dijalog za masovni uvoz PDF dokumenata */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Masovni uvoz PDF dokumenata</DialogTitle>
            <DialogDescription>
              Unesite URL stranice sa koje želite da preuzmete PDF dokumente u bazu znanja.
              Svi PDF dokumenti sa te stranice biće dodati u bazu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="import-url" className="text-sm font-medium">
                URL stranice sa PDF dokumentima
              </label>
              <Input
                id="import-url"
                placeholder="https://example.com/page-with-pdfs"
                value={bulkImportUrl}
                onChange={(e) => setBulkImportUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Npr. stranica sa listom propisa i pravilnika
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="import-category" className="text-sm font-medium">
                Kategorija
              </label>
              <Select
                value={bulkImportCategory}
                onValueChange={setBulkImportCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Izaberite kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Opšte informacije</SelectItem>
                  <SelectItem value="law">Zakoni</SelectItem>
                  <SelectItem value="regulation">Pravilnici</SelectItem>
                  <SelectItem value="guideline">Uputstva</SelectItem>
                  <SelectItem value="standard">Standardi</SelectItem>
                  <SelectItem value="research">Istraživanja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {foundFiles.length > 0 && (
              <div className="space-y-2 border rounded-md p-3">
                <h4 className="font-medium">Pronađeni dokumenti ({foundFiles.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {foundFiles.map((file, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <span className="truncate">{file.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex flex-col sm:flex-row">
            {foundFiles.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFoundFiles([]);
                    setBulkImportUrl("");
                  }}
                >
                  Resetuj
                </Button>
                <Button
                  onClick={handleAddAllDocuments}
                  disabled={isImporting}
                  className="gap-1"
                >
                  {isImporting ? (
                    "Dodavanje dokumenata..."
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Dodaj sve u bazu znanja</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setBulkImportDialogOpen(false)}
                >
                  Otkaži
                </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={isImporting || !bulkImportUrl}
                  className="gap-1"
                >
                  {isImporting ? (
                    "Pretraživanje..."
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      <span>Pronađi PDF dokumente</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
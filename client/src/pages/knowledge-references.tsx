import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BookOpen, Link as LinkIcon, Trash2, Edit, ExternalLink } from "lucide-react";

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

const KnowledgeReferenceDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData = initialFormData,
  isEditing = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: KnowledgeReferenceFormData) => void;
  initialData?: KnowledgeReferenceFormData;
  isEditing?: boolean;
}) => {
  const [formData, setFormData] = useState<KnowledgeReferenceFormData>(initialData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Izmena reference" : "Nova referenca znanja"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Naslov</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Unesite naslov reference"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/document"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Kratak opis sadržaja reference"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorija</Label>
              <Select name="category" value={formData.category} onValueChange={handleSelectChange} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Izaberite kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Opšte informacije</SelectItem>
                  <SelectItem value="law">Zakon</SelectItem>
                  <SelectItem value="regulation">Pravilnik</SelectItem>
                  <SelectItem value="guideline">Uputstvo</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="research">Istraživanje</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isActive">Aktivna</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{isEditing ? "Sačuvaj izmene" : "Dodaj referencu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function KnowledgeReferences() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<KnowledgeReferenceFormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: references, isLoading } = useQuery({
    queryKey: ["/api/knowledge-references", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/knowledge-references" 
        : `/api/knowledge-references?category=${selectedCategory}`;
      return apiRequest<KnowledgeReference[]>(url);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: KnowledgeReferenceFormData) => {
      return apiRequest("/api/knowledge-references", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-references"] });
      toast({
        title: "Uspešno",
        description: "Referenca je uspešno dodata!",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom dodavanja reference",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; reference: KnowledgeReferenceFormData }) => {
      return apiRequest(`/api/knowledge-references/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.reference),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-references"] });
      toast({
        title: "Uspešno",
        description: "Referenca je uspešno ažurirana!",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja reference",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/knowledge-references/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-references"] });
      toast({
        title: "Uspešno",
        description: "Referenca je uspešno obrisana!",
      });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja reference",
        variant: "destructive",
      });
    },
  });

  const handleCreateReference = (data: KnowledgeReferenceFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdateReference = (data: KnowledgeReferenceFormData) => {
    if (editingReference && 'id' in editingReference) {
      updateMutation.mutate({
        id: (editingReference as any).id,
        reference: data,
      });
    }
  };

  const handleDeleteReference = (id: number) => {
    if (confirm("Da li ste sigurni da želite da obrišete ovu referencu?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (reference: KnowledgeReference) => {
    setEditingReference({
      title: reference.title,
      url: reference.url,
      description: reference.description || "",
      category: reference.category,
      isActive: reference.isActive,
    });
    setEditDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "general": return "Opšte informacije";
      case "law": return "Zakon";
      case "regulation": return "Pravilnik";
      case "guideline": return "Uputstvo";
      case "standard": return "Standard";
      case "research": return "Istraživanje";
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reference znanja za AI asistenta</h1>
          <p className="text-muted-foreground mt-2">
            Upravljajte referencama koje AI asistent koristi za pružanje tačnih informacija u svojim odgovorima.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" />
          Nova referenca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pregled referenci</CardTitle>
          <CardDescription>
            Lista dostupnih referenci znanja za AI asistenta
          </CardDescription>
          <div className="mt-4">
            <Label htmlFor="filter-category">Filtriraj po kategoriji</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="filter-category" className="w-[200px]">
                <SelectValue placeholder="Sve kategorije" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve kategorije</SelectItem>
                <SelectItem value="general">Opšte informacije</SelectItem>
                <SelectItem value="law">Zakon</SelectItem>
                <SelectItem value="regulation">Pravilnik</SelectItem>
                <SelectItem value="guideline">Uputstvo</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="research">Istraživanje</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !references || references.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nema dostupnih referenci. Dodajte nove reference za AI asistenta.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naslov</TableHead>
                    <TableHead>Kategorija</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {references.map((reference) => (
                    <TableRow key={reference.id}>
                      <TableCell>
                        <div className="font-medium">{reference.title}</div>
                        {reference.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {reference.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryLabel(reference.category)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          reference.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {reference.isActive ? "Aktivna" : "Neaktivna"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(reference.url, "_blank")}
                            title="Otvori link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(reference)}
                            title="Izmeni"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteReference(reference.id)}
                            title="Obriši"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <KnowledgeReferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreateReference}
      />

      <KnowledgeReferenceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateReference}
        initialData={editingReference}
        isEditing
      />
    </div>
  );
}
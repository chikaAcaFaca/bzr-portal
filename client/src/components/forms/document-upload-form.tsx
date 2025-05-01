import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertBaseDocumentSchema, type BaseDocument } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useState } from "react";

// Extend the schema for validation
const formSchema = insertBaseDocumentSchema.extend({
  title: z.string().min(2, { message: "Naziv dokumenta mora imati najmanje 2 karaktera" }),
  category: z.string().min(1, { message: "Kategorija je obavezna" }),
});

interface DocumentUploadFormProps {
  defaultValues?: Partial<BaseDocument>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

// Document categories
const documentCategories = [
  "Sistematizacija",
  "Sistematizacija sa imenima",
  "Opis poslova",
  "Pravilnici",
  "Uputstva",
  "Obrasci",
  "Zakoni i propisi",
  "Izveštaji",
  "Ostalo"
];

const processableCategories = [
  "Sistematizacija",
  "Sistematizacija sa imenima",
  "Opis poslova"
];

export function DocumentUploadForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: DocumentUploadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string>(defaultValues?.fileName || "");
  const [fileSize, setFileSize] = useState<number>(defaultValues?.fileSize || 0);
  const [fileType, setFileType] = useState<string>(defaultValues?.fileType || "");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      fileName: defaultValues?.fileName || "",
      fileType: defaultValues?.fileType || "",
      fileSize: defaultValues?.fileSize || 0,
      category: defaultValues?.category || "",
    },
  });

  // Simulated file upload handling
  // In a real app, we would upload the file to a server
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (1GB limit)
      if (file.size > 1024 * 1024 * 1024) {
        toast({
          title: "Greška",
          description: "Veličina fajla ne može biti veća od 1GB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const allowedExtensions = ['.xls', '.doc', '.odt', '.ods', '.pdf', '.jpg', '.png', '.csv', '.bmp'];
      if (!allowedExtensions.includes(ext)) {
        toast({
          title: "Greška",
          description: "Nepodržan tip fajla",
          variant: "destructive",
        });
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type);
      
      form.setValue("fileName", file.name);
      form.setValue("fileType", file.type);
      form.setValue("fileSize", file.size);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // In a real implementation, we would first upload the file
      // and then create the document record with the file URL
      const res = await apiRequest(
        "POST",
        "/api/documents",
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Uspešno otpremljeno",
        description: "Dokument je uspešno otpremljen.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!defaultValues?.id) throw new Error("ID nije definisan");
      
      const res = await apiRequest(
        "PUT",
        `/api/documents/${defaultValues.id}`,
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Dokument je uspešno ažuriran.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Izmena dokumenta" : "Otpremanje novog dokumenta"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv dokumenta</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv dokumenta" {...field} />
                  </FormControl>
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
                      placeholder="Unesite kratak opis dokumenta"
                      {...field}
                    />
                  </FormControl>
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
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Kategorija pomaže u organizaciji dokumenata
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditMode && (
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Dokument</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="document-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Kliknite za otpremanje</span> ili prevucite dokument ovde
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOCX, XLSX, PPTX, JPG, PNG (MAX. 10MB)
                          </p>
                        </div>
                        <input
                          id="document-upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {fileName && `Izabran fajl: ${fileName}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
                
                {/* Hidden fields for file data */}
                <input type="hidden" {...form.register("fileName")} />
                <input type="hidden" {...form.register("fileType")} />
                <input type="hidden" {...form.register("fileSize")} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Otkaži
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending || (!isEditMode && !fileName)}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? "Sačuvavanje..." 
                : isEditMode ? "Sačuvaj izmene" : "Otpremi dokument"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

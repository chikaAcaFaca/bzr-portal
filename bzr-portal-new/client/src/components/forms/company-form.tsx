
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertCompanySchema, type Company } from "@shared/schema";
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompanyFormProps {
  defaultValues?: Partial<Company>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CompanyForm({
  defaultValues,
  onSuccess,
  onCancel,
}: CompanyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      pib: defaultValues?.pib || "",
      registrationNumber: defaultValues?.registrationNumber || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(values));
      if (documentFile) {
        formData.append("document", documentFile);
      }

      const res = await apiRequest(
        "POST",
        "/api/companies",
        formData,
        { isFormData: true }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Uspešno kreirano",
        description: "Podaci o kompaniji su uspešno sačuvani.",
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

  function onSubmit(values: any) {
    createMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Podaci o kompaniji</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv kompanije</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv kompanije" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pib"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIB</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite PIB" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matični broj</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite matični broj" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Izvod iz APR-a</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                />
              </FormControl>
              <FormDescription>
                Priložite skeniran izvod iz APR-a
              </FormDescription>
            </FormItem>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Otkaži
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Čuvanje..." : "Sačuvaj"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  documentType: z.string(),
  employeeId: z.string().optional(),
  jobPositionId: z.string().optional(),
  date: z.date().optional(),
});

export function DocumentGeneratorForm() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: "",
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: jobPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const { data: company } = useQuery({
    queryKey: ['/api/company'],
  });

  const generateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('/api/documents/generate', {
        method: 'POST',
        body: {
          documentType: values.documentType,
          data: {
            company,
            employee: employees?.find(e => e.id.toString() === values.employeeId),
            jobPosition: jobPositions?.find(j => j.id.toString() === values.jobPositionId),
            date: values.date,
          }
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Dokument je generisan",
          description: "Dokument je uspešno generisan i spreman za preuzimanje",
        });
        // Ovde dodati logiku za preuzimanje/prikaz dokumenta
      }
    },
    onError: (error: any) => {
      toast({
        title: "Greška",
        description: `Došlo je do greške pri generisanju dokumenta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    generateMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip dokumenta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite tip dokumenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="obrazac1">Obrazac 1 - Izveštaj o povredi na radu</SelectItem>
                  <SelectItem value="obrazac6">Obrazac 6 - Evidencija o osposobljavanju</SelectItem>
                  {/* Dodati ostale obrasce */}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Dodati ostala polja u zavisnosti od tipa dokumenta */}

        <Button type="submit" disabled={generateMutation.isPending}>
          {generateMutation.isPending ? "Generisanje..." : "Generiši dokument"}
        </Button>
      </form>
    </Form>
  );
}

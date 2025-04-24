import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertRiskCategorySchema, type RiskCategory, type JobPosition } from "@shared/schema";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

// Extend the schema for validation
const formSchema = insertRiskCategorySchema.extend({
  name: z.string().min(2, { message: "Naziv kategorije mora imati najmanje 2 karaktera" }),
  severity: z.string().min(1, { message: "Težina rizika je obavezna" }),
  likelihood: z.string().min(1, { message: "Verovatnoća rizika je obavezna" }),
  jobPositions: z.array(z.coerce.number())
});

interface RiskCategoryFormProps {
  defaultValues?: Partial<RiskCategory>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

// Severity and likelihood options
const severityOptions = ["Niska", "Srednja", "Visoka"];
const likelihoodOptions = ["Malo verovatna", "Moguća", "Verovatna"];

export function RiskCategoryForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: RiskCategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch job positions for the job position selection
  const { data: jobPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      severity: defaultValues?.severity || "",
      likelihood: defaultValues?.likelihood || "",
      jobPositions: defaultValues?.jobPositions || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest(
        "POST",
        "/api/risk-categories",
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-categories"] });
      toast({
        title: "Uspešno kreirano",
        description: "Kategorija rizika je uspešno kreirana.",
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
        `/api/risk-categories/${defaultValues.id}`,
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-categories"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Kategorija rizika je uspešno ažurirana.",
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
        <CardTitle>{isEditMode ? "Izmena kategorije rizika" : "Nova kategorija rizika"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv kategorije</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv kategorije rizika" {...field} />
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
                      placeholder="Unesite opis kategorije rizika"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Težina rizika</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite težinu rizika" />
                        </SelectTrigger>
                        <SelectContent>
                          {severityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="likelihood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verovatnoća rizika</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite verovatnoću rizika" />
                        </SelectTrigger>
                        <SelectContent>
                          {likelihoodOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobPositions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Radna mesta koja pripadaju ovoj kategoriji</FormLabel>
                    <FormDescription>
                      Izaberite radna mesta koja su izložena ovoj vrsti rizika
                    </FormDescription>
                  </div>
                  {isLoadingPositions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {jobPositions?.map((position: JobPosition) => (
                        <FormField
                          key={position.id}
                          control={form.control}
                          name="jobPositions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={position.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(position.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = [...field.value || []];
                                      if (checked) {
                                        field.onChange([...currentValues, position.id]);
                                      } else {
                                        field.onChange(
                                          currentValues.filter((value) => value !== position.id)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {position.title} ({position.department})
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Otkaži
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Sačuvavanje..." : "Sačuvaj"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

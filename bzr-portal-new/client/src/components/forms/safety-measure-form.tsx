import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertSafetyMeasureSchema, type SafetyMeasure, type RiskCategory } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MinusCircle } from "lucide-react";

// Extend the schema for validation
const formSchema = insertSafetyMeasureSchema.extend({
  title: z.string().min(2, { message: "Naziv mere mora imati najmanje 2 karaktera" }),
  description: z.string().min(5, { message: "Opis mere mora imati najmanje 5 karaktera" }),
  instructions: z.string().min(5, { message: "Uputstva moraju imati najmanje 5 karaktera" }),
  applicableRiskCategories: z.array(z.coerce.number()),
});

interface SafetyMeasureFormProps {
  defaultValues?: Partial<SafetyMeasure>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function SafetyMeasureForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: SafetyMeasureFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [equipment, setEquipment] = useState<string[]>(
    defaultValues?.requiredEquipment || [""]
  );

  // Fetch risk categories for the selection
  const { data: riskCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/risk-categories'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      instructions: defaultValues?.instructions || "",
      applicableRiskCategories: defaultValues?.applicableRiskCategories || [],
      requiredEquipment: defaultValues?.requiredEquipment || [""],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Filter out empty equipment items
      const filteredValues = {
        ...values,
        requiredEquipment: values.requiredEquipment.filter(item => item.trim() !== "")
      };

      const res = await apiRequest(
        "POST",
        "/api/safety-measures",
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety-measures"] });
      toast({
        title: "Uspešno kreirano",
        description: "Mera zaštite je uspešno kreirana.",
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
      
      // Filter out empty equipment items
      const filteredValues = {
        ...values,
        requiredEquipment: values.requiredEquipment.filter(item => item.trim() !== "")
      };

      const res = await apiRequest(
        "PUT",
        `/api/safety-measures/${defaultValues.id}`,
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety-measures"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Mera zaštite je uspešno ažurirana.",
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

  // Handle adding/removing equipment
  const addEquipment = () => {
    setEquipment([...equipment, ""]);
    form.setValue("requiredEquipment", [...equipment, ""]);
  };

  const removeEquipment = (index: number) => {
    const newEquipment = equipment.filter((_, i) => i !== index);
    setEquipment(newEquipment);
    form.setValue("requiredEquipment", newEquipment);
  };

  const updateEquipment = (index: number, value: string) => {
    const newEquipment = [...equipment];
    newEquipment[index] = value;
    setEquipment(newEquipment);
    form.setValue("requiredEquipment", newEquipment);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Izmena mere zaštite" : "Nova mera zaštite"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv mere zaštite</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv mere zaštite" {...field} />
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
                  <FormLabel>Opis mere zaštite</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite opis mere zaštite"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detaljna uputstva</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite detaljna uputstva za primenu mere"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-sm font-medium mb-3">Potrebna oprema/sredstva</h3>
              {equipment.map((item, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateEquipment(index, e.target.value)}
                    placeholder="Unesite potrebnu opremu/sredstvo"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEquipment(index)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addEquipment}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj opremu/sredstvo
              </Button>
            </div>

            <FormField
              control={form.control}
              name="applicableRiskCategories"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Primenjive kategorije rizika</FormLabel>
                    <FormDescription>
                      Izaberite kategorije rizika na koje se ova mera zaštite odnosi
                    </FormDescription>
                  </div>
                  {isLoadingCategories ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {riskCategories?.map((category: RiskCategory) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="applicableRiskCategories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = [...field.value || []];
                                      if (checked) {
                                        field.onChange([...currentValues, category.id]);
                                      } else {
                                        field.onChange(
                                          currentValues.filter((value) => value !== category.id)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {category.name} 
                                  <span className="text-xs ml-1 text-gray-500">
                                    (Težina: {category.severity}, Verovatnoća: {category.likelihood})
                                  </span>
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

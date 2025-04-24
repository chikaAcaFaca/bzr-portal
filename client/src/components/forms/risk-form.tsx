import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertRiskSchema, type Risk, type RiskCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MinusCircle } from "lucide-react";

// Extend the schema for validation
const formSchema = insertRiskSchema.extend({
  description: z.string().min(5, { message: "Opis rizika mora imati najmanje 5 karaktera" }),
  potentialHarm: z.string().min(5, { message: "Opis potencijalne štete mora imati najmanje 5 karaktera" }),
  categoryId: z.coerce.number({ 
    required_error: "Kategorija rizika je obavezna",
    invalid_type_error: "Kategorija rizika mora biti broj"
  }),
});

interface RiskFormProps {
  defaultValues?: Partial<Risk>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function RiskForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: RiskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [controlMeasures, setControlMeasures] = useState<string[]>(
    defaultValues?.controlMeasures || [""]
  );

  // Fetch risk categories for the dropdown
  const { data: riskCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/risk-categories'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: defaultValues?.categoryId || 0,
      description: defaultValues?.description || "",
      potentialHarm: defaultValues?.potentialHarm || "",
      controlMeasures: defaultValues?.controlMeasures || [""],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Filter out empty control measures
      const filteredValues = {
        ...values,
        controlMeasures: values.controlMeasures.filter(measure => measure.trim() !== "")
      };

      const res = await apiRequest(
        "POST",
        "/api/risks",
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      toast({
        title: "Uspešno kreirano",
        description: "Rizik je uspešno kreiran.",
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
      
      // Filter out empty control measures
      const filteredValues = {
        ...values,
        controlMeasures: values.controlMeasures.filter(measure => measure.trim() !== "")
      };

      const res = await apiRequest(
        "PUT",
        `/api/risks/${defaultValues.id}`,
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Rizik je uspešno ažuriran.",
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

  // Handle adding/removing control measures
  const addControlMeasure = () => {
    setControlMeasures([...controlMeasures, ""]);
    form.setValue("controlMeasures", [...controlMeasures, ""]);
  };

  const removeControlMeasure = (index: number) => {
    const newMeasures = controlMeasures.filter((_, i) => i !== index);
    setControlMeasures(newMeasures);
    form.setValue("controlMeasures", newMeasures);
  };

  const updateControlMeasure = (index: number, value: string) => {
    const newMeasures = [...controlMeasures];
    newMeasures[index] = value;
    setControlMeasures(newMeasures);
    form.setValue("controlMeasures", newMeasures);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategorija rizika</FormLabel>
              <FormControl>
                {isLoadingCategories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value ? field.value.toString() : undefined}
                    disabled={defaultValues?.categoryId !== undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite kategoriju rizika" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskCategories?.map((category: RiskCategory) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name} ({category.severity}, {category.likelihood})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
              <FormLabel>Opis rizika</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Unesite opis rizika"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="potentialHarm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potencijalna šteta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Opišite potencijalnu štetu koja može nastati"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-sm font-medium mb-3">Mere kontrole</h3>
          {controlMeasures.map((measure, index) => (
            <div key={index} className="flex items-center mb-2 gap-2">
              <Input
                value={measure}
                onChange={(e) => updateControlMeasure(index, e.target.value)}
                placeholder="Unesite meru kontrole za ovaj rizik"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeControlMeasure(index)}
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
            onClick={addControlMeasure}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Dodaj meru kontrole
          </Button>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Otkaži
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Sačuvavanje..." : "Sačuvaj"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

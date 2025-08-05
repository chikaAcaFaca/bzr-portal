import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertJobDescriptionSchema, type JobDescription, type JobPosition } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MinusCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Extend the schema for validation
const formSchema = insertJobDescriptionSchema.extend({
  description: z.string().min(5, { message: "Opis mora imati najmanje 5 karaktera" }),
  jobPositionId: z.coerce.number({ 
    required_error: "Radno mesto je obavezno",
    invalid_type_error: "Radno mesto mora biti broj"
  }),
});

interface JobDescriptionFormProps {
  defaultValues?: Partial<JobDescription>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function JobDescriptionForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: JobDescriptionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [duties, setDuties] = useState<string[]>(
    defaultValues?.duties || [""]
  );
  const [equipment, setEquipment] = useState<string[]>(
    defaultValues?.equipment || [""]
  );

  // Fetch job positions for select dropdown
  const { data: jobPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobPositionId: defaultValues?.jobPositionId || 0,
      description: defaultValues?.description || "",
      duties: defaultValues?.duties || [""],
      workingConditions: defaultValues?.workingConditions || "",
      equipment: defaultValues?.equipment || [""],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Filter out empty values
      const filteredValues = {
        ...values,
        duties: values.duties.filter(duty => duty.trim() !== ""),
        equipment: values.equipment.filter(item => item.trim() !== "")
      };

      const res = await apiRequest(
        "POST",
        "/api/job-descriptions",
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      toast({
        title: "Uspešno kreirano",
        description: "Opis posla je uspešno kreiran.",
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

      // Filter out empty values
      const filteredValues = {
        ...values,
        duties: values.duties.filter(duty => duty.trim() !== ""),
        equipment: values.equipment.filter(item => item.trim() !== "")
      };

      const res = await apiRequest(
        "PUT",
        `/api/job-descriptions/${defaultValues.id}`,
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Opis posla je uspešno ažuriran.",
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

  // Handle adding/removing duties
  const addDuty = () => {
    setDuties([...duties, ""]);
    form.setValue("duties", [...duties, ""]);
  };

  const removeDuty = (index: number) => {
    const newDuties = duties.filter((_, i) => i !== index);
    setDuties(newDuties);
    form.setValue("duties", newDuties);
  };

  const updateDuty = (index: number, value: string) => {
    const newDuties = [...duties];
    newDuties[index] = value;
    setDuties(newDuties);
    form.setValue("duties", newDuties);
  };

  // Handle adding/removing equipment
  const addEquipment = () => {
    setEquipment([...equipment, ""]);
    form.setValue("equipment", [...equipment, ""]);
  };

  const removeEquipment = (index: number) => {
    const newEquipment = equipment.filter((_, i) => i !== index);
    setEquipment(newEquipment);
    form.setValue("equipment", newEquipment);
  };

  const updateEquipment = (index: number, value: string) => {
    const newEquipment = [...equipment];
    newEquipment[index] = value;
    setEquipment(newEquipment);
    form.setValue("equipment", newEquipment);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Izmena opisa posla" : "Novi opis posla"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="jobPositionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radno mesto</FormLabel>
                  <FormControl>
                    {isLoadingPositions ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite radno mesto" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPositions?.map((position: JobPosition) => (
                            <SelectItem key={position.id} value={position.id.toString()}>
                              {position.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormDescription>Povezani opis posla sa radnim mestom</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detaljan opis posla</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite detaljan opis posla"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-sm font-medium mb-3">Radne dužnosti</h3>
              {duties.map((duty, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <Input
                    value={duty}
                    onChange={(e) => updateDuty(index, e.target.value)}
                    placeholder="Unesite radnu dužnost"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDuty(index)}
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
                onClick={addDuty}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj dužnost
              </Button>
            </div>

            <FormField
              control={form.control}
              name="workingConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uslovi rada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite uslove rada na radnom mestu"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-sm font-medium mb-3">Oprema za rad</h3>
              {equipment.map((item, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateEquipment(index, e.target.value)}
                    placeholder="Unesite opremu za rad"
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
                Dodaj opremu
              </Button>
            </div>
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

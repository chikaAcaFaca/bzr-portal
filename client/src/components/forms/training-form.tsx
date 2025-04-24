import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  insertEmployeeTrainingSchema, 
  type EmployeeTraining, 
  type Employee,
  type TrainingType,
  type Risk,
  type SafetyMeasure
} from "@shared/schema";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// Extend the schema for validation
const formSchema = insertEmployeeTrainingSchema.extend({
  employeeId: z.coerce.number({ 
    required_error: "Zaposleni je obavezan",
    invalid_type_error: "ID zaposlenog mora biti broj"
  }),
  trainingTypeId: z.coerce.number({ 
    required_error: "Tip obuke je obavezan",
    invalid_type_error: "ID tipa obuke mora biti broj"
  }),
  trainingDate: z.date({
    required_error: "Datum obuke je obavezan",
  }),
  completedDate: z.date().optional(),
  status: z.string({
    required_error: "Status je obavezan",
  }),
  trainedRisks: z.array(z.coerce.number()),
  safetyMeasures: z.array(z.coerce.number()),
});

interface TrainingFormProps {
  defaultValues?: Partial<EmployeeTraining>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

// Training status options
const trainingStatusOptions = ["Zakazano", "U toku", "Završeno"];

export function TrainingForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: TrainingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees for the selection
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch training types for the selection
  const { data: trainingTypes, isLoading: isLoadingTrainingTypes } = useQuery({
    queryKey: ['/api/training-types'],
  });

  // Fetch risks for the selection
  const { data: risks, isLoading: isLoadingRisks } = useQuery({
    queryKey: ['/api/risks'],
  });

  // Fetch safety measures for the selection
  const { data: safetyMeasures, isLoading: isLoadingSafetyMeasures } = useQuery({
    queryKey: ['/api/safety-measures'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: defaultValues?.employeeId || 0,
      trainingTypeId: defaultValues?.trainingTypeId || 0,
      trainingDate: defaultValues?.trainingDate ? new Date(defaultValues.trainingDate) : new Date(),
      completedDate: defaultValues?.completedDate ? new Date(defaultValues.completedDate) : undefined,
      status: defaultValues?.status || "Zakazano",
      notes: defaultValues?.notes || "",
      trainedRisks: defaultValues?.trainedRisks || [],
      safetyMeasures: defaultValues?.safetyMeasures || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest(
        "POST",
        "/api/employee-trainings",
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-trainings"] });
      toast({
        title: "Uspešno kreirano",
        description: "Obuka je uspešno zakazana.",
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
        `/api/employee-trainings/${defaultValues.id}`,
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-trainings"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Obuka je uspešno ažurirana.",
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
        <CardTitle>{isEditMode ? "Izmena obuke" : "Nova obuka zaposlenog"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zaposleni</FormLabel>
                  <FormControl>
                    {isLoadingEmployees ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite zaposlenog" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((employee: Employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
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
              name="trainingTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vrsta obuke</FormLabel>
                  <FormControl>
                    {isLoadingTrainingTypes ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite vrstu obuke" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingTypes?.map((type: TrainingType) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.code} - {type.name}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="trainingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum obuke</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Izaberite datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status obuke</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite status obuke" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
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

            {form.watch("status") === "Završeno" && (
              <FormField
                control={form.control}
                name="completedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum završetka</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Izaberite datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.getValues("trainingDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Datum kada je obuka završena. Mora biti nakon datuma obuke.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Napomene</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Unesite dodatne napomene o obuci"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainedRisks"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Rizici obuhvaćeni obukom</FormLabel>
                    <FormDescription>
                      Izaberite rizike koji su obuhvaćeni ovom obukom
                    </FormDescription>
                  </div>
                  {isLoadingRisks ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {risks?.map((risk: Risk) => (
                        <FormField
                          key={risk.id}
                          control={form.control}
                          name="trainedRisks"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={risk.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(risk.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = [...field.value || []];
                                      if (checked) {
                                        field.onChange([...currentValues, risk.id]);
                                      } else {
                                        field.onChange(
                                          currentValues.filter((value) => value !== risk.id)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {risk.description}
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

            <FormField
              control={form.control}
              name="safetyMeasures"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Mere zaštite u obuci</FormLabel>
                    <FormDescription>
                      Izaberite mere zaštite koje su obuhvaćene ovom obukom
                    </FormDescription>
                  </div>
                  {isLoadingSafetyMeasures ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {safetyMeasures?.map((measure: SafetyMeasure) => (
                        <FormField
                          key={measure.id}
                          control={form.control}
                          name="safetyMeasures"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={measure.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(measure.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = [...field.value || []];
                                      if (checked) {
                                        field.onChange([...currentValues, measure.id]);
                                      } else {
                                        field.onChange(
                                          currentValues.filter((value) => value !== measure.id)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {measure.title}
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

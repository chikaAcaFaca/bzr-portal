import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertJobPositionSchema, type JobPosition } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MinusCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend the schema for validation
const formSchema = insertJobPositionSchema.extend({
  title: z.string().min(2, { message: "Naziv radnog mesta mora imati najmanje 2 karaktera" }),
  department: z.string().min(2, { message: "Naziv odeljenja mora imati najmanje 2 karaktera" }),
});

interface JobPositionFormProps {
  defaultValues?: Partial<JobPosition>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function JobPositionForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditMode = false,
}: JobPositionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    defaultValues?.requiredSkills || [""]
  );
  const [responsibilities, setResponsibilities] = useState<string[]>(
    defaultValues?.responsibilities || [""]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      department: defaultValues?.department || "",
      description: defaultValues?.description || "",
      requiredSkills: defaultValues?.requiredSkills || [""],
      responsibilities: defaultValues?.responsibilities || [""],
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Filter out empty skills and responsibilities
      const filteredValues = {
        ...values,
        requiredSkills: values.requiredSkills.filter(skill => skill.trim() !== ""),
        responsibilities: values.responsibilities.filter(resp => resp.trim() !== "")
      };

      const res = await apiRequest(
        "POST",
        "/api/job-positions",
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-positions"] });
      toast({
        title: "Uspešno kreirano",
        description: "Radno mesto je uspešno kreirano.",
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

      // Filter out empty skills and responsibilities
      const filteredValues = {
        ...values,
        requiredSkills: values.requiredSkills.filter(skill => skill.trim() !== ""),
        responsibilities: values.responsibilities.filter(resp => resp.trim() !== "")
      };

      const res = await apiRequest(
        "PUT",
        `/api/job-positions/${defaultValues.id}`,
        filteredValues
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-positions"] });
      toast({
        title: "Uspešno ažurirano",
        description: "Radno mesto je uspešno ažurirano.",
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

  // Handle adding/removing skills
  const addSkill = () => {
    setRequiredSkills([...requiredSkills, ""]);
    form.setValue("requiredSkills", [...requiredSkills, ""]);
  };

  const removeSkill = (index: number) => {
    const newSkills = requiredSkills.filter((_, i) => i !== index);
    setRequiredSkills(newSkills);
    form.setValue("requiredSkills", newSkills);
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...requiredSkills];
    newSkills[index] = value;
    setRequiredSkills(newSkills);
    form.setValue("requiredSkills", newSkills);
  };

  // Handle adding/removing responsibilities
  const addResponsibility = () => {
    setResponsibilities([...responsibilities, ""]);
    form.setValue("responsibilities", [...responsibilities, ""]);
  };

  const removeResponsibility = (index: number) => {
    const newResponsibilities = responsibilities.filter((_, i) => i !== index);
    setResponsibilities(newResponsibilities);
    form.setValue("responsibilities", newResponsibilities);
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...responsibilities];
    newResponsibilities[index] = value;
    setResponsibilities(newResponsibilities);
    form.setValue("responsibilities", newResponsibilities);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Izmena radnog mesta" : "Novo radno mesto"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv radnog mesta</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv radnog mesta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odeljenje</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite odeljenje" {...field} />
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
                      placeholder="Unesite kratak opis radnog mesta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-sm font-medium mb-3">Potrebne veštine</h3>
              {requiredSkills.map((skill, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <Input
                    value={skill}
                    onChange={(e) => updateSkill(index, e.target.value)}
                    placeholder="Unesite potrebnu veštinu"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkill(index)}
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
                onClick={addSkill}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj veštinu
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Odgovornosti</h3>
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <Input
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder="Unesite odgovornost"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(index)}
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
                onClick={addResponsibility}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj odgovornost
              </Button>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Aktivno</FormLabel>
                    <FormDescription>
                      Radno mesto je trenutno aktivno u sistematizaciji
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

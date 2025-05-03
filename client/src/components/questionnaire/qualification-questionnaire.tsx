import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle,
  Send,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

// Lista kvalifikovanih delatnosti prema Članu 47
const kvalifikovaneDelatnosti = [
  { id: 'trgovina', naziv: 'Trgovina na malo' },
  { id: 'ugostiteljstvo', naziv: 'Usluge smeštaja i ishrane' },
  { id: 'informisanje', naziv: 'Informisanje i komunikacije' },
  { id: 'finansije', naziv: 'Finansijske delatnosti' },
  { id: 'osiguranje', naziv: 'Delatnosti osiguranja' },
  { id: 'nekretnine', naziv: 'Poslovanje nekretninama' },
  { id: 'strucne', naziv: 'Stručne i naučne delatnosti' },
  { id: 'inovacije', naziv: 'Inovacione delatnosti' },
  { id: 'administrativne', naziv: 'Administrativne delatnosti' },
  { id: 'pomocne', naziv: 'Pomoćne uslužne delatnosti' },
  { id: 'osiguranje_socijalno', naziv: 'Obavezno socijalno osiguranje' },
  { id: 'obrazovanje', naziv: 'Obrazovanje' },
  { id: 'umetnost', naziv: 'Umetnost, zabava i rekreacija' },
  { id: 'ostale_usluge', naziv: 'Ostale uslužne delatnosti' }
];

// Validaciona šema za prvi korak
const companySchema = z.object({
  companyName: z.string().min(2, "Naziv firme mora imati najmanje 2 karaktera"),
  companySize: z.enum(["1-5", "6-10", "11-19", "20-49", "50+"], {
    required_error: "Molimo izaberite veličinu firme",
  }),
  industry: z.string({
    required_error: "Molimo izaberite delatnost kompanije",
  }),
});

// Validaciona šema za drugi korak
const contactSchema = z.object({
  fullName: z.string().min(3, "Ime i prezime moraju imati najmanje 3 karaktera"),
  email: z.string().email("Unesite validnu email adresu"),
  phone: z.string().optional(),
  position: z.string().min(2, "Pozicija mora imati najmanje 2 karaktera"),
});

// Validaciona šema za treći korak
const requirementsSchema = z.object({
  hasRiskAssessment: z.enum(["da", "ne", "neznam"], {
    required_error: "Molimo odgovorite na pitanje",
  }),
  hasTrainingProgram: z.enum(["da", "ne", "neznam"], {
    required_error: "Molimo odgovorite na pitanje",
  }),
  hasSafetyPerson: z.enum(["da", "ne", "neznam"], {
    required_error: "Molimo odgovorite na pitanje",
  }),
  hasDocumentation: z.enum(["da", "ne", "delimično"], {
    required_error: "Molimo odgovorite na pitanje",
  }),
});

// Kombinovana validaciona šema
type QualificationFormData = z.infer<typeof companySchema> & 
  z.infer<typeof contactSchema> & 
  z.infer<typeof requirementsSchema>;

interface QualificationQuestionnaireProps {
  onComplete: () => void;
}

export default function QualificationQuestionnaire({
  onComplete
}: QualificationQuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QualificationFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<{
    qualified: boolean;
    message: string;
    recommendations: string[];
  } | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;
  const { toast } = useToast();

  // Form za prvi korak - osnovni podaci o kompaniji
  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: formData.companyName || "",
      companySize: formData.companySize as any || undefined,
      industry: formData.industry || undefined,
    },
  });

  // Form za drugi korak - kontakt podaci
  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      phone: formData.phone || "",
      position: formData.position || "",
    },
  });

  // Form za treći korak - pitanja o BZR
  const requirementsForm = useForm<z.infer<typeof requirementsSchema>>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: {
      hasRiskAssessment: formData.hasRiskAssessment as any || undefined,
      hasTrainingProgram: formData.hasTrainingProgram as any || undefined,
      hasSafetyPerson: formData.hasSafetyPerson as any || undefined,
      hasDocumentation: formData.hasDocumentation as any || undefined,
    },
  });

  const handleCompanySubmit = (data: z.infer<typeof companySchema>) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const handleContactSubmit = (data: z.infer<typeof contactSchema>) => {
    setFormData({ ...formData, ...data });
    setStep(3);
  };

  const handleRequirementsSubmit = async (data: z.infer<typeof requirementsSchema>) => {
    const completeFormData = { ...formData, ...data };
    setFormData(completeFormData);
    setSubmitting(true);

    try {
      // Pravila kvalifikacije prema Članu 47
      const isQualifiedIndustry = kvalifikovaneDelatnosti.some(d => d.id === completeFormData.industry);
      const isUnder20Employees = ["1-5", "6-10", "11-19"].includes(completeFormData.companySize || "");
      const isQualified = isQualifiedIndustry && isUnder20Employees;

      // Generisanje preporuka na osnovu odgovora
      const recommendations: string[] = [];
      if (data.hasRiskAssessment !== "da") {
        recommendations.push("Izrada akta o proceni rizika za sva radna mesta");
      }
      if (data.hasTrainingProgram !== "da") {
        recommendations.push("Uspostavljanje programa obuke zaposlenih o bezbednosti i zdravlju na radu");
      }
      if (data.hasSafetyPerson !== "da") {
        recommendations.push(isQualified 
          ? "Polaganje stručnog ispita za obavljanje poslova BZR (za poslodavca)" 
          : "Angažovanje lica sa licencom za BZR"
        );
      }
      if (data.hasDocumentation !== "da") {
        recommendations.push("Izrada i ažuriranje dokumentacije o bezbednosti i zdravlju na radu");
      }

      // Rezultat kvalifikacije
      const result = {
        qualified: isQualified,
        message: isQualified 
          ? "Vaša kompanija se kvalifikuje prema Članu 47! Možete sami obavljati poslove BZR uz polaganje stručnog ispita."
          : "Vaša kompanija se ne kvalifikuje prema Članu 47 i potrebno je angažovati lice sa licencom za poslove BZR.",
        recommendations
      };
      
      setQualificationResult(result);

      // Slanje rezultata na email
      try {
        const response = await apiRequest("POST", "/api/questionnaire/send-results", {
          email: completeFormData.email || "",
          companyName: completeFormData.companyName || "",
          fullName: completeFormData.fullName || "",
          result
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error("Greška prilikom slanja rezultata na email");
        }
        
        // Proveravamo da li je email zaista poslat ili je sačuvan lokalno
        setEmailSent(responseData.emailSent !== false);
        
        // Ako imamo resultId u odgovoru, čuvamo ga za kasnije preuzimanje
        if (responseData.resultId) {
          setResultId(responseData.resultId);
        }
      } catch (error) {
        toast({
          title: "Upozorenje",
          description: "Rezultati su generisani, ali nismo uspeli da ih pošaljemo na email. Možete ih pregledati direktno.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom obrade upitnika. Molimo pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepTitle = () => {
    switch (step) {
      case 1:
        return "Osnovni podaci o kompaniji";
      case 2:
        return "Kontakt podaci";
      case 3:
        return "Pitanja o bezbednosti i zdravlju na radu";
      default:
        return "Kvalifikacija za Član 47";
    }
  };

  const renderStepDescription = () => {
    switch (step) {
      case 1:
        return "Unesite osnovne informacije o vašoj kompaniji";
      case 2:
        return "Unesite kontakt podatke za slanje rezultata";
      case 3:
        return "Odgovorite na nekoliko pitanja o trenutnom stanju BZR u vašoj kompaniji";
      default:
        return "";
    }
  };

  // Prikaz rezultata
  if (qualificationResult) {
    return (
      <div className="space-y-6">
        <Card className={qualificationResult.qualified ? "border-green-500" : "border-amber-500"}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {qualificationResult.qualified ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
              <CardTitle className={qualificationResult.qualified ? "text-green-700" : "text-amber-700"}>
                Rezultat kvalifikacije
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium mb-4">{qualificationResult.message}</p>
            
            {qualificationResult.recommendations.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-800 mt-6 mb-3">Preporuke za usklađivanje:</h3>
                <ul className="space-y-2">
                  {qualificationResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-1 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="space-y-6 mt-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Šta dalje?</h4>
                <p className="text-blue-700">
                  Detaljan izveštaj o kvalifikaciji je poslat na vašu email adresu: <strong>{formData.email}</strong>. 
                  Registrujte se besplatno kao FREE korisnik i dobićete pristup našem osnovnom AI asistentu za bezbednost i zdravlje na radu.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-md border border-indigo-200">
                <h4 className="font-medium text-indigo-800 mb-2">Unapredite na PRO verziju</h4>
                <p className="text-indigo-700 mb-4">
                  PRO korisnici dobijaju pristup punoj funkcionalnosti portala za samo <strong>2990 RSD + PDV mesečno</strong> (manje od 100 dinara dnevno).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Automatsko generisanje celokupne dokumentacije</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Neograničeni pristup AI asistentu</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">1GB prostora za dokumente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Automatske obuke zaposlenih</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Upravljanje rizicima i merama zaštite</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Praćenje zakonskih regulativa</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={onComplete}>Zatvori</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{renderStepTitle()}</h3>
        <p className="text-sm text-gray-500">{renderStepDescription()}</p>
        <Progress value={progress} className="h-2 mt-4" />
      </div>

      {step === 1 && (
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-6">
            <FormField
              control={companyForm.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv kompanije</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite naziv vaše kompanije" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={companyForm.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj zaposlenih</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite broj zaposlenih" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 zaposlenih</SelectItem>
                      <SelectItem value="6-10">6-10 zaposlenih</SelectItem>
                      <SelectItem value="11-19">11-19 zaposlenih</SelectItem>
                      <SelectItem value="20-49">20-49 zaposlenih</SelectItem>
                      <SelectItem value="50+">50+ zaposlenih</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={companyForm.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delatnost kompanije</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite primarnu delatnost" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kvalifikovaneDelatnosti.map(delatnost => (
                        <SelectItem key={delatnost.id} value={delatnost.id}>
                          {delatnost.naziv}
                        </SelectItem>
                      ))}
                      <SelectItem value="proizvodnja">Proizvodnja</SelectItem>
                      <SelectItem value="gradjevinarstvo">Građevinarstvo</SelectItem>
                      <SelectItem value="poljoprivreda">Poljoprivreda</SelectItem>
                      <SelectItem value="saobracaj">Saobraćaj i skladištenje</SelectItem>
                      <SelectItem value="rudarstvo">Rudarstvo</SelectItem>
                      <SelectItem value="energetika">Snabdevanje električnom energijom</SelectItem>
                      <SelectItem value="zdravstvo">Zdravstvena zaštita</SelectItem>
                      <SelectItem value="drugo">Drugo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">
                Sledeći korak <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...contactForm}>
          <form onSubmit={contactForm.handleSubmit(handleContactSubmit)} className="space-y-6">
            <FormField
              control={contactForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime i prezime</FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite vaše ime i prezime" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email adresa</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Unesite email za slanje rezultata" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon <span className="text-gray-500 text-sm ml-1">(opciono)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Unesite kontakt telefon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={contactForm.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vaša pozicija u kompaniji</FormLabel>
                  <FormControl>
                    <Input placeholder="npr. Direktor, HR menadžer, itd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Prethodni korak
              </Button>
              <Button type="submit">
                Sledeći korak <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && (
        <Form {...requirementsForm}>
          <form onSubmit={requirementsForm.handleSubmit(handleRequirementsSubmit)} className="space-y-6">
            <FormField
              control={requirementsForm.control}
              name="hasRiskAssessment"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Da li vaša kompanija ima izrađen akt o proceni rizika za sva radna mesta?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="da" />
                        </FormControl>
                        <FormLabel className="font-normal">Da</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ne" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="neznam" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne znam</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={requirementsForm.control}
              name="hasTrainingProgram"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Da li vaša kompanija ima program obuke zaposlenih za bezbedan i zdrav rad?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="da" />
                        </FormControl>
                        <FormLabel className="font-normal">Da</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ne" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="neznam" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne znam</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={requirementsForm.control}
              name="hasSafetyPerson"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Da li je u vašoj kompaniji već angažovano lice za bezbednost i zdravlje na radu?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="da" />
                        </FormControl>
                        <FormLabel className="font-normal">Da</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ne" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="neznam" />
                        </FormControl>
                        <FormLabel className="font-normal">Ne znam</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={requirementsForm.control}
              name="hasDocumentation"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Da li vaša kompanija ima svu potrebnu BZR dokumentaciju spremnu i ažuriranu?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="da" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Da, imamo svu dokumentaciju
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="delimično" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Delimično, nedostaje nam neka dokumentacija
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ne" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Ne, nemamo potrebnu dokumentaciju
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(2)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Prethodni korak
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? (
                  <>Obrađujem...</>
                ) : (
                  <>
                    Pošalji <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
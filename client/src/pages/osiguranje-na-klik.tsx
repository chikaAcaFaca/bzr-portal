import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  CheckIcon, 
  AlertCircleIcon,
  FileTextIcon, 
  InfoIcon,
  ArrowRightIcon
} from "lucide-react";

export default function OsiguranjeNaKlik() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    employeeCount: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Zahtev uspešno poslat",
      description: "Uskoro ćemo vas kontaktirati sa personalizovanom ponudom.",
      variant: "default",
    });
    setFormData({
      companyName: '',
      fullName: '',
      email: '',
      phone: '',
      employeeCount: '',
      message: ''
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Osiguranje zaposlenih od posledica nesrećnog slučaja
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Saznajte sve o kolektivnom osiguranju zaposlenih - zakonskim obavezama, prednostima, uporednim ponudama i koracima za dobijanje optimalnog rešenja
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const contactForm = document.getElementById('contact-form');
                  if (contactForm) contactForm.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ZATRAŽITE PONUDU
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Article */}
            <div className="lg:col-span-2">
              <article className="prose prose-lg max-w-none">
                <div className="mb-6 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <span>Objavljeno: 10.05.2025.</span>
                    <span className="mx-2">|</span>
                    <span>Kategorija: Osiguranje</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InfoIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Ključni podatak:</strong> Prema Zakonu o bezbednosti i zdravlju na radu, svi poslodavci u Srbiji su u obavezi da osiguraju svoje zaposlene od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom. 
                      </p>
                    </div>
                  </div>
                </div>

                <h2>Šta je kolektivno osiguranje zaposlenih?</h2>
                <p>
                  Kolektivno osiguranje zaposlenih od posledica nesrećnog slučaja (nezgode) predstavlja vid osiguranja kojim poslodavac osigurava sve svoje zaposlene, ili određene kategorije zaposlenih, od posledica nesrećnog slučaja bez obzira na to da li se nezgoda dogodila na radu ili van rada.
                </p>
                <p>
                  Ovaj vid osiguranja predviđen je kao <strong>zakonska obaveza poslodavca</strong> prema Zakonu o bezbednosti i zdravlju na radu. Tačnije, član 53. ovog zakona propisuje da je poslodavac dužan da zaposlene osigura od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom, radi obezbeđivanja naknade štete.
                </p>

                <h2>Osnovni rizici pokriveni osiguranjem zaposlenih</h2>
                <p>
                  Standardan paket kolektivnog osiguranja zaposlenih od posledica nesrećnog slučaja obično pokriva sledeće rizike:
                </p>
                <ul>
                  <li>Trajni invaliditet usled nezgode</li>
                  <li>Smrt usled nezgode</li>
                  <li>Troškovi lečenja usled nezgode</li>
                  <li>Dnevna naknada za bolničke dane</li>
                </ul>

                <p>
                  Osiguravajuća društva nude različite varijante paketa osiguranja zaposlenih, koji se razlikuju prema:
                </p>
                <ul>
                  <li>Visini osiguranih suma</li>
                  <li>Obimu pokrića (24h ili samo za vreme rada)</li>
                  <li>Dodatnim pogodnostima</li>
                </ul>

                <h2>Prednosti kolektivnog osiguranja zaposlenih</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">Za poslodavca:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Ispunjavanje zakonske obaveze</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Zaštita od potencijalnih sudskih procesa</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Povećanje zadovoljstva i lojalnosti zaposlenih</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Niža cena osiguranja po osobi zbog grupne polise</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Troškovi osiguranja se priznaju kao rashod</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">Za zaposlene:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Finansijska sigurnost u slučaju nezgode</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Pokriće troškova lečenja</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Naknada za dane sprečenosti za rad</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Osiguranje važi 24/7, na poslu i van posla</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Nema dodatnih troškova za zaposlene</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h2>Zakonska regulativa i odgovornost poslodavca</h2>
                <p>
                  Zakon o bezbednosti i zdravlju na radu (član 53) jasno propisuje da je poslodavac dužan da zaposlene osigura od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom.
                </p>
                <p>
                  U slučaju da poslodavac ne obezbedi ovo osiguranje, može biti kažnjen novčanom kaznom:
                </p>
                <ul>
                  <li>Za pravno lice: od 800.000 do 1.000.000 dinara</li>
                  <li>Za odgovorno lice u pravnom licu: od 40.000 do 50.000 dinara</li>
                  <li>Za preduzetnike: od 300.000 do 500.000 dinara</li>
                </ul>
                <p>
                  Osim zakonskih kazni, poslodavac koji nije osigurao zaposlene može biti izložen građanskim tužbama zaposlenih koji pretrpe povredu na radu. U takvim slučajevima, poslodavac bi morao iz sopstvenih sredstava da nadoknadi štetu, što može dovesti do značajnih finansijskih gubitaka.
                </p>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircleIcon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Važno upozorenje:</strong> Odsustvo ili nedostatak odgovarajućeg osiguranja zaposlenih može rezultirati teškim posledicama za poslodavca - od plaćanja visokih kazni do potencijalnih tužbi zaposlenih za naknadu štete.
                      </p>
                    </div>
                  </div>
                </div>

                <h2>Šta utiče na cenu osiguranja zaposlenih?</h2>
                <p>
                  Pri određivanju premije za kolektivno osiguranje zaposlenih, osiguravači uzimaju u obzir više faktora:
                </p>
                <ul>
                  <li><strong>Delatnost kompanije</strong> - delatnosti sa povećanim rizikom (npr. građevinarstvo) imaju više premije</li>
                  <li><strong>Broj zaposlenih</strong> - veći broj zaposlenih obično znači nižu premiju po zaposlenom</li>
                  <li><strong>Visina osiguranih suma</strong> - veće osigurane sume znače i višu premiju</li>
                  <li><strong>Starosna struktura zaposlenih</strong> - prosečna starost zaposlenih može uticati na premiju</li>
                  <li><strong>Prethodno iskustvo</strong> - istorija šteta može uticati na visinu premije</li>
                </ul>

                <h2>Proces ugovaranja osiguranja zaposlenih</h2>
                <p>
                  Proces ugovaranja kolektivnog osiguranja zaposlenih obično prati sledeće korake:
                </p>
                <ol className="space-y-4 my-6">
                  <li className="flex items-start">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                    <div>
                      <strong>Analiza potreba</strong>
                      <p className="text-gray-600 mt-1">
                        Procena specifičnih rizika u vašoj delatnosti i potreba zaposlenih.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                    <div>
                      <strong>Prikupljanje ponuda</strong>
                      <p className="text-gray-600 mt-1">
                        Kontaktiranje više osiguravajućih društava radi dobijanja ponuda.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                    <div>
                      <strong>Poređenje ponuda</strong>
                      <p className="text-gray-600 mt-1">
                        Analiza uslova osiguranja, cena i dodatnih pogodnosti koje osiguravači nude.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</div>
                    <div>
                      <strong>Ugovaranje polise</strong>
                      <p className="text-gray-600 mt-1">
                        Potpisivanje ugovora o osiguranju sa izabranim osiguravačem.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">5</div>
                    <div>
                      <strong>Plaćanje premije</strong>
                      <p className="text-gray-600 mt-1">
                        Premija se može platiti jednokratno ili u ratama, zavisno od dogovora.
                      </p>
                    </div>
                  </li>
                </ol>

                <h2>Često postavljana pitanja</h2>
                <Accordion type="single" collapsible className="my-6">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left">Da li se moraju osigurati svi zaposleni?</AccordionTrigger>
                    <AccordionContent>
                      Da, zakonska obaveza podrazumeva osiguranje svih zaposlenih. Polisa kolektivnog osiguranja obično pokriva sve zaposlene u kompaniji, bez obzira na vrstu ugovora o radu (stalni radni odnos, privremeni i povremeni poslovi, itd.).
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">Šta pokriva osiguranje od nezgode?</AccordionTrigger>
                    <AccordionContent>
                      Standardno pokriće uključuje smrt usled nezgode, trajni invaliditet, troškove lečenja i dnevne naknade. Moguće je ugovoriti i dodatna pokrića prema potrebama kompanije i zaposlenih, kao što su hirurške intervencije, prelomi kostiju, itd.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left">Koliko košta osiguranje zaposlenih?</AccordionTrigger>
                    <AccordionContent>
                      Cena zavisi od više faktora, uključujući delatnost kompanije, broj zaposlenih i visinu osiguranih suma. Za male i srednje firme, cena po zaposlenom može iznositi od nekoliko stotina do nekoliko hiljada dinara godišnje, zavisno od obima pokrića.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left">Šta ako zaposleni napusti kompaniju tokom osiguranog perioda?</AccordionTrigger>
                    <AccordionContent>
                      U slučaju fluktuacije zaposlenih, moguće je ugovoriti polisu na osnovu spiska zaposlenih koji se periodično ažurira. Neki osiguravači nude i opciju osiguranja zasnovanu na broju zaposlenih bez potrebe za dostavljanjem pojedinačnih podataka.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-left">Kako se prijavljuje šteta u slučaju nezgode?</AccordionTrigger>
                    <AccordionContent>
                      Procedura obično uključuje popunjavanje obrasca za prijavu štete, dostavljanje medicinske dokumentacije koja potvrđuje nezgodu i posledice, i eventualno drugih dokumenata koje zatraži osiguravač. Prijava se obično može izvršiti online, telefonom ili lično u poslovnici osiguravajućeg društva.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 my-8">
                  <h3 className="text-xl font-bold mb-4 text-primary-800">Zaključak</h3>
                  <p className="mb-4">
                    Kolektivno osiguranje zaposlenih od posledica nesrećnog slučaja nije samo zakonska obaveza, već i mudra investicija koja štiti i poslodavca i zaposlene od finansijskih posledica nezgoda.
                  </p>
                  <p>
                    Kroz minimalna ulaganja, poslodavci mogu obezbediti adekvatnu zaštitu za svoje zaposlene, ispuniti zakonske obaveze, i istovremeno povećati zadovoljstvo i lojalnost zaposlenih.
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => {
                        const contactForm = document.getElementById('contact-form');
                        if (contactForm) contactForm.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="gap-2"
                    >
                      <span>Zatražite ponudu danas</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-8 sticky top-24">
                {/* Contact Card */}
                <Card id="contact-form" className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary text-white">
                    <CardTitle>Zatražite ponudu</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                            Naziv kompanije <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="Unesite naziv vaše kompanije"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Kontakt osoba <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Ime i prezime"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="vasa@email.com"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+381 6X XXX XXX"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
                            Broj zaposlenih <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="employeeCount"
                            name="employeeCount"
                            type="number"
                            value={formData.employeeCount}
                            onChange={handleInputChange}
                            placeholder="Unesite broj"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                            Dodatne napomene
                          </label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Unesite dodatne informacije..."
                            className="h-24"
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full mt-6">
                        Pošalji upit
                      </Button>
                      <p className="text-xs text-gray-500 mt-4 text-center">
                        Slanjem upita prihvatate našu politiku privatnosti.
                      </p>
                    </form>
                  </CardContent>
                </Card>

                {/* Related Articles */}
                <Card className="shadow-md border-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Povezani članci</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-4">
                      <li>
                        <Link href="/blog">
                          <div className="group flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                              <FileTextIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                Prevencija povreda na radu – praktični saveti
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">15. april 2025.</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog">
                          <div className="group flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                              <FileTextIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                Kako odabrati najbolje osiguranje za zaposlene
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">2. maj 2025.</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog">
                          <div className="group flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                              <FileTextIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                Novine u Zakonu o bezbednosti i zdravlju na radu
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">28. april 2025.</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BZR Portal</h3>
              <p className="text-gray-400 mb-4">
                Sveobuhvatno rešenje za upravljanje bezbednošću i zdravljem na radu.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Linkovi</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Početna</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link href="/osiguranje-na-klik" className="text-gray-400 hover:text-white">Osiguranje na klik</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">O nama</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Kontakt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Uslovi korišćenja</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Kontakt</h3>
              <address className="not-italic text-gray-400">
                <p className="mb-2">Email: info@bzrportal.rs</p>
                <p className="mb-2">Telefon: +381 11 123 4567</p>
                <p>Adresa: Bulevar oslobođenja 123, Beograd</p>
              </address>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} BZR Portal. Sva prava zadržana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
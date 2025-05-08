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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  CheckIcon, 
  AlertCircleIcon,
  FileTextIcon, 
  ShieldIcon, 
  Users2Icon, 
  BuildingIcon 
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
    // Ovde bi se inače poslali podaci na server
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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ZAŠTITITE SVOJE <br />
              <span className="text-yellow-300">ZAPOSLENE I POSLOVANJE</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Kompletna rešenja za kolektivno osiguranje zaposlenih u skladu sa zakonom
            </p>
            <div className="flex flex-wrap gap-4">
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
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white/10"
              >
                Saznajte više
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div className="bg-white rounded-lg p-6 shadow-xl text-gray-800 max-w-md w-full">
              <h3 className="font-bold text-xl mb-4 text-blue-700">Zakonska obaveza osiguranja</h3>
              <p className="mb-4">
                Prema Zakonu o bezbednosti i zdravlju na radu, svaki poslodavac je dužan da osigura zaposlene od:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Smrti usled nesrećnog slučaja</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Trajnog gubitka radne sposobnosti (invaliditeta)</span>
                </li>
              </ul>
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex items-start">
                <AlertCircleIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Neispunjavanje ove obaveze može dovesti do ozbiljnih pravnih i finansijskih posledica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prednosti Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Zašto je kolektivno osiguranje zaposlenih pametna investicija?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Osiguranje zaposlenih nije samo zakonska obaveza - to je strateška investicija koja štiti vaš biznis i motiviše zaposlene.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-blue-700">Za vašu kompaniju:</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Ispunjavate zakonsku obavezu</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Štitite poslovanje od nepredviđenih finansijskih rizika</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Povećavate lojalnost i motivaciju zaposlenih</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Unapređujete imidž društveno odgovorne kompanije</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-blue-700">Za vaše zaposlene:</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Finansijska sigurnost u slučaju nezgode</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Pokriće troškova lečenja</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Naknada za period privremene sprečenosti za rad</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Dodatna zaštita za porodicu</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const contactForm = document.getElementById('contact-form');
                if (contactForm) contactForm.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Investirajte u sigurnost danas za bezbrižnu budućnost sutra!
            </Button>
          </div>
        </div>
      </section>
      
      {/* Ponude osiguravajućih kuća */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Uporedite najbolje ponude i izaberite idealno rešenje</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pružamo vam pregled aktuelnih ponuda vodećih osiguravajućih kuća u Srbiji, sa svim relevantnim informacijama na jednom mestu.
            </p>
          </div>
          
          <Tabs defaultValue="dunav" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dunav">Dunav osiguranje</TabsTrigger>
              <TabsTrigger value="generali">Generali</TabsTrigger>
              <TabsTrigger value="wiener">Wiener Städtische</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dunav">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <img 
                      src="https://www.dunav.com/wp-content/uploads/2018/07/dunav-logo.png" 
                      alt="Dunav osiguranje" 
                      className="h-10 mr-4" 
                    />
                    Dunav osiguranje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Dunav osiguranje je jedna od vodećih osiguravajućih kuća u Srbiji koja nudi sveobuhvatno kolektivno osiguranje zaposlenih od posledica nesrećnog slučaja.
                    </p>
                    <h4 className="font-semibold text-lg">Prednosti:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Tradicionalno pouzdan partner sa dugogodišnjim iskustvom</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Sveobuhvatna zaštita za sve vrste delatnosti</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Prilagođene ponude prema specifičnostima vašeg poslovanja</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Jednostavan proces prijave i brze isplate štete</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Zatražite ponudu</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="generali">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <img 
                      src="https://www.generali.rs/resources/img/logo/generali_logo_new.png" 
                      alt="Generali osiguranje" 
                      className="h-10 mr-4" 
                    />
                    Generali osiguranje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Generali osiguranje nudi fleksibilne pakete kolektivnog osiguranja prilagođene različitim potrebama poslodavaca i zaposlenih.
                    </p>
                    <h4 className="font-semibold text-lg">Prednosti:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Deo međunarodne grupacije sa globalnim iskustvom</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Konkurentne cene za male i srednje firme</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Digitalni pristup polisama i upravljanju osiguranjem</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Široka mreža zdravstvenih ustanova za lečenje</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Zatražite ponudu</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="wiener">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <img 
                      src="https://wiener.co.rs/wp-content/uploads/2023/09/logo.png" 
                      alt="Wiener Städtische" 
                      className="h-10 mr-4" 
                    />
                    Wiener Städtische
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Wiener Städtische osiguranje pruža kvalitetne programe kolektivnog osiguranja zaposlenih sa dodatnim benefitima.
                    </p>
                    <h4 className="font-semibold text-lg">Prednosti:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Inovativna rešenja osiguranja sa dodatnim pogodnostima</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Posebni paketi za visokorizična zanimanja</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Mogućnost kombinovanja sa dobrovoljnim zdravstvenim osiguranjem</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Transparentni uslovi i brza procedura isplate</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Zatražite ponudu</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Proces osiguranja */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Jednostavan proces do potpunog osiguranja</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Samo 4 koraka do kompletnog osiguranja vaših zaposlenih u skladu sa zakonom.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-bold mb-3">Zatražite ponudu</h3>
              <p className="text-gray-600">
                Popunite jednostavan formular sa osnovnim podacima o vašoj kompaniji i broju zaposlenih.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-bold mb-3">Konsultujte se sa ekspertom</h3>
              <p className="text-gray-600">
                Naši stručnjaci će vas kontaktirati i pomoći vam da razumete sve opcije osiguranja.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-bold mb-3">Izaberite najbolje rešenje</h3>
              <p className="text-gray-600">
                Na osnovu vaših potreba i preferencija, izaberite ponudu koja vam najviše odgovara.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-xl font-bold mb-3">Potpišite ugovor</h3>
              <p className="text-gray-600">
                Finalizujte proces potpisivanjem ugovora i obezbedite sigurnost vašim zaposlenima.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Najčešća pitanja</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Odgovori na pitanja koja poslodavci najčešće postavljaju o osiguranju zaposlenih.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Šta tačno pokriva kolektivno osiguranje zaposlenih?</h3>
                <p className="text-gray-700">
                  Kolektivno osiguranje pokriva najmanje smrt usled nesrećnog slučaja i trajni invaliditet. Proširene opcije mogu uključivati troškove lečenja, dnevne naknade za bolničke dane, i druge pogodnosti.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Da li je osiguranje zaposlenih obavezno po zakonu?</h3>
                <p className="text-gray-700">
                  Da, prema Zakonu o bezbednosti i zdravlju na radu, poslodavci su dužni da osiguraju zaposlene od povreda na radu i profesionalnih oboljenja.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Koliko košta kolektivno osiguranje zaposlenih?</h3>
                <p className="text-gray-700">
                  Cena zavisi od više faktora, uključujući broj zaposlenih, vrstu delatnosti, izabrani obim pokrića i osiguravajuću kuću. Za mala preduzeća, cena može biti već od nekoliko stotina dinara mesečno po zaposlenom.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Kako se prijavljuje šteta u slučaju povrede zaposlenog?</h3>
                <p className="text-gray-700">
                  Proces uključuje popunjavanje formulara za prijavu štete i dostavljanje medicinske dokumentacije koja potvrđuje povredu. Većina osiguravajućih kuća ima jednostavne online procedure za prijavu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Form */}
      <section id="contact-form" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ne čekajte nesreću da biste shvatili vrednost osiguranja!</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Popunite formular i dobićete besplatnu konsultaciju sa ekspertom i personalizovanu ponudu prilagođenu vašim potrebama.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Naziv kompanije *
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
                    Ime i prezime *
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Unesite vaše ime i prezime"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email adresa *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@company.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
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
                    Broj zaposlenih *
                  </label>
                  <Input
                    id="employeeCount"
                    name="employeeCount"
                    type="number"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    placeholder="Unesite broj zaposlenih"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Dodatne napomene
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Unesite dodatne informacije koje mogu biti važne za kreiranje ponude..."
                  className="h-32"
                />
              </div>
              
              <div className="text-center">
                <Button type="submit" size="lg" className="w-full md:w-auto px-8">
                  POŠALJI UPIT
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  Slanjem upita prihvatate našu politiku privatnosti. Nećemo deliti vaše podatke sa trećim licima.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
              <h3 className="text-xl font-bold mb-4">Korisni linkovi</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Blog</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">O nama</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Kontakt</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Politika privatnosti</a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">Uslovi korišćenja</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Kontaktirajte nas</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+381 11 123 4567</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>kontakt@bzr-portal.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Bulevar kralja Aleksandra 73<br />11000 Beograd, Srbija</span>
                </li>
              </ul>
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
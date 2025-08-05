import { storage } from '../storage';
import { blogStatusEnum } from '@shared/schema';
import { transliterate } from '../utils/transliterate';

interface SeedBlogPost {
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';
}

function generateSlug(title: string): string {
  const transliterated = transliterate(title.toLowerCase());
  return transliterated
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .trim();
}

const getRandomImageUrl = (category: string): string => {
  const imageMap: Record<string, string[]> = {
    'bezbednost-na-radu': [
      'https://images.unsplash.com/photo-1574269910231-bc508bcb68ae?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577131163847-3ff9cd0a8898?w=800&auto=format&fit=crop'
    ],
    'propisi': [
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop'
    ],
    'obuka': [
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop'
    ],
    'procena-rizika': [
      'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591439657848-9f4b9ce332a8?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1622186477895-f2af6a0f5a97?w=800&auto=format&fit=crop'
    ],
    'zaštitna-oprema': [
      'https://images.unsplash.com/photo-1587614298171-58fd8f9c8dde?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1614446662115-75f00df4c8e2?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602041077871-d36e53d31eec?w=800&auto=format&fit=crop'
    ]
  };

  // Default za kategorije koje nisu definisane
  const defaultImages = [
    'https://images.unsplash.com/photo-1526786220381-1d21eedf92bf?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=800&auto=format&fit=crop',
  ];

  const categoryImages = imageMap[category] || defaultImages;
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  return categoryImages[randomIndex];
};

const blogPostsData: SeedBlogPost[] = [
  {
    title: 'Kaznene odredbe Zakona o bezbednosti i zdravlju na radu: Obaveza osiguranja zaposlenih',
    content: `# Kaznene odredbe Zakona o bezbednosti i zdravlju na radu: Obaveza osiguranja zaposlenih

Zakon o bezbednosti i zdravlju na radu predstavlja temeljni pravni akt kojim se regulišu prava, obaveze i odgovornosti poslodavaca i zaposlenih u oblasti bezbednosti i zdravlja na radu. Novi zakon, koji je Narodna skupština Republike Srbije donela 28. aprila 2023. godine i koji je objavljen u "Službenom glasniku RS", broj 35/2023, donosi značajna unapređenja u cilju smanjenja povreda na radu, profesionalnih bolesti i bolesti u vezi sa radom.

## Pravni okvir za bezbednost i zdravlje na radu

Zakon o bezbednosti i zdravlju na radu uređuje unapređivanje i sprovođenje mera bezbednosti i zdravlja na radu lica koja učestvuju u radnim procesima, kao i lica koja se zateknu u radnoj sredini. Cilj ovog zakona je sprečavanje povreda na radu, profesionalnih bolesti i bolesti u vezi sa radom, definisanje opštih načela prevencije, prava posebnih grupa zaposlenih, obaveza poslodavaca, prava i obaveza zaposlenih.

Ovaj zakon se primenjuje na državne organe, organe autonomnih pokrajina, organe jedinica lokalne samouprave, privredna društva, druga pravna i fizička lica, u svim delatnostima. Jedini izuzeci odnose se na poslove iz oblasti odbrane, policijske poslove i poslove zaštite i spasavanja, gde su ova pitanja regulisana posebnim zakonima.

## Kaznene odredbe i njihov značaj

Kaznene odredbe Zakona o bezbednosti i zdravlju na radu definisane su članovima 100 i 101, i predviđaju novčane kazne za različite prekršaje poslodavaca. Ove odredbe imaju izuzetno važnu ulogu u obezbeđivanju poštovanja zakona i zaštiti prava zaposlenih. Visina kazni varira u zavisnosti od težine prekršaja i statusa poslodavca (pravno lice, preduzetnik, fizičko lice ili odgovorno lice).

### Član 100 - Teži prekršaji i visoke novčane kazne

Član 100 predviđa kazne od 1.500.000 do 2.000.000 dinara za poslodavca sa svojstvom pravnog lica za najteže prekršaje, kao što su:

- Neobezbeđivanje i nesprovođenje preventivnih mera bezbednosti i zdravlja na radu - odnosi se na obavezu poslodavca da primenjuje sve mere predviđene zakonom kako bi zaštitio zdravlje zaposlenih (član 9. stav 1)

- Nezaustavljanje rada koji predstavlja ozbiljnu i neposrednu opasnost - poslodavac je dužan da zaustavi svaki rad koji bi mogao ugroziti zdravlje i život zaposlenih (član 15. stav 1. tačka 10)

- Nedostavljanje prijave o povredi na radu - poslodavac je dužan da u roku od 24 časa prijavi svaku težu, smrtnu ili kolektivnu povredu nadležnim organima (član 64. stav 1)

Za prekršaje iz člana 100, preduzetnici se kažnjavaju novčanom kaznom od 400.000 do 500.000 dinara, a odgovorna lica i fizička lica novčanom kaznom od 50.000 do 150.000 dinara.

### Član 101 - Značajni prekršaji i obavezno osiguranje zaposlenih

Član 101 propisuje kazne od 1.000.000 do 1.500.000 dinara za poslodavca sa svojstvom pravnog lica za prekršaje koji uključuju, između ostalog:

- Neutvrđivanje prava, obaveza i odgovornosti u oblasti bezbednosti i zdravlja na radu opštim aktom (član 14)

- Nezaključivanje sporazuma o primeni mera za bezbednost i zdravlje na radu sa drugim poslodavcem sa kojim deli radni prostor (član 24)

- Nedovoljno obaveštavanje zaposlenih o opasnostima i štetnostima u radnom procesu (član 15. stav 1. tačka 3)

## Obaveza osiguranja zaposlenih i kazne za nepoštovanje

Posebno značajna odredba sadržana u članu 101. tačka 20. odnosi se na obavezu poslodavca da zaposlene osigura za slučaj povreda na radu i profesionalnih bolesti, radi obezbeđivanja naknade štete (član 67. stav 1).

Ova obaveza podrazumeva da je svaki poslodavac dužan da obezbedi adekvatno osiguranje za svoje zaposlene koje će pokriti eventualne povrede na radu i profesionalne bolesti. Cilj ove odredbe je da se zaposlenima obezbedi finansijska sigurnost u slučaju povrede ili bolesti nastale na radu ili u vezi sa radom.

### Visina kazni za neosiguravanje zaposlenih

Ukoliko poslodavac ne ispuni obavezu osiguranja zaposlenih, zakon predviđa sledeće novčane kazne:

- Za poslodavca sa svojstvom pravnog lica: 1.000.000 do 1.500.000 dinara
- Za poslodavca koji je preduzetnik: 200.000 do 400.000 dinara
- Za direktora ili drugo odgovorno lice kod poslodavca: 30.000 do 150.000 dinara
- Za poslodavca koji je fizičko lice: 30.000 do 150.000 dinara

Ove kazne pokazuju da zakonodavac pridaje veliki značaj zaštiti zaposlenih kroz osiguranje, i da nepoštovanje ove obaveze povlači značajne finansijske sankcije.

## Značaj osiguranja zaposlenih za bezbednost i zdravlje na radu

Obavezno osiguranje zaposlenih od povreda na radu i profesionalnih bolesti ima višestruki značaj:

- Obezbeđuje finansijsku sigurnost zaposlenima u slučaju nesreće ili bolesti nastale na radu
- Stimuliše poslodavce da ulažu u preventivne mere bezbednosti i zdravlja na radu
- Smanjuje potencijalne sudske sporove između poslodavaca i zaposlenih
- Olakšava rehabilitaciju i povratak na rad nakon povrede ili bolesti

## Praktični aspekti obaveznog osiguranja

Poslodavci bi trebalo da obrate pažnju na sledeće aspekte prilikom osiguranja svojih zaposlenih:

- Osiguranje treba da pokrije sve zaposlene, uključujući i one sa privremenim i povremenim angažovanjem
- Polisa osiguranja treba da odgovara proceni rizika na radnim mestima
- Visina osiguranja treba da bude adekvatna za pokrivanje potencijalnih šteta
- Osiguranje treba redovno obnavljati i ažurirati prema promenama u radnom procesu i broju zaposlenih

## Zaključak

Novi Zakon o bezbednosti i zdravlju na radu doneo je značajna unapređenja u oblasti zaštite zaposlenih, uključujući i jasne kaznene odredbe za poslodavce koji ne ispunjavaju svoje zakonske obaveze. Obaveza osiguranja zaposlenih za slučaj povreda na radu i profesionalnih bolesti predstavlja važan element u sistemu zaštite zaposlenih, a nepridržavanje ove obaveze povlači značajne novčane kazne.

Poslodavci bi trebalo da shvate osiguranje zaposlenih ne samo kao zakonsku obavezu čije nepoštovanje povlači kazne, već i kao investiciju u stabilnost poslovanja i dobrobit zaposlenih. Adekvatno osiguranje štiti kako zaposlene tako i poslodavce od nepredviđenih finansijskih troškova koji mogu nastati usled povreda na radu i profesionalnih bolesti.

Poštovanje zakonske obaveze osiguranja zaposlenih predstavlja temelj odgovornog poslovanja i doprinosi stvaranju bezbednog i zdravog radnog okruženja za sve zaposlene.`,
    excerpt: 'Detaljno objašnjenje kaznenih odredbi Zakona o bezbednosti i zdravlju na radu, s posebnim osvrtom na obavezu osiguranja zaposlenih prema članu 67 i kazne za nepoštovanje ove obaveze prema članu 101.',
    imageUrl: '/kaznene-odredbe-banner.svg',
    category: 'propisi',
    tags: ['zakon', 'kazne', 'osiguranje', 'član 67', 'član 101'],
    status: 'published'
  },
  {
    title: 'Zakon o bezbednosti i zdravlju na radu: Šta svaki poslodavac mora znati',
    content: `
# Zakon o bezbednosti i zdravlju na radu: Šta svaki poslodavac mora znati

Zakon o bezbednosti i zdravlju na radu predstavlja temeljni pravni akt koji reguliše oblast zaštite na radu u Republici Srbiji. Za svakog poslodavca, nezavisno od veličine preduzeća i delatnosti kojom se bavi, poznavanje ovog zakona je od ključnog značaja.

## Osnovni principi Zakona

Zakon o bezbednosti i zdravlju na radu ("Sl. glasnik RS", br. 101/2005, 91/2015 i 113/2017 - dr. zakon) postavlja okvir za stvaranje bezbednih i zdravih uslova rada. Osnovni principi na kojima se zasniva ovaj zakon su:

1. **Prevencija**: Sprečavanje povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom
2. **Odgovornost poslodavca**: Poslodavac snosi primarnu odgovornost za sprovođenje mera bezbednosti i zdravlja na radu
3. **Sveobuhvatnost**: Zaštita se odnosi na sve zaposlene, kao i na sve osobe koje se po bilo kom osnovu nalaze u radnoj okolini

## Ključne obaveze poslodavca

Prema Zakonu, poslodavac je dužan da:

- Donese **Akt o proceni rizika** za sva radna mesta
- Obezbedi zaposlenima rad na radnom mestu i u radnoj okolini u kojima su sprovedene mere bezbednosti i zdravlja na radu
- Izvrši **osposobljavanje zaposlenih** za bezbedan i zdrav rad
- Obezbedi zaposlenima korišćenje sredstava i opreme za ličnu zaštitu na radu
- Obezbedi održavanje sredstava za rad i sredstava i opreme za ličnu zaštitu na radu u ispravnom stanju
- Angažuje pravno lice sa licencom radi sprovođenja preventivnih i periodičnih pregleda i provere opreme za rad
- Obezbedi na osnovu akta o proceni rizika i ocene službe medicine rada **propisane lekarske preglede** zaposlenih
- Osigura zaposlene od povreda na radu, profesionalnih oboljenja i oboljenja u vezi sa radom

## Član 47: Kada poslodavac može sam obavljati poslove bezbednosti i zdravlja na radu

Posebno je značajan **član 47** Zakona koji propisuje pod kojim uslovima poslodavac može sam obavljati poslove bezbednosti i zdravlja na radu:

> Poslodavac u delatnostima trgovine na malo, usluga smeštaja i ishrane, informisanja i komunikacija, finansijskim i osiguranja, poslovanja nekretninama, stručnim, naučnim, inovacionim, administrativnim i pomoćnim uslužnim delatnostima, obaveznog socijalnog osiguranja, obrazovanja, umetnosti, zabave i rekreacije, kao i ostalim uslužnim delatnostima, koji ima do 20 zaposlenih, poslove bezbednosti i zdravlja na radu može obavljati sam.

Ova odredba omogućava manjim preduzećima u navedenim delatnostima da uštede na angažovanju eksternog lica za bezbednost i zdravlje na radu, ali podrazumeva da poslodavac mora biti osposobljen za obavljanje ovih poslova.

## Kazne za nepoštovanje Zakona

Nepridržavanje odredbi Zakona o bezbednosti i zdravlju na radu povlači prekršajnu odgovornost poslodavca. Kazne su značajne:

- Za pravno lice: od 800.000 do 1.000.000 dinara
- Za odgovorno lice u pravnom licu: od 40.000 do 50.000 dinara
- Za preduzetnika: od 300.000 do 500.000 dinara

## Zaključak

Investiranje u bezbednost i zdravlje na radu nije samo zakonska obaveza, već i ekonomski opravdana odluka. Ulaganjem u prevenciju, poslodavci izbegavaju potencijalne troškove koji nastaju kao posledica povreda na radu, profesionalnih oboljenja, prekida procesa rada, i prekršajnih kazni.

Za detaljnije informacije, možete konsultovati pun tekst [Zakona o bezbednosti i zdravlju na radu](https://www.paragraf.rs/propisi/zakon_o_bezbednosti_i_zdravlju_na_radu.html).

**Izvor:** Paragraf.rs - Zakon o bezbednosti i zdravlju na radu
    `,
    excerpt: 'Pregled ključnih obaveza poslodavaca prema Zakonu o bezbednosti i zdravlju na radu, sa posebnim osvrtom na Član 47 koji omogućava malim preduzećima da sama obavljaju poslove BZR.',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop',
    category: 'propisi',
    tags: ['zakon', 'propisi', 'obaveze poslodavca', 'kazne', 'član 47'],
    status: 'published'
  },
  {
    title: 'Procena rizika na radnom mestu: Korak po korak vodič',
    content: `
# Procena rizika na radnom mestu: Korak po korak vodič

Procena rizika predstavlja sistemski proces identifikacije, analize i evaluacije potencijalnih opasnosti i štetnosti na radnom mestu, sa ciljem da se utvrdi nivo rizika i definišu adekvatne mere za njihovo otklanjanje ili kontrolu. Ovaj dokument je ključan za svaku organizaciju, jer predstavlja temelj za efikasno upravljanje bezbednošću i zdravljem na radu.

## Zakonski okvir

Prema Zakonu o bezbednosti i zdravlju na radu i Pravilniku o načinu i postupku procene rizika na radnom mestu i u radnoj okolini ("Sl. glasnik RS", br. 72/2006, 84/2006 - ispr., 30/2010 i 102/2015), procena rizika je obaveza svakog poslodavca u Republici Srbiji.

## Proces procene rizika: 5 ključnih koraka

### 1. Priprema i planiranje

Prvi korak podrazumeva formiranje tima za procenu rizika, definisanje metodologije i prikupljanje relevantnih informacija. Tim treba da uključi:
- Lice za bezbednost i zdravlje na radu
- Predstavnike zaposlenih
- Službu medicine rada
- Rukovodioce organizacionih jedinica

Potrebno je prikupiti:
- Akt o sistematizaciji radnih mesta
- Podatke o prethodnim povredama i profesionalnim oboljenjima
- Izveštaje o ispitivanju uslova radne okoline
- Izveštaje o pregledima i ispitivanjima opreme za rad
- Uputstva za bezbedan rad

### 2. Identifikacija opasnosti i štetnosti

U ovoj fazi je potrebno identifikovati sve potencijalne opasnosti i štetnosti za svako radno mesto. One se mogu grupisati kao:

**Mehaničke opasnosti**:
- Opasnost od rotirajućih delova
- Opasnost od alata i oštrica
- Opasnost od padova i klizanja

**Opasnosti od električne struje**:
- Opasnost od direktnog i indirektnog dodira
- Opasnost od statičkog elektriciteta

**Štetnosti u procesu rada**:
- Hemijske štetnosti (gasovi, pare, prašina)
- Fizičke štetnosti (buka, vibracije, zračenje)
- Biološke štetnosti (virusi, bakterije)

**Psihofizički napori**:
- Nefiziološki položaj tela
- Napori pri obavljanju određenih poslova
- Psihičko opterećenje

### 3. Procena rizika za identifikovane opasnosti i štetnosti

Za svaku identifikovanu opasnost i štetnost potrebno je proceniti:
- **Verovatnoću nastanka** (mala, srednja, velika)
- **Težinu posledice** (laka, srednja, teška, fatalna)
- **Učestalost izlaganja** (retko, povremeno, često, kontinuirano)

Na osnovu ovih parametara određuje se **nivo rizika** koji može biti:
- Zanemarljiv (nije potrebno preduzimati mere)
- Mali (poželjno je planirati i preduzeti mere)
- Umeren (potrebno je preduzeti mere u definisanom roku)
- Visok (potrebno je odmah preduzeti mere)
- Ekstremni (rad mora biti zaustavljen dok se rizik ne smanji)

### 4. Utvrđivanje mera za kontrolu rizika

Za svaki identifikovani rizik potrebno je definisati mere za njegovo otklanjanje ili smanjenje na prihvatljiv nivo. Mere mogu biti:

- **Eliminacija rizika** (potpuno uklanjanje opasnosti)
- **Zamena** (zamena opasnog materijala ili procesa manje opasnim)
- **Inženjerske kontrole** (fizičke barijere, ventilacija, izolacija)
- **Administrativne mere** (procedure, uputstva, obuka, znakovi upozorenja)
- **Lična zaštitna oprema** (kao poslednja linija odbrane)

### 5. Implementacija i revizija

Nakon definisanja mera, potrebno je:
- Izraditi i usvojiti Akt o proceni rizika
- Implementirati definisane mere
- Pratiti efikasnost implementiranih mera
- Vršiti periodičnu reviziju procene rizika (najmanje jednom u 3 godine)
- Ažurirati procenu rizika nakon svake promene u radnom procesu

## Sadržaj Akta o proceni rizika

Akt o proceni rizika mora sadržati:
1. Opšte podatke o poslodavcu
2. Opis tehnološkog i radnog procesa
3. Podatke o radnim mestima koja su procenjena
4. Prepoznavanje i utvrđivanje opasnosti i štetnosti
5. Procenu rizika u odnosu na opasnosti i štetnosti
6. Utvrđivanje načina i mera za otklanjanje, smanjenje ili sprečavanje rizika
7. Zaključak
8. Izmene i dopune akta o proceni rizika
9. Podatke o licima koja su učestvovala u proceni rizika

## Zaključak

Procena rizika nije samo zakonska obaveza, već i ključni alat za prevenciju povreda na radu i profesionalnih oboljenja. Kvalitetno sprovedena procena rizika omogućava poslodavcu da identifikuje potencijalne probleme pre nego što dovedu do neželjenih posledica, što dugoročno doprinosi većoj produktivnosti i smanjenju troškova.

**Izvor:** Uprava za bezbednost i zdravlje na radu, Ministarstvo rada, zapošljavanja i socijalne politike
    `,
    excerpt: 'Detaljan vodič za sprovođenje procene rizika na radnom mestu, od pripremne faze do implementacije mera za smanjenje rizika, u skladu sa važećim zakonskim propisima.',
    imageUrl: 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=800&auto=format&fit=crop',
    category: 'procena-rizika',
    tags: ['procena rizika', 'opasnosti', 'štetnosti', 'mere zaštite', 'akt o proceni rizika'],
    status: 'published'
  },
  {
    title: 'Značaj lične zaštitne opreme na radnom mestu',
    content: `
# Značaj lične zaštitne opreme na radnom mestu

Lična zaštitna oprema (LZO) predstavlja poslednju liniju odbrane radnika od opasnosti i štetnosti na radnom mestu. Iako se u hijerarhiji kontrolnih mera nalazi na poslednjem mestu, nakon eliminacije rizika, inženjerskih i administrativnih kontrola, njena uloga je nezamenljiva u situacijama kada ostale mere nisu dovoljne za adekvatnu zaštitu zaposlenih.

## Šta je lična zaštitna oprema?

Lična zaštitna oprema obuhvata svu opremu koju zaposleni nose ili koriste radi zaštite od jedne ili više opasnosti i štetnosti koje mogu ugroziti njihovu bezbednost i zdravlje na radnom mestu, kao i svaki dodatak ili pribor namenjen za tu svrhu.

## Zakonska regulativa

U Republici Srbiji, obaveza obezbeđivanja i korišćenja lične zaštitne opreme regulisana je:
- Zakonom o bezbednosti i zdravlju na radu
- Pravilnikom o preventivnim merama za bezbedan i zdrav rad pri korišćenju sredstava i opreme za ličnu zaštitu na radu
- Pravilnikom o ličnoj zaštitnoj opremi

Poslodavac je dužan da obezbedi ličnu zaštitnu opremu koja ispunjava propisane tehničke zahteve, da je održava u ispravnom stanju i obezbeđuje njenu zamenu u slučaju oštećenja. Takođe, poslodavac mora osigurati da zaposleni budu obučeni za pravilno korišćenje LZO.

## Vrste lične zaštitne opreme

### 1. Zaštita glave

**Zaštitni šlemovi** pružaju zaštitu od:
- Padajućih predmeta
- Udara u glavu
- Kontakta sa električnim vodovima
- Prskanja hemikalija
- UV zračenja

**Preporuke za upotrebu:**
- Građevinarstvo
- Rudarstvo
- Šumarstvo
- Rad na visini
- Električni radovi

### 2. Zaštita očiju i lica

**Zaštitne naočare, viziri i štitnici za lice** štite od:
- Letećih čestica i krhotina
- Hemijskih prskanja
- Prašine
- Zračenja (UV, IR)
- Zaslepljujućeg sjaja

**Preporuke za upotrebu:**
- Brušenje i sečenje
- Zavarivanje
- Rad sa hemikalijama
- Rad sa laserima
- Medicinski postupci

### 3. Zaštita sluha

**Čepići za uši i antifoni** pružaju zaštitu od:
- Industrijske buke
- Impulsne buke
- Dugotrajne izloženosti buci

**Preporuke za upotrebu:**
- Rad sa bučnim mašinama
- Rad u blizini aviona
- Koncertna produkcija
- Građevinski radovi
- Drvna industrija

### 4. Zaštita organa za disanje

**Respiratori, maske i aparati za disanje** štite od:
- Prašine i čestica
- Dimova i magli
- Gasova i para
- Nedostatka kiseonika

**Preporuke za upotrebu:**
- Rad sa hemikalijama
- Rad u zatvorenim prostorima
- Bojenje i lakiranje
- Obrada drveta
- Rad sa azbestom

### 5. Zaštita ruku

**Rukavice** pružaju zaštitu od:
- Mehaničkih povreda (posekotine, ogrebotine)
- Hemikalija
- Ekstremnih temperatura
- Bioloških agenasa
- Električne struje

**Preporuke za upotrebu:**
- Rukovanje oštrim predmetima
- Rad sa hemikalijama
- Rad sa vrućim materijalima
- Medicinski postupci
- Električni radovi

### 6. Zaštita nogu

**Zaštitne cipele i čizme** štite od:
- Padajućih predmeta
- Probijanja đona
- Klizanja
- Električne struje
- Hemikalija

**Preporuke za upotrebu:**
- Građevinarstvo
- Rad u skladištima
- Rad sa teškim materijalima
- Rad na klizavim površinama
- Rad sa električnim instalacijama

### 7. Zaštita tela

**Zaštitna odeća** pruža zaštitu od:
- Mehaničkih opasnosti
- Hemikalija
- Ekstremnih temperatura
- Loših vremenskih uslova
- Bioloških agenasa

**Preporuke za upotrebu:**
- Rad sa hemikalijama
- Rad na otvorenom
- Rad u hladnjačama
- Rad sa vrućim materijalima
- Medicinski postupci

### 8. Zaštita od pada sa visine

**Sigurnosni pojasevi i opreme za rad na visini** štite od:
- Pada sa visine
- Pada u dubinu

**Preporuke za upotrebu:**
- Rad na konstrukcijama
- Montažni radovi
- Rad na krovovima
- Rad na stubovima i tornjevima
- Rad na skelama

## Pravilna upotreba lične zaštitne opreme

Za maksimalnu efikasnost lične zaštitne opreme, neophodno je:

1. **Odabrati odgovarajuću LZO** za specifične opasnosti i štetnosti
2. **Osigurati pravilan fit** - LZO mora odgovarati korisniku
3. **Pravilno održavati LZO** - redovno čišćenje, pregled i zamena oštećenih delova
4. **Obučiti zaposlene** za pravilno korišćenje, skladištenje i održavanje
5. **Nadzirati korišćenje** - osigurati da se LZO koristi kada i kako je propisano

## Zaključak

Lična zaštitna oprema predstavlja kritičnu komponentu sistema bezbednosti i zdravlja na radu. Iako treba težiti eliminaciji opasnosti i štetnosti na radnom mestu, u mnogim situacijama to nije u potpunosti moguće. U takvim okolnostima, kvalitetna LZO koja se pravilno koristi može biti razlika između bezbednog radnog dana i ozbiljne povrede.

Investiranje u kvalitetnu ličnu zaštitnu opremu i obuku zaposlenih za njeno pravilno korišćenje nije samo zakonska obaveza, već i pokazatelj odgovornog poslovanja i brige o najvrednijem resursu svake organizacije - njenim zaposlenima.

**Izvor:** Institut za standardizaciju Srbije, Uprava za bezbednost i zdravlje na radu
    `,
    excerpt: 'Pregled različitih vrsta lične zaštitne opreme, njihove namene i pravilne upotrebe, sa fokusom na zakonske obaveze poslodavaca i značaj LZO u prevenciji povreda na radu.',
    imageUrl: 'https://images.unsplash.com/photo-1587614298171-58fd8f9c8dde?w=800&auto=format&fit=crop',
    category: 'zaštitna-oprema',
    tags: ['lična zaštitna oprema', 'LZO', 'zaštita na radu', 'zaštitna sredstva', 'sigurnost'],
    status: 'published'
  },
  {
    title: 'Osposobljavanje zaposlenih za bezbedan i zdrav rad',
    content: `
# Osposobljavanje zaposlenih za bezbedan i zdrav rad

Osposobljavanje zaposlenih za bezbedan i zdrav rad predstavlja jedan od temelja sistema bezbednosti i zdravlja na radu. Dobro obučeni zaposleni koji razumeju potencijalne opasnosti svog radnog mesta i znaju kako da primene mere zaštite, ključni su za prevenciju povreda, profesionalnih oboljenja i nesreća na radu.

## Zakonski okvir

Prema Zakonu o bezbednosti i zdravlju na radu Republike Srbije, poslodavac je dužan da izvrši osposobljavanje zaposlenih za bezbedan i zdrav rad kod:
- Zasnivanja radnog odnosa
- Premeštaja na druge poslove
- Uvođenja nove tehnologije ili novih sredstava za rad
- Promene procesa rada koja može prouzrokovati promenu mera za bezbedan i zdrav rad

Osposobljavanje se mora sprovoditi u toku radnog vremena, a troškovi osposobljavanja ne mogu biti na teret zaposlenih.

## Pravilnik o programu, načinu i visini troškova polaganja stručnog ispita za obavljanje poslova bezbednosti i zdravlja na radu i poslova odgovornog lica

Ovaj pravilnik detaljno reguliše postupak osposobljavanja zaposlenih i precizira:
- Sadržaj teorijskog i praktičnog dela osposobljavanja
- Način provere osposobljenosti
- Vođenje evidencije o osposobljavanju
- Periodičnu proveru osposobljenosti (najmanje jednom u 4 godine)

## Proces osposobljavanja zaposlenih

### 1. Teorijska obuka

Teorijski deo osposobljavanja obuhvata:

**Opšti deo**:
- Prava, obaveze i odgovornosti zaposlenih u oblasti bezbednosti i zdravlja na radu
- Upoznavanje sa zakonskom regulativom
- Organizacija bezbednosti i zdravlja na radu kod poslodavca

**Posebni deo**:
- Specifične opasnosti i štetnosti na radnom mestu
- Mere za bezbedan rad u odnosu na identifikovane opasnosti
- Postupci u slučaju povrede na radu ili vanredne situacije
- Pravilna upotreba sredstava i opreme za rad
- Pravilna upotreba lične zaštitne opreme

### 2. Praktična obuka

Praktični deo osposobljavanja obuhvata:
- Demonstraciju pravilnih radnih postupaka
- Praktičnu primenu mera za bezbedan rad
- Pravilno korišćenje sredstava za rad
- Pravilno korišćenje lične zaštitne opreme
- Postupanje u slučaju vanrednih situacija

### 3. Provera osposobljenosti

Nakon završene teorijske i praktične obuke, vrši se provera osposobljenosti zaposlenih kroz:
- Teorijski test znanja
- Praktičnu proveru radnih veština

Zaposleni koji uspešno položi proveru osposobljenosti dobija potvrdu o osposobljenosti za bezbedan i zdrav rad.

## Sadržaj programa osposobljavanja

Program osposobljavanja mora biti prilagođen specifičnostima svakog radnog mesta i obuhvatati:

### 1. Opšte mere bezbednosti i zdravlja na radu

- Pravila ponašanja u radnom prostoru
- Znakovi upozorenja i obaveštenja
- Putevi i izlazi za evakuaciju
- Postupci u slučaju požara ili druge vanredne situacije
- Prva pomoć i procedura prijavljivanja povreda

### 2. Specifične mere za konkretno radno mesto

- Karakteristične opasnosti i štetnosti radnog mesta
- Specifične mere zaštite
- Pravilni radni postupci
- Pravilna upotreba alata, mašina i opreme
- Specifična lična zaštitna oprema i način korišćenja

### 3. Praktična demonstracija

- Pokazivanje pravilnih radnih postupaka
- Demonstracija pravilne upotrebe opreme
- Demonstracija pravilnog korišćenja LZO
- Simulacija postupanja u vanrednim situacijama

## Periodično osposobljavanje

Periodično osposobljavanje se vrši:
- U intervalima ne dužim od 4 godine
- Nakon svake teže povrede na radu
- Nakon promene tehnologije ili radnog procesa
- Na zahtev inspektora rada

## Dokumentacija o osposobljavanju

Poslodavac je dužan da vodi evidenciju o osposobljavanju koja mora sadržati:
1. Ime i prezime zaposlenog
2. Naziv radnog mesta
3. Datum zasnivanja radnog odnosa
4. Datume sprovedenog osposobljavanja (teorijskog i praktičnog)
5. Datum provere osposobljenosti
6. Potpis zaposlenog i lica za bezbednost i zdravlje na radu

## Kvalitet osposobljavanja

Kvalitetno osposobljavanje treba da:
1. Bude prilagođeno obrazovnom nivou zaposlenih
2. Koristi razumljiv jezik i terminologiju
3. Kombinuje različite metode učenja (prezentacije, video materijale, praktične vežbe)
4. Uključuje aktivno učešće zaposlenih
5. Bude redovno ažurirano u skladu sa novim saznanjima i promenama u radnom procesu

## Zaključak

Osposobljavanje zaposlenih za bezbedan i zdrav rad nije samo zakonska obaveza, već ključni element preventivnog delovanja u oblasti bezbednosti i zdravlja na radu. Dobro osposobljeni zaposleni svesni su rizika svog radnog mesta i sposobni da primene mere zaštite, što direktno doprinosi smanjenju broja povreda i profesionalnih oboljenja.

Investiranje u kvalitetno osposobljavanje zaposlenih dugoročno donosi višestruke koristi: smanjenje broja povreda i bolovanja, povećanje produktivnosti, poboljšanje kvaliteta rada i stvaranje kulture bezbednosti u radnoj organizaciji.

**Izvor:** Uprava za bezbednost i zdravlje na radu, Ministarstvo rada, zapošljavanja i socijalne politike
    `,
    excerpt: 'Kompletan vodič za organizaciju i sprovođenje osposobljavanja zaposlenih za bezbedan i zdrav rad, sa osvrtom na zakonske obaveze, sadržaj programa i dokumentaciju.',
    imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop',
    category: 'obuka',
    tags: ['osposobljavanje', 'obuka', 'edukacija', 'bezbednost na radu', 'trening'],
    status: 'published'
  },
  {
    title: 'Prva pomoć na radnom mestu: Šta svaki poslodavac mora obezbediti',
    content: `
# Prva pomoć na radnom mestu: Šta svaki poslodavac mora obezbediti

Pružanje prve pomoći na radnom mestu predstavlja ključni element u minimiziranju posledica povreda i iznenadnih oboljenja zaposlenih. Brza i adekvatna reakcija u prvim minutima nakon incidenta često može biti presudna za ishod povređenog ili obolelog.

## Zakonski okvir

U Republici Srbiji, obaveza poslodavca da obezbedi pružanje prve pomoći regulisana je:
- Zakonom o bezbednosti i zdravlju na radu
- Pravilnikom o načinu pružanja prve pomoći, vrsti sredstava i opreme koji moraju biti obezbeđeni na radnom mestu, načinu i rokovima osposobljavanja zaposlenih za pružanje prve pomoći

Prema ovim propisima, poslodavac je dužan da obezbedi:
1. Opremu i sredstva za pružanje prve pomoći
2. Osposobljene zaposlene za pružanje prve pomoći
3. Procedure za postupanje u slučaju povrede ili iznenadnog oboljenja

## Oprema za pružanje prve pomoći

### Ormarić za prvu pomoć

Svaki poslodavac mora obezbediti odgovarajući broj ormarića za prvu pomoć koji moraju biti:
- Jasno obeleženi oznakom crvenog krsta
- Postavljeni na vidljivim i lako dostupnim mestima
- Zaštićeni od prašine, vlage i ekstremnih temperatura
- Redovno kontrolisani i dopunjavani

### Sadržaj ormarića za prvu pomoć

Prema Pravilniku, ormarić za prvu pomoć mora sadržati:

**Sanitetski materijal**:
- Sterilna gaza (različitih dimenzija)
- Zavoji (različitih dimenzija)
- Adhezivni zavojni materijal
- Sterilne komprese
- Trougle marame
- Sigurnosne igle
- Elastični zavoji
- Vata

**Pribor**:
- Makaze sa zaobljenim vrhom
- Pinceta
- Rukavice za jednokratnu upotrebu
- Maska za veštačko disanje
- Termometar
- Folija za opekotine
- Alkohol za dezinfekciju
- Antiseptički rastvor

**Dodatna oprema** (u zavisnosti od specifičnih rizika radnog mesta):
- Sredstva za zaustavljanje krvarenja
- Priručna sredstva za imobilizaciju
- Automatski spoljni defibrilator (AED)
- Nosila

## Osposobljavanje zaposlenih za pružanje prve pomoći

### Broj osposobljenih zaposlenih

Prema Pravilniku, poslodavac mora osposobiti određeni broj zaposlenih za pružanje prve pomoći:
- Najmanje 2% od ukupnog broja zaposlenih u jednoj smeni
- Najmanje 5 zaposlenih u objektima sa visokim rizikom
- Najmanje jedan zaposleni u izdvojenim organizacionim jedinicama

### Program osposobljavanja

Program osposobljavanja za pružanje prve pomoći obuhvata:

**Teoretski deo**:
- Principi prve pomoći
- Procena stanja povređenog ili obolelog
- Postupci pozivanja hitne medicinske pomoći
- Poznavanje sadržaja i načina korišćenja opreme za prvu pomoć

**Praktični deo**:
- Kardiopulmonalna reanimacija (KPR)
- Zaustavljanje krvarenja
- Imobilizacija preloma i iščašenja
- Postupanje kod opekotina
- Postupanje kod gušenja stranim telom
- Stavljanje povređenog u bočni položaj

### Dokumentacija o osposobljenosti

Poslodavac mora voditi evidenciju o zaposlenima osposobljenim za pružanje prve pomoći koja sadrži:
- Ime i prezime zaposlenog
- Datum osposobljavanja
- Naziv institucije koja je vršila osposobljavanje
- Nivo osposobljenosti

## Procedure za pružanje prve pomoći

Poslodavac je dužan da izradi i istakne procedure za pružanje prve pomoći koje sadrže:

1. **Postupak u slučaju povrede ili iznenadnog oboljenja**:
   - Osiguranje bezbednosti mesta događaja
   - Procena stanja povređenog
   - Pozivanje osposobljenog lica za pružanje prve pomoći
   - Pozivanje hitne medicinske pomoći

2. **Postupak obaveštavanja**:
   - Koga obavestiti o događaju (rukovodioca, službu BZR)
   - Brojevi telefona hitnih službi
   - Način dokumentovanja incidenta

3. **Spisak osposobljenih lica** za pružanje prve pomoći sa kontakt podacima

## Specific situacije i postupci prve pomoći

### 1. Kardiopulmonalna reanimacija (KPR)

Osnovni postupak za osobu bez svesti koja ne diše:
1. Proveriti svest i disanje
2. Pozvati hitnu pomoć
3. Postaviti žrtvu na čvrstu podlogu
4. Započeti kompresije grudnog koša (30 kompresija)
5. Dati 2 udaha veštačkog disanja
6. Nastaviti sa odnosom 30:2 do dolaska hitne pomoći ili znakova života

### 2. Zaustavljanje krvarenja

Postupak kod jačeg krvarenja:
1. Pritisnuti ranu sterilnom gazom
2. Podići ekstremitet iznad nivoa srca (ako je moguće)
3. Primeniti direktan pritisak na ranu
4. Postaviti kompresivni zavoj
5. U ekstremnim slučajevima, primeniti podvezu (samo obučeno osoblje)

### 3. Postupak kod preloma

Osnovni postupak:
1. Imobilisati povređeni deo tela
2. Ne pokušavati vraćanje kosti u normalan položaj
3. Pričvrstiti udlagu iznad i ispod mesta preloma
4. Lediti mesto povrede (umotan led)
5. Podići ekstremitet ako je moguće

### 4. Postupak kod opekotina

Postupak prve pomoći:
1. Hladiti opekotinu hladnom (ne ledenom) vodom 10-20 minuta
2. Skinuti nakit i tesnu odeću pre nego što nastupi otok
3. Pokriti opekotinu sterilnom gazom
4. Ne bušiti plikove
5. Ne stavljati kreme, masti, ulja ili kućne lekove na opekotine

## Značaj treninga i simulacija

Redovni treninzi i simulacije incidenata znatno povećavaju efikasnost pružanja prve pomoći kroz:
- Održavanje veština pružalaca prve pomoći
- Uvežbavanje procedura i timskog rada
- Identifikaciju potencijalnih problema u sistemu pružanja prve pomoći
- Smanjenje vremena reakcije u stvarnim situacijama

## Zaključak

Organizacija sistema prve pomoći na radnom mestu nije samo zakonska obaveza poslodavca, već i moralna odgovornost prema zaposlenima. Pravovremena i adekvatna prva pomoć može spasiti život, smanjiti komplikacije povrede i ubrzati oporavak.

Ulaganje u kvalitetnu opremu za prvu pomoć i temeljno osposobljavanje zaposlenih predstavlja investiciju u bezbednost na radu koja se višestruko isplati kroz očuvanje zdravlja zaposlenih, smanjenje odsustva sa posla i stvaranje sigurnijeg radnog okruženja.

**Izvor:** Crveni krst Srbije, Uprava za bezbednost i zdravlje na radu
    `,
    excerpt: 'Pregled zakonskih obaveza poslodavaca vezanih za organizaciju pružanja prve pomoći na radnom mestu, opremu koja mora biti obezbeđena i postupke osposobljavanja zaposlenih.',
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop',
    category: 'bezbednost-na-radu',
    tags: ['prva pomoć', 'ormarić za prvu pomoć', 'osposobljavanje', 'postupci', 'opasnost'],
    status: 'published'
  }
];

// Funkcija za kreiranje blog posta
export async function createBlogPost(post: SeedBlogPost): Promise<number> {
  try {
    const slug = generateSlug(post.title);
    const imageUrl = post.imageUrl || getRandomImageUrl(post.category);
    
    const blogPost = await storage.createBlogPost({
      title: post.title,
      slug: slug,
      content: post.content,
      excerpt: post.excerpt,
      imageUrl: imageUrl,
      category: post.category,
      tags: post.tags,
      status: post.status
    });
    
    return blogPost.id;
  } catch (error) {
    console.error('Greška pri kreiranju blog posta:', error);
    throw error;
  }
}

// Glavni funkcija za dodavanje blog postova u bazu
export async function seedBlogPosts() {
  console.log('Pokretanje seed skripte za blog postove...');
  
  try {
    // Provera da li već postoje blog postovi
    const existingPosts = await storage.getAllBlogPosts();
    
    if (existingPosts.length > 0) {
      console.log(`U bazi već postoji ${existingPosts.length} blog postova. Preskačem seed.`);
      return existingPosts.length;
    }
    
    // Kreiranje blog postova
    let createdCount = 0;
    for (const post of blogPostsData) {
      const id = await createBlogPost(post);
      console.log(`Kreiran blog post ID: ${id}, naslov: "${post.title}"`);
      createdCount++;
    }
    
    console.log(`Uspešno kreirano ${createdCount} blog postova.`);
    return createdCount;
  } catch (error) {
    console.error('Greška pri seed-ovanju blog postova:', error);
    throw error;
  }
}
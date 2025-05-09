import { storage } from '../storage';
import { transliterate } from '../utils/transliterate';

/**
 * Funkcija za generisanje slug-a iz naslova
 */
function generateSlug(title: string): string {
  const transliterated = transliterate(title.toLowerCase());
  return transliterated
    .replace(/[^\w\s-]/g, '')  // Uklanjanje specijalnih karaktera
    .replace(/\s+/g, '-')      // Zamena razmaka sa crticama
    .replace(/-+/g, '-')       // Zamena višestrukih crtica sa jednom
    .trim();
}

/**
 * Funkcija za dodavanje blog posta o kaznenim odredbama
 */
export async function addPenaltyBlogPost() {
  try {
    console.log('Dodavanje blog posta o kaznenim odredbama...');
    
    // Definisanje sadržaja blog posta
    const title = 'Kaznene odredbe Zakona o bezbednosti i zdravlju na radu: Obaveza osiguranja zaposlenih';
    const slug = generateSlug(title);
    
    // Provera da li blog post sa ovim slug-om već postoji
    const existingPost = await storage.getBlogPostBySlug(slug);
    if (existingPost) {
      console.log(`Blog post sa slug-om "${slug}" već postoji. Preskačem.`);
      return existingPost.id;
    }
    
    const content = `# Kaznene odredbe Zakona o bezbednosti i zdravlju na radu: Obaveza osiguranja zaposlenih

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

Poštovanje zakonske obaveze osiguranja zaposlenih predstavlja temelj odgovornog poslovanja i doprinosi stvaranju bezbednog i zdravog radnog okruženja za sve zaposlene.`;
    
    const excerpt = 'Detaljno objašnjenje kaznenih odredbi Zakona o bezbednosti i zdravlju na radu, s posebnim osvrtom na obavezu osiguranja zaposlenih prema članu 67 i kazne za nepoštovanje ove obaveze prema članu 101.';
    const imageUrl = '/kaznene-odredbe-banner.svg';
    
    // Kreiranje blog posta
    const blogPost = await storage.createBlogPost({
      title,
      slug,
      content,
      excerpt,
      imageUrl,
      category: 'propisi',
      tags: ['zakon', 'kazne', 'osiguranje', 'član 67', 'član 101'],
      status: 'published',
      authorId: null, // AI generisani sadržaj
    });
    
    // publishedAt će se automatski popuniti u storage-u kada je status 'published'
    
    console.log(`Uspešno kreiran blog post ID: ${blogPost.id}`);
    return blogPost.id;
  } catch (error) {
    console.error('Greška pri dodavanju blog posta o kaznenim odredbama:', error);
    throw error;
  }
}

// Izvršavanje funkcije ako je skripta pokrenuta direktno
if (require.main === module) {
  addPenaltyBlogPost()
    .then(() => {
      console.log('Skripta uspešno izvršena.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Greška prilikom izvršavanja skripte:', error);
      process.exit(1);
    });
}
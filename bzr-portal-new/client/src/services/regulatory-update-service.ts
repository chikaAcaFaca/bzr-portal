import { RegulatoryUpdate, RegulatoryUpdateStatus } from "@/components/regulatory-updates/regulatory-update-card";

// Ovo je mock servis koji simulira API pozive
// U produkciji, ovo bi komuniciralo sa backend API-jem

// Mock podaci za regulatorna ažuriranja
const mockRegulatoryUpdates: RegulatoryUpdate[] = [
  {
    id: "1",
    title: "Novi Pravilnik o proceni rizika na radnom mestu",
    description: "U Službenom glasniku RS br. 45/2023 objavljen je novi Pravilnik o proceni rizika na radnom mestu koji donosi značajne izmene u metodologiji identifikacije i procene rizika. Nova metodologija zahteva detaljniju kategorizaciju rizika i uvodi nove faktore koji se moraju uzeti u obzir prilikom procene rizika.",
    date: "2023-11-15",
    status: "pending",
    severity: "critical",
    affectedDocuments: [
      {
        id: "d1",
        name: "Akt o proceni rizika",
        type: "Glavni dokument"
      },
      {
        id: "d2",
        name: "Liste opasnosti i štetnosti",
        type: "Prilog"
      },
      {
        id: "d3",
        name: "Plan mera za smanjenje rizika",
        type: "Prilog"
      },
      {
        id: "d4",
        name: "Metodologija procene rizika",
        type: "Interni dokument"
      }
    ],
    source: "Službeni glasnik RS 45/2023",
    legalReference: "Pravilnik o proceni rizika (Sl. glasnik RS 45/2023)",
    complianceDeadline: "2024-05-15",
    requiredChanges: "1. Ažurirati metodologiju za procenu rizika u skladu sa novim zahtevima\n2. Dopuniti liste opasnosti i štetnosti sa novim kategorijama\n3. Prilagoditi obrazac za procenu rizika tako da sadrži nove elemente\n4. Ponovo proceniti rizike za sva radna mesta prema novoj metodologiji\n5. Ažurirati plan mera za smanjenje rizika u skladu sa novim nalazima\n6. Obezbediti obuku za zaposlene i lica za bezbednost i zdravlje na radu o novim zahtevima"
  },
  {
    id: "2",
    title: "Izmene Zakona o bezbednosti i zdravlju na radu",
    description: "Usvojene su izmene i dopune Zakona o bezbednosti i zdravlju na radu koje donose nove obaveze poslodavcima u pogledu evidentiranja, izveštavanja i obuke zaposlenih. Izmene se posebno odnose na rad na daljinu i rad od kuće, kao i na psihosocijalne rizike na radnom mestu.",
    date: "2023-10-01",
    status: "in-progress",
    severity: "important",
    affectedDocuments: [
      {
        id: "d5",
        name: "Pravilnik o bezbednosti i zdravlju na radu",
        type: "Glavni dokument"
      },
      {
        id: "d6",
        name: "Evidencije iz oblasti BZR",
        type: "Obrasci"
      },
      {
        id: "d7",
        name: "Program obuke zaposlenih",
        type: "Interni dokument"
      }
    ],
    source: "Službeni glasnik RS 38/2023",
    legalReference: "Zakon o izmenama i dopunama Zakona o bezbednosti i zdravlju na radu (Sl. glasnik RS 38/2023)",
    complianceDeadline: "2024-04-01",
    requiredChanges: "1. Ažurirati Pravilnik o bezbednosti i zdravlju na radu u skladu sa novim zakonskim odredbama\n2. Uvesti nove obrasce za evidenciju rada na daljinu\n3. Ažurirati program obuke zaposlenih da uključi nove teme o psihosocijalnim rizicima\n4. Ažurirati procedure za procenu rizika da uključe specifičnosti rada od kuće\n5. Implementirati nove procedure za izveštavanje o incidentima"
  },
  {
    id: "3",
    title: "Novi standardi za lična zaštitna sredstva",
    description: "Usvojeni su novi SRPS standardi koji se odnose na lična zaštitna sredstva (LZS) u skladu sa evropskim standardima. Ovi standardi donose nove zahteve u pogledu kvaliteta, označavanja i testiranja LZS.",
    date: "2023-09-15",
    status: "completed",
    severity: "info",
    affectedDocuments: [
      {
        id: "d8",
        name: "Pravilnik o ličnim zaštitnim sredstvima",
        type: "Interni dokument"
      },
      {
        id: "d9",
        name: "Specifikacije za nabavku LZS",
        type: "Procedura"
      }
    ],
    source: "Institut za standardizaciju Srbije",
    legalReference: "SRPS EN 397:2023, SRPS EN 166:2023, SRPS EN 388:2023",
    complianceDeadline: "2024-03-15",
    requiredChanges: "1. Ažurirati Pravilnik o ličnim zaštitnim sredstvima da reference nove standarde\n2. Prilagoditi specifikacije za nabavku LZS prema novim zahtevima\n3. Obučiti zaposlene o pravilnom korišćenju novih LZS\n4. Ažurirati evidencije o izdatim LZS"
  },
  {
    id: "4",
    title: "Nova uredba o preventivnim merama za bezbedan rad pri korišćenju opreme sa ekranom",
    description: "Usvojena je nova Uredba koja propisuje minimalne zahteve za bezbednost i zdravlje na radu pri korišćenju opreme sa ekranom. Uredba donosi nove zahteve za ergonomiju radnog mesta, preventivne zdravstvene preglede i radno vreme za zaposlene koji rade sa računarima.",
    date: "2023-12-01",
    status: "pending",
    severity: "important",
    affectedDocuments: [
      {
        id: "d10",
        name: "Akt o proceni rizika za radna mesta sa računarima",
        type: "Deo glavnog dokumenta"
      },
      {
        id: "d11",
        name: "Uputstvo za bezbedan rad sa računarom",
        type: "Interni dokument"
      },
      {
        id: "d12",
        name: "Plan preventivnih zdravstvenih pregleda",
        type: "Procedura"
      }
    ],
    source: "Službeni glasnik RS 50/2023",
    legalReference: "Uredba o preventivnim merama za bezbedan rad pri korišćenju opreme sa ekranom (Sl. glasnik RS 50/2023)",
    complianceDeadline: "2024-06-01",
    requiredChanges: "1. Ažurirati Akt o proceni rizika za radna mesta sa računarima\n2. Izraditi nova uputstva za bezbedan rad sa računarom\n3. Ažurirati plan preventivnih zdravstvenih pregleda za zaposlene koji rade sa računarima\n4. Obezbediti ergonomsku opremu u skladu sa novim zahtevima\n5. Organizovati obuku zaposlenih o ergonomiji radnog mesta"
  },
  {
    id: "5",
    title: "Nove granične vrednosti izloženosti hemijskim materijama",
    description: "Ministarstvo za rad je usvojilo novi Pravilnik o preventivnim merama za bezbedan rad pri izlaganju hemijskim materijama, koji donosi nove, strože granične vrednosti izloženosti za određene hemijske materije na radnom mestu.",
    date: "2023-11-20",
    status: "ignored",
    severity: "critical",
    affectedDocuments: [
      {
        id: "d13",
        name: "Akt o proceni rizika - deo o hemijskim štetnostima",
        type: "Deo glavnog dokumenta"
      },
      {
        id: "d14",
        name: "Uputstva za bezbedan rad sa hemikalijama",
        type: "Interni dokument"
      },
      {
        id: "d15",
        name: "Plan merenja koncentracije hemijskih materija",
        type: "Procedura"
      },
      {
        id: "d16",
        name: "Bezbednosni listovi",
        type: "Eksterna dokumentacija"
      }
    ],
    source: "Službeni glasnik RS 48/2023",
    legalReference: "Pravilnik o preventivnim merama za bezbedan rad pri izlaganju hemijskim materijama (Sl. glasnik RS 48/2023)",
    complianceDeadline: "2024-05-20",
    requiredChanges: "1. Ažurirati procenu rizika za radna mesta sa izloženošću hemijskim materijama\n2. Prilagoditi uputstva za bezbedan rad sa hemikalijama\n3. Povećati učestalost merenja koncentracije hemijskih materija u radnoj okolini\n4. Ažurirati plan zaštitnih mera\n5. Obezbediti dodatna lična zaštitna sredstva gde je potrebno\n6. Obezbediti dodatnu obuku zaposlenih o bezbednom radu sa hemikalijama"
  },
  {
    id: "6",
    title: "Novi zahtevi za obuku vozača viljuškara",
    description: "Ministarstvo za rad je izdalo novi Pravilnik o stručnom osposobljavanju vozača viljuškara i drugih transportnih sredstava unutrašnjeg transporta. Pravilnik donosi nove zahteve za teorijsku i praktičnu obuku, kao i nove uslove za izdavanje i obnavljanje dozvola.",
    date: "2023-10-10",
    status: "pending",
    severity: "info",
    affectedDocuments: [
      {
        id: "d17",
        name: "Program obuke za vozače viljuškara",
        type: "Interni dokument"
      },
      {
        id: "d18",
        name: "Evidencija o stručnoj osposobljenosti",
        type: "Obrasci"
      },
      {
        id: "d19",
        name: "Uputstvo za bezbedan rad sa viljuškarom",
        type: "Interni dokument"
      }
    ],
    source: "Službeni glasnik RS 42/2023",
    legalReference: "Pravilnik o stručnom osposobljavanju vozača viljuškara (Sl. glasnik RS 42/2023)",
    complianceDeadline: "2024-04-10",
    requiredChanges: "1. Ažurirati program obuke za vozače viljuškara\n2. Organizovati dodatnu obuku za postojeće vozače\n3. Ažurirati evidencije o stručnoj osposobljenosti\n4. Ažurirati uputstva za bezbedan rad sa viljuškarom\n5. Obezbediti nove dozvole za vozače viljuškara"
  }
];

// Privatna promenljiva koja čuva trenutno stanje
let regulatoryUpdates = [...mockRegulatoryUpdates];

/**
 * Funkcija za dohvatanje svih regulatornih ažuriranja
 */
export const getRegulatoryUpdates = async (): Promise<RegulatoryUpdate[]> => {
  // Simuliramo latenciju mrežnog poziva
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...regulatoryUpdates];
};

/**
 * Funkcija za dohvatanje jednog regulatornog ažuriranja po ID-u
 */
export const getRegulatoryUpdateById = async (id: string): Promise<RegulatoryUpdate | null> => {
  // Simuliramo latenciju mrežnog poziva
  await new Promise(resolve => setTimeout(resolve, 300));
  return regulatoryUpdates.find(update => update.id === id) || null;
};

/**
 * Funkcija za ažuriranje statusa regulatornog ažuriranja
 */
export const updateRegulatoryUpdateStatus = async (
  id: string,
  status: RegulatoryUpdateStatus
): Promise<RegulatoryUpdate | null> => {
  // Simuliramo latenciju mrežnog poziva
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const index = regulatoryUpdates.findIndex(update => update.id === id);
  if (index === -1) return null;
  
  // Kreiramo novo stanje sa ažuriranim statusom
  const updatedItem = { ...regulatoryUpdates[index], status };
  regulatoryUpdates = [
    ...regulatoryUpdates.slice(0, index),
    updatedItem,
    ...regulatoryUpdates.slice(index + 1)
  ];
  
  return updatedItem;
};

/**
 * Funkcija za dobijanje broja nepreglendanih ažuriranja
 */
export const getUnreadUpdatesCount = async (): Promise<number> => {
  // Simuliramo latenciju mrežnog poziva
  await new Promise(resolve => setTimeout(resolve, 200));
  return regulatoryUpdates.filter(update => update.status === "pending").length;
};
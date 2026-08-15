const storeKey = "summer-attendance-v1";
const backupStoreKey = "summer-attendance-backup-before-db";
const lastUserKey = "summer-attendance-last-user";
const recentInstructionsKey = "summer-attendance-recent-instructions";
const managerPasswordValue = "summer2026";
const instructionBucket = "game-instructions";
const instructionMaxFileSize = 8 * 1024 * 1024;
const instructionLocalFileLimit = 750 * 1024;
const instructionLibraryVersion = Math.max(0, Number(window.KVW_INSTRUCTION_LIBRARY_VERSION) || 0);
const builtInGameInstructions = Array.isArray(window.KVW_BUILT_IN_INSTRUCTIONS)
  ? structuredClone(window.KVW_BUILT_IN_INSTRUCTIONS)
  : [];
const agreementsLibraryVersion = Math.max(0, Number(window.KVW_AGREEMENTS_LIBRARY_VERSION) || 0);
const builtInGeneralAgreements = Array.isArray(window.KVW_BUILT_IN_AGREEMENTS)
  ? structuredClone(window.KVW_BUILT_IN_AGREEMENTS)
  : [];
const agreementCategories = [
  { id: "daily", label: "Dagelijkse begeleiding", shortLabel: "Dagelijks" },
  { id: "safety", label: "Veiligheid en omgang", shortLabel: "Veiligheid" },
  { id: "practical", label: "Praktische regels", shortLabel: "Praktisch" },
  { id: "special", label: "Kamp en hulp", shortLabel: "Kamp en hulp" }
];

const defaultSupportProfiles = [
  { id: "support-mariska-wouters", name: "Mariska Wouters", boardRole: "Catering", intro: "Voor alles rond de catering.", phone: "", photo: "" },
  { id: "support-franky-recollecte", name: "Franky Recollecte", boardRole: "Materialen", intro: "Voor alles rond materialen.", phone: "", photo: "" }
];

const seed = {
  activeGroupId: "sunbeams",
  activeDay: "Ma 17 aug",
  activeView: "homeView",
  currentUser: null,
  groups: [
    {
      id: "sunbeams",
      name: "Zonnestralen",
      leaderIds: ["mia", "tom"],
      kids: [
        "Ava Lee",
        "Ben Miller",
        "Chloe Smith",
        "Ethan Taylor",
        "Grace Wang",
        "Hugo Johnson",
        "Isla Scott",
        "Jake Patel",
        "Kara Lewis",
        "Leo Martinez",
        "Noah White",
        "Sofia Brown",
        "Mila Garcia",
        "Oscar Wilson",
        "Lina Ahmed",
        "Finn Cooper",
        "Emma Davies",
        "Nina Khan",
        "Luca Rossi",
        "Zoe Carter",
        "Sam Brooks"
      ]
    },
    {
      id: "rainbows",
      name: "Regenbogen",
      leaderIds: ["sara"],
      kids: ["Maya Chen", "Adam Foster", "Olivia Green", "Tess Murphy", "Ravi Shah", "Ellie Young"]
    },
    {
      id: "rockets",
      name: "Raketten",
      leaderIds: ["daan"],
      kids: ["Liam Clark", "Nora Evans", "Aria Singh", "Max Turner", "Ivy Walker", "Jonas Reed"]
    }
  ],
  leaders: [
    { id: "mia", name: "Mia de Jong" },
    { id: "tom", name: "Tom Bakker" },
    { id: "sara", name: "Sara Visser" },
    { id: "daan", name: "Daan Peters" }
  ],
  managers: [
    { id: "manager-lotte", name: "Lotte Beheerder" },
    { id: "manager-mark", name: "Mark Coördinator" }
  ],
  supportProfiles: structuredClone(defaultSupportProfiles),
  userPins: {},
  userThemes: {},
  feedback: [],
  importantInfo: [],
  generalAgreements: [],
  generalAgreementsVersion: 0,
  gameInstructions: [],
  instructionLibraryVersion: 0,
  setupModuleEnabled: false,
  setupTasks: [
    { id: "setup-aula", title: "Aula klaarzetten", area: "Odulphus", maxPeople: 2, assignees: [], done: false, checkedBy: "", checkedAt: "" },
    { id: "setup-borden", title: "Borden en bewegwijzering ophangen", area: "Terrein", maxPeople: 2, assignees: [], done: false, checkedBy: "", checkedAt: "" },
    { id: "setup-materialen", title: "Materialen per activiteit klaarleggen", area: "Materiaal", maxPeople: 4, assignees: [], done: false, checkedBy: "", checkedAt: "" },
    { id: "setup-ontvangst", title: "Ontvangsttafel opbouwen", area: "Entree", maxPeople: 1, assignees: [], done: false, checkedBy: "", checkedAt: "" }
  ],
  days: ["Ma 17 aug", "Di 18 aug", "Wo 19 aug", "Do 20 aug", "Vr 21 aug"],
  attendance: {
    "Ma 17 aug": {
      sunbeams: {
        "Ava Lee": "present",
        "Ben Miller": "present",
        "Chloe Smith": "present",
        "Ethan Taylor": "missing",
        "Grace Wang": "present",
        "Hugo Johnson": "missing",
        "Isla Scott": "present",
        "Jake Patel": "present",
        "Kara Lewis": "present",
        "Leo Martinez": "missing",
        "Noah White": "present",
        "Sofia Brown": "present",
        "Mila Garcia": "present",
        "Oscar Wilson": "present",
        "Lina Ahmed": "present",
        "Finn Cooper": "present",
        "Emma Davies": "present",
        "Nina Khan": "present",
        "Luca Rossi": "present",
        "Zoe Carter": "present",
        "Sam Brooks": "present"
      }
    }
  },
  savedAt: {}
};

let state = loadState();
let databaseClient = null;
let databaseReady = false;
let applyingRemoteState = false;
let remoteSaveTimer = null;
let lastRemoteUpdate = "";
let lastSharedStateJson = "";
let queuedSharedStateJson = "";
let localSavePending = false;
let lastLocalChangeAt = 0;

const scheduleDays = [
  {
    "label": "Maandag",
    "date": "17 aug 2026"
  },
  {
    "label": "Dinsdag",
    "date": "18 aug 2026"
  },
  {
    "label": "Woensdag",
    "date": "19 aug 2026"
  },
  {
    "label": "Donderdag",
    "date": "20 aug 2026"
  },
  {
    "label": "Vrijdag",
    "date": "21 aug 2026"
  },
  {
    "label": "Zaterdagavond",
    "date": "22 aug 2026"
  }
];

const scheduleCategories = ["kleuters", "pupillen", "jongeren", "ouderen"];
const legacySchedulePrograms = {
  "kleuters": [
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:15",
        "title": "Kleuters 3A, 3B, 4A, 4B Tikspelletjes (gymzaal Wilgenstraat)",
        "detail": "Zie de uitleg voor vijf varianten tikspelletjes die je kunt spelen.",
        "type": "active"
      },
      {
        "time": "10:15",
        "title": "Kleuters 1A, 1B, 2A, 2B",
        "detail": "Lasergamen (Laagstraat) Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Kleuters 1A, 1B, 2A, 2B",
        "detail": "Tikspelletjes (gymzaal Wilgenstraat) Zie de uitleg voor vijf varianten tikspelletjes die je kunt spelen.",
        "type": "active"
      },
      {
        "time": "11:15",
        "title": "Kleuters 3A, 3B, 4A, 4B",
        "detail": "Lasergamen Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "12:15",
        "title": "Voorleeskwartier",
        "detail": "Even een momentje rust met de kleuters. Laat de groepsleiding ranja en koekjes ophalen voor de hele groep en kom daarna rustig met de kinderen zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Knutselen",
        "detail": "We gaan prachtige vuurpijlen en sterren maken. De knutselvoorbeelden liggen klaar. Haal de materialen op. Verder inspiratie vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:30",
        "title": "Stormbaan",
        "detail": "Op het veld staan stormbanen en luchtkastelen. Laat de kinderen los. Mochten de kinderen zich gaan vervelen kun je wedstrijdjes gaan houden welke groep het snelst de stormbaan kan afleggen. De eindtijd van 15:15 is vrij in te vullen, indien ze er nog niet klaar mee zijn, blijf gerust tot de centrale afsluiting begint.",
        "type": "active"
      },
      {
        "time": "15:15",
        "title": "Kleurplaat tekenen",
        "detail": "Zie bovenstaande, als na de stormbaan is het tijd voor wat creatieve cooling down. Pak wat te drinken en wat lekkers en laat de kinderen kleuren tot de centrale afsluiting begint.",
        "type": "meal"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "08:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "08:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen. Laat kinderen meteen nog even naar het toilet gaan. Dit is niet meer mogelijk tijdens de busreis.",
        "type": "rest"
      },
      {
        "time": "08:45",
        "title": "Bussen aanwezig – groepen instappen",
        "detail": "De bussen zijn aanwezig om 08:45, vanaf dat moment worden groepen langzaam geïnstrueerd om naar de bus te gaan. Op de dag zelf wordt de bussenindeling gedeeld via de groepsapp. Zorg dat alle kinderen van tevoren naar het toilet geweest zijn. Er zijn blauwe IKEA-tassen aanwezig waarin je in Toverland de tassen van je groepje op één plek kunt verzamelen, vergeet deze niet!",
        "type": "rest"
      },
      {
        "time": "10:15",
        "title": "Aankomst in Toverland",
        "detail": "We lopen met zijn allen in één keer naar binnen richting de verzamelplek. Deze is rechts achter in het park voor de indoor speelhallen voor het doolhof. Zorg dat je je groep compleet hebt als je bij de verzamelplak bent en spreek indien nodig een tijd af met je groep om gezamenlijk te lunchen (dit schiet er anders vaak bij in). Kleuters en pupillen lopen in groepjes door Toverland. Jongeren wordt bepaald per groep of ze alleen door het park kunnen of met begeleiding. Ouderen mogen zelfstandig door Toverland lopen. LET OP! Je krijgt een rooster wanneer je met welke groep door het park moet lopen. Iedere leiding (incl hulpleiding) moet een aangewezen tijdslot een groep kleuters of pupillen begeleiden in het park. Zo doet iedereen wat en kan iedereen van het park genieten. Zorg voor elkaar ☺. Er dient ook altijd iemand aanwezig te zijn bij de verzamelplek (hier is ook de EHBO-koffer te vinden).",
        "type": "meal"
      },
      {
        "time": "16:00",
        "title": "Verzamelen bij de verzamelplek",
        "detail": "We verzamelen allemaal weer bij de verzamelplek. Is je groep compleet? Daarna lopen we samen naar de bussen.",
        "type": "rest"
      },
      {
        "time": "16:30",
        "title": "Terugrijden naar Odulphus",
        "detail": "",
        "type": "rest"
      },
      {
        "time": "17:45",
        "title": "Aankomst Odulphus",
        "detail": "Bij aankomst bij Odulphus staan er vaak al ouders klaar om hun kind op te halen. Zorg ervoor dat je groep eerst compleet naar de binnenplaats gaat. Daar kunnen ouders hun kinderen ophalen. Het is van belang dat jij overzicht houdt over welke kinderen al opgehaald zijn en dat lukt niet als ouders hun kinderen meteen wegplukken als je de bus uitstapt.",
        "type": "rest"
      },
      {
        "time": "18:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "18:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Film in de kapel",
        "detail": "Laat kinderen plassen voordat je naar de filmzaal gaat en wat drinken. Er wordt niet gedronken in de kapel. Film: Verjaardag van Bluey Gebruik de pauze als uitloop, uiterlijk om 11u beginnen de pupillen aan hun film.",
        "type": "meal"
      },
      {
        "time": "10:45",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:00",
        "title": "Knutselen",
        "detail": "We gaan een vlaggenlijn maken die iedereen bij het groepje kan ophangen als herkenningspunt. Ieder kind versiert een aantal vlaggen en de leiding knoopt ze aan een touw.",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "12:15",
        "title": "Voorleeskwartier",
        "detail": "Even een momentje rust met de kleuters. Laat de groepsleiding ranja en koekjes ophalen voor de hele groep en kom daarna rustig met de kinderen zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen. Zorg voor voldoende tekenpapier/ kleurplaten. Hang de kleurplaten op aan de grote lijn. Hoe meer hoe beter, maak als de lijn vol is een wall of fame met alle kleurplaten.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Kleuters 1A, 1B, 2A, 2B",
        "detail": "Knutselen We gaan prachtige verjaarsdagmutsen en slingers maken. De knutselvoorbeelden liggen klaar. Haal de materialen op. Verder inspiratie vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Kleuters 3A, 3B, 4A, 4B",
        "detail": "Spel – taartentrefbal (gymzaal Wilgenstraat) We gaan taartentrefbal spelen! Een variant op het bekende spel. Gooi alle kaarsen om van de taart van de tegenstander en zorg dat je zelf niet geraakt wordt.",
        "type": "active"
      },
      {
        "time": "14:00",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:15",
        "title": "Kleuters 3A, 3B, 4A, 4B",
        "detail": "We gaan prachtige verjaarsdagmutsen en slingers maken. De knutselvoorbeelden liggen klaar. Haal de materialen op. Verder inspiratie vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Kleuters 1A, 1B, 2A, 2B",
        "detail": "Spel – taartentrefbal (gymzaal Wilgenstraat) We gaan taartentrefbal spelen! Een variant op het bekende spel. Gooi alle kaarsen om van de taart van de tegenstander en zorg dat je zelf niet geraakt wordt.",
        "type": "active"
      },
      {
        "time": "14:45",
        "title": "Wisselen van activiteit",
        "detail": "",
        "type": "active"
      },
      {
        "time": "15:00",
        "title": "Feestrace (sportveld)",
        "detail": "Speel alle spellen met je groepje. Zie de uitleg na de materialenlijst van vandaag.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Ouders halen hun kinderen weer op bij het Odulphus. Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is, kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Theater en diverse activiteiten",
        "detail": "Deze ochtend komt een echte theaterdocent de kinderen ‘les’ geven. Daaromheen gaan we knutselen, waterspelletjes spelen en dansen met Just Dance. Zie hieronder het te volgen schema.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Kleuters 1",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Kleuters 2",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Kleuters 3",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Kleuters 4",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:25",
        "title": "Wisselen",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:30",
        "title": "Kleuters 2",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:30",
        "title": "Kleuters 3",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:30",
        "title": "Kleuters 4",
        "detail": "",
        "type": "active"
      },
      {
        "time": "10:30",
        "title": "Kleuters 1",
        "detail": "",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "11:30",
        "title": "Kleuters 3",
        "detail": "",
        "type": "active"
      },
      {
        "time": "11:30",
        "title": "Kleuters 4",
        "detail": "",
        "type": "active"
      },
      {
        "time": "11:30",
        "title": "Kleuters 1",
        "detail": "",
        "type": "active"
      },
      {
        "time": "11:30",
        "title": "Kleuters 2",
        "detail": "",
        "type": "active"
      },
      {
        "time": "11:55",
        "title": "Wisselen",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Kleuters 4",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Kleuters 1",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Kleuters 2",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Kleuters 3",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Plaspauze",
        "detail": "",
        "type": "active"
      },
      {
        "time": "13:45",
        "title": "Lopen naar de Kloostertuin",
        "detail": "Pak de hesjes en doe als begeleiders een hesje aan voordat je vertrekt naar de kloostertuin. Loop met elkaar naar de kloostertuin. Eén groepje neemt de bolderkar met ranja, bekers en koeken mee voor in de Kloostertuin.",
        "type": "meal"
      },
      {
        "time": "14:00",
        "title": "Spelletjes in de Kloostertuin",
        "detail": "Zoek indien nodig de schaduw op en speel spelletjes met de kinderen. Inspiratie voor spelletjes vind je bij de uitleg activiteiten van vandaag. Als de kinderen vrij willen spelen kan dat natuurlijk ook. Eindtijd is 14.45, als de kinderen er klaar mee zijn, loop gerust eerder terug. Als ze langer willen blijven is dat ook goed. Zorg dat je uiterlijk om 15.30 terug bent (geef ze dan wat te drinken).",
        "type": "meal"
      },
      {
        "time": "14:45",
        "title": "Teruglopen naar Odulphus",
        "detail": "Pak de hesjes en doe als begeleiders een hesje aan voordat je vertrekt naar de het Odulphus. Loop met elkaar naar het Odulphus.",
        "type": "rest"
      },
      {
        "time": "15:00",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "15:15",
        "title": "Strandparty en waterpret (sportveld)",
        "detail": "We hebben vier spelletje klaargezet",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Vossenjacht in de wijk: deel 1",
        "detail": "Verzamel het fruit en drinken van jouw groepje in een blauwe IKEA-tas. Deze wordt door de kantine vrijwilliger meegenomen naar de kloostertuin voor tijdens de pauze. Leiding doet fluoriserende hesjes aan. Zorg dat alle kinderen naar het toilet zijn geweest voordat je vertrekt. Je hoort van je bestuurslid bij welke vos je start en je loopt met je groepje de aangewezen route af, zodat er niet meerdere groepjes gaan dringen of lang moeten wachten bij een vos. De kleuters (en de pupillen) hebben een vos in de kloostertuin waar je pauze kunt nemen. Bij deze vos staat ranja en wat lekkers.",
        "type": "meal"
      },
      {
        "time": "10:45",
        "title": "Fruitpauze in de kloostertuin",
        "detail": "Fruit eten en vrij spelen. Of juist eventjes bijkomen van het eerste deel van de vossenjacht. Beslis met je groepsleiding wanneer je begint aan deel 2 van de vossenjacht. Een kwartiertje langer spelen, kan ook de juiste keuze zijn.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Vossenjacht in de wijk: deel 2",
        "detail": "Deel 2 van de vossenjacht. Kom eerder terug naar Odulphus als je groep moe is en niet meer verder kan. Ga dan knutselen/tekenen tot de andere groepen terug zijn.",
        "type": "active"
      },
      {
        "time": "11:45",
        "title": "Terug richting Odulphus, ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "11:45",
        "title": "Schminken, vrij spelen of tekenen.",
        "detail": "Haal de schmink en de schmink voorbeelden op bij de materialenbalie.",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Ranja en voorleeskwartier",
        "detail": "Even een momentje rust met de kleuters. Laat de groepsleiding ranja en koekjes ophalen voor de hele groep en kom daarna rustig met de kinderen zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Apenkooien (gymzaal Laagstraat)",
        "detail": "Leef je uit in de gymzaal aan de Laagstraat als echte carnavalsapen.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Schminken en voorbereiden carnavals catwalk: Kékt dan, gé kékt nie en oud hollandse spelen.",
        "detail": "Begin met de kleuters aan de voorbereiding catwalk. Tijdens het grote carnavalsfeest zullen de kinderen over een catwalk lopen om hun mooiste pékskes te showen aan heel KVW. Verzin met je groepje een bijzondere manier van lopen óf voer een kleine show op met je groepje. Bedenk samen moet jullie laten zien dat jullie de gekste zijn én de mooiste pékskes hebben. Haal de schmink en de schmink voorbeelden op bij de materialenbalie. Kinderen die geen zin hebben in schminken en voorbereiden, kunnen lekker blijven apenkooien in de gymzaal. Zorg dat je met andere leiding goed afstemt wie waar toezicht houdt.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Het grote carnavalsfeest",
        "detail": "We sluiten KVW2026 af met een gigantisch carnavalsfeest midden in de zomer! Kom verkleed! Iedereen is welkom, alle ouders/verzorgers zijn ook van harte uitgenodigd om verkleed KVW af te sluiten! Ouders zijn vanaf 15.30u welkom om mee te feesten!",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vandaag ruimen we alles op en poetsen we Odulphus. Dit betekent ook dat er een paar mensen mee moeten rijden naar de opslag en dat we meer schoonmaakwerk hebben. En ook vandaag geldt: Vele handen maken licht werk! Als er schoongemaakt is, evalueren we nog kort. Daarna gaat iedereen naar huis om te eten en zich klaar te maken voor het vrijwilligersfeest.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "20:30",
        "title": "Vrijwilligersfeest",
        "detail": "Om jullie te bedanken voor jullie harde inzet en om stoom af te blazen na een drukke week is op zaterdagavond een vrijwilligersfeest. Het feest is weer als vanouds in het Odulphus. Zorg ervoor dat je binnenkomt via de Wilgenstraat en de ingang naast de kantine (bij de fietsenstalling bij de keuken).",
        "type": "active"
      },
      {
        "time": "23:00",
        "title": "Hulpleiding naar huis",
        "detail": "Om 23:00 bedanken we de hulpleiding voor hun inzet tijdens de week en zwaaien we ze uit als ze naar huis gaan.",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Richting de stad",
        "detail": "We feesten midden in een woonwijk, dus om 01:00 is het tijd om richting de stad te gaan en het feestje verder te zetten in de kroeg.",
        "type": "rest"
      }
    ]
  ],
  "pupillen": [
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:15",
        "title": "Tikspelletjes (binnenplaats)",
        "detail": "Zie de uitleg voor vijf varianten tikspelletjes die je kunt spelen.",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Knutselen (binnenplaats)",
        "detail": "We gaan prachtige vuurpijlen en sterren maken. De knutselvoorbeelden liggen klaar. LET OP! Pas zelf de ranja en plaspauze in tijdens het knutselen!",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Stormbaan",
        "detail": "Op het veld staan stormbanen en luchtkastelen. Laat de kinderen los. Mochten de kinderen zich gaan vervelen kun je wedstrijdjes gaan houden welke groep het snelst de stormbaan kan afleggen.",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:45",
        "title": "Knutselen (aula)",
        "detail": "We gaan een vlaggenlijn maken die iedereen bij het groepje kan ophangen als herkenningspunt. Ieder kind versiert een aantal vlaggen en de leiding knoopt ze aan een touw.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "08:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "08:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen. Laat kinderen meteen nog even naar het toilet gaan. Dit is niet meer mogelijk tijdens de busreis.",
        "type": "rest"
      },
      {
        "time": "08:45",
        "title": "Bussen aanwezig – groepen instappen",
        "detail": "De bussen zijn aanwezig om 08:45, vanaf dat moment worden groepen langzaam geïnstrueerd om naar de bus te gaan. Op de dag zelf wordt de bussenindeling gedeeld via de groepsapp. Zorg dat alle kinderen van tevoren naar het toilet geweest zijn. Er zijn blauwe IKEA-tassen aanwezig waarin je in Toverland de tassen van je groepje op één plek kunt verzamelen, vergeet deze niet!",
        "type": "rest"
      },
      {
        "time": "10:15",
        "title": "Aankomst in Toverland",
        "detail": "We lopen met zijn allen in één keer naar binnen richting de verzamelplek. Deze is rechts achter in het park voor de indoor speelhallen voor het doolhof. Zorg dat je je groep compleet hebt als je bij de verzamelplak bent en spreek indien nodig een tijd af met je groep om gezamenlijk te lunchen (dit schiet er anders vaak bij in). Kleuters en pupillen lopen in groepjes door Toverland. Jongeren wordt bepaald per groep of ze alleen door het park kunnen of met begeleiding. Ouderen mogen zelfstandig door Toverland lopen. LET OP! Je krijgt een rooster wanneer je met welke groep door het park moet lopen. Iedere leiding (incl hulpleiding) moet een aangewezen tijdslot een groep kleuters of pupillen beleiden in het park. Zo doet iedereen wat en kan iedereen van het park genieten. Zorg voor elkaar ☺. Er dient ook altijd iemand aanwezig te zijn bij de verzamelplek (hier is ook de EHBO-koffer te vinden).",
        "type": "meal"
      },
      {
        "time": "16:00",
        "title": "Verzamelen bij de verzamelplek",
        "detail": "We verzamelen allemaal weer bij de verzamelplek. Is je groep compleet? Daarna lopen we samen naar de bussen.",
        "type": "rest"
      },
      {
        "time": "16:30",
        "title": "Terugrijden naar Odulphus",
        "detail": "",
        "type": "rest"
      },
      {
        "time": "17:45",
        "title": "Aankomst Odulphus",
        "detail": "Bij aankomst bij Odulphus staan er vaak al ouders klaar om hun kind op te halen. Zorg ervoor dat je groep eerst compleet naar de binnenplaats gaat. Daar kunnen ouders hun kinderen ophalen. Het is van belang dat jij overzicht houdt over welke kinderen al opgehaald zijn en dat lukt niet als ouders hun kinderen meteen wegplukken als je de bus uitstapt.",
        "type": "rest"
      },
      {
        "time": "18:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "18:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Spel – taartentrefbal (gymzaal Wilgenstraat)",
        "detail": "We gaan taartentrefbal spelen! Een variant op het bekende spel. Gooi alle kaarsen om van de taart van de tegenstander en zorg dat je zelf niet geraakt wordt.",
        "type": "active"
      },
      {
        "time": "10:45",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:00",
        "title": "Film in de kapel",
        "detail": "Laat kinderen plassen voordat je naar de filmzaal gaat. Tijdens de film zullen zakjes chips worden uitgedeeld. Na afloop krijgen ze weer drinken. Er wordt niet gedronken in de kapel. Film: de verjaardag van tante Rita (1u 20m).",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Pupillen 1A, 1B en 2A",
        "detail": "Lasergamen (gymzaal Laagstraat) Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Pupillen 2B, 3A en 3B",
        "detail": "Knutselen (aula) We gaan prachtige verjaardagsmutsen en slingers maken. De knutselvoorbeelden liggen klaar. Haal de materialen op. Verder inspiratie vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:45",
        "title": "Pupillen 2B, 3A en 3B",
        "detail": "Knutselen (aula) We gaan prachtige verjaardagsmutsen en slingers maken. De knutselvoorbeelden liggen klaar. Haal de materialen op. Verder inspiratie vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "14:45",
        "title": "Pupillen 1A, 1B en 2A",
        "detail": "Lasergamen (gymzaal Laagstraat) Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Ouders halen hun kinderen weer op bij het Odulphus. Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Lopen naar het Stadspark",
        "detail": "Laat de kinderen eerst plassen voordat we samen naar het spoorpark lopen. Pak als leiding een hesje en verzamel je kinderen op het middenterrein. We lopen gezamenlijk met de jongeren naar het Spoorpark. LET OP! Laat de kinderen drinken en fruit meenemen.",
        "type": "meal"
      },
      {
        "time": "10:30",
        "title": "Smokkelspel in het Stadspark",
        "detail": "Laat de kinderen eerst plassen voordat we samen naar het spoorpark lopen. Pak als leiding een hesje en verzamel je kinderen op het middenterrein. We lopen gezamenlijk met de jongeren naar het Spoorpark. Uitleg van het smokkelspel vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Smokkelspel vervolg of Zwemmer, redder, haai spel",
        "detail": "Als smokkelspel klaar is of als de kinderen er klaar mee zijn speel dan het zwemmer, redder haai spel (bestuurslid neemt deze mee).",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Teruglopen naar het Odulphus",
        "detail": "Verzamel al je kinderen, trek weer een hesje aan en we lopen gezamenlijk met de jongeren terug naar het Odulpus.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Meeleeftheater",
        "detail": "Beleef samen de wildste avonturen en aan het eind wordt er ook altijd nog even gedanst.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Pupillen 1A, 1B en 2A",
        "detail": "Theaterworkshop (kapel) Deze middag komt een echte theaterdocent de kinderen ‘les’ geven.",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Pupillen 2B, 3A en 3B",
        "detail": "Knutselen (binnenplaats) Zie de voorbeelden hieronder, wat er geknutseld gaat worden.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Drinkpauze voor alle groepen",
        "detail": "",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Pupillen 2B, 3A en 3B",
        "detail": "Theaterworkshop (kapel) Deze middag komt een echte theaterdocent de kinderen ‘les’ geven.",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Pupillen 1A, 1B en 2A",
        "detail": "Knutselen (binnenplaats) Zie de voorbeelden hieronder, wat er geknutseld gaat worden.",
        "type": "active"
      },
      {
        "time": "15:15",
        "title": "Waterspelletjes (Sportveld)",
        "detail": "Zie bij de uitleg hieronder welke waterspellen er allemaal gespeeld kunnen worden.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Vossenjacht in de wijk",
        "detail": "Leiding doet fluoriserende hesjes aan. Zorg dat alle kinderen naar het toilet zijn geweest voordat je vertrekt. Je hoort van je bestuurslid bij welke vos je start en je loopt met je groepje een route af, zodat er niet meerdere groepjes gaan dringen of lang moeten wachten bij een vos. De kleuters en pupillen hebben een vos in de kloostertuin waar ze een pauze momentje kunnen inlassen. Bij deze vos staat ranja en wat lekkers. Plan deze vos dus zorgvuldig in. Zijn de kinderen eerder moe/ klaar loop gerust terug en begin aan je fruitpauze. Heb je wat meer tijd nodig, gebruik de fruitpauze als uitloop. Laat de tassen op het Odulphus! Ga niet sjouwen met de tassen.",
        "type": "meal"
      },
      {
        "time": "11:30",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:45",
        "title": "Schminken, vrij spelen of tekenen.",
        "detail": "Haal de schmink en de schmink voorbeelden op bij de materialenbalie. De kinderen die vrij willen spelen, mag je meenemen naar het sportveld. Neem ballen, spellen, etc mee. Let op: enkel op het sportveld vrij spelen i.v.m. het programma van de andere groepen.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Voorbereiden carnavals catwalk: Kékt dan, gé kékt nie",
        "detail": "Begin met de kinderen aan de voorbereiding catwalk. Tijdens het grote carnavalsfeest zullen de kinderen over een catwalk lopen om hun mooiste pékskes te showen aan heel KVW. Verzin met je groepje een bijzondere manier van lopen óf voer een kleine show op met je groepje. Bedenk samen moet jullie laten zien dat jullie de gekste zijn én de mooiste pékskes hebben.",
        "type": "active"
      },
      {
        "time": "13:00",
        "title": "Oudhollandse spellen",
        "detail": "Voor de kinderen die klaar zijn met de voorbereiding voor het carnavalsfeest óf voor de kinderen die daar geen zin in hebben, staan er Oudhollandse spellen op de binnenplaats. Stem met andere leiding af wie waar staat.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Het grote carnavalsfeest",
        "detail": "We sluiten KVW2026 af met een gigantisch carnavalsfeest midden in de zomer! Kom verkleed! Iedereen is welkom, alle ouders/verzorgers zijn ook van harte uitgenodigd om verkleed KVW af te sluiten! Ouders zijn vanaf 15.30u welkom om mee te feesten!",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vandaag ruimen we alles op en poetsen we Odulphus. Dit betekent ook dat er een paar mensen mee moeten rijden naar de opslag en dat we meer schoonmaakwerk hebben. En ook vandaag geldt: Vele handen maken licht werk! Als er schoongemaakt is, evalueren we nog kort. Daarna gaat iedereen naar huis om te eten en zich klaar te maken voor het vrijwilligersfeest.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "20:30",
        "title": "Vrijwilligersfeest",
        "detail": "Om jullie te bedanken voor jullie harde inzet en om stoom af te blazen na een drukke week is op zaterdagavond een vrijwilligersfeest. Het feest is weer als vanouds in het Odulphus. Zorg ervoor dat je binnenkomt via de Wilgenstraat en de ingang naast de kantine (bij de fietsenstalling bij de keuken).",
        "type": "active"
      },
      {
        "time": "23:00",
        "title": "Hulpleiding naar huis",
        "detail": "Om 23:00 bedanken we de hulpleiding voor hun inzet tijdens de week en zwaaien we ze uit als ze naar huis gaan.",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Richting de stad",
        "detail": "We feesten midden in een woonwijk, dus om 01:00 is het tijd om richting de stad te gaan en het feestje verder te zetten in de kroeg.",
        "type": "rest"
      }
    ]
  ],
  "jongeren": [
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:15",
        "title": "Stormbaan",
        "detail": "Op het veld staan stormbanen en luchtkastelen. Laat de kinderen los 😊. Mochten de kinderen zich gaan vervelen kun je wedstrijdjes gaan houden welke groep het snelst de stormbaan kan afleggen.",
        "type": "active"
      },
      {
        "time": "11:15",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Imposter game (aula)",
        "detail": "Speel minimaal het imposter spel. Daarna kun je nog twee andere spellen spelen. De uitleg vind je in de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Crazy88 in de wijk",
        "detail": "Je krijgt een lijst met 88 opdrachten mee. Aan jullie om met je groep de opdrachten zo goed mogelijk uit te voeren in de wijk. Zorg ervoor dat iedereen naar het toilet is geweest en draag als leiding een fluorescerend hesje. Aan het eind van de dag wordt de winnaar bekend gemaakt. De leiding beoordeelt of de opdracht goed is uitgevoerd en vinkt die dan af. Leiding geeft de formulieren door aan Rob.",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:45",
        "title": "Waterpret (binnenplaats)",
        "detail": "Zie de uitleg van de spellen. Omkleden kan in de kleedkamer aan de kant van de Laagstraat.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "08:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "08:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen. Laat kinderen meteen nog even naar het toilet gaan. Dit is niet meer mogelijk tijdens de busreis.",
        "type": "rest"
      },
      {
        "time": "08:45",
        "title": "Bussen aanwezig – groepen instappen",
        "detail": "De bussen zijn aanwezig om 08:45, vanaf dat moment worden groepen langzaam geïnstrueerd om naar de bus te gaan. Op de dag zelf wordt de bussenindeling gedeeld via de groepsapp. Zorg dat alle kinderen van tevoren naar het toilet geweest zijn. Er zijn blauwe IKEA-tassen aanwezig waarin je in Toverland de tassen van je groepje op één plek kunt verzamelen, vergeet deze niet!",
        "type": "rest"
      },
      {
        "time": "10:15",
        "title": "Aankomst in Toverland",
        "detail": "We lopen met zijn allen in één keer naar binnen richting de verzamelplek. Deze is rechts achter in het park voor de indoor speelhallen voor het doolhof. Zorg dat je je groep compleet hebt als je bij de verzamelplak bent en spreek indien nodig een tijd af met je groep om gezamenlijk te lunchen (dit schiet er anders vaak bij in). Kleuters en pupillen lopen in groepjes door Toverland. Jongeren wordt bepaald per groep of ze alleen door het park kunnen of met begeleiding. Ouderen mogen zelfstandig door Toverland lopen. LET OP! Je krijgt een rooster wanneer je met welke groep door het park moet lopen. Iedere leiding (incl hulpleiding) moet een aangewezen tijdslot een groep kleuters of pupillen beleiden in het park. Zo doet iedereen wat en kan iedereen van het park genieten. Zorg voor elkaar ☺. Er dient ook altijd iemand aanwezig te zijn bij de verzamelplek (hier is ook de EHBO-koffer te vinden).",
        "type": "meal"
      },
      {
        "time": "16:00",
        "title": "Verzamelen bij de verzamelplek",
        "detail": "We verzamelen allemaal weer bij de verzamelplek. Is je groep compleet? Daarna lopen we samen naar de bussen.",
        "type": "rest"
      },
      {
        "time": "16:30",
        "title": "Terugrijden naar Odulphus",
        "detail": "",
        "type": "rest"
      },
      {
        "time": "17:45",
        "title": "Aankomst Odulphus",
        "detail": "Bij aankomst bij Odulphus staan er vaak al ouders klaar om hun kind op te halen. Zorg ervoor dat je groep eerst compleet naar de binnenplaats gaat. Daar kunnen ouders hun kinderen ophalen. Het is van belang dat jij overzicht houdt over welke kinderen al opgehaald zijn en dat lukt niet als ouders hun kinderen meteen wegplukken als je de bus uitstapt.",
        "type": "rest"
      },
      {
        "time": "18:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "18:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Jongeren 1 + 3",
        "detail": "Lasergamen (gymzaal Laagstraat) Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Jongeren 2 + 4",
        "detail": "Feestrace (Sportveld) Speel alle spellen met je groepje. Zie de uitleg na de materialenlijst van vandaag.",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Jongeren 2 + 4",
        "detail": "Feestrace (Sportveld) Speel alle spellen met je groepje. Zie de uitleg na de materialenlijst van vandaag.",
        "type": "active"
      },
      {
        "time": "11:15",
        "title": "Jongeren 1 + 3",
        "detail": "Lasergamen (gymzaal Laagstraat) Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar.",
        "type": "active"
      },
      {
        "time": "12:15",
        "title": "Eventueel omkleden vanwege natte kleren na feestrace",
        "detail": "",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen. Zorg voor voldoende tekenpapier/ kleurplaten. Hang de kleurplaten op aan de grote lijn. Hoe meer hoe beter, maak als de lijn vol is een wall of fame met alle kleurplaten.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Ballontrappen (binnenplaats)",
        "detail": "Wie o wie is het beste in het kapot trappen van de ballon van een ander?",
        "type": "active"
      },
      {
        "time": "13:30",
        "title": "Film in de kapel",
        "detail": "Geef de kinderen van tevoren wat te drinken. Laat kinderen plassen voordat je naar de filmzaal gaat. Tijdens de film zullen zakjes chips worden uitgedeeld. Na afloop krijgen ze weer drinken. Er wordt niet gedronken in de kapel. De film is ruim gepland, las eventueel een pauze in na 45min film. Film: Encanto (1u 49m)",
        "type": "meal"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Ouders halen hun kinderen weer op bij het Odulphus. Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Lopen naar het Stadspark",
        "detail": "Laat de kinderen eerst plassen voordat we samen naar het spoorpark lopen. Pak als leiding een hesje en verzamel je kinderen op het middenterrein. We lopen gezamenlijk met de jongeren naar het Spoorpark. LET OP! Laat de kinderen drinken en fruit meenemen.",
        "type": "meal"
      },
      {
        "time": "10:30",
        "title": "Smokkelspel in het Stadspark",
        "detail": "Laat de kinderen eerst plassen voordat we samen naar het spoorpark lopen. Pak als leiding een hesje en verzamel je kinderen op het middenterrein. We lopen gezamenlijk met de jongeren naar het Spoorpark. Uitleg van het smokkelspel vind je bij de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Smokkelspel vervolg of Zwemmer, redder, haai spel",
        "detail": "Als smokkelspel klaar is of als de kinderen er klaar mee zijn, speel dan het zwemmer, redder haai spel (bestuurslid neemt deze mee).",
        "type": "active"
      },
      {
        "time": "12:00",
        "title": "Teruglopen naar het Odulphus",
        "detail": "Verzamel al je kinderen, trek weer een hesje aan en we lopen gezamenlijk met de jongeren terug naar het Odulphus.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Jongeren 1: Volleybal Gymzaal Laagstraat",
        "detail": "Deze middag komen twee echte volleybaltrainers jullie de fijne kneepjes van het volleybal bijbrengen.",
        "type": "active"
      },
      {
        "time": "13:00",
        "title": "Jongeren 2: Volleybal",
        "detail": "Gymzaal Wilgenstraat Deze middag komen twee echte volleybaltrainers jullie de fijne kneepjes van het volleybal bijbrengen.",
        "type": "active"
      },
      {
        "time": "13:00",
        "title": "Jongeren 3 en Jongeren 4: Tikspel moeder moeder en vrij spel op het sportveld",
        "detail": "Lees het tikspel door en speel dit met twee of meer groepen. Als je tijd over hebt, kun je vrij spelen.",
        "type": "active"
      },
      {
        "time": "14:00",
        "title": "Drinkpauze alle groepen",
        "detail": "",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Jongeren 3: Volleybal Gymzaal Laagstraat",
        "detail": "Deze middag komen twee echte volleybaltrainers jullie de fijne kneepjes van het volleybal bijbrengen.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Jongeren 4: Volleybal",
        "detail": "Gymzaal Wilgenstraat Deze middag komen twee echte volleybaltrainers jullie de fijne kneepjes van het volleybal bijbrengen.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Jongeren 1 en Jongeren 2: Tikspel moeder moeder en vrij spel op het sportveld",
        "detail": "Lees het tikspel door en speel dit met twee of meer groepen. Als je tijd over hebt, kun je vrij spelen.",
        "type": "active"
      },
      {
        "time": "15:15",
        "title": "Waterpret op het sportveld",
        "detail": "Zie bij uitleg spellen welke waterspellen er zijn.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Vossenjacht in de wijk",
        "detail": "Leiding doet fluoriserende hesjes aan. Zorg dat alle kinderen naar het toilet zijn geweest voordat je vertrekt. Je hoort van je bestuurslid bij welke vos je start en je loopt met je groepje een route af, zodat er niet meerdere groepjes gaan dringen of lang moeten wachten bij een vos. De jongeren hebben een vos in de kloostertuin waar ze een pauze-momentje kunnen inlassen. Bij deze vos staat ranja en wat lekkers. Plan deze vos dus zorgvuldig in.",
        "type": "meal"
      },
      {
        "time": "11:30",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:45",
        "title": "Sport op het sportveld",
        "detail": "Neem wat ballen en lintjes mee en ga lekker sporten met de kinderen. Haal spel ideeën op bij de materialen balie.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Ruilspel in de wijk",
        "detail": "Elke groep krijgt een item wat ze moeten zien te ruilen voor iets groters/ meer waarde heeft. Wie komt met het mooiste/grootste item terug?",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Het grote carnavalsfeest",
        "detail": "We sluiten KVW2026 af met een gigantisch carnavalsfeest midden in de zomer! Kom verkleed! Iedereen is welkom, alle ouders/verzorgers zijn ook van harte uitgenodigd om verkleed KVW af te sluiten! Ouders zijn vanaf 15.30u welkom om mee te feesten!",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vandaag ruimen we alles op en poetsen we Odulphus. Dit betekent ook dat er een paar mensen mee moeten rijden naar de opslag en dat we meer schoonmaakwerk hebben. En ook vandaag geldt: Vele handen maken licht werk! Als er schoongemaakt is, evalueren we nog kort. Daarna gaat iedereen naar huis om te eten en zich klaar te maken voor het vrijwilligersfeest.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "20:30",
        "title": "Vrijwilligersfeest",
        "detail": "Om jullie te bedanken voor jullie harde inzet en om stoom af te blazen na een drukke week is op zaterdagavond een vrijwilligersfeest. Het feest is weer als vanouds in het Odulphus. Zorg ervoor dat je binnenkomt via de Wilgenstraat en de ingang naast de kantine (bij de fietsenstalling bij de keuken).",
        "type": "active"
      },
      {
        "time": "23:00",
        "title": "Hulpleiding naar huis",
        "detail": "Om 23:00 bedanken we de hulpleiding voor hun inzet tijdens de week en zwaaien we ze uit als ze naar huis gaan.",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Richting de stad",
        "detail": "We feesten midden in een woonwijk, dus om 01:00 is het tijd om richting de stad te gaan en het feestje verder te zetten in de kroeg.",
        "type": "rest"
      }
    ]
  ],
  "ouderen": [
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:15",
        "title": "Imposter game (aula)",
        "detail": "Speel minimaal het imposter spel. Daarna kun je nog twee andere spellen spelen. De uitleg vind je in de uitleg activiteiten van vandaag.",
        "type": "active"
      },
      {
        "time": "11:00",
        "title": "Fruitpauze",
        "detail": "Kinderen hebben zelf fruit mee (en vaak ook drinken). Ranja kun je eventueel pakken bij de catering.",
        "type": "meal"
      },
      {
        "time": "11:15",
        "title": "Stormbaan",
        "detail": "Op het veld staan stormbanen en luchtkastelen. Laat de kinderen los 😊. Mochten de kinderen zich gaan vervelen kun je wedstrijdjes gaan houden welke groep het snelst de stormbaan kan afleggen.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "13.00: Lasergamen in de gymzaal (Laagstraat)",
        "detail": "Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar.",
        "type": "active"
      },
      {
        "time": "13:00",
        "title": "13.00: Crazy88 in de wijk",
        "detail": "Je krijgt een lijst met 88 opdrachten mee. Aan jullie om met je groep de opdrachten zo goed mogelijk uit te voeren in de wijk. Zorg ervoor dat iedereen naar het toilet is geweest en draag als leiding een fluorescerend hesje.",
        "type": "active"
      },
      {
        "time": "14:00",
        "title": "14.00: Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:00",
        "title": "14:30 Ranja en plaspauze",
        "detail": "",
        "type": "meal"
      },
      {
        "time": "14:15",
        "title": "14.15: Crazy88 in de wijk",
        "detail": "Je krijgt een lijst met 88 opdrachten mee. Aan jullie om met je groep de opdrachten zo goed mogelijk uit te voeren in de wijk. Zorg ervoor dat iedereen naar het toilet is geweest en draag als leiding een fluorescerend hesje.",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "14:45: Lasergamen in de gymzaal (Laagstraat)",
        "detail": "Bouw de gymzaal om tot lasergame veld, maak groepen of verdeel op basis van de groepjes en knallen maar.",
        "type": "active"
      },
      {
        "time": "15:45",
        "title": "Centrale afsluiting bij podium",
        "detail": "Bij de afsluiting wordt de winnaar bekend van de crazy88. De leiding beoordeelt of de opdracht goed is uitgevoerd en vinkt die dan af. Leiding geeft de formulieren door aan Rob.",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "08:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "08:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen. Laat kinderen meteen nog even naar het toilet gaan. Dit is niet meer mogelijk tijdens de busreis.",
        "type": "rest"
      },
      {
        "time": "08:45",
        "title": "Bussen aanwezig – groepen instappen",
        "detail": "De bussen zijn aanwezig om 08:45, vanaf dat moment worden groepen langzaam geïnstrueerd om naar de bus te gaan. Op de dag zelf wordt de bussenindeling gedeeld via de groepsapp. Zorg dat alle kinderen van tevoren naar het toilet geweest zijn. Er zijn blauwe IKEA-tassen aanwezig waarin je in Toverland de tassen van je groepje op één plek kunt verzamelen, vergeet deze niet!",
        "type": "rest"
      },
      {
        "time": "10:15",
        "title": "Aankomst in Toverland",
        "detail": "We lopen met zijn allen in één keer naar binnen richting de verzamelplek. Deze is rechts achter in het park voor de indoor speelhallen voor het doolhof. Zorg dat je je groep compleet hebt als je bij de verzamelplak bent en spreek indien nodig een tijd af met je groep om gezamenlijk te lunchen (dit schiet er anders vaak bij in). Kleuters en pupillen lopen in groepjes door Toverland. Jongeren wordt bepaald per groep of ze alleen door het park kunnen of met begeleiding. Ouderen mogen zelfstandig door Toverland lopen. LET OP! Je krijgt een rooster wanneer je met welke groep door het park moet lopen. Iedere leiding (incl hulpleiding) moet een aangewezen tijdslot een groep kleuters of pupillen beleiden in het park. Zo doet iedereen wat en kan iedereen van het park genieten. Zorg voor elkaar ☺. Er dient ook altijd iemand aanwezig te zijn bij de verzamelplek (hier is ook de EHBO-koffer te vinden).",
        "type": "meal"
      },
      {
        "time": "16:00",
        "title": "Verzamelen bij de verzamelplek",
        "detail": "We verzamelen allemaal weer bij de verzamelplek. Is je groep compleet? Daarna lopen we samen naar de bussen.",
        "type": "rest"
      },
      {
        "time": "16:30",
        "title": "Terugrijden naar Odulphus",
        "detail": "",
        "type": "rest"
      },
      {
        "time": "17:45",
        "title": "Aankomst Odulphus",
        "detail": "Bij aankomst bij Odulphus staan er vaak al ouders klaar om hun kind op te halen. Zorg ervoor dat je groep eerst compleet naar de binnenplaats gaat. Daar kunnen ouders hun kinderen ophalen. Het is van belang dat jij overzicht houdt over welke kinderen al opgehaald zijn en dat lukt niet als ouders hun kinderen meteen wegplukken als je de bus uitstapt.",
        "type": "rest"
      },
      {
        "time": "18:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "18:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Fietsen naar Heukelom",
        "detail": "Controleer of alle fietsen in goede staat zijn, zorg voor fluorescerende hesjes voor alle leiding en zorg dat je een bandenplaksetje bij je hebt. In een grote groep wordt er naar de locatie in Heukelom gefietst. Iedereen rijdt twee-aan-twee, leiding vooraan en achteraan de groep. Zorg dat je als leiding de route kent. Deze vind je in het draaiboek.",
        "type": "rest",
        "routeUrl": "https://maps.app.goo.gl/mA2iY9o2Cx9bn4Te7"
      },
      {
        "time": "11:00",
        "title": "Vrije tijd op kamp/slaapplek in orde maken",
        "detail": "Om 11.00 komt iedereen aan op het kampadres. Laat de kinderen zelf een plek zoeken waar ze willen slapen en geef ze de tijd om hun luchtbedden op te blazen, etc. Let op: inventariseer bij je eigen groep welke snack iedereen wil bij de frietjes (avondeten). Dan kunnen we dat op tijd doorgeven bij de snackbar.",
        "type": "meal"
      },
      {
        "time": "12:00",
        "title": "Lunch",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "12:45",
        "title": "Uitleg Gotcha",
        "detail": "Tijdens het kamp spelen de kinderen het spel woord gotcha. Luister goed naar de uitleg en pak je kaartje.",
        "type": "active"
      },
      {
        "time": "13:00",
        "title": "Zeskamp",
        "detail": "We gaan heerlijk sporten, al de energie moet eruit. Maar welke groep wordt de winnaar?",
        "type": "active"
      },
      {
        "time": "14:30",
        "title": "Ranjapauze en iets lekkers",
        "detail": "Zorg dat er voldoende ranja en water klaarstaat, koeken/snoep en groente en fruit.",
        "type": "meal"
      },
      {
        "time": "15:00",
        "title": "Levend stratego (in het bos)",
        "detail": "Verdeel de groep in twee grote groepen en speel Levend Stratego. Iedereen weet inmiddels wel hoe dit werkt toch?",
        "type": "active"
      },
      {
        "time": "17:00",
        "title": "Frietjes + snack",
        "detail": "Friettafels, saus en snack. Smullen maar!",
        "type": "meal"
      },
      {
        "time": "18:00",
        "title": "Chillen met die billen",
        "detail": "Heb jij ook zo’n after-dinner-dip? Geen probleem. Even relaxen nu. Voor degenen die wel energie hebben: ga alvast waterballonnen vullen. De bingo kan natuurlijk ook al eerder starten als iedereen dat wil.",
        "type": "active"
      },
      {
        "time": "19:00",
        "title": "Ranjacantus",
        "detail": "Het is zingtijd! Ga aan de lange tafels zitten en we zetten een heuse ranjacantus in. Is ook goed voor de zenuwen,",
        "type": "meal"
      },
      {
        "time": "19:45",
        "title": "Spoken arriveren in het bos",
        "detail": "De adresgegevens van de spooktochtlocatie worden tijdens de week in de groepsapp gedeeld.",
        "type": "active"
      },
      {
        "time": "20:00",
        "title": "Omkleden",
        "detail": "Iedereen gaat zich klaarmaken en omkleden voor de avond. Natte kleding kan aan een lange waslijn gehangen worden. Zorg dat kinderen warm genoeg gekleed zijn voor de spooktocht.",
        "type": "active"
      },
      {
        "time": "20:00",
        "title": "Samen route lopen en plekken toewijzen",
        "detail": "Alle spoken lopen samen de route van de spooktocht. De plekken waar de spoken zitten worden hier toebedeeld/bepaald. De groepjes spoken blijven achter op hun plek om alles voor te bereiden en op te bouwen.",
        "type": "active"
      },
      {
        "time": "20:30",
        "title": "Opbouwen spookplek",
        "detail": "Ieder groepje bouwt zijn eigen plek op en kleedt zich om en wordt geschminkt. De spooktocht werkgroep zorgt ervoor dat met breekstaafjes de route gemarkeerd wordt en dat gevaarlijke stukjes afgezet worden. Zij communiceren met regelmaat naar het kamp en de spoken.",
        "type": "active"
      },
      {
        "time": "21:00",
        "title": "Lantaarns maken",
        "detail": "Voor wie de zenuwen niet kan bedwingen en wat te doen wil hebben kunnen een lantaarn gaan maken.",
        "type": "active"
      },
      {
        "time": "22:00",
        "title": "Spooktocht",
        "detail": "Zorg dat alle kinderen naar het toilet geweest zijn en warm zijn aangekleed. Als het buiten echt donker is, zal de eerste groep vertrekken naar het bos. De kinderen mogen zelf hun groepjes voor de spooktocht maken en geven deze door. De groepjes bestaan uit maximaal 8 kinderen. De groepjes zullen om de 10 minuten vertrekken onder leiding van 2 of 3 leidingen.",
        "type": "rest"
      },
      {
        "time": "22:00",
        "title": "Eerste groepje vertrekt vanuit het kamp naar het bos",
        "detail": "Griezelen maar!",
        "type": "rest"
      },
      {
        "time": "00:00",
        "title": "Soep en marshmallows bij het kampvuur",
        "detail": "Er blijven een paar vrijwilligers achter op het kamp met de te bange kinderen om de soep op te warmen, het kampvuur aan te steken en de marshmallows te spiesen. Zodra de groepjes binnendruppelen wordt dit aan ze uitgedeeld en gaat iedereen rond het kampvuur zitten. Wie neemt zijn gitaar mee of kan spoorverhalen vertellen? LET OP! Zorg dat er altijd iemand toezicht houdt op het kampvuur. We sluiten de spooktocht gezamenlijk af als alle groepen terug zijn.",
        "type": "active"
      },
      {
        "time": "00:00",
        "title": "Spooktocht opruimen en richting kamp",
        "detail": "Verzamel al je materialen en laat het bos netjes achter. Neem op de terugweg alle breekstaafjes en andere materialen die je tegenkomt mee. Houd regelmatig contact met andere spoken of er nog ergens hulp nodig is. Hierna gaan alle spoken richting het kamp. Hier staan soep en marshmallows klaar bij het kampvuur.",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Leiding jongeren en kleuters uiterlijk naar huis",
        "detail": "Tijd om kinderen naar de slaapzaal te sturen en de leiding van de jongeren en kleuters naar huis. Morgen weer een lange dag!",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Leiding jongeren en kleuters uiterlijk naar huis",
        "detail": "Tijd om kinderen naar de slaapzaal te sturen en de leiding van de jongeren en kleuters naar huis. Morgen weer een lange dag!",
        "type": "rest"
      }
    ],
    [
      {
        "time": "08:00",
        "title": "Wakker worden, wassen, aankleden en ontbijt klaarzetten",
        "detail": "Pak pannen en lepels, want iedereen moet gewekt worden! Tijd om wakker te worden, te wassen en aan te kleden. Als kinderen al tijd hebben om hun luchtbed leeg te laten lopen en spullen in te pakken, laat ze dat vooral al doen.",
        "type": "meal"
      },
      {
        "time": "09:30",
        "title": "Ontbijten",
        "detail": "Zorg met een aantal vrijwilligers dat het ontbijt klaargezet wordt. Daarna kan er met iedereen ontbeten worden. Mogelijk is het makkelijker om dit in twee rondes te doen (09:00 en 09:30). Kies wat voor jullie het prettigst is. Laat kinderen na het ontbijt hun spullen verder inpakken.",
        "type": "meal"
      },
      {
        "time": "10:30",
        "title": "Opruimen en bijkomen van de nacht",
        "detail": "Ruim rustig je spullen in, poets je tanden, ga hangen en plak je fietsband als dat nodig is.",
        "type": "rest"
      },
      {
        "time": "12:00",
        "title": "Lunchen",
        "detail": "De tafels worden nogmaals gedekt om snel een broodje te kunnen smeren en te lunchen. Na de lunch heeft iedereen nog tijd om zijn/haar laatste spullen in te pakken.",
        "type": "meal"
      },
      {
        "time": "12:30",
        "title": "Activiteit",
        "detail": "Wordt nog bekend gemaakt wat we gaan doen!",
        "type": "active"
      },
      {
        "time": "15:00",
        "title": "Terugfietsen naar Odulphus",
        "detail": "De groepen fietsen gezamenlijk weer terug naar Odulphus. Vergeet de fluorescerende hesjes niet! De enkele vrijwilliger die met de auto op het kampadres is, helpt mee de bus in te laden met tassen.",
        "type": "rest"
      },
      {
        "time": "15:45",
        "title": "Aankomst op Odulphus",
        "detail": "Welkom terug op Odulphus! Er staat ranja en wat lekkers voor jullie klaar!",
        "type": "meal"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      },
      {
        "time": "16:15",
        "title": "Schoonmaken en evalueren",
        "detail": "Zodra je groep naar huis is kijk je op het schoonmaakrooster wat je kunt doen. Dit rooster hangt bij de catering. Streep af wat je gedaan hebt. Vele handen maken licht werk! Als er schoongemaakt is, starten we onder het genot van een hapje en een drankje met de evaluatie. Na elke dag evalueren we met zijn allen (of per bouw) de dag. Wat ging er goed, wat ging er minder goed en wat gaan we morgen doen? Gebruik de achterkant van je draaiboek om overdag notities te maken van dingen waar je tegenaan loopt of die je helemaal fantastisch vindt.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "09:00",
        "title": "Leiding aanwezig bij Odulphus",
        "detail": "Pak lekker een bakje koffie en maak een praatje met andere leiding. Neem het programma door en pak alvast de sleuteldoos en namenlijst voor je groep. Mogelijk start het bestuur de dag met een algemene mededeling. Zorg dat je op tijd klaar zit om de kinderen te ontvangen.",
        "type": "rest"
      },
      {
        "time": "09:30",
        "title": "Kinderen aanwezig bij Odulphus",
        "detail": "Controleer met de namenlijst van je groep of ieder kind aanwezig is en neem de fietssleutels in. Laat het bestuurslid van je groep weten als je een kind mist, dan kunnen zij ouders gaan bellen.",
        "type": "rest"
      },
      {
        "time": "09:45",
        "title": "Aftrap bij podium",
        "detail": "Verzamel al je kinderen voor het podium.",
        "type": "active"
      },
      {
        "time": "10:00",
        "title": "Moordmysterie oplossen (gymzaal Wilgenstraat)",
        "detail": "Komen jullie erachter wie het heeft gedaan? Kom naar de gymzaal en laat de speurneus in je los. Om het geheim te houden, geen verdere uitleg.",
        "type": "active"
      },
      {
        "time": "12:30",
        "title": "Lunchpauze & wisselen ouders(participatie)",
        "detail": "Kinderen hebben zelf een lunchpakketje mee. Zoek een fijn plekje om met je groep te lunchen.",
        "type": "meal"
      },
      {
        "time": "13:00",
        "title": "Ruilspel in de wijk",
        "detail": "Elke groep krijgt een item wat ze moeten zien te ruilen voor iets groters/ meer waarde heeft. Wie komt met het mooiste/grootste item terug?",
        "type": "active"
      },
      {
        "time": "14:15",
        "title": "Het grote carnavalsfeest",
        "detail": "We sluiten KVW2026 af met een gigantisch carnavalsfeest midden in de zomer! Kom verkleed! Iedereen is welkom, alle ouders/verzorgers zijn ook van harte uitgenodigd om verkleed KVW af te sluiten! Ouders zijn vanaf 15.30u welkom om mee te feesten!",
        "type": "active"
      },
      {
        "time": "16:00",
        "title": "Kinderen naar huis",
        "detail": "Zorg dat de kinderen niet zelf naar huis gaan, tenzij anders is afgesproken met ouders.",
        "type": "rest"
      }
    ],
    [
      {
        "time": "20:30",
        "title": "Vrijwilligersfeest",
        "detail": "Om jullie te bedanken voor jullie harde inzet en om stoom af te blazen na een drukke week is op zaterdagavond een vrijwilligersfeest. Het feest is weer als vanouds in het Odulphus. Zorg ervoor dat je binnenkomt via de Wilgenstraat en de ingang naast de kantine (bij de fietsenstalling bij de keuken).",
        "type": "active"
      },
      {
        "time": "23:00",
        "title": "Hulpleiding naar huis",
        "detail": "Om 23:00 bedanken we de hulpleiding voor hun inzet tijdens de week en zwaaien we ze uit als ze naar huis gaan.",
        "type": "rest"
      },
      {
        "time": "01:00",
        "title": "Richting de stad",
        "detail": "We feesten midden in een woonwijk, dus om 01:00 is het tijd om richting de stad te gaan en het feestje verder te zetten in de kroeg.",
        "type": "rest"
      }
    ]
  ]
};

const schedulePrograms = window.KVW_PROGRAM_DATA || legacySchedulePrograms;
const scheduleThemes = window.KVW_PROGRAM_THEMES || {};
const scheduleActivityIndex = buildScheduleActivityIndex(schedulePrograms);

let scheduleDayIndex = 0;
let scheduleCategory = scheduleCategories[0];
let scheduleSwipeStartX = null;
const scheduleRotationUI = new Map();
const toverlandResources = {
  map: {
    kind: "pdf",
    url: "./assets/toverland/plattegrond-toverland.pdf#view=FitH",
    title: "Plattegrond Toverland"
  },
  ranjapost: {
    kind: "image",
    url: "./assets/toverland/instructie-ranjapost.png",
    title: "Instructiekaart ranjapost"
  },
  "meeting-point": {
    kind: "image",
    url: "./assets/toverland/instructie-verzamelplek.png",
    title: "Instructiekaart verzamelplek"
  }
};
const toverlandRoster = [
  { time: "11:00 - 11:45", ranjapost: ["Dylan Kruis", "Roos Post"], meetingPoint: ["Finn Verbraak"] },
  { time: "11:45 - 12:30", ranjapost: ["Isabel Bruijns", "Mila Reith"], meetingPoint: ["Floris van der Lee"] },
  { time: "12:30 - 13:15", ranjapost: ["Henrike Maaskant", "Moessa Mbarki"], meetingPoint: ["Ricky de Laat"] },
  { time: "13:15 - 14:00", ranjapost: ["Robin Rongen", "Sara Meijs"], meetingPoint: ["Roan van Heijst"] },
  { time: "14:00 - 14:45", ranjapost: ["Thijs van Stokkum", "Robijn Conradi"], meetingPoint: ["Joep Schutselaars"] },
  { time: "14:45 - 15:30", ranjapost: ["Iby van de Hout", "Ashley van der Vliet"], meetingPoint: ["Kate Fonk"] }
];
let toverlandRosterMode = "mine";
let toverlandRosterReturnFocus = null;
const cleaningRosterImage = "./assets/cleaning/schoonmaakrooster-kvw-2026.jpg";
const cleaningRosterByDay = {
  0: [
    { task: "Kantine opruimen en poetsen", groups: ["Pupillen 2A"] },
    { task: "Sportveld opruimen", groups: ["Jongeren 1"] },
    { task: "Gymzaal Laagstraat opruimen", groups: ["Kleuters 1A"] },
    { task: "Gymzaal Wilgenstraat opruimen", groups: ["Kleuters 4A"] },
    { task: "Keuken opruimen en poetsen", groups: ["Ouderen 1"] },
    { task: "Toiletten kantine schoonmaken", groups: ["Pupillen 1A"] },
    { task: "Toiletten gymzalen schoonmaken", groups: ["Kleuters 3A"] },
    { task: "Binnenplaats opruimen", groups: ["Ouderen 2"] },
    { task: "Kleuterhoek opruimen", groups: ["Kleuters 2A"] },
    { task: "Gangen vegen/stofzuigen", groups: ["Pupillen 3A"] }
  ],
  1: [
    { task: "Toiletten kantine schoonmaken", groups: ["Kleuters 1B"] },
    { task: "Toiletten gymzalen schoonmaken", groups: ["Pupillen 1B"] }
  ],
  2: [
    { task: "Kantine opruimen en poetsen", groups: ["Jongeren 3"] },
    { task: "Sportveld opruimen", groups: ["Kleuters 3B"] },
    { task: "Gymzaal Laagstraat opruimen", groups: ["Kleuters 4B"] },
    { task: "Gymzaal Wilgenstraat opruimen", groups: ["Pupillen 2B"] },
    { task: "Keuken opruimen en poetsen", groups: ["Kleuters 1B"] },
    { task: "Toiletten kantine schoonmaken", groups: ["Pupillen 3B"] },
    { task: "Toiletten gymzalen schoonmaken", groups: ["Jongeren 4"] },
    { task: "Binnenplaats opruimen", groups: ["Jongeren 2"] },
    { task: "Kleuterhoek opruimen", groups: ["Kleuters 2B"] },
    { task: "Gangen vegen/stofzuigen", groups: ["Pupillen 1B"] }
  ],
  3: [
    { task: "Kantine opruimen en poetsen", groups: ["Kleuters 3A"] },
    { task: "Sportveld opruimen", groups: ["Kleuters 2A"] },
    { task: "Gymzaal Laagstraat opruimen", groups: ["Jongeren 1"] },
    { task: "Gymzaal Wilgenstraat opruimen", groups: ["Pupillen 2A"] },
    { task: "Keuken opruimen en poetsen", groups: ["Pupillen 3A"] },
    { task: "Toiletten kantine schoonmaken", groups: ["Ouderen 1"] },
    { task: "Toiletten gymzalen schoonmaken", groups: ["Kleuters 1A"] },
    { task: "Binnenplaats opruimen", groups: ["Ouderen 3"] },
    { task: "Kleuterhoek opruimen", groups: ["Kleuters 4A"] },
    { task: "Gangen vegen/stofzuigen", groups: ["Pupillen 1A"] }
  ],
  4: [
    { task: "Kantine opruimen en poetsen", groups: ["Kleuters 3B"] },
    { task: "Sportveld opruimen", groups: ["Kleuters 2B"] },
    { task: "Gymzaal Laagstraat opruimen", groups: ["Jongeren 3"] },
    { task: "Gymzaal Wilgenstraat opruimen", groups: ["Pupillen 2B"] },
    { task: "Keuken opruimen en poetsen", groups: ["Pupillen 3B"] },
    { task: "Toiletten kantine schoonmaken", groups: ["Jongeren 2"] },
    { task: "Toiletten gymzalen schoonmaken", groups: ["Ouderen 3"] },
    { task: "Binnenplaats opruimen", groups: ["Ouderen 2"] },
    { task: "Kleuterhoek opruimen", groups: ["Kleuters 4B"] },
    { task: "Gangen vegen/stofzuigen", groups: ["Jongeren 4"] }
  ]
};

const legacyRoomScheduleDays = [
  {
    label: "Maandag",
    date: "17 aug",
    rows: [
      { time: "09:45 - 10:15", rooms: [{ room: "Aula", activity: "Iedereen" }] },
      { time: "10:15 - 11:00", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Kleuters 1/2 - Lasergamen" },
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters 3/4 - Tikspelletjes" },
        { room: "Binnenplaats", activity: "Ouderen" },
        { room: "Sportveld", activity: "Pupillen / Jongeren" }
      ] },
      { time: "11:15 - 12:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Kleuters 3/4 - Lasergamen tot 12:00" },
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters 1/2 - Tikspelletjes tot 12:00" },
        { room: "Aula", activity: "Kleuters vanaf 12:00 / Pupillen" },
        { room: "Binnenplaats", activity: "Pupillen / Jongeren" },
        { room: "Sportveld", activity: "Ouderen" }
      ] },
      { time: "13:00 - 13:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Ouderen 1/2 - Lasergamen" },
        { room: "Aula", activity: "Kleuters / Pupillen" },
        { room: "Extern / overig", activity: "Jongeren - wijk" }
      ] },
      { time: "13:30 - 14:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Ouderen 1/2 - Lasergamen tot 14:00" },
        { room: "Aula", activity: "Kleuters" },
        { room: "Sportveld", activity: "Pupillen" },
        { room: "Extern / overig", activity: "Jongeren - wijk / Ouderen - wijk vanaf 14:00" }
      ] },
      { time: "14:30 - 15:45", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Ouderen 3/4 - Lasergamen" },
        { room: "Aula", activity: "Kleuters vanaf 15:15 / Pupillen vanaf 14:45" },
        { room: "Sportveld", activity: "Kleuters tot 15:15 / Jongeren vanaf 14:45" },
        { room: "Extern / overig", activity: "Ouderen - wijk" }
      ] }
    ]
  },
  {
    label: "Dinsdag",
    date: "18 aug",
    rows: [
      { time: "Hele dag", rooms: [{ room: "Extern / overig", activity: "Geen ruimteschema in Odulphus" }] }
    ]
  },
  {
    label: "Woensdag",
    date: "19 aug",
    rows: [
      { time: "09:45 - 10:00", rooms: [{ room: "Aula", activity: "Iedereen" }] },
      { time: "10:00 - 11:00", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Jongeren 1/3 - Lasergamen" },
        { room: "Gymzaal Wilgenstraat", activity: "Pupillen" },
        { room: "Sportveld", activity: "Jongeren 2/4 - Feestrace" },
        { room: "Extern / overig", activity: "Kleuters - kapel / Ouderen - kamp" }
      ] },
      { time: "11:00 - 12:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Jongeren 2/4 - Lasergamen" },
        { room: "Sportveld", activity: "Jongeren 1/3 - Feestrace" },
        { room: "Extern / overig", activity: "Pupillen - kapel / Ouderen - kamp" }
      ] },
      { time: "13:00 - 13:30", rooms: [
        { room: "Aula", activity: "Kleuters / Pupillen" },
        { room: "Binnenplaats", activity: "Jongeren" },
        { room: "Extern / overig", activity: "Ouderen - kamp" }
      ] },
      { time: "13:30 - 14:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Pupillen 1A, 1B, 2A - Lasergamen" },
        { room: "Aula", activity: "Pupillen - Knutselen" },
        { room: "Binnenplaats", activity: "Kleuters" },
        { room: "Extern / overig", activity: "Jongeren - kapel / Ouderen - kamp" }
      ] },
      { time: "14:30 - 15:00", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Pupillen 2B, 3A, 3B - Lasergamen" },
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters 3/4 - Taarttrefbal" },
        { room: "Aula", activity: "Pupillen - Knutselen" },
        { room: "Binnenplaats", activity: "Kleuters 1/2 - Feestrace" },
        { room: "Extern / overig", activity: "Jongeren - kapel / Ouderen - kamp" }
      ] },
      { time: "15:00 - 15:45", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Pupillen 2B, 3A, 3B - Lasergamen" },
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters 1/2 - Taarttrefbal" },
        { room: "Aula", activity: "Pupillen - Knutselen" },
        { room: "Binnenplaats", activity: "Kleuters 3/4 - Feestrace" },
        { room: "Extern / overig", activity: "Jongeren - kapel / Ouderen - kamp" }
      ] }
    ]
  },
  {
    label: "Donderdag",
    date: "20 aug",
    rows: [
      { time: "09:45 - 10:00", rooms: [
        { room: "Aula", activity: "Kleuters / Pupillen / Jongeren" },
        { room: "Extern / overig", activity: "Ouderen - kamp" }
      ] },
      { time: "10:00 - 11:00", rooms: [
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters" },
        { room: "Aula", activity: "Kleuters" },
        { room: "Binnenplaats", activity: "Kleuters" },
        { room: "Extern / overig", activity: "Kleuters - lokaal / Pupillen - stadspark / Jongeren - stadspark / Ouderen - kamp" }
      ] },
      { time: "11:15 - 12:30", rooms: [
        { room: "Gymzaal Wilgenstraat", activity: "Kleuters" },
        { room: "Aula", activity: "Kleuters" },
        { room: "Binnenplaats", activity: "Kleuters" },
        { room: "Extern / overig", activity: "Kleuters - lokaal / Pupillen - stadspark / Jongeren - stadspark" }
      ] },
      { time: "13:00 - 13:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Jongeren" },
        { room: "Gymzaal Wilgenstraat", activity: "Jongeren" },
        { room: "Aula", activity: "Kleuters / Pupillen" },
        { room: "Sportveld", activity: "Jongeren" }
      ] },
      { time: "13:30 - 14:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Jongeren" },
        { room: "Gymzaal Wilgenstraat", activity: "Jongeren" },
        { room: "Aula", activity: "Pupillen" },
        { room: "Sportveld", activity: "Pupillen / Jongeren" },
        { room: "Extern / overig", activity: "Kleuters - kloostertuin / Pupillen - kapel/lokaal / Ouderen - kamp" }
      ] },
      { time: "14:30 - 15:45", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Jongeren" },
        { room: "Gymzaal Wilgenstraat", activity: "Jongeren" },
        { room: "Aula", activity: "Pupillen" },
        { room: "Binnenplaats", activity: "Kleuters vanaf 15:00" },
        { room: "Sportveld", activity: "Pupillen / Jongeren" },
        { room: "Extern / overig", activity: "Kleuters - kloostertuin tot 15:00 / Pupillen - kapel/lokaal / Ouderen - kamp" }
      ] },
      { time: "15:45 - 16:00", rooms: [{ room: "Aula", activity: "Iedereen" }] }
    ]
  },
  {
    label: "Vrijdag",
    date: "21 aug",
    rows: [
      { time: "09:45 - 10:00", rooms: [{ room: "Aula", activity: "Iedereen" }] },
      { time: "10:00 - 11:30", rooms: [
        { room: "Gymzaal Laagstraat", activity: "Kleuters vanaf 11:00" },
        { room: "Gymzaal Wilgenstraat", activity: "Ouderen" },
        { room: "Extern / overig", activity: "Kleuters - wijk tot 10:45 / Pupillen - wijk / Jongeren - wijk" }
      ] },
      { time: "11:30 - 12:30", rooms: [
        { room: "Aula", activity: "Kleuters / Pupillen" },
        { room: "Sportveld", activity: "Jongeren" }
      ] },
      { time: "13:15 - 14:15", rooms: [
        { room: "Aula", activity: "Kleuters" },
        { room: "Binnenplaats", activity: "Pupillen / Jongeren / Ouderen" }
      ] },
      { time: "14:15 - 16:00", rooms: [{ room: "Aula", activity: "Iedereen" }] }
    ]
  }
];

const legacyRoomScheduleRooms = [
  "Gymzaal Laagstraat",
  "Gymzaal Wilgenstraat",
  "Aula",
  "Binnenplaats",
  "Sportveld",
  "Extern / overig"
];

const roomScheduleData = window.KVW_TIMETABLE_DATA || {};
const roomScheduleDays = roomScheduleData.days || legacyRoomScheduleDays;
const roomScheduleRooms = roomScheduleData.rooms || legacyRoomScheduleRooms;
const roomScheduleLegendItems = roomScheduleData.legend || [];

let roomScheduleDayIndex = 0;

const groupSelect = document.querySelector("#groupSelect");
const daySelect = document.querySelector("#daySelect");
const presentCount = document.querySelector("#presentCount");
const missingCount = document.querySelector("#missingCount");
const searchInput = document.querySelector("#searchInput");
const childList = document.querySelector("#childList");
const saveButton = document.querySelector("#saveButton");
const saveStatus = document.querySelector("#saveStatus");
const navButtons = document.querySelectorAll(".bottom-nav button");
const views = document.querySelectorAll(".content-view");
const attendanceChrome = document.querySelectorAll("[data-attendance-chrome]");
const homeView = document.querySelector("#homeView");
const criticalInfoBanner = document.querySelector("#criticalInfoBanner");
const criticalInfoBannerText = document.querySelector("#criticalInfoBannerText");
const groupCards = document.querySelector("#groupCards");
const manageList = document.querySelector("#manageList");
const addKidForm = document.querySelector("#addKidForm");
const newKidName = document.querySelector("#newKidName");
const markAllButton = document.querySelector("#markAllButton");
const toast = document.querySelector("#toast");
const saveDock = document.querySelector("#saveDock");
const saveCelebration = document.querySelector("#saveCelebration");
const managerStats = document.querySelector("#managerStats");
const createGroupForm = document.querySelector("#createGroupForm");
const newGroupName = document.querySelector("#newGroupName");
const addLeaderForm = document.querySelector("#addLeaderForm");
const newLeaderName = document.querySelector("#newLeaderName");
const leadersList = document.querySelector("#leadersList");
const addManagerForm = document.querySelector("#addManagerForm");
const newManagerName = document.querySelector("#newManagerName");
const managersList = document.querySelector("#managersList");
const boardGrid = document.querySelector("#boardGrid");
const boardProfileEditor = document.querySelector("#boardProfileEditor");
const bulkKidsForm = document.querySelector("#bulkKidsForm");
const bulkKidsCsv = document.querySelector("#bulkKidsCsv");
const bulkUsersForm = document.querySelector("#bulkUsersForm");
const bulkUsersCsv = document.querySelector("#bulkUsersCsv");
const bulkImportStatus = document.querySelector("#bulkImportStatus");
const managerGroups = document.querySelector("#managerGroups");
const managementLock = document.querySelector("#managementLock");
const managementWorkspace = document.querySelector("#managementWorkspace");
const unlockForm = document.querySelector("#unlockForm");
const managerPassword = document.querySelector("#managerPassword");
const lockManagementButton = document.querySelector("#lockManagementButton");
const managementIntro = document.querySelector("#managementIntro");
const managementHub = document.querySelector("#managementHub");
const managementPanels = document.querySelectorAll("[data-management-panel]");
const changeOwnPinForm = document.querySelector("#changeOwnPinForm");
const ownPinInput = document.querySelector("#ownPinInput");
const resetPinForm = document.querySelector("#resetPinForm");
const resetPinUser = document.querySelector("#resetPinUser");
const resetPinInput = document.querySelector("#resetPinInput");
const resetAllPinsForm = document.querySelector("#resetAllPinsForm");
const resetAllPinsConfirm = document.querySelector("#resetAllPinsConfirm");
const themeToggle = document.querySelector("#themeToggle");
const scheduleDateLabel = document.querySelector("#scheduleDateLabel");
const scheduleDayName = document.querySelector("#scheduleDayName");
const scheduleDayRange = document.querySelector("#scheduleDayRange");
const scheduleCategorySwitch = document.querySelector("#scheduleCategorySwitch");
const scheduleBoard = document.querySelector("#scheduleBoard");
const toverlandHub = document.querySelector("#toverlandHub");
const toverlandRosterModal = document.querySelector("#toverlandRosterModal");
const toverlandRosterContent = document.querySelector("#toverlandRosterContent");
const closeToverlandRosterButton = document.querySelector("#closeToverlandRoster");
const prevScheduleDay = document.querySelector("#prevScheduleDay");
const nextScheduleDay = document.querySelector("#nextScheduleDay");
const openInstructionLibraryButton = document.querySelector("#openInstructionLibraryButton");
const closeInstructionLibraryButton = document.querySelector("#closeInstructionLibraryButton");
const publicInstructionSearch = document.querySelector("#publicInstructionSearch");
const publicInstructionFilters = document.querySelector("#publicInstructionFilters");
const publicInstructionResults = document.querySelector("#publicInstructionResults");
const publicInstructionCount = document.querySelector("#publicInstructionCount");
const roomScheduleSwitch = document.querySelector("#roomScheduleSwitch");
const roomScheduleLegend = document.querySelector("#roomScheduleLegend");
const roomScheduleBoard = document.querySelector("#roomScheduleBoard");
const instructionSearch = document.querySelector("#instructionSearch");
const instructionCategoryFilter = document.querySelector("#instructionCategoryFilter");
const instructionList = document.querySelector("#instructionList");
const instructionDetail = document.querySelector("#instructionDetail");
const addInstructionButton = document.querySelector("#addInstructionButton");
const instructionModal = document.querySelector("#instructionModal");
const instructionForm = document.querySelector("#instructionForm");
const instructionFormTitle = document.querySelector("#instructionFormTitle");
const instructionId = document.querySelector("#instructionId");
const instructionTitle = document.querySelector("#instructionTitle");
const instructionCategory = document.querySelector("#instructionCategory");
const instructionSummary = document.querySelector("#instructionSummary");
const instructionBody = document.querySelector("#instructionBody");
const instructionMaterials = document.querySelector("#instructionMaterials");
const instructionSafety = document.querySelector("#instructionSafety");
const instructionFiles = document.querySelector("#instructionFiles");
const instructionUploadStatus = document.querySelector("#instructionUploadStatus");
const saveInstructionButton = document.querySelector("#saveInstructionButton");
const cancelInstructionButton = document.querySelector("#cancelInstructionButton");
const cancelInstructionFooterButton = document.querySelector("#cancelInstructionFooterButton");
const instructionImageViewer = document.querySelector("#instructionImageViewer");
const instructionImageViewerImage = document.querySelector("#instructionImageViewerImage");
const instructionImageViewerCaption = document.querySelector("#instructionImageViewerCaption");
const instructionImageViewerCount = document.querySelector("#instructionImageViewerCount");
const instructionDocumentViewer = document.querySelector("#instructionDocumentViewer");
const boardGuideButton = document.querySelector("#boardGuideButton");
const boardGuideViewer = document.querySelector("#boardGuideViewer");
const boardGuideFrame = document.querySelector("#boardGuideFrame");
const closeBoardGuideButton = document.querySelector("#closeBoardGuideButton");
const instructionTextViewer = document.querySelector("#instructionTextViewer");
const instructionTextViewerTitle = document.querySelector("#instructionTextViewerTitle");
const instructionTextViewerSummary = document.querySelector("#instructionTextViewerSummary");
const instructionTextViewerBody = document.querySelector("#instructionTextViewerBody");
const closeInstructionImageViewerButton = document.querySelector("#closeInstructionImageViewer");
const previousInstructionViewerItemButton = document.querySelector("#previousInstructionViewerItem");
const nextInstructionViewerItemButton = document.querySelector("#nextInstructionViewerItem");
const feedbackForm = document.querySelector("#feedbackForm");
const feedbackCategory = document.querySelector("#feedbackCategory");
const feedbackText = document.querySelector("#feedbackText");
const feedbackList = document.querySelector("#feedbackList");
const clearFeedbackButton = document.querySelector("#clearFeedbackButton");
const clearFeedbackConfirm = document.querySelector("#clearFeedbackConfirm");
const confirmClearFeedbackButton = document.querySelector("#confirmClearFeedbackButton");
const cancelClearFeedbackButton = document.querySelector("#cancelClearFeedbackButton");
const importantInfoForm = document.querySelector("#importantInfoForm");
const importantInfoUrgency = document.querySelector("#importantInfoUrgency");
const importantInfoTitle = document.querySelector("#importantInfoTitle");
const importantInfoText = document.querySelector("#importantInfoText");
const importantInfoList = document.querySelector("#importantInfoList");
const agreementsList = document.querySelector("#agreementsList");
const setupHomeTile = document.querySelector("#setupHomeTile");
const setupSummary = document.querySelector("#setupSummary");
const setupTaskList = document.querySelector("#setupTaskList");
const setupModuleToggle = document.querySelector("#setupModuleToggle");
const setupTaskForm = document.querySelector("#setupTaskForm");
const setupTaskTitle = document.querySelector("#setupTaskTitle");
const setupTaskArea = document.querySelector("#setupTaskArea");
const identityScreen = document.querySelector("#identityScreen");
const identityForm = document.querySelector("#identityForm");
const identitySearch = document.querySelector("#identitySearch");
const identityResults = document.querySelector("#identityResults");
const installHelpButton = document.querySelector("#installHelpButton");
const installHelpPanel = document.querySelector("#installHelpPanel");
const installHelpClose = document.querySelector("#installHelpClose");
const recentUserCard = document.querySelector("#recentUserCard");
const recentUserName = document.querySelector("#recentUserName");
const recentUserButton = document.querySelector("#recentUserButton");
const bootstrapManagerForm = document.querySelector("#bootstrapManagerForm");
const bootstrapManagerName = document.querySelector("#bootstrapManagerName");
const bootstrapManagerPin = document.querySelector("#bootstrapManagerPin");
const bootstrapManagerPinConfirm = document.querySelector("#bootstrapManagerPinConfirm");
const bootstrapManagerError = document.querySelector("#bootstrapManagerError");
const pinForm = document.querySelector("#pinForm");
const pinInput = document.querySelector("#pinInput");
const pinConfirmInput = document.querySelector("#pinConfirmInput");
const pinError = document.querySelector("#pinError");
const pinLabel = document.querySelector("#pinLabel");
const pinSubmitButton = document.querySelector("#pinSubmitButton");
const pinBackButton = document.querySelector("#pinBackButton");
const currentUserLabel = document.querySelector("#currentUserLabel");
const switchUserButton = document.querySelector("#switchUserButton");
let managementUnlocked = false;
let pendingUser = null;
let activeManagementPanel = "";
let activeInstructionId = "";
let instructionActivityFilter = "";
let instructionLinkCategory = scheduleCategories[0];
let instructionLinkDayIndex = 0;
let instructionImageViewerReturnFocus = null;
let instructionViewerItems = [];
let instructionViewerIndex = 0;
let boardGuideReturnFocus = null;
let publicInstructionCategory = "all";
let openAgreementId = "";

function loadState() {
  const stored = localStorage.getItem(storeKey);
  if (!stored) return normalizeState(structuredClone(seed));

  try {
    return normalizeState({ ...structuredClone(seed), ...JSON.parse(stored) });
  } catch {
    return normalizeState(structuredClone(seed));
  }
}

function backupLocalState(reason = "database-sync") {
  try {
    localStorage.setItem(backupStoreKey, JSON.stringify({
      reason,
      createdAt: new Date().toISOString(),
      state
    }));
  } catch {
    // Backup is best-effort; the app should keep working if storage is full.
  }
}

function persist() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Lokale opslag is vol; database-opslag blijft actief", error);
  }
  queueRemoteSave();
}

function sharedStateSnapshot() {
  return {
    groups: state.groups,
    leaders: state.leaders,
    managers: state.managers,
    supportProfiles: state.supportProfiles,
    userPins: state.userPins,
    userThemes: state.userThemes,
    feedback: state.feedback,
    importantInfo: state.importantInfo,
    generalAgreements: state.generalAgreements,
    generalAgreementsVersion: state.generalAgreementsVersion,
    gameInstructions: state.gameInstructions,
    instructionLibraryVersion: state.instructionLibraryVersion,
    setupModuleEnabled: state.setupModuleEnabled,
    setupTasks: state.setupTasks,
    days: state.days,
    attendance: state.attendance,
    savedAt: state.savedAt
  };
}

function stableJsonStringify(value) {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (!nestedValue || typeof nestedValue !== "object" || Array.isArray(nestedValue)) return nestedValue;
    return Object.fromEntries(
      Object.keys(nestedValue)
        .sort()
        .map((key) => [key, nestedValue[key]])
    );
  });
}

function sharedStateJson() {
  return stableJsonStringify(sharedStateSnapshot());
}

const sharedStateKeys = [
  "groups",
  "leaders",
  "managers",
  "supportProfiles",
  "userPins",
  "userThemes",
  "feedback",
  "importantInfo",
  "generalAgreements",
  "generalAgreementsVersion",
  "gameInstructions",
  "instructionLibraryVersion",
  "setupModuleEnabled",
  "setupTasks",
  "days",
  "attendance",
  "savedAt"
];

function changedSharedStateKeys(previousState, nextState) {
  return new Set(sharedStateKeys.filter((key) => (
    stableJsonStringify(previousState?.[key]) !== stableJsonStringify(nextState?.[key])
  )));
}

function remoteUpdateToastMessage(changedKeys) {
  const changed = (...keys) => keys.some((key) => changedKeys.has(key));

  if (state.activeView === "todayView" && changed("attendance", "savedAt", "days")) {
    return "Aanwezigheid bijgewerkt door een andere gebruiker";
  }
  if (state.activeView === "feedbackView" && changed("feedback")) {
    return "Evaluaties bijgewerkt door een andere gebruiker";
  }
  if (["homeView", "contactsView"].includes(state.activeView) && changed("importantInfo")) {
    return "Belangrijke info bijgewerkt";
  }
  if (["homeView", "agreementsView"].includes(state.activeView) && changed("generalAgreements")) {
    return "Algemene afspraken bijgewerkt";
  }
  if (["homeView", "setupView"].includes(state.activeView) && changed("setupModuleEnabled", "setupTasks")) {
    return "Opbouw bijgewerkt door een andere gebruiker";
  }
  if (["scheduleView", "instructionLibraryView"].includes(state.activeView) && changed("gameInstructions", "instructionLibraryVersion")) {
    return "Spelinstructies bijgewerkt";
  }
  if (["todayView", "groupsView", "kidsView"].includes(state.activeView) && changed("groups", "leaders", "managers")) {
    return "Groepen bijgewerkt door een andere gebruiker";
  }
  if (state.activeView === "boardView" && changed("managers", "supportProfiles")) {
    return "Profielen bijgewerkt";
  }
  if (state.activeView === "managementView") {
    if (activeManagementPanel === "instructions" && changed("gameInstructions", "instructionLibraryVersion")) {
      return "Spelinstructies bijgewerkt";
    }
    if (activeManagementPanel === "groups" && changed("groups", "leaders")) {
      return "Groepen bijgewerkt door een andere gebruiker";
    }
    if (["users", "overview"].includes(activeManagementPanel) && changed("groups", "leaders", "managers")) {
      return "Beheergegevens bijgewerkt";
    }
    if (activeManagementPanel === "access" && changed("userPins", "userThemes")) {
      return "Toegangsinstellingen bijgewerkt";
    }
  }

  return "";
}

function peopleCount(source) {
  return (source.leaders?.length || 0) + (source.managers?.length || 0);
}

function kidsCount(source) {
  return (source.groups || []).reduce((sum, group) => sum + (group.kids?.length || 0), 0);
}

function shouldRecoverFromEmptyRemoteState(remoteState) {
  const localSharedState = sharedStateSnapshot();
  const localPeople = peopleCount(localSharedState);
  const remotePeople = peopleCount(remoteState || {});
  const localKids = kidsCount(localSharedState);
  const remoteKids = kidsCount(remoteState || {});

  return remotePeople === 0 && remoteKids === 0 && (localPeople > 0 || localKids > 0);
}

function remoteUpdatedAtMs(value) {
  const time = Date.parse(value || "");
  return Number.isNaN(time) ? 0 : time;
}

function applySharedState(sharedState) {
  const session = {
    currentUser: state.currentUser,
    activeView: state.activeView,
    activeGroupId: state.activeGroupId,
    activeDay: state.activeDay
  };

  state = normalizeState({ ...structuredClone(seed), ...sharedState });
  state.currentUser = session.currentUser && userExists(state, session.currentUser) ? session.currentUser : null;
  state.activeView = ["homeView", "todayView", "scheduleView", "instructionLibraryView", "setupView", "roomScheduleView", "feedbackView", "contactsView", "agreementsView", "boardView", "groupsView", "kidsView", "managementView"].includes(session.activeView)
    ? session.activeView
    : "homeView";
  if (!state.setupModuleEnabled && state.activeView === "setupView") {
    state.activeView = "homeView";
  }
  state.activeDay = state.days.includes(session.activeDay) ? session.activeDay : state.days[0];

  const visibleGroups = visibleGroupsFor(state);
  state.activeGroupId = visibleGroups.some((group) => group.id === session.activeGroupId)
    ? session.activeGroupId
    : visibleGroups[0]?.id || state.groups[0]?.id || "";
  const normalizedSharedStateJson = sharedStateJson();
  const incomingSharedStateJson = stableJsonStringify(sharedState);
  lastSharedStateJson = incomingSharedStateJson === normalizedSharedStateJson
    ? normalizedSharedStateJson
    : incomingSharedStateJson;
  queuedSharedStateJson = "";
}

function hasDatabaseConfig() {
  const config = window.KVW_SUPABASE_CONFIG || {};
  return Boolean(config.url && config.anonKey && window.supabase?.createClient);
}

function queueRemoteSave() {
  if (!databaseReady || applyingRemoteState || !databaseClient) return;
  const nextSharedStateJson = sharedStateJson();
  if (nextSharedStateJson === lastSharedStateJson || nextSharedStateJson === queuedSharedStateJson) return;
  queuedSharedStateJson = nextSharedStateJson;
  localSavePending = true;
  lastLocalChangeAt = Date.now();
  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(saveRemoteState, 350);
}

async function saveRemoteState() {
  if (!databaseReady || applyingRemoteState || !databaseClient) return;
  const nextSharedStateJson = sharedStateJson();
  if (nextSharedStateJson === lastSharedStateJson) {
    queuedSharedStateJson = "";
    localSavePending = false;
    return;
  }

  const updatedAt = new Date().toISOString();
  lastRemoteUpdate = updatedAt;

  const { error } = await databaseClient
    .from("kvw_app_state")
    .upsert({
      id: "main",
      state: sharedStateSnapshot(),
      updated_at: updatedAt
    });

  if (error) {
    console.error("Database opslaan mislukt", error);
    showToast("Database opslaan mislukt");
    localSavePending = false;
    return;
  }

  lastSharedStateJson = nextSharedStateJson;
  queuedSharedStateJson = "";
  localSavePending = false;
}

async function initDatabase() {
  if (!hasDatabaseConfig()) return;

  const config = window.KVW_SUPABASE_CONFIG;
  databaseClient = window.supabase.createClient(config.url, config.anonKey);

  const { data, error } = await databaseClient
    .from("kvw_app_state")
    .select("state, updated_at")
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    console.error("Database laden mislukt", error);
    showToast("Database laden mislukt");
    return;
  }

  if (data?.state) {
    if (shouldRecoverFromEmptyRemoteState(data.state)) {
      backupLocalState("remote-state-smaller-than-local");
      databaseReady = true;
      lastSharedStateJson = "";
      showToast("Lokale gegevens naar database hersteld");
      await saveRemoteState();
    } else {
      backupLocalState("before-remote-state-applied");
      applyingRemoteState = true;
      lastRemoteUpdate = data.updated_at || "";
      applySharedState(data.state);
      renderAll();
      applyingRemoteState = false;
    }
  } else {
    backupLocalState("before-first-remote-save");
    lastSharedStateJson = "";
  }

  databaseReady = true;
  if (!data?.state || lastSharedStateJson !== sharedStateJson()) await saveRemoteState();

  databaseClient
    .channel("kvw-app-state")
    .on("postgres_changes", { event: "*", schema: "public", table: "kvw_app_state", filter: "id=eq.main" }, (payload) => {
      if (!payload.new?.state || payload.new.updated_at === lastRemoteUpdate) return;
      if (remoteUpdatedAtMs(payload.new.updated_at) < lastLocalChangeAt) return;

      const incomingSharedStateJson = stableJsonStringify(payload.new.state);
      const changedKeys = changedSharedStateKeys(sharedStateSnapshot(), payload.new.state);
      if (!changedKeys.size) {
        lastRemoteUpdate = payload.new.updated_at || "";
        lastSharedStateJson = incomingSharedStateJson;
        queuedSharedStateJson = "";
        localSavePending = false;
        return;
      }
      if (localSavePending && incomingSharedStateJson !== queuedSharedStateJson) return;
      if (localSavePending && incomingSharedStateJson === queuedSharedStateJson) {
        lastRemoteUpdate = payload.new.updated_at || "";
        lastSharedStateJson = incomingSharedStateJson;
        queuedSharedStateJson = "";
        localSavePending = false;
        return;
      }

      const updateMessage = remoteUpdateToastMessage(changedKeys);
      applyingRemoteState = true;
      lastRemoteUpdate = payload.new.updated_at || "";
      applySharedState(payload.new.state);
      renderAll();
      applyingRemoteState = false;
      queueRemoteSave();
      if (updateMessage) showToast(updateMessage);
    })
    .subscribe();

  showToast("Database gekoppeld");
}

function normalizeState(nextState) {
  const dayTranslations = {
    "Mon 20 Jul": "Ma 20 jul",
    "Tue 21 Jul": "Di 21 jul",
    "Wed 22 Jul": "Wo 22 jul",
    "Thu 23 Jul": "Do 23 jul",
    "Fri 24 Jul": "Vr 24 jul",
    "Ma 20 jul": "Ma 17 aug",
    "Di 21 jul": "Di 18 aug",
    "Wo 22 jul": "Wo 19 aug",
    "Do 23 jul": "Do 20 aug",
    "Vr 24 jul": "Vr 21 aug"
  };
  const defaultGroupTranslations = {
    Sunbeams: "Zonnestralen",
    Rainbows: "Regenbogen",
    Rockets: "Raketten"
  };
  const defaultPersonTranslations = {
    "Lotte Manager": "Lotte Beheerder",
    "Mark Coordinator": "Mark Coördinator"
  };

  nextState.days = structuredClone(seed.days);

  Object.entries(dayTranslations).forEach(([oldDay, newDay]) => {
    if (nextState.attendance?.[oldDay] && !nextState.attendance[newDay]) {
      nextState.attendance[newDay] = nextState.attendance[oldDay];
      delete nextState.attendance[oldDay];
    }
  });

  if (dayTranslations[nextState.activeDay]) {
    nextState.activeDay = dayTranslations[nextState.activeDay];
  }

  nextState.groups = Array.isArray(nextState.groups) && nextState.groups.length ? nextState.groups : structuredClone(seed.groups);
  nextState.leaders = Array.isArray(nextState.leaders) ? nextState.leaders : structuredClone(seed.leaders);
  nextState.managers = Array.isArray(nextState.managers) ? nextState.managers : structuredClone(seed.managers);
  nextState.days = Array.isArray(nextState.days) && nextState.days.length ? nextState.days : structuredClone(seed.days);
  nextState.attendance ||= {};
  nextState.savedAt ||= {};
  nextState.userPins ||= {};
  nextState.userThemes ||= {};
  nextState.feedback = Array.isArray(nextState.feedback)
    ? nextState.feedback.map((entry) => ({
      ...entry,
      reactions: entry?.reactions && typeof entry.reactions === "object" && !Array.isArray(entry.reactions)
        ? entry.reactions
        : {}
    }))
    : [];
  nextState.importantInfo = Array.isArray(nextState.importantInfo) ? nextState.importantInfo : [];
  nextState.generalAgreements = Array.isArray(nextState.generalAgreements) ? nextState.generalAgreements : [];
  nextState.generalAgreementsVersion = Math.max(0, Number(nextState.generalAgreementsVersion) || 0);
  if (nextState.generalAgreementsVersion < agreementsLibraryVersion) {
    const existingAgreementIds = new Set(nextState.generalAgreements.map((entry) => entry?.id));
    builtInGeneralAgreements.forEach((agreement) => {
      if (!existingAgreementIds.has(agreement.id)) nextState.generalAgreements.push(structuredClone(agreement));
    });
    nextState.generalAgreementsVersion = agreementsLibraryVersion;
  }
  nextState.generalAgreements = nextState.generalAgreements
    .filter((entry) => entry?.title && entry?.text)
    .map((entry, index) => ({
      id: entry.id || `afspraak-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : 1000 + index,
      category: agreementCategories.some((category) => category.id === entry.category) ? entry.category : "additional",
      title: String(entry.title),
      summary: String(entry.summary || String(entry.text).split(/[.!?](?:\s|$)/)[0] || entry.title).trim(),
      text: String(entry.text),
      notice: entry.notice && ["warning", "critical"].includes(entry.notice.level) && entry.notice.text
        ? { level: entry.notice.level, text: String(entry.notice.text) }
        : null,
      userName: entry.userName || "",
      createdAt: entry.createdAt || ""
    }));
  nextState.gameInstructions = Array.isArray(nextState.gameInstructions) ? nextState.gameInstructions : [];
  nextState.instructionLibraryVersion = Math.max(0, Number(nextState.instructionLibraryVersion) || 0);
  if (nextState.instructionLibraryVersion < instructionLibraryVersion) {
    const existingInstructionIds = new Set(nextState.gameInstructions.map((instruction) => instruction?.id));
    builtInGameInstructions.forEach((instruction) => {
      if (!existingInstructionIds.has(instruction.id)) nextState.gameInstructions.push(structuredClone(instruction));
    });
    nextState.instructionLibraryVersion = instructionLibraryVersion;
  }
  nextState.setupModuleEnabled = Boolean(nextState.setupModuleEnabled);
  nextState.setupTasks = Array.isArray(nextState.setupTasks) ? nextState.setupTasks : structuredClone(seed.setupTasks);
  nextState.currentUser = null;

  nextState.leaders = nextState.leaders.map((leader) => ({
    id: leader.id || makeId(leader.name || "leader", nextState.leaders.map((item) => item.id)),
    name: defaultPersonTranslations[leader.name] || leader.name || "Naamloze leider"
  }));

  nextState.managers = nextState.managers.map((manager) => ({
    id: manager.id || makeId(manager.name || "manager", nextState.managers.map((item) => item.id)),
    name: defaultPersonTranslations[manager.name] || manager.name || "Naamloos bestuurslid",
    boardRole: String(manager.boardRole || "Bestuurslid").trim().slice(0, 80),
    intro: String(manager.intro || "").trim().slice(0, 280),
    phone: String(manager.phone || "").trim().slice(0, 32),
    photo: String(manager.photo || "").trim()
  }));

  const savedSupportProfiles = new Map(
    (Array.isArray(nextState.supportProfiles) ? nextState.supportProfiles : [])
      .filter((profile) => profile?.id)
      .map((profile) => [profile.id, profile])
  );
  nextState.supportProfiles = defaultSupportProfiles.map((defaultProfile) => {
    const profile = savedSupportProfiles.get(defaultProfile.id) || {};
    return {
      id: defaultProfile.id,
      name: defaultProfile.name,
      boardRole: String(profile.boardRole || defaultProfile.boardRole).trim().slice(0, 80),
      intro: String(profile.intro || defaultProfile.intro).trim().slice(0, 280),
      phone: String(profile.phone || "").trim().slice(0, 32),
      photo: String(profile.photo || "").trim()
    };
  });

  nextState.groups = nextState.groups.map((group) => ({
    id: group.id || makeId(group.name || "group", nextState.groups.map((item) => item.id)),
    name: defaultGroupTranslations[group.name] || group.name || "Naamloze groep",
    leaderIds: Array.isArray(group.leaderIds) ? group.leaderIds : [],
    kids: Array.isArray(group.kids) ? group.kids : []
  }));

  const instructionIds = [];
  nextState.gameInstructions = nextState.gameInstructions.map((instruction) => {
    const id = instruction.id || makeId(instruction.title || "spelinstructie", instructionIds);
    instructionIds.push(id);
    return {
      id,
      title: instruction.title || "Naamloze spelinstructie",
      category: ["kleuters", "pupillen", "jongeren", "ouderen", "all-groups"].includes(instruction.category)
        ? instruction.category
        : "all-groups",
      summary: instruction.summary || "",
      body: instruction.body || "",
      materials: instruction.materials || "",
      safety: instruction.safety || "",
      activityIds: Array.isArray(instruction.activityIds) ? [...new Set(instruction.activityIds.filter(Boolean))] : [],
      attachments: Array.isArray(instruction.attachments)
        ? instruction.attachments
            .filter((attachment) => attachment?.url && attachment?.name)
            .map((attachment) => ({
              id: attachment.id || `${id}-bestand-${Math.random().toString(16).slice(2)}`,
              name: attachment.name,
              type: attachment.type || "application/octet-stream",
              url: attachment.url,
              path: attachment.path || "",
              size: Math.max(0, Number(attachment.size) || 0)
            }))
        : [],
      createdBy: instruction.createdBy || "",
      updatedAt: instruction.updatedAt || ""
    };
  });

  if (!nextState.days.includes(nextState.activeDay)) {
    nextState.activeDay = nextState.days[0];
  }

  nextState.setupTasks = nextState.setupTasks.map((task) => {
    const assignees = Array.isArray(task.assignees)
      ? task.assignees.filter((person) => person?.userKey && person?.name)
      : [];
    if (!assignees.length && task.assigneeKey && task.assigneeName) {
      assignees.push({ userKey: task.assigneeKey, name: task.assigneeName });
    }

    const maxPeople = Math.max(1, Number(task.maxPeople) || assignees.length || 1);

    return {
      id: task.id || `setup-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: task.title || "Naamloze taak",
      area: task.area || "Algemeen",
      maxPeople: Math.max(maxPeople, assignees.length),
      assignees,
      done: Boolean(task.done),
      checkedBy: task.checkedBy || "",
      checkedAt: task.checkedAt || ""
    };
  });

  if (!["homeView", "todayView", "scheduleView", "instructionLibraryView", "setupView", "roomScheduleView", "feedbackView", "contactsView", "agreementsView", "boardView", "groupsView", "kidsView", "managementView"].includes(nextState.activeView)) {
    nextState.activeView = "homeView";
  }

  if (!nextState.setupModuleEnabled && nextState.activeView === "setupView") {
    nextState.activeView = "homeView";
  }

  if (nextState.currentUser && !userExists(nextState, nextState.currentUser)) {
    nextState.currentUser = null;
  }

  const visibleGroups = visibleGroupsFor(nextState);
  if (!visibleGroups.some((group) => group.id === nextState.activeGroupId)) {
    nextState.activeGroupId = visibleGroups[0]?.id || nextState.groups[0].id;
  }

  if (nextState.currentUser?.role !== "manager" && ["kidsView", "managementView"].includes(nextState.activeView)) {
    nextState.activeView = "homeView";
  }

  return nextState;
}

function userExists(nextState, user) {
  if (!user?.role || !user?.id) return false;
  const source = user.role === "manager" ? nextState.managers : nextState.leaders;
  return source.some((person) => person.id === user.id);
}

function userKey(user) {
  return user ? `${user.role}:${user.id}` : "";
}

function hasPin(user) {
  return Boolean(state.userPins[userKey(user)]);
}

function isValidPin(pin) {
  return /^\d{6,10}$/.test(pin);
}

function showPinError(message) {
  pinError.textContent = message;
  pinError.classList.remove("hidden");
}

function clearPinError() {
  pinError.textContent = "";
  pinError.classList.add("hidden");
}

function showBootstrapManagerError(message) {
  bootstrapManagerError.textContent = message;
  bootstrapManagerError.classList.remove("hidden");
}

function clearBootstrapManagerError() {
  bootstrapManagerError.textContent = "";
  bootstrapManagerError.classList.add("hidden");
}

function visibleGroupsFor(nextState = state) {
  if (nextState.currentUser?.role === "leader") {
    return nextState.groups.filter((group) => group.leaderIds.includes(nextState.currentUser.id));
  }

  return nextState.groups;
}

function makeId(name, existingIds = []) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
  let id = base;
  let counter = 2;

  while (existingIds.includes(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }

  return id;
}

function leaderName(id) {
  return state.leaders.find((leader) => leader.id === id)?.name || "Onbekende leider";
}

function currentUserName() {
  if (!state.currentUser) return "Kies gebruiker";
  const list = state.currentUser.role === "manager" ? state.managers : state.leaders;
  return list.find((person) => person.id === state.currentUser.id)?.name || "Kies gebruiker";
}

function isManager() {
  return state.currentUser?.role === "manager";
}

function currentTheme() {
  return state.userThemes[userKey(state.currentUser)] === "dark" ? "dark" : "light";
}

function applyTheme() {
  const theme = currentTheme();
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme !== "dark");
}

function activeGroup() {
  const visibleGroups = visibleGroupsFor();
  return visibleGroups.find((group) => group.id === state.activeGroupId) || visibleGroups[0] || state.groups[0];
}

function activeAttendance() {
  if (!activeGroup()) return {};

  state.attendance[state.activeDay] ||= {};
  state.attendance[state.activeDay][state.activeGroupId] ||= {};
  const attendance = state.attendance[state.activeDay][state.activeGroupId];

  activeGroup().kids.forEach((kid) => {
    attendance[kid] ||= "missing";
  });

  return attendance;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(index) {
  return [ "#fff0bf", "#d8ebff", "#d8f4e4", "#e4e9ff" ][index % 4];
}

function renderSelectors() {
  const visibleGroups = visibleGroupsFor();

  groupSelect.innerHTML = visibleGroups
    .map((group) => `<option value="${group.id}">${group.name}</option>`)
    .join("");

  if (!visibleGroups.length) {
    groupSelect.innerHTML = `<option value="">Geen groepen</option>`;
  }

  groupSelect.value = visibleGroups.some((group) => group.id === state.activeGroupId) ? state.activeGroupId : visibleGroups[0]?.id || "";

  daySelect.innerHTML = state.days.map((day) => `<option value="${day}">${day}</option>`).join("");
  daySelect.value = state.activeDay;
}

function renderSummary() {
  if (!visibleGroupsFor().length) {
    presentCount.textContent = "0";
    missingCount.textContent = "0";
    return;
  }

  const attendance = activeAttendance();
  const kids = activeGroup().kids;
  const present = kids.filter((kid) => attendance[kid] === "present").length;
  const missing = kids.length - present;

  presentCount.textContent = present;
  missingCount.textContent = missing;
}

function renderChildList() {
  if (!visibleGroupsFor().length) {
    childList.innerHTML = `<article class="child-row"><span class="avatar" style="background:#d8ebff">?</span><strong class="child-name">Nog geen gekoppelde groepen</strong></article>`;
    return;
  }

  const group = activeGroup();
  const attendance = activeAttendance();
  const query = searchInput.value.trim().toLowerCase();
  const filtered = group.kids.filter((kid) => kid.toLowerCase().includes(query));

  childList.innerHTML = filtered
    .map((kid) => {
      const index = group.kids.indexOf(kid);
      const status = attendance[kid];
      return `
        <article class="child-row">
          <span class="avatar" style="background:${avatarColor(index)}">${initials(kid)}</span>
          <strong class="child-name">${escapeHTML(kid)}</strong>
          <div class="status-toggle" data-status="${status}" aria-label="Aanwezigheid van ${escapeAttribute(kid)}">
            <button type="button" data-kid="${escapeAttribute(kid)}" data-status="present" aria-label="Markeer ${escapeAttribute(kid)} als aanwezig">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
            </button>
            <button type="button" data-kid="${escapeAttribute(kid)}" data-status="missing" aria-label="Markeer ${escapeAttribute(kid)} als afwezig">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 17h.01" /></svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  if (!filtered.length) {
    childList.innerHTML = `<article class="child-row"><span class="avatar" style="background:#d8ebff">?</span><strong class="child-name">Geen kinderen gevonden</strong></article>`;
  }
}

function renderGroups() {
  const attendance = activeAttendance();
  const groups = state.groups;

  groupCards.innerHTML = groups
    .map((group) => {
      const canOpen = isManager() || (state.currentUser?.role === "leader" && group.leaderIds.includes(state.currentUser.id));
      const present = canOpen && group.id === state.activeGroupId
        ? group.kids.filter((kid) => attendance[kid] === "present").length
        : 0;
      const leaders = group.leaderIds.map(leaderName).join(", ") || "Nog geen leiders";
      return `
        <button
          class="group-card ${group.id === state.activeGroupId && canOpen ? "active" : ""} ${canOpen ? "" : "locked"}"
          type="button"
          ${canOpen ? `data-group="${group.id}"` : "disabled aria-disabled=\"true\""}
        >
          <span>
            <strong>${escapeHTML(group.name)}</strong>
            <span>${group.kids.length} kinderen · ${escapeHTML(leaders)}</span>
          </span>
          <span>${canOpen ? (group.id === state.activeGroupId ? `${present} gecheckt` : "Openen") : "Alleen bekijken"}</span>
        </button>
      `;
    })
    .join("");

  if (!groups.length) {
    groupCards.innerHTML = `<article class="group-card"><span><strong>Geen gekoppelde groepen</strong><span>Vraag een bestuurslid om je aan een groep te koppelen.</span></span></article>`;
  }
}

function renderManageList() {
  if (!visibleGroupsFor().length) {
    manageList.innerHTML = `<article class="manage-row"><span class="avatar" style="background:#d8ebff">?</span><strong class="child-name">Nog geen gekoppelde groepen</strong></article>`;
    return;
  }

  const rows = isManager()
    ? state.groups.flatMap((group) => group.kids.map((kid, index) => ({ group, kid, index })))
    : activeGroup().kids.map((kid, index) => ({ group: activeGroup(), kid, index }));

  manageList.innerHTML = rows
    .map(({ group, kid, index }) => `
      <article class="manage-row">
        <span class="avatar" style="background:${avatarColor(index)}">${initials(kid)}</span>
        <span class="child-detail">
          <strong class="child-name">${escapeHTML(kid)}</strong>
          <span>${escapeHTML(group.name)}</span>
        </span>
        <button class="remove-button" type="button" data-remove="${escapeAttribute(kid)}" data-remove-from-group="${group.id}" aria-label="Verwijder ${escapeAttribute(kid)} uit ${escapeAttribute(group.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </article>
    `)
    .join("");

  if (!rows.length) {
    manageList.innerHTML = `<article class="manage-row"><span class="avatar" style="background:#d8ebff">?</span><span class="child-detail"><strong class="child-name">Nog geen kinderen</strong><span>Voeg kinderen toe bij een groep.</span></span></article>`;
  }
}

function savedKey() {
  return `${state.activeDay}-${state.activeGroupId}`;
}

function hasUnsavedCheck() {
  return Boolean(activeGroup()) && !state.savedAt[savedKey()];
}

function renderSaveStatus() {
  const saved = state.savedAt[savedKey()];
  saveStatus.textContent = saved ? `Opgeslagen om ${saved}` : "Nog niet opgeslagen";
  saveButton.disabled = !hasUnsavedCheck();
  saveButton.setAttribute("aria-disabled", String(!hasUnsavedCheck()));
}

function renderManagementPanels() {
  if (!isManager() && activeManagementPanel && activeManagementPanel !== "access") {
    activeManagementPanel = "access";
  }

  const hasOpenPanel = Boolean(activeManagementPanel);
  managementHub.classList.toggle("hidden", hasOpenPanel);
  managementPanels.forEach((panel) => {
    panel.classList.toggle("management-panel-hidden", panel.dataset.managementPanel !== activeManagementPanel);
  });
}

function attendanceSnapshotForGroup(group, day = state.activeDay) {
  const attendance = state.attendance[day]?.[group.id] || {};
  const present = group.kids.filter((kid) => attendance[kid] === "present").length;
  const expected = group.kids.length;

  return {
    expected,
    present,
    missing: Math.max(0, expected - present),
    saved: Boolean(state.savedAt[`${day}-${group.id}`])
  };
}

function renderManagerOverviewDashboard(kidCount) {
  const day = state.activeDay;
  const snapshots = state.groups.map((group) => ({ group, ...attendanceSnapshotForGroup(group, day) }));
  const expected = snapshots.reduce((sum, item) => sum + item.expected, 0);
  const present = snapshots.reduce((sum, item) => sum + item.present, 0);
  const missing = snapshots.reduce((sum, item) => sum + item.missing, 0);
  const uncheckedGroups = snapshots.filter((item) => !item.saved);
  const criticalInfo = state.importantInfo.filter((entry) => entry.urgency === "critical");
  const groupsWithoutLeaders = state.groups.filter((group) => !group.leaderIds.length);
  const leaderIdsWithGroup = new Set(state.groups.flatMap((group) => group.leaderIds));
  const leadersWithoutGroup = state.leaders.filter((leader) => !leaderIdsWithGroup.has(leader.id));
  const setup = setupProgress();
  const groupSizes = state.groups.map((group) => ({ name: group.name, size: group.kids.length }));
  const largestGroup = groupSizes.slice().sort((a, b) => b.size - a.size)[0];
  const smallestGroup = groupSizes.slice().sort((a, b) => a.size - b.size)[0];
  const feedbackByCategory = state.feedback.reduce((totals, entry) => {
    const label = feedbackCategoryLabel(entry.category);
    totals[label] = (totals[label] || 0) + 1;
    return totals;
  }, {});
  const actionItems = [
    uncheckedGroups.length ? `${uncheckedGroups.length} groepen hebben de aanwezigheid voor ${day} nog niet opgeslagen.` : "",
    criticalInfo.length ? `${criticalInfo.length} kritische melding${criticalInfo.length === 1 ? "" : "en"} actief bij Belangrijke info.` : "",
    groupsWithoutLeaders.length ? `${groupsWithoutLeaders.length} groepen hebben nog geen gekoppelde leider.` : "",
    leadersWithoutGroup.length ? `${leadersWithoutGroup.length} leiders zijn nog niet aan een groep gekoppeld.` : "",
    state.setupModuleEnabled && setup.open ? `${setup.open} plekken bij opbouwtaken zijn nog vrij.` : ""
  ].filter(Boolean);

  managerStats.innerHTML = `
    <div class="overview-dashboard">
      <div class="overview-kpis">
        <article class="overview-kpi">
          <span>Verwacht</span>
          <strong>${expected}</strong>
          <small>${escapeHTML(day)}</small>
        </article>
        <article class="overview-kpi positive">
          <span>Aanwezig</span>
          <strong>${present}</strong>
          <small>${expected ? Math.round((present / expected) * 100) : 0}% gemeld</small>
        </article>
        <article class="overview-kpi warning">
          <span>Afwezig / open</span>
          <strong>${missing}</strong>
          <small>${uncheckedGroups.length} groepen niet opgeslagen</small>
        </article>
        <article class="overview-kpi">
          <span>Gebruikers</span>
          <strong>${state.leaders.length + state.managers.length}</strong>
          <small>${state.groups.length} groepen · ${kidCount} kinderen</small>
        </article>
      </div>

      <section class="overview-block ${actionItems.length ? "needs-action" : "all-clear"}">
        <div class="overview-block-title">
          <h4>Actie nodig</h4>
          <span>${actionItems.length || "Alles rustig"}</span>
        </div>
        ${actionItems.length
          ? `<ul class="overview-action-list">${actionItems.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
          : `<p class="overview-empty">Geen directe aandachtspunten.</p>`}
      </section>

      <section class="overview-block">
        <div class="overview-block-title">
          <h4>Aanwezigheid per groep</h4>
          <span>${escapeHTML(day)}</span>
        </div>
        <div class="overview-group-list">
          ${snapshots.map((item) => {
            const percent = item.expected ? Math.round((item.present / item.expected) * 100) : 0;
            return `
              <article class="overview-group-row">
                <div>
                  <strong>${escapeHTML(item.group.name)}</strong>
                  <span>${item.present}/${item.expected} aanwezig · ${item.saved ? "opgeslagen" : "nog niet opgeslagen"}</span>
                </div>
                <div class="overview-progress" aria-label="${percent}% aanwezig">
                  <span style="width:${percent}%"></span>
                </div>
              </article>
            `;
          }).join("") || `<p class="overview-empty">Nog geen groepen aangemaakt.</p>`}
        </div>
      </section>

      <div class="overview-split">
        <section class="overview-block">
          <div class="overview-block-title">
            <h4>Evaluatie</h4>
            <span>${state.feedback.length} totaal</span>
          </div>
          ${Object.keys(feedbackByCategory).length
            ? `<div class="overview-mini-list">${Object.entries(feedbackByCategory).map(([label, total]) => `<span><strong>${escapeHTML(label)}</strong>${total}</span>`).join("")}</div>`
            : `<p class="overview-empty">Nog geen evaluaties binnen.</p>`}
          <div class="overview-latest">
            ${state.feedback.slice(-3).reverse().map((entry) => `<p><strong>${escapeHTML(entry.userName)}</strong> ${escapeHTML(entry.text)}</p>`).join("")}
          </div>
        </section>

        <section class="overview-block">
          <div class="overview-block-title">
            <h4>Groepen</h4>
            <span>${groupsWithoutLeaders.length} zonder leider</span>
          </div>
          <div class="overview-mini-list">
            <span><strong>Grootste groep</strong>${largestGroup ? `${escapeHTML(largestGroup.name)} · ${largestGroup.size}` : "-"}</span>
            <span><strong>Kleinste groep</strong>${smallestGroup ? `${escapeHTML(smallestGroup.name)} · ${smallestGroup.size}` : "-"}</span>
            <span><strong>Leiders zonder groep</strong>${leadersWithoutGroup.length}</span>
          </div>
        </section>
      </div>

      ${state.setupModuleEnabled ? `
        <section class="overview-block">
          <div class="overview-block-title">
            <h4>Opbouw zondag</h4>
            <span>${setup.done}/${state.setupTasks.length} taken gecontroleerd</span>
          </div>
          <div class="overview-mini-list">
            <span><strong>Opgepakt</strong>${setup.claimed}</span>
            <span><strong>Nog vrij</strong>${setup.open}</span>
            <span><strong>Plekken totaal</strong>${setup.total}</span>
          </div>
        </section>
      ` : ""}
    </div>
  `;
}

function renderManagement() {
  const kidCount = state.groups.reduce((sum, group) => sum + group.kids.length, 0);
  managementIntro.textContent = isManager()
    ? "Beheer toegang, gebruikers, groepen en kinderen."
    : "Wijzig je pincode en persoonlijke weergave voor de volgende keer dat je de app opent.";

  themeToggle.querySelectorAll("[data-theme-option]").forEach((button) => {
    const active = button.dataset.themeOption === currentTheme();
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  renderManagerOverviewDashboard(kidCount);

  leadersList.innerHTML = state.leaders
    .map((leader) => `
      <span class="leader-chip">
        ${escapeHTML(leader.name)}
        <button type="button" data-remove-leader="${leader.id}" aria-label="Verwijder ${escapeAttribute(leader.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </span>
    `)
    .join("");

  managersList.innerHTML = state.managers
    .map((manager) => `
      <span class="leader-chip manager-chip">
        ${escapeHTML(manager.name)}
        <button type="button" data-remove-manager="${manager.id}" aria-label="Verwijder ${escapeAttribute(manager.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </span>
    `)
    .join("");

  resetPinUser.innerHTML = [
    ...state.managers.map((person) => ({ ...person, role: "manager" })),
    ...state.leaders.map((person) => ({ ...person, role: "leader" }))
  ]
    .map((person) => `<option value="${person.role}:${person.id}">${escapeHTML(person.name)} (${person.role === "manager" ? "Bestuurslid" : "Leider"})</option>`)
    .join("");

  managerGroups.innerHTML = state.groups
    .map((group) => `
      <article class="manager-group-card" data-group-card="${group.id}">
        <div class="manager-group-header">
          <input class="group-name-input" data-group-name="${group.id}" value="${escapeAttribute(group.name)}" aria-label="Groepsnaam voor ${escapeAttribute(group.name)}" />
          <button class="delete-group-button" type="button" data-delete-group="${group.id}" aria-label="Verwijder ${escapeAttribute(group.name)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" /></svg>
          </button>
        </div>
        <div class="group-meta">
          <span>${group.kids.length} kinderen</span>
          <span>${group.leaderIds.length || "Geen"} leiders gekoppeld</span>
        </div>
        <div class="leader-assignment">
          <span class="leader-assignment-title">Leiders koppelen</span>
          ${state.leaders.length ? `
            <div class="assigned-leaders">
              ${group.leaderIds.map((id) => `
                <span class="leader-chip">
                  ${escapeHTML(leaderName(id))}
                  <button type="button" data-unassign-leader="${group.id}" data-leader-id="${id}" aria-label="Ontkoppel ${escapeAttribute(leaderName(id))}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              `).join("") || `<span class="leader-chip muted-chip">Geen leiders gekoppeld</span>`}
            </div>
            <div class="leader-picker">
              <input type="search" data-leader-search="${group.id}" placeholder="Zoek leider om toe te voegen" autocomplete="off" aria-label="Zoek leider voor ${escapeAttribute(group.name)}" />
              <div class="leader-picker-list">
                ${state.leaders
                  .filter((leader) => !group.leaderIds.includes(leader.id))
                  .map((leader) => `
                    <button type="button" data-assign-leader="${group.id}" data-leader-id="${leader.id}">
                      ${escapeHTML(leader.name)}
                    </button>
                  `).join("") || `<span>Alle leiders zijn gekoppeld</span>`}
              </div>
            </div>
          ` : `<span class="leader-chip">Voeg eerst een leider toe</span>`}
        </div>
        <form class="group-kid-form" data-add-kid-group="${group.id}">
          <input type="text" placeholder="Naam kind" autocomplete="off" aria-label="Kind toevoegen aan ${escapeAttribute(group.name)}" />
          <button type="submit">Toevoegen</button>
        </form>
        <div class="kid-pill-list">
          ${group.kids.map((kid) => `
            <span class="kid-pill">
              <span>${escapeHTML(kid)}</span>
              <button type="button" data-remove-group-kid="${group.id}" data-kid="${escapeAttribute(kid)}" aria-label="Verwijder ${escapeAttribute(kid)} uit ${escapeAttribute(group.name)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </span>
          `).join("")}
        </div>
      </article>
    `)
    .join("");

  renderManagementPanels();
}

function renderFeedback() {
  const visibleFeedback = isManager()
    ? state.feedback
    : state.feedback.filter((entry) => (
      entry.userKey === userKey(state.currentUser) || feedbackBelongsToCurrentLeadersGroup(entry)
    ));

  feedbackList.innerHTML = visibleFeedback
    .slice()
    .reverse()
    .map((entry) => `
      <article class="feedback-entry">
        <div class="feedback-entry-meta">
          <strong>${escapeHTML(feedbackCategoryLabel(entry.category))}</strong>
          <span>${escapeHTML(entry.userName)}</span>
          <span>${escapeHTML(roleLabel(entry.role))}</span>
          ${entry.groupName && feedbackAuthorHasAssignedGroup(entry) ? `<span>${escapeHTML(entry.groupName)}</span>` : ""}
          <span>${escapeHTML(entry.createdAt)}</span>
        </div>
        <p>${escapeHTML(entry.text)}</p>
        ${renderFeedbackReactions(entry)}
        ${isManager() ? `<button class="text-button" type="button" data-remove-feedback="${escapeAttribute(entry.id)}">Verwijderen</button>` : ""}
      </article>
    `)
    .join("");

  if (!visibleFeedback.length) {
    feedbackList.innerHTML = `<article class="feedback-entry"><p>${isManager() ? "Nog geen evaluatie ingediend." : "Nog geen evaluaties voor jouw groep ingediend."}</p></article>`;
  }
}

function feedbackBelongsToCurrentLeadersGroup(entry) {
  if (!feedbackAuthorHasAssignedGroup(entry)) return false;
  const assignedGroups = visibleGroupsFor();
  return assignedGroups.some((group) => (
    entry.groupId === group.id || (!entry.groupId && entry.groupName === group.name)
  ));
}

function feedbackAuthorHasAssignedGroup(entry) {
  if (!entry.userKey?.startsWith("leader:")) return true;
  const leaderId = entry.userKey.slice("leader:".length);
  return state.groups.some((group) => group.leaderIds.includes(leaderId));
}

function feedbackGroupForCurrentUser() {
  if (isManager()) return activeGroup();
  const assignedGroups = visibleGroupsFor();
  return assignedGroups.find((group) => group.id === state.activeGroupId) || assignedGroups[0] || null;
}

function canReactToFeedback(entry) {
  return !isManager()
    && entry.userKey !== userKey(state.currentUser)
    && feedbackBelongsToCurrentLeadersGroup(entry);
}

function renderFeedbackReactions(entry) {
  const reactions = entry.reactions || {};
  const currentReaction = reactions[userKey(state.currentUser)] || "";
  const upCount = Object.values(reactions).filter((reaction) => reaction === "up").length;
  const downCount = Object.values(reactions).filter((reaction) => reaction === "down").length;

  if (!canReactToFeedback(entry) && !upCount && !downCount) return "";

  return `
    <div class="feedback-reactions" aria-label="Waarderingen">
      <span class="feedback-reactions-label">${upCount + downCount ? "Waarderingen" : "Jouw reactie"}</span>
      ${canReactToFeedback(entry) ? `
        <button
          class="feedback-reaction-button ${currentReaction === "up" ? "selected up" : ""}"
          type="button"
          data-feedback-reaction="up"
          data-feedback-id="${escapeAttribute(entry.id)}"
          aria-label="Duimpje omhoog"
          aria-pressed="${currentReaction === "up"}"
          title="Duimpje omhoog"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4V10h3Zm3 10h7.2a2 2 0 0 0 1.94-1.5l1.43-5.5A2 2 0 0 0 18.63 10H15l.7-3.17A2.8 2.8 0 0 0 13 3.4L10 10v10Z" /></svg>
          <span>${upCount}</span>
        </button>
      ` : (upCount ? `<span class="feedback-reaction-count up"><span aria-hidden="true">&#128077;</span>${upCount}</span>` : "")}
      ${canReactToFeedback(entry) ? `
        <button
          class="feedback-reaction-button ${currentReaction === "down" ? "selected down" : ""}"
          type="button"
          data-feedback-reaction="down"
          data-feedback-id="${escapeAttribute(entry.id)}"
          aria-label="Duimpje omlaag"
          aria-pressed="${currentReaction === "down"}"
          title="Duimpje omlaag"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v10H4V4h3Zm3 0h7.2a2 2 0 0 1 1.94 1.5l1.43 5.5A2 2 0 0 1 18.63 14H15l.7 3.17A2.8 2.8 0 0 1 13 20.6L10 14V4Z" /></svg>
          <span>${downCount}</span>
        </button>
      ` : (downCount ? `<span class="feedback-reaction-count down"><span aria-hidden="true">&#128078;</span>${downCount}</span>` : "")}
    </div>
  `;
}

function renderImportantInfo() {
  const criticalInfo = state.importantInfo
    .slice()
    .reverse()
    .find((entry) => entry.urgency === "critical");

  criticalInfoBanner.classList.toggle("hidden", !criticalInfo);
  criticalInfoBannerText.textContent = criticalInfo ? criticalInfo.title : "";

  importantInfoList.innerHTML = state.importantInfo
    .slice()
    .reverse()
    .map((entry) => `
      <article class="important-info-entry ${entry.urgency}">
        <div class="important-info-meta">
          <span class="urgency-pill ${entry.urgency}">${urgencyLabel(entry.urgency)}</span>
          <span>${escapeHTML(entry.userName)}</span>
          <span>${escapeHTML(entry.createdAt)}</span>
        </div>
        <h3>${escapeHTML(entry.title)}</h3>
        <p>${escapeHTML(entry.text)}</p>
        ${isManager() ? `<button class="text-button" type="button" data-remove-info="${entry.id}">Verwijderen</button>` : ""}
      </article>
    `)
    .join("");

  if (!state.importantInfo.length) {
    importantInfoList.innerHTML = `<article class="important-info-entry"><p>Nog geen belangrijke info geplaatst.</p></article>`;
  }
}

function renderGeneralAgreements() {
  const sortedAgreements = builtInGeneralAgreements
    .slice()
    .sort((first, second) => first.order - second.order || first.title.localeCompare(second.title, "nl"));
  agreementsList.innerHTML = agreementCategories.map((category) => {
    const entries = sortedAgreements.filter((entry) => entry.category === category.id);
    if (!entries.length) return "";

    return `
      <section class="agreement-group category-${category.id}" aria-labelledby="agreement-group-${category.id}">
        <header class="agreement-group-header">
          <h3 id="agreement-group-${category.id}">${escapeHTML(category.label)}</h3>
          <span>${entries.length} ${entries.length === 1 ? "afspraak" : "afspraken"}</span>
        </header>
        <div class="agreement-group-entries">
          ${entries.map((entry) => {
            const isOpen = openAgreementId === entry.id;
            const notice = entry.notice
              ? `<div class="agreement-notice ${entry.notice.level}" role="note"><strong>${entry.notice.level === "critical" ? "Direct belangrijk" : "Let op"}</strong><span>${escapeHTML(entry.notice.text)}</span></div>`
              : "";

            return `
              <article class="agreement-entry ${isOpen ? "open" : ""}">
                <button class="agreement-toggle" type="button" data-toggle-agreement="${escapeAttribute(entry.id)}" aria-expanded="${isOpen}" aria-controls="agreement-detail-${escapeAttribute(entry.id)}">
                  <span class="agreement-number" aria-hidden="true">${entry.order}</span>
                  <span class="agreement-heading">
                    <strong>${escapeHTML(entry.title)}</strong>
                    <span>${escapeHTML(entry.summary)}</span>
                  </span>
                  <svg class="agreement-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
                </button>
                <div class="agreement-detail ${isOpen ? "" : "hidden"}" id="agreement-detail-${escapeAttribute(entry.id)}">
                  ${notice}
                  <p>${escapeHTML(entry.text)}</p>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function boardInitials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function whatsappNumber(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `31${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

const boardDisplayOrder = ["naomi", "jeroen", "nanne", "peter", "rob", "ties", "joy"];

function boardFirstName(person) {
  return String(person?.name || "").trim().split(/\s+/)[0].toLowerCase();
}

function orderedBoardMembers() {
  return state.managers.slice().sort((first, second) => {
    const firstOrder = boardDisplayOrder.indexOf(boardFirstName(first));
    const secondOrder = boardDisplayOrder.indexOf(boardFirstName(second));
    const firstRank = firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder;
    const secondRank = secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder;
    if (firstRank !== secondRank) return firstRank - secondRank;
    return first.name.localeCompare(second.name, "nl");
  });
}

function renderBoardCard(person) {
  const number = whatsappNumber(person.phone);
  const avatar = person.photo
    ? `<img src="${escapeAttribute(person.photo)}" alt="Foto van ${escapeAttribute(person.name)}" />`
    : `<span aria-hidden="true">${escapeHTML(boardInitials(person.name))}</span>`;
  const contactActions = number
    ? `<div class="board-contact-actions">
        <a class="board-contact-button board-whatsapp" href="https://wa.me/${number}" target="_blank" rel="noopener noreferrer" aria-label="Stuur ${escapeAttribute(person.name)} een WhatsApp-bericht">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.8Z" /><path d="M8.1 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.9c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6.7 1.3 1.8 2.4 3.2 3 .2.1.4.1.6-.1l.8-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .5-.2 1.4-.8 1.9-.6.6-1.5.9-2.4.7-1.1-.2-2.6-.7-4.2-2.1-1.3-1.1-2.3-2.5-2.8-3.6-.5-1.1-.5-2.2-.2-2.9.2-.5.7-.9 1.1-1Z" /></svg>
          <span>WhatsApp</span>
        </a>
        <a class="board-contact-button board-call" href="tel:+${number}" aria-label="Bel ${escapeAttribute(person.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>
          <span>Bellen</span>
        </a>
      </div>`
    : "";

  return `
    <article class="board-card">
      <div class="board-avatar">${avatar}</div>
      <div class="board-card-copy">
        <small>${escapeHTML(person.boardRole || "Bestuurslid")}</small>
        <h3>${escapeHTML(person.name)}</h3>
        <p>${escapeHTML(person.intro || "Binnenkort lees je hier meer over dit bestuurslid.")}</p>
      </div>
      ${contactActions}
    </article>
  `;
}

function renderBoardProfiles() {
  const boardMembers = orderedBoardMembers();
  boardGrid.innerHTML = `
    <section class="board-section" aria-labelledby="board-members-heading">
      <h3 id="board-members-heading">Bestuur</h3>
      <div class="board-section-grid">
        ${boardMembers.length ? boardMembers.map(renderBoardCard).join("") : `<p class="board-empty">Er zijn nog geen bestuursleden toegevoegd.</p>`}
      </div>
    </section>
    <section class="board-section" aria-labelledby="board-support-heading">
      <h3 id="board-support-heading">Ondersteuning</h3>
      <div class="board-section-grid">${state.supportProfiles.map(renderBoardCard).join("")}</div>
    </section>
  `;

  boardProfileEditor.innerHTML = [
    ...orderedBoardMembers().map((manager) => renderBoardProfileForm(manager, "manager")),
    ...state.supportProfiles.map((profile) => renderBoardProfileForm(profile, "support"))
  ].join("");
}

function renderBoardProfileForm(person, kind) {
  const profileLabel = kind === "support" ? "Ondersteuning" : "Bestuur";
  return `
    <form class="board-profile-form" data-board-profile="${escapeAttribute(person.id)}" data-board-profile-kind="${kind}">
      <div class="board-profile-form-header">
        <div class="board-avatar small">
          ${person.photo ? `<img src="${escapeAttribute(person.photo)}" alt="" />` : `<span aria-hidden="true">${escapeHTML(boardInitials(person.name))}</span>`}
        </div>
        <div><strong>${escapeHTML(person.name)}</strong><small>${profileLabel}</small></div>
      </div>
      <label>Functie
        <input name="boardRole" type="text" maxlength="80" value="${escapeAttribute(person.boardRole || (kind === "support" ? "Ondersteuning" : "Bestuurslid"))}" placeholder="Bijvoorbeeld voorzitter" />
      </label>
      <label>Korte introductie
        <textarea name="intro" rows="3" maxlength="280" placeholder="Vertel kort waarvoor mensen bij jou terechtkunnen">${escapeHTML(person.intro || "")}</textarea>
      </label>
      <label>Mobiel nummer
        <input name="phone" type="tel" value="${escapeAttribute(person.phone || "")}" placeholder="06 12 34 56 78" autocomplete="tel" />
      </label>
      <label>Profielfoto
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <div class="board-profile-actions">
        ${person.photo ? `<button class="text-button" type="button" data-remove-board-photo="${escapeAttribute(person.id)}" data-board-profile-kind="${kind}">Foto verwijderen</button>` : ""}
        <button type="submit">Profiel opslaan</button>
      </div>
    </form>
  `;
}

function setupProgress() {
  const total = state.setupTasks.reduce((sum, task) => sum + task.maxPeople, 0);
  const claimed = state.setupTasks.reduce((sum, task) => sum + (task.done ? 0 : task.assignees.length), 0);
  const done = state.setupTasks.filter((task) => task.done).length;
  const open = state.setupTasks.reduce((sum, task) => sum + (task.done ? 0 : Math.max(0, task.maxPeople - task.assignees.length)), 0);
  return { total, claimed, done, open };
}

function setupTaskStatus(task) {
  if (task.done) return { className: "done", label: "Gecontroleerd" };
  if (task.assignees.length >= task.maxPeople) return { className: "claimed", label: "Vol" };
  if (task.assignees.length) return { className: "claimed", label: "In uitvoering" };
  return { className: "open", label: "Open" };
}

function renderSetupModule() {
  setupHomeTile.classList.toggle("hidden", !state.setupModuleEnabled);

  if (!state.setupModuleEnabled && state.activeView === "setupView") {
    state.activeView = "homeView";
  }

  const progress = setupProgress();
  setupSummary.innerHTML = `
    <article><strong>${progress.open}</strong><span>plekken open</span></article>
    <article><strong>${progress.claimed}</strong><span>bezet</span></article>
    <article><strong>${progress.done}</strong><span>klaar</span></article>
  `;

  setupTaskList.innerHTML = state.setupTasks
    .map((task) => {
      const status = setupTaskStatus(task);
      const currentKey = userKey(state.currentUser);
      const assignedToCurrentUser = task.assignees.some((person) => person.userKey === currentKey);
      const availableSpots = Math.max(0, task.maxPeople - task.assignees.length);
      const assigneeNames = task.assignees.map((person) => person.name).join(", ");
      const canClaim = !task.done && !assignedToCurrentUser && availableSpots > 0;
      const canRelease = !task.done && assignedToCurrentUser;
      return `
        <article class="setup-task ${status.className}">
          <div class="setup-task-main">
            <span class="setup-status ${status.className}">${status.label}</span>
            <strong>${escapeHTML(task.title)}</strong>
            <span>${escapeHTML(task.area)} · ${task.assignees.length}/${task.maxPeople} plekken bezet</span>
            ${assigneeNames ? `<small>Opgepakt door ${escapeHTML(assigneeNames)}</small>` : `<small>Nog niemand gekoppeld</small>`}
            ${task.done ? `<small>Afgevinkt door ${escapeHTML(task.checkedBy)}${task.checkedAt ? ` · ${escapeHTML(task.checkedAt)}` : ""}</small>` : ""}
          </div>
          <div class="setup-task-actions">
            ${canClaim ? `<button type="button" data-claim-setup="${task.id}">Ik pak dit op</button>` : ""}
            ${canRelease ? `<button class="text-button" type="button" data-release-setup="${task.id}">Vrijgeven</button>` : ""}
            ${isManager() && !task.done ? `
              <button class="setup-icon-button check" type="button" data-check-setup="${task.id}" aria-label="Controleer ${escapeAttribute(task.title)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
              </button>
            ` : ""}
            ${isManager() && task.done ? `<button class="text-button" type="button" data-reopen-setup="${task.id}">Heropenen</button>` : ""}
            ${isManager() ? `
              <div class="setup-capacity-control" aria-label="Aantal personen voor ${escapeAttribute(task.title)}">
                <button type="button" data-decrease-setup-capacity="${task.id}" aria-label="Minder personen">-</button>
                <strong>${task.maxPeople}</strong>
                <button type="button" data-increase-setup-capacity="${task.id}" aria-label="Meer personen">+</button>
              </div>
              <button class="setup-icon-button delete" type="button" data-remove-setup-task="${task.id}" aria-label="Verwijder ${escapeAttribute(task.title)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16M10 11v6M14 11v6" /></svg>
              </button>
            ` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  if (!state.setupTasks.length) {
    setupTaskList.innerHTML = `<article class="setup-task"><div class="setup-task-main"><strong>Nog geen taken</strong><span>Een bestuurslid kan taken toevoegen in Beheer.</span></div></article>`;
  }
}

function renderSetupManagement() {
  setupModuleToggle.textContent = state.setupModuleEnabled ? "Aan" : "Uit";
  setupModuleToggle.classList.toggle("active", state.setupModuleEnabled);
  setupModuleToggle.setAttribute("aria-pressed", String(state.setupModuleEnabled));
}

function urgencyLabel(urgency) {
  const labels = {
    low: "Laag",
    medium: "Gemiddeld",
    critical: "Kritisch"
  };

  return labels[urgency] || "Laag";
}

function feedbackCategoryLabel(category) {
  const labels = {
    General: "Algemeen",
    Child: "Kind",
    Activity: "Activiteit",
    Safety: "Veiligheid",
    Material: "Materiaal",
    Other: "Overig"
  };

  return labels[category] || category;
}

function roleLabel(role) {
  const labels = {
    manager: "Bestuurslid",
    leader: "Groepsleider",
    Manager: "Bestuurslid",
    Leader: "Groepsleider",
    "Group leader": "Groepsleider"
  };

  return labels[role] || role;
}

function instructionCategoryLabel(category) {
  const labels = {
    kleuters: "Kleuters",
    pupillen: "Pupillen",
    jongeren: "Jongeren",
    ouderen: "Ouderen",
    "all-groups": "Alle groepen"
  };
  return labels[category] || "Alle groepen";
}

function scheduleActivitySlug(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "activiteit";
}

function buildScheduleActivityIndex(programs) {
  const index = new Map();
  const usedIds = new Set();

  Object.entries(programs).forEach(([category, days]) => {
    days.forEach((items, dayIndex) => {
      items.forEach((item) => {
        const baseId = item.activityId || [
          "programma",
          category,
          dayIndex + 1,
          item.time.replace(":", ""),
          scheduleActivitySlug(item.title)
        ].join("-");
        let activityId = baseId;
        let duplicate = 2;
        while (usedIds.has(activityId)) {
          activityId = `${baseId}-${duplicate}`;
          duplicate += 1;
        }
        usedIds.add(activityId);
        item.activityId = activityId;
        index.set(activityId, {
          id: activityId,
          category,
          dayIndex,
          time: item.time,
          title: item.title
        });
      });
    });
  });

  return index;
}

function scheduleActivityLabel(activityId) {
  const activity = scheduleActivityIndex.get(activityId);
  if (!activity) return "Niet meer gevonden in het programma";
  const day = scheduleDays[activity.dayIndex];
  return `${instructionCategoryLabel(activity.category)} · ${day?.label || "Dag"} ${activity.time} · ${activity.title}`;
}

function groupScheduleItems(items) {
  return items.reduce((groups, item) => {
    const current = groups[groups.length - 1];
    if (current?.time === item.time) {
      current.items.push(item);
    } else {
      groups.push({ time: item.time, items: [item] });
    }
    return groups;
  }, []);
}

const scheduleActivityTypes = {
  general: { className: "general", label: "Algemeen" },
  logistics: { className: "logistics", label: "Logistiek" },
  food: { className: "food", label: "Eten & pauze" },
  meal: { className: "food", label: "Eten & pauze" },
  creative: { className: "creative", label: "Creatief" },
  sport: { className: "sport", label: "Sport & beweging" },
  active: { className: "sport", label: "Sport & beweging" },
  game: { className: "game", label: "Spel & opdracht" },
  show: { className: "show", label: "Show & media" },
  outing: { className: "outing", label: "Uitje & extern" },
  camp: { className: "camp", label: "Kamp & nacht" },
  rest: { className: "general", label: "Algemeen" }
};

function scheduleActivityType(item) {
  const title = item.title.toLowerCase();
  const matches = (patterns) => patterns.some((pattern) => pattern.test(title));

  if (matches([/eventueel omkleden/, /omkleden vanwege/])) return "logistics";
  if (matches([/feestrace/, /bingo/, /oud.?hollandse spellen/, /moordmysterie/])) return "game";
  if (matches([/film/, /theater/, /meeleef/, /podium/, /afsluiting/, /catwalk/])) return "show";
  if (matches([/stormbaan/, /trefbal/, /zeskamp/, /volleybal/, /smokkelspel/, /zwemmer, redder/, /waterpret/])) return "sport";
  if (matches([/knutsel/, /kleurplaat/, /tekenen/, /vlaggenlijn/])) return "creative";
  if (matches([/vossenjacht/, /spelletjes in de kloostertuin/, /starten met .vegen/])) return "outing";
  if (matches([/traktatie/, /ranjapauze/])) return "food";
  if (matches([/aankomst/, /verzamelen bij/, /lopen naar/, /terugfietsen/, /hulpleiding naar huis/, /inleveren formulieren/])) return "logistics";

  return scheduleActivityTypes[item.type] ? item.type : "general";
}

function scheduleActivityMeta(item) {
  return scheduleActivityTypes[scheduleActivityType(item)] || scheduleActivityTypes.general;
}

function scheduleParallelMeta(items) {
  const metas = items.map(scheduleActivityMeta);
  if (metas.every((meta) => meta.className === metas[0].className)) return metas[0];
  return { className: "game", label: "Parallelle activiteiten" };
}

function scheduleRotationKey(item) {
  return item.rotation.id;
}

function scheduleRotationState(item) {
  const key = scheduleRotationKey(item);
  if (!scheduleRotationUI.has(key)) {
    scheduleRotationUI.set(key, {
      expanded: false,
      round: item.rotation.rounds?.[0]?.time || "",
      group: ""
    });
  }
  return scheduleRotationUI.get(key);
}

function rotationGroupsLabel(groups) {
  return groups.replace(/\s+vs\s+/i, " tegen ");
}

function rotationGroupMembers(groups) {
  return groups.split(/\s+vs\s+/i).map((group) => group.trim());
}

function rotationGroupDisplayName(group) {
  return /^(groep|kleuters|pupillen|jongeren|ouderen)\s/i.test(group) ? group : `Groep ${group}`;
}

function renderScheduleRotation(item, isParallel = false, activityIndex = 0) {
  const key = scheduleRotationKey(item);
  const ui = scheduleRotationState(item);
  const { rotation } = item;
  const rounds = rotation.rounds || [];
  const isFreeFlow = rotation.mode === "free";
  const isMatchRotation = rotation.mode === "matches";
  const isTimeline = rotation.mode === "timeline";
  const isGroupRoutes = rotation.mode === "groupRoutes";
  const selectedRound = rounds.find((round) => round.time === ui.round) || rounds[0];
  const stations = rotation.stations || rounds[0]?.assignments.map((assignment) => assignment.station) || [];
  const stationLocations = rotation.stationLocations || {};
  const activityMeta = rotation.className
    ? { className: rotation.className }
    : scheduleActivityMeta(item);
  const rotationSummary = rotation.summary
    || `${stations.length} spellen · ${isFreeFlow ? "vrije volgorde" : `${rounds.length} rondes`}`;
  const toggleLabel = isFreeFlow ? "spellen" : isTimeline ? "schema" : isGroupRoutes ? "routes" : "indeling";
  const route = ui.group && !isFreeFlow
    ? rounds.map((round) => {
        const assignment = round.assignments.find((entry) => rotationGroupMembers(entry.groups).includes(ui.group));
        const partner = assignment
          ? rotationGroupMembers(assignment.groups).find((group) => group !== ui.group)
          : "";
        return { time: round.label || round.time, assignment, partner };
      })
    : [];

  return `
    <div class="schedule-event schedule-rotation-event ${activityMeta.className} ${isParallel ? "parallel" : ""} ${ui.expanded ? "expanded" : ""}">
      <div class="rotation-summary">
        <div class="rotation-summary-copy">
          ${isParallel ? `<span class="parallel-index">Activiteit ${activityIndex + 1}</span>` : ""}
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(rotation.location)} · ${escapeHTML(rotationSummary)}</span>
        </div>
        <div class="rotation-summary-actions">
          ${renderRanjaInfoButton(item)}
          ${renderInstructionLinkButton(item)}
          <button
            class="rotation-toggle"
            type="button"
            data-schedule-interactive
            data-rotation-toggle="${escapeAttribute(key)}"
            aria-expanded="${ui.expanded}"
          >
            <span>${ui.expanded ? `Verberg ${toggleLabel}` : `Bekijk ${toggleLabel}`}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 10 5 5 5-5"></path>
            </svg>
          </button>
        </div>
      </div>
      ${ui.expanded ? `
        <div class="rotation-details">
          ${item.detail ? `<p class="rotation-intro">${escapeHTML(item.detail)}</p>` : ""}
          ${isFreeFlow ? `
            <div class="rotation-participants">
              <span>Voor</span>
              <strong>${escapeHTML(rotation.groups.join(" en "))}</strong>
            </div>
            <div class="rotation-station-list" aria-label="Spellen van de Feestrace">
              ${stations.map((station, index) => `
                <div class="rotation-station">
                  <span class="rotation-station-number">${index + 1}</span>
                  <strong>${escapeHTML(station)}</strong>
                </div>
              `).join("")}
            </div>
          ` : isTimeline ? `
            <div class="rotation-timeline" aria-label="${escapeAttribute(item.title)} schema">
              ${rotation.steps.map((step) => `
                <div class="rotation-timeline-step">
                  <time>${escapeHTML(step.time)}</time>
                  <div>
                    <div class="rotation-step-title">
                      <strong>${escapeHTML(step.title)}</strong>
                      ${renderRanjaInfoButton(step)}
                    </div>
                    ${step.detail ? `<span>${escapeHTML(step.detail)}</span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          ` : isGroupRoutes ? `
            <label class="rotation-group-control">
              <span>Mijn groep</span>
              <select
                data-schedule-interactive
                data-rotation-group="${escapeAttribute(key)}"
              >
                <option value="">Alle groepen</option>
                ${rotation.groups.map((group) => `
                  <option value="${escapeAttribute(group)}" ${ui.group === group ? "selected" : ""}>${escapeHTML(rotationGroupDisplayName(group))}</option>
                `).join("")}
              </select>
            </label>
            <div class="group-route-overview ${ui.group ? "single-route" : ""}">
              ${rotation.groups
                .filter((group) => !ui.group || group === ui.group)
                .map((group) => `
                  <section class="group-route-column" aria-label="Route ${escapeAttribute(rotationGroupDisplayName(group))}">
                    <h3>${escapeHTML(rotationGroupDisplayName(group))}</h3>
                    ${rotation.routes[group].map((step) => `
                      <div class="group-route-step">
                        <time>${escapeHTML(step.time)}</time>
                        <div>
                          <div class="rotation-step-title">
                            <strong>${escapeHTML(step.title)}</strong>
                            ${renderRanjaInfoButton(step)}
                          </div>
                          ${step.detail ? `<span>${escapeHTML(step.detail)}</span>` : ""}
                        </div>
                      </div>
                    `).join("")}
                  </section>
                `).join("")}
            </div>
          ` : `
            <label class="rotation-group-control">
              <span>Mijn groep</span>
              <select
                data-schedule-interactive
                data-rotation-group="${escapeAttribute(key)}"
              >
                <option value="">Alle groepen</option>
                ${rotation.groups.map((group) => `
                  <option value="${escapeAttribute(group)}" ${ui.group === group ? "selected" : ""}>${escapeHTML(rotationGroupDisplayName(group))}</option>
                `).join("")}
              </select>
            </label>

            ${ui.group ? `
            <div class="rotation-route" aria-label="Route voor ${escapeAttribute(rotationGroupDisplayName(ui.group))}">
              <h3>Route ${escapeHTML(rotationGroupDisplayName(ui.group))}</h3>
              ${route.map(({ time, assignment, partner }) => `
                <div class="rotation-route-row">
                  <time>${escapeHTML(time)}</time>
                  <div class="rotation-assignment-copy">
                    <strong>${escapeHTML(assignment?.station || rotation.idleLabel || "Geen indeling")}</strong>
                    ${assignment && stationLocations[assignment.station] ? `<small>${escapeHTML(stationLocations[assignment.station])}</small>` : ""}
                  </div>
                  <span>${partner ? (isMatchRotation ? `tegen ${escapeHTML(rotationGroupDisplayName(partner))}` : `met groep ${escapeHTML(partner)}`) : ""}</span>
                </div>
              `).join("")}
            </div>
            ` : `
              <div class="rotation-round-switch" role="group" aria-label="Kies een ronde">
                ${rounds.map((round) => `
                  <button
                    type="button"
                    data-schedule-interactive
                    data-rotation-key="${escapeAttribute(key)}"
                    data-rotation-round="${escapeAttribute(round.time)}"
                    aria-pressed="${selectedRound?.time === round.time}"
                    class="${selectedRound?.time === round.time ? "active" : ""}"
                  >${escapeHTML(round.label || round.time)}</button>
                `).join("")}
              </div>

              <div class="rotation-mobile-round">
                ${selectedRound?.assignments.map((assignment) => `
                  <div class="rotation-assignment">
                    <div class="rotation-assignment-copy">
                      <strong>${escapeHTML(assignment.station)}</strong>
                      ${stationLocations[assignment.station] ? `<small>${escapeHTML(stationLocations[assignment.station])}</small>` : ""}
                    </div>
                    <span>${escapeHTML(rotationGroupsLabel(assignment.groups))}</span>
                  </div>
                `).join("") || ""}
              </div>

              <div class="rotation-matrix-wrap">
                <table class="rotation-matrix">
                  <thead>
                    <tr>
                      <th scope="col">Tijd</th>
                      ${stations.map((station) => `
                        <th scope="col">
                          <span>${escapeHTML(station)}</span>
                          ${stationLocations[station] ? `<small>${escapeHTML(stationLocations[station])}</small>` : ""}
                        </th>
                      `).join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${rounds.map((round) => `
                      <tr>
                        <th scope="row">${escapeHTML(round.label || round.time)}</th>
                        ${stations.map((station) => {
                          const assignment = round.assignments.find((entry) => entry.station === station);
                          return `<td>${escapeHTML(rotationGroupsLabel(assignment?.groups || "-"))}</td>`;
                        }).join("")}
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `}
          `}
        </div>
      ` : ""}
    </div>
  `;
}

function renderSchedule() {
  const day = scheduleDays[scheduleDayIndex];
  const theme = scheduleThemes[scheduleCategory]?.[scheduleDayIndex];
  scheduleDateLabel.textContent = `${day.label} ${day.date}${theme ? ` · ${theme}` : ""}`;
  scheduleDayName.textContent = day.label;
  scheduleDayRange.textContent = day.date;
  prevScheduleDay.disabled = scheduleDayIndex === 0;
  nextScheduleDay.disabled = scheduleDayIndex === scheduleDays.length - 1;
  toverlandHub.classList.toggle("hidden", scheduleDayIndex !== 1);

  scheduleCategorySwitch.innerHTML = scheduleCategories
    .map((category) => `
      <button type="button" class="${category === scheduleCategory ? "active" : ""}" data-schedule-category="${escapeAttribute(category)}">
        ${escapeHTML(category)}
      </button>
    `)
    .join("");

  const scheduleItems = scheduleFor(scheduleCategory, scheduleDayIndex);
  const scheduleBlocks = groupScheduleItems(scheduleItems);

  scheduleBoard.innerHTML = scheduleBlocks
    .map((block) => {
      const parallelMeta = block.items.length > 1 ? scheduleParallelMeta(block.items) : null;
      return `
      <article class="schedule-row ${block.items.length > 1 ? "parallel-row" : ""}">
        <time class="schedule-time">${block.time}</time>
        <div class="schedule-event-stack">
          ${block.items.length > 1 ? `<span class="parallel-badge">${block.items.length} activiteiten tegelijk</span>` : ""}
          ${block.items.map((item, index) => {
            if (item.rotation) return renderScheduleRotation(item, block.items.length > 1, index);
            const meta = parallelMeta || scheduleActivityMeta(item);
            return `
              <div class="schedule-event ${meta.className} ${block.items.length > 1 ? "parallel" : ""}">
                ${block.items.length > 1 ? `<span class="parallel-index">Activiteit ${index + 1}</span>` : ""}
                <div class="schedule-event-title-row">
                  <strong>${escapeHTML(item.title)}</strong>
                  <span class="schedule-event-title-actions">
                    ${renderRanjaInfoButton(item)}
                    ${renderInstructionLinkButton(item)}
                  </span>
                </div>
                ${item.detail ? `<span>${escapeHTML(item.detail)}</span>` : ""}
                ${renderScheduleRouteLink(item)}
                ${renderToverlandArrivalTools(item)}
                ${renderCleaningAssignment(item)}
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
    })
    .join("");

  if (!scheduleItems.length) {
    scheduleBoard.innerHTML = `<article class="schedule-row"><time class="schedule-time">-</time><div class="schedule-event rest"><strong>Geen programma</strong><span>Er is voor deze dag en doelgroep nog geen programma ingevuld.</span></div></article>`;
  }
}

function renderToverlandArrivalTools(item) {
  if (scheduleDayIndex !== 1 || !item.title.toLowerCase().includes("aankomst in toverland")) return "";

  return `
    <section class="toverland-arrival-tools" aria-label="Toverland diensten en instructies">
      <div class="toverland-arrival-tools-heading">
        <span>Direct na aankomst</span>
        <strong>Diensten & instructies</strong>
      </div>
      <div class="toverland-arrival-resource-grid">
        <button type="button" data-schedule-interactive data-toverland-resource="roster">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M7 14h4M13 14h4M7 18h4M13 18h4" /></svg>
          <span><strong>Dienstrooster</strong><small>Bekijk jouw dienst</small></span>
        </button>
        <button type="button" data-schedule-interactive data-toverland-resource="ranjapost">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8l1 18H7Z" /><path d="M9 8h6M10 12h4" /></svg>
          <span><strong>Ranjapost</strong><small>Instructiekaart</small></span>
        </button>
        <button type="button" data-schedule-interactive data-toverland-resource="meeting-point">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
          <span><strong>Verzamelplek</strong><small>Instructiekaart</small></span>
        </button>
      </div>
    </section>
  `;
}

function normalizeCleaningGroupName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function cleaningGroupForCurrentUser() {
  if (isManager()) return activeGroup();
  const assignedGroups = visibleGroupsFor();
  return assignedGroups.find((group) => group.id === state.activeGroupId) || assignedGroups[0] || null;
}

function groupMatchesCleaningAssignment(groupName, assignmentGroup) {
  const group = normalizeCleaningGroupName(groupName);
  const assignment = normalizeCleaningGroupName(assignmentGroup);
  if (group === assignment) return true;
  if (assignment === "ouderen12") return group === "ouderen1" || group === "ouderen2";
  return false;
}

function cleaningAssignmentsForGroup(group) {
  if (!group) return [];
  return (cleaningRosterByDay[scheduleDayIndex] || []).filter((assignment) => (
    assignment.groups.some((groupName) => groupMatchesCleaningAssignment(group.name, groupName))
  ));
}

function renderCleaningAssignment(item) {
  if (!item.title.toLowerCase().includes("schoonmaken en evalueren")) return "";

  const group = cleaningGroupForCurrentUser();
  const assignments = cleaningAssignmentsForGroup(group);
  const heading = isManager() ? "Schoonmaakrooster" : "Jouw schoonmaaktaak";
  const message = !group
    ? "Je bent niet aan een groep gekoppeld. Bekijk het volledige rooster."
    : assignments.length
      ? `${group.name} is vandaag ingedeeld.`
      : `${group.name} heeft vandaag geen reguliere schoonmaaktaak.`;

  return `
    <section class="cleaning-assignment-card" aria-label="${escapeAttribute(heading)}">
      <div class="cleaning-assignment-heading">
        <span>Schoonmaakrooster</span>
        <strong>${escapeHTML(heading)}</strong>
      </div>
      <p>${escapeHTML(message)}</p>
      ${assignments.length ? `
        <ul>
          ${assignments.map((assignment) => `<li>${escapeHTML(assignment.task)}</li>`).join("")}
        </ul>
      ` : ""}
      <button type="button" data-schedule-interactive data-open-cleaning-roster>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M7 14h4M13 14h4M7 18h4M13 18h4" /></svg>
        <span>Volledig schoonmaakrooster</span>
      </button>
    </section>
  `;
}

function openCleaningRoster(trigger) {
  instructionViewerItems = [{
    kind: "image",
    url: cleaningRosterImage,
    name: "Schoonmaakrooster KVW 2026",
    instruction: { title: "Schoonmaakrooster KVW 2026", summary: "", body: "", materials: "", safety: "" }
  }];
  instructionViewerIndex = 0;
  instructionImageViewerReturnFocus = trigger;
  renderInstructionViewerItem();
  instructionImageViewer.classList.remove("hidden");
  instructionImageViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("instruction-viewer-open");
  closeInstructionImageViewerButton.focus();
}

function renderScheduleRouteLink(item) {
  if (!item.routeUrl) return "";
  let routeUrl;
  try {
    const parsed = new URL(item.routeUrl);
    if (parsed.protocol !== "https:") return "";
    routeUrl = parsed.href;
  } catch {
    return "";
  }

  return `
    <a
      class="schedule-route-link"
      href="${escapeAttribute(routeUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      data-schedule-interactive
      aria-label="Open de fietsroute naar Heukelom in Google Maps"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18 4 20V6l5-2 6 2 5-2v14l-5 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
      <span>Open fietsroute</span>
      <svg class="schedule-route-external" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 5h5v5M19 5l-8 8" />
        <path d="M19 13v6H5V5h6" />
      </svg>
    </a>
  `;
}

function openToverlandResource(resourceKey, trigger) {
  const resource = toverlandResources[resourceKey];
  if (!resource) return;
  instructionViewerItems = [{
    ...resource,
    name: resource.title,
    instruction: { title: resource.title, summary: "", body: "", materials: "", safety: "" }
  }];
  instructionViewerIndex = 0;
  instructionImageViewerReturnFocus = trigger;
  renderInstructionViewerItem();
  instructionImageViewer.classList.remove("hidden");
  instructionImageViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("instruction-viewer-open");
  closeInstructionImageViewerButton.focus();
}

function toverlandAssignmentsFor(slot) {
  return [
    { label: "Ranjapost", names: slot.ranjapost, className: "" },
    { label: "Verzamelplek", names: slot.meetingPoint, className: "meeting" }
  ];
}

function renderToverlandRoster() {
  const currentName = currentUserName().trim().toLowerCase();
  document.querySelectorAll("[data-toverland-roster-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.toverlandRosterMode === toverlandRosterMode);
    button.setAttribute("aria-pressed", String(button.dataset.toverlandRosterMode === toverlandRosterMode));
  });

  const rows = toverlandRoster
    .map((slot) => {
      const assignments = toverlandAssignmentsFor(slot).filter((assignment) => (
        toverlandRosterMode === "all"
        || assignment.names.some((name) => name.toLowerCase() === currentName)
      ));
      return assignments.length ? { ...slot, assignments } : null;
    })
    .filter(Boolean);

  if (!rows.length) {
    toverlandRosterContent.innerHTML = `
      <div class="toverland-roster-empty">
        <strong>Je bent niet ingedeeld</strong>
        <p>Er staat geen dienst op jouw naam. Bekijk het volledige rooster om te zien wie er wel is ingedeeld.</p>
      </div>
    `;
    return;
  }

  toverlandRosterContent.innerHTML = rows.map((slot) => `
    <article class="toverland-roster-row">
      <time class="toverland-roster-time">${escapeHTML(slot.time)}</time>
      <div class="toverland-roster-assignments">
        ${slot.assignments.map((assignment) => `
          <div class="toverland-roster-assignment ${assignment.className}">
            <small>${assignment.label}</small>
            <strong>${assignment.names.map(escapeHTML).join(" en ")}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function openToverlandRoster(trigger) {
  toverlandRosterMode = "mine";
  toverlandRosterReturnFocus = trigger;
  renderToverlandRoster();
  toverlandRosterModal.classList.remove("hidden");
  toverlandRosterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("toverland-roster-open");
  closeToverlandRosterButton.focus();
}

function closeToverlandRoster() {
  toverlandRosterModal.classList.add("hidden");
  toverlandRosterModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("toverland-roster-open");
  if (toverlandRosterReturnFocus?.isConnected) toverlandRosterReturnFocus.focus();
  toverlandRosterReturnFocus = null;
}

function instructionsForActivity(activityId) {
  return state.gameInstructions.filter((instruction) => instruction.activityIds.includes(activityId));
}

function renderInstructionLinkButton(item) {
  const linkedInstructions = instructionsForActivity(item.activityId);
  if (!linkedInstructions.length) return "";

  return `
    <button
      class="schedule-instruction-button"
      type="button"
      data-schedule-interactive
      data-open-activity-instructions="${escapeAttribute(item.activityId)}"
      aria-label="Bekijk ${linkedInstructions.length === 1 ? "spelinstructie" : `${linkedInstructions.length} spelinstructies`} voor ${escapeAttribute(item.title)}"
      title="Bekijk spelinstructie"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v16H4.5A2.5 2.5 0 0 0 2 21.5Z" />
        <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v16h6.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      </svg>
      ${linkedInstructions.length > 1 ? `<span class="schedule-instruction-count">${linkedInstructions.length}</span>` : ""}
    </button>
  `;
}

function isRanjaPause(item) {
  const title = item?.title || "";
  return /ranja/i.test(title) && /pauze/i.test(title);
}

function renderRanjaInfoButton(item) {
  if (!isRanjaPause(item)) return "";
  return `
    <button
      class="schedule-info-button"
      type="button"
      data-schedule-interactive
      data-open-ranja-info
      aria-label="Bekijk afspraak bij deze ranjapauze"
      title="Afspraak bij ranjapauze"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" />
      </svg>
    </button>
  `;
}

function openRanjaInfo(trigger) {
  instructionViewerItems = [{
    kind: "text",
    url: "",
    name: "Ranjapauze",
    instruction: {
      title: "Ranjapauze",
      summary: "Er staat ranja en een traktatie klaar bij de catering. Alleen (hulp)leiding kunnen deze ophalen! Ga niet met je groepje langs de catering, maar zoek een plek om je pauze door te brengen.",
      body: "",
      materials: "",
      safety: ""
    }
  }];
  instructionViewerIndex = 0;
  instructionImageViewerReturnFocus = trigger;
  renderInstructionViewerItem();
  instructionImageViewer.classList.remove("hidden");
  instructionImageViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("instruction-viewer-open");
  closeInstructionImageViewerButton.focus();
}

function visibleInstructions() {
  const query = instructionSearch.value.trim().toLowerCase();
  const category = instructionCategoryFilter.value;

  return state.gameInstructions
    .filter((instruction) => !instructionActivityFilter || instruction.activityIds.includes(instructionActivityFilter))
    .filter((instruction) => category === "all" || instruction.category === category)
    .filter((instruction) => {
      if (!query) return true;
      return [instruction.title, instruction.summary, instruction.body, instruction.materials]
        .some((value) => value.toLowerCase().includes(query));
    })
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

function safeInstructionFileUrl(value) {
  const url = String(value || "");
  if (/^data:(image\/(jpeg|png|webp|gif)|application\/pdf);base64,/i.test(url)) return url;
  try {
    const parsed = new URL(url, window.location.href);
    if (["http:", "https:", "blob:"].includes(parsed.protocol)) return parsed.href;

    if (window.location.protocol === "file:" && parsed.protocol === "file:") {
      const bundledInstructionRoot = new URL("./assets/game-instructions/", window.location.href);
      if (parsed.pathname.startsWith(bundledInstructionRoot.pathname)) return parsed.href;
    }

    return "#";
  } catch {
    return "#";
  }
}

function loadRecentlyViewedInstructionIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(recentInstructionsKey) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function rememberViewedInstructions(instructions) {
  const viewedIds = instructions.map((instruction) => instruction?.id).filter(Boolean);
  if (!viewedIds.length) return;
  const recentIds = loadRecentlyViewedInstructionIds().filter((id) => !viewedIds.includes(id));
  try {
    localStorage.setItem(recentInstructionsKey, JSON.stringify([...viewedIds, ...recentIds].slice(0, 6)));
  } catch {
    // Recent bekeken is alleen een lokaal hulpmiddel; de viewer blijft zonder opslag werken.
  }
  if (state.activeView === "instructionLibraryView") renderPublicInstructionLibrary();
}

function publicInstructionFileLabel(instruction) {
  const imageCount = instruction.attachments.filter((attachment) => attachment.type.startsWith("image/")).length;
  const pdfCount = instruction.attachments.filter((attachment) => attachment.type === "application/pdf").length;
  if (imageCount === instruction.attachments.length && imageCount) {
    return `${imageCount} afbeelding${imageCount === 1 ? "" : "en"}`;
  }
  if (pdfCount === instruction.attachments.length && pdfCount) {
    return `${pdfCount} PDF${pdfCount === 1 ? "" : "'s"}`;
  }
  if (instruction.attachments.length) {
    return `${instruction.attachments.length} bestand${instruction.attachments.length === 1 ? "" : "en"}`;
  }
  return "Tekstinstructie";
}

function instructionHasViewableContent(instruction) {
  const hasSupportedAttachment = instruction.attachments.some((attachment) => (
    (attachment.type.startsWith("image/") || attachment.type === "application/pdf")
    && safeInstructionFileUrl(attachment.url) !== "#"
  ));
  const hasText = [instruction.summary, instruction.body, instruction.materials, instruction.safety]
    .some((value) => String(value || "").trim());
  return hasSupportedAttachment || hasText;
}

function renderPublicInstructionThumbnail(instruction) {
  const imageAttachment = instruction.attachments.find((attachment) => (
    attachment.type.startsWith("image/") && safeInstructionFileUrl(attachment.url) !== "#"
  ));
  if (imageAttachment) {
    return `<img src="${escapeAttribute(safeInstructionFileUrl(imageAttachment.url))}" alt="" />`;
  }

  const hasPdf = instruction.attachments.some((attachment) => attachment.type === "application/pdf");
  return `
    <span class="public-instruction-file-icon ${hasPdf ? "pdf" : "text"}" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </svg>
    </span>
  `;
}

function renderPublicInstructionCard(instruction) {
  return `
    <button
      class="public-instruction-card instruction-category-${escapeAttribute(instruction.category)}"
      type="button"
      data-public-instruction-id="${escapeAttribute(instruction.id)}"
    >
      <span class="public-instruction-thumbnail">${renderPublicInstructionThumbnail(instruction)}</span>
      <span class="public-instruction-card-copy">
        <strong>${escapeHTML(instruction.title)}</strong>
        ${instruction.summary ? `<span>${escapeHTML(instruction.summary)}</span>` : ""}
        <small>
          <span>${escapeHTML(instructionCategoryLabel(instruction.category))}</span>
          <span>${escapeHTML(publicInstructionFileLabel(instruction))}</span>
        </small>
      </span>
      <svg class="public-instruction-card-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
    </button>
  `;
}

function visiblePublicInstructions() {
  const query = publicInstructionSearch.value.trim().toLowerCase();
  return state.gameInstructions
    .filter(instructionHasViewableContent)
    .filter((instruction) => (
      publicInstructionCategory === "all"
      || instruction.category === "all-groups"
      || instruction.category === publicInstructionCategory
    ))
    .filter((instruction) => {
      if (!query) return true;
      const activityLabels = instruction.activityIds.map(scheduleActivityLabel);
      return [
        instruction.title,
        instruction.summary,
        instruction.body,
        instruction.materials,
        instruction.safety,
        ...activityLabels
      ].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

function renderPublicInstructionSection(title, instructions, recent = false) {
  if (!instructions.length) return "";
  return `
    <section class="public-instruction-section ${recent ? "recent" : ""}">
      <h3>${escapeHTML(title)}</h3>
      <div class="public-instruction-grid">
        ${instructions.map(renderPublicInstructionCard).join("")}
      </div>
    </section>
  `;
}

function renderPublicInstructionLibrary() {
  const filters = ["all", ...scheduleCategories];
  publicInstructionFilters.innerHTML = filters.map((category) => `
    <button
      class="${category === publicInstructionCategory ? "active" : ""}"
      type="button"
      data-public-instruction-category="${escapeAttribute(category)}"
      aria-pressed="${category === publicInstructionCategory}"
    >
      ${category === "all" ? "Alle" : escapeHTML(instructionCategoryLabel(category))}
    </button>
  `).join("");

  const instructions = visiblePublicInstructions();
  const showRecent = !publicInstructionSearch.value.trim() && publicInstructionCategory === "all";
  const recentIds = showRecent ? loadRecentlyViewedInstructionIds() : [];
  const recentInstructions = recentIds
    .map((id) => instructions.find((instruction) => instruction.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const recentIdSet = new Set(recentInstructions.map((instruction) => instruction.id));
  const remainingInstructions = showRecent
    ? instructions.filter((instruction) => !recentIdSet.has(instruction.id))
    : instructions;

  publicInstructionCount.textContent = `${instructions.length} instructie${instructions.length === 1 ? "" : "s"}`;
  publicInstructionResults.innerHTML = instructions.length
    ? [
        renderPublicInstructionSection("Recent bekeken", recentInstructions, true),
        renderPublicInstructionSection(recentInstructions.length ? "Alle instructies" : "Instructies", remainingInstructions)
      ].join("")
    : `<div class="public-instruction-empty"><strong>Geen instructies gevonden</strong><span>Probeer een andere zoekterm of doelgroep.</span></div>`;
}

function formatFileSize(size) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} kB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderInstructionAttachment(attachment) {
  const url = safeInstructionFileUrl(attachment.url);
  const isImage = attachment.type.startsWith("image/");
  return `
    <article class="instruction-file ${isImage ? "image" : "pdf"}">
      ${isImage ? `
        <button class="instruction-file-content" type="button" data-view-instruction-image="${escapeAttribute(attachment.id)}" aria-label="Open ${escapeAttribute(attachment.name)} groot">
          <img src="${escapeAttribute(url)}" alt="${escapeAttribute(attachment.name)}" />
          <span>${escapeHTML(attachment.name)}${attachment.size ? ` · ${escapeHTML(formatFileSize(attachment.size))}` : ""}</span>
        </button>
      ` : `
        <a class="instruction-file-content" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 15h8M8 18h5" /></svg>
          <span>${escapeHTML(attachment.name)}${attachment.size ? ` · ${escapeHTML(formatFileSize(attachment.size))}` : ""}</span>
        </a>
      `}
      ${isManager() ? `
        <button class="instruction-file-remove" type="button" data-remove-instruction-file="${escapeAttribute(attachment.id)}" aria-label="Verwijder ${escapeAttribute(attachment.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ` : ""}
    </article>
  `;
}

function instructionActivityOptions(instruction) {
  const items = schedulePrograms[instructionLinkCategory]?.[instructionLinkDayIndex] || [];
  const available = items.filter((item) => !instruction.activityIds.includes(item.activityId));
  if (!available.length) return `<option value="">Geen activiteiten beschikbaar</option>`;
  return available
    .map((item) => `<option value="${escapeAttribute(item.activityId)}">${escapeHTML(`${item.time} · ${item.title}`)}</option>`)
    .join("");
}

function renderInstructionDetail(instruction) {
  if (!instruction) {
    return `
      <div class="instruction-detail-empty">
        <p>${isManager() ? "Nog geen spelinstructies. Voeg de eerste instructie toe." : "Nog geen spelinstructies beschikbaar."}</p>
      </div>
    `;
  }

  const activityLinks = instruction.activityIds.map((activityId) => ({
    id: activityId,
    label: scheduleActivityLabel(activityId)
  }));

  return `
    <article class="instruction-detail-article instruction-category-${escapeAttribute(instruction.category)}">
      <header class="instruction-detail-header">
        <div>
          <span class="instruction-category-pill">${escapeHTML(instructionCategoryLabel(instruction.category))}</span>
          <h3>${escapeHTML(instruction.title)}</h3>
          ${instruction.summary ? `<p class="instruction-summary">${escapeHTML(instruction.summary)}</p>` : ""}
        </div>
        ${isManager() ? `
          <div class="instruction-detail-actions">
            <button class="instruction-icon-button" type="button" data-edit-instruction="${escapeAttribute(instruction.id)}" aria-label="Bewerk ${escapeAttribute(instruction.title)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            <button class="instruction-icon-button danger" type="button" data-delete-instruction="${escapeAttribute(instruction.id)}" aria-label="Verwijder ${escapeAttribute(instruction.title)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" /></svg>
            </button>
          </div>
        ` : ""}
      </header>

      ${instruction.body ? `<section class="instruction-copy-section"><h4>Spelverloop</h4><p>${escapeHTML(instruction.body)}</p></section>` : ""}
      ${instruction.materials ? `<section class="instruction-copy-section"><h4>Benodigdheden</h4><p>${escapeHTML(instruction.materials)}</p></section>` : ""}
      ${instruction.safety ? `<section class="instruction-copy-section"><h4>Veiligheid</h4><p>${escapeHTML(instruction.safety)}</p></section>` : ""}

      ${instruction.attachments.length ? `
        <section class="instruction-files">
          <h4>Bestanden</h4>
          <div class="instruction-file-grid">${instruction.attachments.map(renderInstructionAttachment).join("")}</div>
        </section>
      ` : ""}

      <section class="instruction-link-section">
        <h4>Gekoppeld aan programma</h4>
        <div class="instruction-links">
          ${activityLinks.length
            ? activityLinks.map((link) => `
              <span class="instruction-link-chip">
                <span>${escapeHTML(link.label)}</span>
                ${isManager() ? `<button type="button" data-unlink-instruction-activity="${escapeAttribute(link.id)}" aria-label="Koppeling verwijderen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg></button>` : ""}
              </span>
            `).join("")
            : `<span class="instruction-link-chip"><span>Nog niet gekoppeld</span></span>`}
        </div>
        ${isManager() ? `
          <form class="instruction-link-form" id="instructionLinkForm">
            <select data-instruction-link-category aria-label="Doelgroep">
              ${scheduleCategories.map((category) => `<option value="${category}" ${category === instructionLinkCategory ? "selected" : ""}>${escapeHTML(instructionCategoryLabel(category))}</option>`).join("")}
            </select>
            <select data-instruction-link-day aria-label="Dag">
              ${scheduleDays.map((day, index) => `<option value="${index}" ${index === instructionLinkDayIndex ? "selected" : ""}>${escapeHTML(day.label)}</option>`).join("")}
            </select>
            <select data-instruction-link-activity aria-label="Activiteit">${instructionActivityOptions(instruction)}</select>
            <button type="submit">Koppelen</button>
          </form>
        ` : ""}
      </section>
    </article>
  `;
}

function renderInstructions() {
  const instructions = visibleInstructions();
  if (!instructions.some((instruction) => instruction.id === activeInstructionId)) {
    activeInstructionId = instructions[0]?.id || "";
  }

  instructionList.innerHTML = `
    ${instructionActivityFilter ? `
      <button class="text-button instruction-filter-clear" type="button" data-clear-instruction-activity-filter>
        Toon volledige bibliotheek
      </button>
    ` : ""}
    ${instructions.map((instruction) => `
      <button
        class="instruction-list-item instruction-category-${escapeAttribute(instruction.category)} ${instruction.id === activeInstructionId ? "active" : ""}"
        type="button"
        data-instruction-id="${escapeAttribute(instruction.id)}"
      >
        <strong>${escapeHTML(instruction.title)}</strong>
        <span>${escapeHTML(instructionCategoryLabel(instruction.category))}</span>
        <span class="instruction-list-meta">
          <span>${instruction.attachments.length} bestand${instruction.attachments.length === 1 ? "" : "en"}</span>
          <span>${instruction.activityIds.length} koppeling${instruction.activityIds.length === 1 ? "" : "en"}</span>
        </span>
      </button>
    `).join("")}
    ${!instructions.length ? `<div class="instruction-detail-empty"><p>Geen instructies gevonden.</p></div>` : ""}
  `;

  const activeInstruction = state.gameInstructions.find((instruction) => instruction.id === activeInstructionId);
  instructionDetail.innerHTML = renderInstructionDetail(activeInstruction);
}

function openInstructionEditor(id = "") {
  if (!isManager()) return;
  const instruction = state.gameInstructions.find((item) => item.id === id);
  instructionForm.reset();
  instructionId.value = instruction?.id || "";
  instructionTitle.value = instruction?.title || "";
  instructionCategory.value = instruction?.category || "kleuters";
  instructionSummary.value = instruction?.summary || "";
  instructionBody.value = instruction?.body || "";
  instructionMaterials.value = instruction?.materials || "";
  instructionSafety.value = instruction?.safety || "";
  instructionFormTitle.textContent = instruction ? "Instructie bewerken" : "Nieuwe instructie";
  instructionUploadStatus.textContent = "";
  instructionModal.classList.remove("hidden");
  document.body.classList.add("instruction-modal-open");
  instructionTitle.focus();
}

function closeInstructionEditor() {
  instructionModal.classList.add("hidden");
  document.body.classList.remove("instruction-modal-open");
  instructionForm.reset();
  instructionUploadStatus.textContent = "";
}

function instructionViewerEntries(instructions) {
  return instructions.flatMap((instruction) => {
    const attachments = instruction.attachments
      .map((attachment) => {
        const url = safeInstructionFileUrl(attachment.url);
        if (url === "#") return null;
        const kind = attachment.type.startsWith("image/")
          ? "image"
          : attachment.type === "application/pdf" ? "pdf" : "";
        return kind ? { kind, url, name: attachment.name, instruction } : null;
      })
      .filter(Boolean);

    if (attachments.length) return attachments;
    if (![instruction.summary, instruction.body, instruction.materials, instruction.safety].some(Boolean)) return [];
    return [{ kind: "text", url: "", name: instruction.title, instruction }];
  });
}

function renderInstructionViewerItem() {
  const item = instructionViewerItems[instructionViewerIndex];
  if (!item) return;
  const isImage = item.kind === "image";
  const isPdf = item.kind === "pdf";
  const isText = item.kind === "text";

  instructionImageViewerImage.classList.toggle("hidden", !isImage);
  instructionDocumentViewer.classList.toggle("hidden", !isPdf);
  instructionTextViewer.classList.toggle("hidden", !isText);

  if (isImage) {
    instructionImageViewerImage.src = item.url;
    instructionImageViewerImage.alt = item.name;
  } else {
    instructionImageViewerImage.removeAttribute("src");
    instructionImageViewerImage.alt = "";
  }

  instructionDocumentViewer.src = isPdf ? item.url : "about:blank";

  if (isText) {
    const instruction = item.instruction;
    instructionTextViewerTitle.textContent = instruction.title;
    instructionTextViewerSummary.textContent = instruction.summary;
    instructionTextViewerSummary.classList.toggle("hidden", !instruction.summary);
    instructionTextViewerBody.replaceChildren();
    [
      ["Spelverloop", instruction.body],
      ["Benodigdheden", instruction.materials],
      ["Veiligheid", instruction.safety]
    ].forEach(([label, value]) => {
      if (!value) return;
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      const paragraph = document.createElement("p");
      heading.textContent = label;
      paragraph.textContent = value;
      section.append(heading, paragraph);
      instructionTextViewerBody.append(section);
    });
  }

  instructionImageViewerCaption.textContent = item.name === item.instruction.title
    ? item.instruction.title
    : `${item.instruction.title} · ${item.name}`;
  instructionImageViewerCount.textContent = instructionViewerItems.length > 1
    ? `${instructionViewerIndex + 1} / ${instructionViewerItems.length}`
    : "";
  previousInstructionViewerItemButton.classList.toggle("hidden", instructionViewerItems.length < 2);
  nextInstructionViewerItemButton.classList.toggle("hidden", instructionViewerItems.length < 2);
}

function openInstructionViewer(instructions, trigger = null) {
  const items = instructionViewerEntries(instructions);
  if (!items.length) {
    showToast("Geen instructiebestand beschikbaar");
    return;
  }
  rememberViewedInstructions(instructions);
  instructionViewerItems = items;
  instructionViewerIndex = 0;
  instructionImageViewerReturnFocus = trigger;
  renderInstructionViewerItem();
  instructionImageViewer.classList.remove("hidden");
  instructionImageViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("instruction-viewer-open");
  closeInstructionImageViewerButton.focus();
}

function openInstructionImageViewer(attachment, trigger = null) {
  const instruction = state.gameInstructions.find((item) => item.id === activeInstructionId);
  if (!instruction || !attachment) return;
  openInstructionViewer([{ ...instruction, attachments: [attachment] }], trigger);
}

function moveInstructionViewer(direction) {
  if (instructionViewerItems.length < 2) return;
  instructionViewerIndex = (instructionViewerIndex + direction + instructionViewerItems.length) % instructionViewerItems.length;
  renderInstructionViewerItem();
}

function closeInstructionImageViewer() {
  instructionImageViewer.classList.add("hidden");
  instructionImageViewer.setAttribute("aria-hidden", "true");
  instructionImageViewerImage.removeAttribute("src");
  instructionImageViewerImage.alt = "";
  instructionDocumentViewer.src = "about:blank";
  instructionImageViewerCaption.textContent = "";
  instructionImageViewerCount.textContent = "";
  instructionViewerItems = [];
  instructionViewerIndex = 0;
  document.body.classList.remove("instruction-viewer-open");
  if (instructionImageViewerReturnFocus?.isConnected) instructionImageViewerReturnFocus.focus();
  instructionImageViewerReturnFocus = null;
}

function openBoardGuide() {
  if (!isManager()) {
    showToast("Alleen voor bestuursleden");
    return;
  }
  boardGuideReturnFocus = document.activeElement;
  boardGuideFrame.src = "./assets/board/draaiboek-bestuur.pdf#view=FitH";
  boardGuideViewer.classList.remove("hidden");
  boardGuideViewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("board-guide-open");
  closeBoardGuideButton.focus();
}

function closeBoardGuide() {
  boardGuideViewer.classList.add("hidden");
  boardGuideViewer.setAttribute("aria-hidden", "true");
  boardGuideFrame.src = "about:blank";
  document.body.classList.remove("board-guide-open");
  if (boardGuideReturnFocus?.isConnected) boardGuideReturnFocus.focus();
  boardGuideReturnFocus = null;
}

function instructionFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error(`Kon ${file.name} niet lezen.`)));
    reader.readAsDataURL(file);
  });
}

function boardPhotoToDataUrl(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return Promise.reject(new Error("Gebruik een JPG-, PNG- of WebP-afbeelding."));
  }
  if (file.size > 6 * 1024 * 1024) {
    return Promise.reject(new Error("De profielfoto mag maximaal 6 MB zijn."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("De profielfoto kon niet worden gelezen.")));
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", () => reject(new Error("De profielfoto kon niet worden verwerkt.")));
      image.addEventListener("load", () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      });
      image.src = String(reader.result || "");
    });
    reader.readAsDataURL(file);
  });
}

function safeInstructionFileName(name) {
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = scheduleActivitySlug(dotIndex >= 0 ? name.slice(0, dotIndex) : name).slice(0, 60);
  return `${base || "bestand"}${extension}`;
}

async function uploadInstructionFile(instruction, file) {
  const allowed = file.type === "application/pdf" || /^image\/(jpeg|png|webp|gif)$/.test(file.type);
  if (!allowed) throw new Error(`${file.name}: alleen PDF, JPG, PNG, WebP of GIF.`);
  if (file.size > instructionMaxFileSize) throw new Error(`${file.name}: maximaal 8 MB.`);

  const attachmentId = `${instruction.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (databaseReady && databaseClient) {
    const path = `${instruction.id}/${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${safeInstructionFileName(file.name)}`;
    const { error } = await databaseClient.storage
      .from(instructionBucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`${file.name}: upload mislukt. Controleer de Supabase Storage-migratie.`);
    const { data } = databaseClient.storage.from(instructionBucket).getPublicUrl(path);
    return { id: attachmentId, name: file.name, type: file.type, size: file.size, path, url: data.publicUrl };
  }

  if (file.size > instructionLocalFileLimit) {
    throw new Error(`${file.name}: zonder database is de lokale limiet 750 kB.`);
  }
  return {
    id: attachmentId,
    name: file.name,
    type: file.type,
    size: file.size,
    path: "",
    url: await instructionFileToDataUrl(file)
  };
}

async function removeInstructionFile(instruction, attachment) {
  if (attachment.path && databaseReady && databaseClient) {
    const { error } = await databaseClient.storage.from(instructionBucket).remove([attachment.path]);
    if (error) {
      showToast("Bestand kon niet uit Storage worden verwijderd");
      return false;
    }
  }
  instruction.attachments = instruction.attachments.filter((item) => item.id !== attachment.id);
  return true;
}

function renderRoomSchedule() {
  const day = roomScheduleDays[roomScheduleDayIndex];
  const configuredRange = parseScheduleRange(
    `${roomScheduleData.start || "08:00"} - ${roomScheduleData.end || "18:00"}`
  );
  const scheduleStart = configuredRange?.start ?? 8 * 60;
  const scheduleEnd = configuredRange?.end ?? 18 * 60;
  const slotMinutes = 15;
  const totalSlots = (scheduleEnd - scheduleStart) / slotMinutes;
  const timeTicks = Array.from({ length: totalSlots }, (_, index) => {
    const minutes = scheduleStart + (index * slotMinutes);
    return {
      label: formatScheduleTime(minutes),
      row: ((minutes - scheduleStart) / slotMinutes) + 2
    };
  });
  const events = roomScheduleEventsFor(day, scheduleStart, slotMinutes);

  roomScheduleSwitch.innerHTML = roomScheduleDays
    .map((scheduleDay, index) => `
      <button type="button" class="${index === roomScheduleDayIndex ? "active" : ""}" data-room-schedule-day="${index}">
        <strong>${escapeHTML(scheduleDay.label)}</strong>
        <span>${escapeHTML(scheduleDay.date)}</span>
      </button>
    `)
    .join("");

  roomScheduleLegend.innerHTML = roomScheduleLegendItems
    .map((item) => `
      <span class="room-schedule-legend-item">
        <i class="${escapeAttribute(item.type)}" aria-hidden="true"></i>
        ${escapeHTML(item.label)}
      </span>
    `)
    .join("");

  roomScheduleBoard.innerHTML = `
    <div class="room-timetable" style="--room-count: ${roomScheduleRooms.length}; --slot-count: ${totalSlots};">
      <div class="room-timetable-corner">Tijd</div>
      ${roomScheduleRooms.map((room, index) => `
        <div class="room-timetable-room" style="grid-column: ${index + 2};">${escapeHTML(room)}</div>
      `).join("")}
      <div class="room-timetable-time-lane" style="grid-row: 2 / span ${totalSlots};" aria-hidden="true"></div>
      ${timeTicks.map((tick) => `
        <time class="room-timetable-time" style="grid-row: ${tick.row};">${escapeHTML(tick.label)}</time>
      `).join("")}
      ${roomScheduleRooms.map((_, index) => `
        <div class="room-timetable-lane" style="grid-column: ${index + 2}; grid-row: 2 / span ${totalSlots};"></div>
      `).join("")}
      ${events.map((event) => `
        <article
          class="room-timetable-event ${event.type} ${event.rowSpan === 1 ? "compact" : ""}"
          style="grid-column: ${event.column} / span ${event.columnSpan}; grid-row: ${event.rowStart} / span ${event.rowSpan};"
          role="button"
          tabindex="0"
          aria-label="${escapeAttribute(`${event.time}, ${event.room}, ${event.activity}`)}"
          data-room-detail="true"
          data-detail-key="${escapeAttribute(event.key)}"
          data-room="${escapeAttribute(event.room)}"
          data-time="${escapeAttribute(event.time)}"
          data-activity="${escapeAttribute(event.activity)}"
        >
          <span>${escapeHTML(event.time)}</span>
          <strong>${escapeHTML(event.activity)}</strong>
        </article>
      `).join("")}
    </div>
  `;
}

function roomScheduleEventsFor(day, scheduleStart, slotMinutes) {
  return day.rows.flatMap((row) => {
    const range = parseScheduleRange(row.time);
    const start = range?.start ?? scheduleStart;
    const end = range?.end ?? start + 60;
    const rowStart = Math.max(2, Math.round((start - scheduleStart) / slotMinutes) + 2);
    const rowSpan = Math.max(1, Math.round((end - start) / slotMinutes));

    return row.rooms.map((room) => {
      const roomIndex = Number.isInteger(room.column)
        ? room.column
        : roomScheduleRooms.indexOf(room.room);
      return {
        activity: room.activity,
        column: (roomIndex === -1 ? roomScheduleRooms.length - 1 : roomIndex) + 2,
        columnSpan: Math.max(1, Number(room.columnSpan) || 1),
        key: `${row.time}-${room.room}-${room.activity}`,
        room: room.room,
        rowStart,
        rowSpan,
        time: row.time,
        type: room.type || roomScheduleEventType(room.activity)
      };
    });
  });
}

function parseScheduleRange(value) {
  const normalized = String(value).replace(/[–—]/g, "-").replace(/\./g, ":");
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, startHour, startMinute, endHour, endMinute] = match.map(Number);
  return {
    start: (startHour * 60) + startMinute,
    end: (endHour * 60) + endMinute
  };
}

function formatScheduleTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function roomScheduleEventType(activity) {
  const text = activity.toLowerCase();
  if (/iedereen|aanwezig/.test(text)) return "general";
  if (/extern|wijk|kapel|kamp|stadspark|kloostertuin|lokaal/.test(text)) return "outing";
  if (/lasergam|feest|race|tik|trefbal|knutsel/.test(text)) return "activity";
  if (/kleuters/.test(text)) return "kids";
  if (/pupillen/.test(text)) return "pupils";
  if (/jongeren|ouderen/.test(text)) return "older";
  return "default";
}

function scheduleFor(category, dayIndex) {
  return schedulePrograms[category]?.[dayIndex] || [];
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHTML(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addKidToGroup(groupId, kidName) {
  const group = state.groups.find((item) => item.id === groupId);
  const name = kidName.trim().replace(/\s+/g, " ");
  if (!group || !name) return false;

  if (group.kids.some((kid) => kid.toLowerCase() === name.toLowerCase())) {
    showToast("Dit kind staat al in deze groep");
    return false;
  }

  group.kids.push(name);
  state.attendance[state.activeDay] ||= {};
  state.attendance[state.activeDay][group.id] ||= {};
  state.attendance[state.activeDay][group.id][name] = "missing";
  return true;
}

function removeKidFromGroup(groupId, kidName) {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return;

  group.kids = group.kids.filter((name) => name !== kidName);
  Object.values(state.attendance).forEach((day) => {
    delete day[groupId]?.[kidName];
  });
}

function ensureGroup(name) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName) return null;

  let group = state.groups.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());
  if (group) return group;

  group = {
    id: makeId(cleanName, state.groups.map((item) => item.id)),
    name: cleanName,
    leaderIds: [],
    kids: []
  };
  state.groups.push(group);
  return group;
}

function addKidToGroupSilently(group, kidName) {
  const name = kidName.trim().replace(/\s+/g, " ");
  if (!group || !name) return false;
  if (group.kids.some((kid) => kid.toLowerCase() === name.toLowerCase())) return false;

  group.kids.push(name);
  state.days.forEach((day) => {
    state.attendance[day] ||= {};
    state.attendance[day][group.id] ||= {};
    state.attendance[day][group.id][name] = "missing";
  });
  return true;
}

function readCsvFile(input) {
  const file = input.files?.[0];
  if (!file) {
    showToast("Kies eerst een CSV-bestand");
    return Promise.resolve("");
  }

  return file.text();
}

function parseCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];

  const firstLine = cleanText.split(/\r?\n/).find((line) => line.trim()) || "";
  const delimiters = [",", ";", "\t"];
  const delimiter = delimiters
    .map((item) => ({ item, count: splitCsvLine(firstLine, item).length }))
    .sort((a, b) => b.count - a.count)[0].item;

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < cleanText.length; index += 1) {
    const char = cleanText[index];
    const next = cleanText[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift()?.map(normalizeCsvHeader) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    if (char === delimiter && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }

  cells.push(cell);
  return cells;
}

function normalizeCsvHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function csvValue(row, names) {
  return names.map(normalizeCsvHeader).map((name) => row[name]).find(Boolean) || "";
}

function roleFromCsv(value) {
  const role = value.toLowerCase().trim();
  if (["bestuurslid", "bestuur", "manager", "admin"].includes(role)) return "manager";
  return "leader";
}

function renderView() {
  if (!state.setupModuleEnabled && state.activeView === "setupView") {
    state.activeView = "homeView";
  }

  if (!isManager() && state.activeView === "kidsView") {
    state.activeView = "homeView";
  }

  views.forEach((view) => view.classList.toggle("hidden", view.id !== state.activeView));
  attendanceChrome.forEach((element) => {
    element.classList.toggle("hidden", state.activeView !== "todayView");
  });
  navButtons.forEach((button) => {
    const managerOnly = button.hasAttribute("data-manager-only");
    button.classList.toggle("hidden", managerOnly && !isManager());
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  saveDock.classList.toggle("hidden", state.activeView !== "todayView");
  renderManagementLock();
  renderIdentity();
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isManager());
  });
}

function renderAll() {
  applyTheme();
  renderSelectors();
  renderSummary();
  renderChildList();
  renderGroups();
  renderManageList();
  renderSaveStatus();
  renderManagement();
  renderFeedback();
  renderImportantInfo();
  renderGeneralAgreements();
  renderBoardProfiles();
  renderSetupModule();
  renderSetupManagement();
  renderSchedule();
  renderInstructions();
  renderPublicInstructionLibrary();
  renderRoomSchedule();
  renderView();
  persist();
}

function setAttendance(kid, status) {
  if (activeAttendance()[kid] === status) return;
  activeAttendance()[kid] = status;
  delete state.savedAt[savedKey()];
  renderAll();
}

function openView(viewId) {
  if (viewId === "setupView" && !state.setupModuleEnabled) {
    showToast("Opbouwmodule staat uit");
    viewId = "homeView";
  }

  if (viewId === "kidsView" && !isManager()) {
    showToast("Alleen voor bestuursleden");
    viewId = "homeView";
  }

  state.activeView = viewId;

  if (viewId === "managementView" && !managementUnlocked) {
    managerPassword.value = "";
  }

  renderAll();
}

function renderManagementLock() {
  const isManagement = state.activeView === "managementView";
  managementLock.classList.toggle("hidden", !isManagement || managementUnlocked);
  managementWorkspace.classList.toggle("hidden", !isManagement || !managementUnlocked);
}

function renderIdentity() {
  const hasUser = Boolean(state.currentUser);
  const hasManagers = state.managers.length > 0;
  const lastUser = loadLastUser();
  const query = identitySearch.value.trim().toLowerCase();
  const users = allLoginUsers();
  const filteredUsers = users.filter((person) => person.name.toLowerCase().includes(query));
  const groupedUsers = [
    { label: "Bestuursleden", people: filteredUsers.filter((person) => person.role === "manager") },
    { label: "Groepsleiders", people: filteredUsers.filter((person) => person.role === "leader") }
  ];

  identityScreen.classList.toggle("hidden", hasUser);
  identityForm.classList.toggle("hidden", Boolean(pendingUser) || !hasManagers);
  bootstrapManagerForm.classList.toggle("hidden", Boolean(pendingUser) || hasManagers);
  pinForm.classList.toggle("hidden", !pendingUser);
  recentUserCard.classList.toggle("hidden", Boolean(pendingUser) || !hasManagers || !lastUser);
  currentUserLabel.textContent = hasUser
    ? `${currentUserName()} · ${state.currentUser.role === "manager" ? "Bestuurslid" : "Groepsleider"}`
    : "Kies gebruiker";

  if (lastUser) {
    recentUserName.textContent = `${userLabel(lastUser)} · ${lastUser.role === "manager" ? "Bestuurslid" : "Groepsleider"}`;
    recentUserButton.dataset.role = lastUser.role;
    recentUserButton.dataset.id = lastUser.id;
  }

  identityResults.innerHTML = groupedUsers
    .filter((group) => group.people.length)
    .map((group) => `
      <section class="identity-result-group">
        <h3>${escapeHTML(group.label)}</h3>
        <div>
          ${group.people.map((person) => `
            <button type="button" data-login-user="${person.role}:${person.id}">
              <strong>${escapeHTML(person.name)}</strong>
              <span>${escapeHTML(person.detail)}</span>
            </button>
          `).join("")}
        </div>
      </section>
    `)
    .join("");

  if (!filteredUsers.length) {
    identityResults.innerHTML = `<p class="identity-empty">Geen gebruiker gevonden.</p>`;
  }

  if (pendingUser) {
    const mode = hasPin(pendingUser) ? "unlock" : "create";
    pinLabel.textContent = mode === "create" ? "Pincode aanmaken" : `Voer pincode in voor ${currentPendingUserName()}`;
    pinSubmitButton.textContent = mode === "create" ? "Pincode aanmaken" : "Ontgrendelen";
    pinConfirmInput.classList.toggle("hidden", mode !== "create");
  }
}

function assignedGroupText(leaderId) {
  const groups = state.groups.filter((group) => group.leaderIds.includes(leaderId));
  if (!groups.length) return "Geen groepen gekoppeld";
  return groups.map((group) => group.name).join(", ");
}

function chooseUser(role, id) {
  state.currentUser = { role, id };
  rememberLastUser(state.currentUser);
  managementUnlocked = true;
  activeManagementPanel = "";

  const visibleGroups = visibleGroupsFor();
  state.activeGroupId = visibleGroups[0]?.id || state.groups[0].id;
  state.activeView = "homeView";
  searchInput.value = "";
  renderAll();
}

function currentPendingUserName() {
  if (!pendingUser) return "";
  const list = pendingUser.role === "manager" ? state.managers : state.leaders;
  return list.find((person) => person.id === pendingUser.id)?.name || "gebruiker";
}

function allLoginUsers() {
  return [
    ...state.managers.map((person) => ({ ...person, role: "manager", detail: "Bestuurslid" })),
    ...state.leaders.map((person) => ({ ...person, role: "leader", detail: "Groepsleider" }))
  ];
}

function userLabel(user) {
  if (!user) return "";
  const list = user.role === "manager" ? state.managers : state.leaders;
  return list.find((person) => person.id === user.id)?.name || "";
}

function loadLastUser() {
  try {
    const user = JSON.parse(localStorage.getItem(lastUserKey) || "null");
    return userExists(state, user) ? user : null;
  } catch {
    return null;
  }
}

function rememberLastUser(user) {
  if (!user) return;
  localStorage.setItem(lastUserKey, JSON.stringify({ role: user.role, id: user.id }));
}

function startPinForUser(user) {
  if (!userExists(state, user)) return;
  pendingUser = { role: user.role, id: user.id };
  pinInput.value = "";
  pinConfirmInput.value = "";
  clearPinError();
  installHelpPanel.classList.add("hidden");
  renderAll();
  pinInput.focus();
}

function toggleInstallHelp(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : installHelpPanel.classList.contains("hidden");
  installHelpPanel.classList.toggle("hidden", !shouldOpen);
  installHelpButton.setAttribute("aria-expanded", String(shouldOpen));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function showSaveCelebration() {
  document.body.classList.add("save-celebrating");
  saveCelebration.classList.remove("show");
  saveCelebration.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    saveCelebration.classList.add("show");
  });

  clearTimeout(showSaveCelebration.timer);
  showSaveCelebration.timer = setTimeout(() => {
    saveCelebration.classList.remove("show");
    saveCelebration.setAttribute("aria-hidden", "true");
    document.body.classList.remove("save-celebrating");
  }, 1450);
}

function showRoomScheduleDetail(eventCard) {
  let popover = document.querySelector("#roomScheduleDetailPopover");
  if (!popover) {
    popover = document.createElement("div");
    popover.id = "roomScheduleDetailPopover";
    popover.className = "room-detail-popover";
    popover.setAttribute("role", "status");
    document.body.appendChild(popover);
  }

  if (popover.classList.contains("show") && popover.dataset.detailKey === eventCard.dataset.detailKey) {
    hideRoomScheduleDetail();
    return;
  }

  popover.dataset.detailKey = eventCard.dataset.detailKey;
  popover.innerHTML = `
    <span>${escapeHTML(eventCard.dataset.time)}</span>
    <strong>${escapeHTML(eventCard.dataset.activity)}</strong>
    <small>${escapeHTML(eventCard.dataset.room)}</small>
  `;

  const cardRect = eventCard.getBoundingClientRect();
  popover.classList.add("show");
  popover.style.left = "0px";
  popover.style.top = "0px";

  const popoverRect = popover.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - popoverRect.width - 12,
    Math.max(12, cardRect.left + (cardRect.width / 2) - (popoverRect.width / 2))
  );
  const preferredTop = cardRect.top - popoverRect.height - 10;
  const top = preferredTop > 12 ? preferredTop : Math.min(window.innerHeight - popoverRect.height - 12, cardRect.bottom + 10);

  popover.style.left = `${left}px`;
  popover.style.top = `${Math.max(12, top)}px`;

  clearTimeout(showRoomScheduleDetail.timer);
  showRoomScheduleDetail.timer = setTimeout(hideRoomScheduleDetail, 3600);
}

function hideRoomScheduleDetail() {
  const popover = document.querySelector("#roomScheduleDetailPopover");
  clearTimeout(showRoomScheduleDetail.timer);
  if (popover) {
    popover.classList.remove("show");
    delete popover.dataset.detailKey;
  }
}

groupSelect.addEventListener("change", () => {
  if (!groupSelect.value) return;
  state.activeGroupId = groupSelect.value;
  searchInput.value = "";
  renderAll();
});

daySelect.addEventListener("change", () => {
  state.activeDay = daySelect.value;
  searchInput.value = "";
  renderAll();
});

searchInput.addEventListener("input", renderChildList);

childList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-kid]");
  if (!button) return;
  setAttendance(button.dataset.kid, button.dataset.status);
});

markAllButton.addEventListener("click", () => {
  const attendance = activeAttendance();
  const hadMissing = activeGroup().kids.some((kid) => attendance[kid] !== "present");
  if (!hadMissing) return;

  activeGroup().kids.forEach((kid) => {
    attendance[kid] = "present";
  });
  delete state.savedAt[savedKey()];
  renderAll();
});

saveButton.addEventListener("click", () => {
  if (!hasUnsavedCheck()) return;

  state.savedAt[savedKey()] = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
  renderAll();
  showSaveCelebration();
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.view);
  });
});

homeView.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-home-target]");
  if (!tile) return;
  openView(tile.dataset.homeTarget);
});

openInstructionLibraryButton.addEventListener("click", () => {
  publicInstructionSearch.value = "";
  publicInstructionCategory = "all";
  openView("instructionLibraryView");
  requestAnimationFrame(() => publicInstructionSearch.focus());
});

closeInstructionLibraryButton.addEventListener("click", () => openView("scheduleView"));

publicInstructionSearch.addEventListener("input", renderPublicInstructionLibrary);

publicInstructionFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-public-instruction-category]");
  if (!button) return;
  publicInstructionCategory = button.dataset.publicInstructionCategory;
  renderPublicInstructionLibrary();
});

publicInstructionResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-public-instruction-id]");
  if (!button) return;
  const instruction = state.gameInstructions.find((item) => item.id === button.dataset.publicInstructionId);
  if (instruction) openInstructionViewer([instruction], button);
});

scheduleCategorySwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-schedule-category]");
  if (!button) return;
  scheduleCategory = button.dataset.scheduleCategory;
  renderAll();
});

toverlandHub.addEventListener("click", (event) => {
  const button = event.target.closest("[data-toverland-resource]");
  if (!button) return;
  if (button.dataset.toverlandResource === "roster") {
    openToverlandRoster(button);
    return;
  }
  openToverlandResource(button.dataset.toverlandResource, button);
});

closeToverlandRosterButton.addEventListener("click", closeToverlandRoster);
toverlandRosterModal.addEventListener("click", (event) => {
  if (event.target === toverlandRosterModal) {
    closeToverlandRoster();
    return;
  }
  const modeButton = event.target.closest("[data-toverland-roster-mode]");
  if (!modeButton) return;
  toverlandRosterMode = modeButton.dataset.toverlandRosterMode;
  renderToverlandRoster();
});

scheduleBoard.addEventListener("click", (event) => {
  const cleaningRosterButton = event.target.closest("[data-open-cleaning-roster]");
  if (cleaningRosterButton) {
    openCleaningRoster(cleaningRosterButton);
    return;
  }

  const toverlandResourceButton = event.target.closest("[data-toverland-resource]");
  if (toverlandResourceButton) {
    if (toverlandResourceButton.dataset.toverlandResource === "roster") {
      openToverlandRoster(toverlandResourceButton);
    } else {
      openToverlandResource(toverlandResourceButton.dataset.toverlandResource, toverlandResourceButton);
    }
    return;
  }

  const ranjaInfoButton = event.target.closest("[data-open-ranja-info]");
  if (ranjaInfoButton) {
    openRanjaInfo(ranjaInfoButton);
    return;
  }

  const instructionButton = event.target.closest("[data-open-activity-instructions]");
  if (instructionButton) {
    openInstructionViewer(instructionsForActivity(instructionButton.dataset.openActivityInstructions), instructionButton);
    return;
  }

  const toggle = event.target.closest("[data-rotation-toggle]");
  if (toggle) {
    const rotationState = scheduleRotationUI.get(toggle.dataset.rotationToggle);
    if (!rotationState) return;
    rotationState.expanded = !rotationState.expanded;
    renderSchedule();
    return;
  }

  const roundButton = event.target.closest("[data-rotation-round]");
  if (!roundButton) return;
  const rotationState = scheduleRotationUI.get(roundButton.dataset.rotationKey);
  if (!rotationState) return;
  rotationState.round = roundButton.dataset.rotationRound;
  renderSchedule();
});

scheduleBoard.addEventListener("change", (event) => {
  const groupSelect = event.target.closest("[data-rotation-group]");
  if (!groupSelect) return;
  const rotationState = scheduleRotationUI.get(groupSelect.dataset.rotationGroup);
  if (!rotationState) return;
  rotationState.group = groupSelect.value;
  renderSchedule();
});

instructionSearch.addEventListener("input", () => {
  instructionActivityFilter = "";
  renderInstructions();
});

instructionCategoryFilter.addEventListener("change", () => {
  instructionActivityFilter = "";
  renderInstructions();
});

instructionList.addEventListener("click", (event) => {
  const clearFilterButton = event.target.closest("[data-clear-instruction-activity-filter]");
  if (clearFilterButton) {
    instructionActivityFilter = "";
    renderInstructions();
    return;
  }

  const item = event.target.closest("[data-instruction-id]");
  if (!item) return;
  activeInstructionId = item.dataset.instructionId;
  renderInstructions();
  if (window.matchMedia("(max-width: 959px)").matches) {
    instructionDetail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

instructionDetail.addEventListener("change", (event) => {
  const categorySelect = event.target.closest("[data-instruction-link-category]");
  if (categorySelect) {
    instructionLinkCategory = categorySelect.value;
    renderInstructions();
    return;
  }

  const daySelectElement = event.target.closest("[data-instruction-link-day]");
  if (daySelectElement) {
    instructionLinkDayIndex = Number(daySelectElement.value);
    renderInstructions();
  }
});

instructionDetail.addEventListener("submit", (event) => {
  const linkForm = event.target.closest("#instructionLinkForm");
  if (!linkForm) return;
  event.preventDefault();
  if (!isManager()) return;
  const instruction = state.gameInstructions.find((item) => item.id === activeInstructionId);
  const activityId = linkForm.querySelector("[data-instruction-link-activity]")?.value;
  if (!instruction || !activityId || instruction.activityIds.includes(activityId)) return;
  instruction.activityIds.push(activityId);
  instruction.updatedAt = new Date().toISOString();
  renderAll();
  showToast("Activiteit gekoppeld");
});

instructionDetail.addEventListener("click", async (event) => {
  const imageButton = event.target.closest("[data-view-instruction-image]");
  if (imageButton) {
    const instruction = state.gameInstructions.find((item) => item.id === activeInstructionId);
    const attachment = instruction?.attachments.find((item) => item.id === imageButton.dataset.viewInstructionImage);
    if (attachment) openInstructionImageViewer(attachment, imageButton);
    return;
  }

  const editButton = event.target.closest("[data-edit-instruction]");
  if (editButton) {
    openInstructionEditor(editButton.dataset.editInstruction);
    return;
  }

  const unlinkButton = event.target.closest("[data-unlink-instruction-activity]");
  if (unlinkButton && isManager()) {
    const instruction = state.gameInstructions.find((item) => item.id === activeInstructionId);
    if (!instruction) return;
    instruction.activityIds = instruction.activityIds.filter((activityId) => activityId !== unlinkButton.dataset.unlinkInstructionActivity);
    instruction.updatedAt = new Date().toISOString();
    renderAll();
    showToast("Koppeling verwijderd");
    return;
  }

  const removeFileButton = event.target.closest("[data-remove-instruction-file]");
  if (removeFileButton && isManager()) {
    const instruction = state.gameInstructions.find((item) => item.id === activeInstructionId);
    const attachment = instruction?.attachments.find((item) => item.id === removeFileButton.dataset.removeInstructionFile);
    if (!instruction || !attachment) return;
    if (!window.confirm(`Bestand '${attachment.name}' verwijderen?`)) return;
    if (await removeInstructionFile(instruction, attachment)) {
      instruction.updatedAt = new Date().toISOString();
      renderAll();
      showToast("Bestand verwijderd");
    }
    return;
  }

  const deleteButton = event.target.closest("[data-delete-instruction]");
  if (deleteButton && isManager()) {
    const instruction = state.gameInstructions.find((item) => item.id === deleteButton.dataset.deleteInstruction);
    if (!instruction || !window.confirm(`Spelinstructie '${instruction.title}' definitief verwijderen?`)) return;
    if (instruction.attachments.some((attachment) => attachment.path) && databaseReady && databaseClient) {
      const paths = instruction.attachments.map((attachment) => attachment.path).filter(Boolean);
      const { error } = await databaseClient.storage.from(instructionBucket).remove(paths);
      if (error) {
        showToast("Bestanden konden niet worden verwijderd");
        return;
      }
    }
    state.gameInstructions = state.gameInstructions.filter((item) => item.id !== instruction.id);
    activeInstructionId = "";
    renderAll();
    showToast("Spelinstructie verwijderd");
  }
});

addInstructionButton.addEventListener("click", () => openInstructionEditor());
cancelInstructionButton.addEventListener("click", closeInstructionEditor);
cancelInstructionFooterButton.addEventListener("click", closeInstructionEditor);

instructionModal.addEventListener("click", (event) => {
  if (event.target === instructionModal) closeInstructionEditor();
});

closeInstructionImageViewerButton.addEventListener("click", closeInstructionImageViewer);
boardGuideButton.addEventListener("click", openBoardGuide);
closeBoardGuideButton.addEventListener("click", closeBoardGuide);
previousInstructionViewerItemButton.addEventListener("click", () => moveInstructionViewer(-1));
nextInstructionViewerItemButton.addEventListener("click", () => moveInstructionViewer(1));
instructionImageViewer.addEventListener("click", (event) => {
  if (!event.target.closest("img, iframe, .instruction-viewer-text, figcaption, button")) closeInstructionImageViewer();
});

document.addEventListener("keydown", (event) => {
  if (!toverlandRosterModal.classList.contains("hidden") && event.key === "Escape") {
    closeToverlandRoster();
    return;
  }
  if (!boardGuideViewer.classList.contains("hidden") && event.key === "Escape") {
    closeBoardGuide();
    return;
  }
  if (instructionImageViewer.classList.contains("hidden")) return;
  if (event.key === "Escape") closeInstructionImageViewer();
  if (event.key === "ArrowLeft") moveInstructionViewer(-1);
  if (event.key === "ArrowRight") moveInstructionViewer(1);
});

instructionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isManager()) return;

  const title = instructionTitle.value.trim();
  if (!title) return;
  let instruction = state.gameInstructions.find((item) => item.id === instructionId.value);
  if (!instruction) {
    const id = `instructie-${makeId(title, state.gameInstructions.map((item) => item.id.replace(/^instructie-/, "")))}`;
    instruction = {
      id,
      title,
      category: instructionCategory.value,
      summary: "",
      body: "",
      materials: "",
      safety: "",
      activityIds: instructionActivityFilter ? [instructionActivityFilter] : [],
      attachments: [],
      createdBy: currentUserName(),
      updatedAt: ""
    };
    state.gameInstructions.push(instruction);
  }

  instruction.title = title;
  instruction.category = instructionCategory.value;
  instruction.summary = instructionSummary.value.trim();
  instruction.body = instructionBody.value.trim();
  instruction.materials = instructionMaterials.value.trim();
  instruction.safety = instructionSafety.value.trim();
  instruction.updatedAt = new Date().toISOString();
  activeInstructionId = instruction.id;

  const files = Array.from(instructionFiles.files || []);
  const errors = [];
  saveInstructionButton.disabled = true;
  for (const [index, file] of files.entries()) {
    instructionUploadStatus.textContent = `Bestand ${index + 1} van ${files.length} uploaden...`;
    try {
      instruction.attachments.push(await uploadInstructionFile(instruction, file));
    } catch (error) {
      errors.push(error.message);
    }
  }
  saveInstructionButton.disabled = false;
  instructionFiles.value = "";

  if (errors.length) {
    instructionUploadStatus.textContent = `Tekst opgeslagen. ${errors.join(" ")}`;
    renderAll();
    return;
  }

  closeInstructionEditor();
  renderAll();
  showToast("Spelinstructie opgeslagen");
});

roomScheduleSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-room-schedule-day]");
  if (!button) return;
  roomScheduleDayIndex = Number(button.dataset.roomScheduleDay);
  hideRoomScheduleDetail();
  renderAll();
  roomScheduleBoard.scrollLeft = 0;
});

roomScheduleBoard.addEventListener("click", (event) => {
  const eventCard = event.target.closest("[data-room-detail]");
  if (!eventCard) return;
  showRoomScheduleDetail(eventCard);
});

roomScheduleBoard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const eventCard = event.target.closest("[data-room-detail]");
  if (!eventCard) return;
  event.preventDefault();
  showRoomScheduleDetail(eventCard);
});

roomScheduleBoard.addEventListener("pointerdown", (event) => {
  const eventCard = event.target.closest("[data-room-detail]");
  if (!eventCard) return;
  clearTimeout(roomScheduleBoard.holdTimer);
  roomScheduleBoard.holdTimer = setTimeout(() => showRoomScheduleDetail(eventCard), 520);
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  roomScheduleBoard.addEventListener(eventName, () => clearTimeout(roomScheduleBoard.holdTimer));
});

prevScheduleDay.addEventListener("click", () => {
  if (scheduleDayIndex === 0) return;
  scheduleDayIndex -= 1;
  renderAll();
});

nextScheduleDay.addEventListener("click", () => {
  if (scheduleDayIndex === scheduleDays.length - 1) return;
  scheduleDayIndex += 1;
  renderAll();
});

scheduleBoard.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-schedule-interactive]")) {
    scheduleSwipeStartX = null;
    return;
  }
  scheduleSwipeStartX = event.clientX;
});

scheduleBoard.addEventListener("pointerup", (event) => {
  if (scheduleSwipeStartX === null || event.target.closest("[data-schedule-interactive]")) {
    scheduleSwipeStartX = null;
    return;
  }
  const deltaX = event.clientX - scheduleSwipeStartX;
  scheduleSwipeStartX = null;
  if (Math.abs(deltaX) < 60) return;

  if (deltaX < 0 && scheduleDayIndex < scheduleDays.length - 1) {
    scheduleDayIndex += 1;
  }

  if (deltaX > 0 && scheduleDayIndex > 0) {
    scheduleDayIndex -= 1;
  }

  renderAll();
});

identityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const users = allLoginUsers().filter((person) => person.name.toLowerCase().includes(identitySearch.value.trim().toLowerCase()));
  if (users.length === 1) {
    startPinForUser(users[0]);
  }
});

identitySearch.addEventListener("input", renderIdentity);

identityResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-login-user]");
  if (!button) return;
  const [role, id] = button.dataset.loginUser.split(":");
  startPinForUser({ role, id });
});

recentUserButton.addEventListener("click", () => {
  startPinForUser({ role: recentUserButton.dataset.role, id: recentUserButton.dataset.id });
});

installHelpButton.addEventListener("click", () => {
  toggleInstallHelp();
});

installHelpClose.addEventListener("click", () => {
  toggleInstallHelp(false);
});

bootstrapManagerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = bootstrapManagerName.value.trim().replace(/\s+/g, " ");
  const pin = bootstrapManagerPin.value.trim();
  const pinConfirm = bootstrapManagerPinConfirm.value.trim();

  if (!name) {
    showBootstrapManagerError("Vul de naam van het bestuurslid in.");
    return;
  }

  if (!isValidPin(pin)) {
    showBootstrapManagerError("Gebruik een pincode van 6-10 cijfers.");
    return;
  }

  if (pin !== pinConfirm) {
    showBootstrapManagerError("De twee pincodes zijn niet hetzelfde.");
    return;
  }

  const manager = { id: makeId(name, state.managers.map((person) => person.id)), name };
  state.managers.push(manager);
  state.userPins[`manager:${manager.id}`] = pin;
  bootstrapManagerName.value = "";
  bootstrapManagerPin.value = "";
  bootstrapManagerPinConfirm.value = "";
  clearBootstrapManagerError();
  chooseUser("manager", manager.id);
  showToast("Bestuurslid aangemaakt");
});

[bootstrapManagerName, bootstrapManagerPin, bootstrapManagerPinConfirm].forEach((input) => {
  input.addEventListener("input", clearBootstrapManagerError);
});

pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!pendingUser) return;

  const pin = pinInput.value.trim();
  if (!isValidPin(pin)) {
    showPinError("Gebruik een pincode van 6-10 cijfers.");
    showToast("Gebruik een pincode van 6-10 cijfers");
    return;
  }

  if (!hasPin(pendingUser)) {
    if (pin !== pinConfirmInput.value.trim()) {
      showPinError("De twee pincodes zijn niet hetzelfde.");
      showToast("Pincodes komen niet overeen");
      return;
    }

    state.userPins[userKey(pendingUser)] = pin;
    chooseUser(pendingUser.role, pendingUser.id);
    pendingUser = null;
    pinInput.value = "";
    pinConfirmInput.value = "";
    clearPinError();
    showToast("Pincode aangemaakt");
    return;
  }

  if (state.userPins[userKey(pendingUser)] !== pin) {
    pinInput.value = "";
    showPinError("Verkeerde pincode. Probeer het opnieuw.");
    showToast("Verkeerde pincode");
    return;
  }

  chooseUser(pendingUser.role, pendingUser.id);
  pendingUser = null;
  pinInput.value = "";
  clearPinError();
  showToast("Ontgrendeld");
});

pinBackButton.addEventListener("click", () => {
  pendingUser = null;
  pinInput.value = "";
  pinConfirmInput.value = "";
  clearPinError();
  renderAll();
});

switchUserButton.addEventListener("click", () => {
  state.currentUser = null;
  managementUnlocked = false;
  activeManagementPanel = "";
  pendingUser = null;
  clearPinError();
  renderAll();
});

groupCards.addEventListener("click", (event) => {
  const card = event.target.closest("[data-group]");
  if (!card) return;
  state.activeGroupId = card.dataset.group;
  state.activeView = "todayView";
  renderAll();
});

addKidForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (addKidToGroup(state.activeGroupId, newKidName.value)) {
    newKidName.value = "";
    renderAll();
  }
});

manageList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  removeKidFromGroup(button.dataset.removeFromGroup || state.activeGroupId, button.dataset.remove);
  renderAll();
});

createGroupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newGroupName.value.trim().replace(/\s+/g, " ");
  if (!name) return;

  const id = makeId(name, state.groups.map((group) => group.id));
  state.groups.push({ id, name, leaderIds: [], kids: [] });
  state.activeGroupId = id;
  newGroupName.value = "";
  openView("managementView");
  renderAll();
  showToast("Groep aangemaakt");
});

addLeaderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newLeaderName.value.trim().replace(/\s+/g, " ");
  if (!name) return;

  if (state.leaders.some((leader) => leader.name.toLowerCase() === name.toLowerCase())) {
    showToast("Deze leider bestaat al");
    return;
  }

  state.leaders.push({ id: makeId(name, state.leaders.map((leader) => leader.id)), name });
  newLeaderName.value = "";
  renderAll();
});

addManagerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newManagerName.value.trim().replace(/\s+/g, " ");
  if (!name) return;

  if (state.managers.some((manager) => manager.name.toLowerCase() === name.toLowerCase())) {
    showToast("Dit bestuurslid bestaat al");
    return;
  }

  state.managers.push({ id: makeId(name, state.managers.map((manager) => manager.id)), name });
  newManagerName.value = "";
  renderAll();
});

boardProfileEditor.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-board-profile]");
  if (!form) return;
  event.preventDefault();
  if (!isManager()) return;

  const profiles = form.dataset.boardProfileKind === "support" ? state.supportProfiles : state.managers;
  const profile = profiles.find((person) => person.id === form.dataset.boardProfile);
  if (!profile) return;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const photoFile = form.elements.photo.files[0];
    if (photoFile) profile.photo = await boardPhotoToDataUrl(photoFile);
    profile.boardRole = form.elements.boardRole.value.trim().replace(/\s+/g, " ") || (form.dataset.boardProfileKind === "support" ? "Ondersteuning" : "Bestuurslid");
    profile.intro = form.elements.intro.value.trim().replace(/\s+/g, " ");
    profile.phone = form.elements.phone.value.trim();
    renderAll();
    showToast(form.dataset.boardProfileKind === "support" ? "Ondersteuningsprofiel opgeslagen" : "Bestuursprofiel opgeslagen");
  } catch (error) {
    submitButton.disabled = false;
    showToast(error.message || "Profiel kon niet worden opgeslagen");
  }
});

boardProfileEditor.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-board-photo]");
  if (!button || !isManager()) return;
  const profiles = button.dataset.boardProfileKind === "support" ? state.supportProfiles : state.managers;
  const profile = profiles.find((person) => person.id === button.dataset.removeBoardPhoto);
  if (!profile) return;
  profile.photo = "";
  renderAll();
  showToast("Profielfoto verwijderd");
});

bulkKidsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isManager()) return;

  const text = await readCsvFile(bulkKidsCsv);
  if (!text) return;

  const rows = parseCsv(text);
  let added = 0;
  let skipped = 0;

  rows.forEach((row) => {
    const kidName = csvValue(row, ["naam", "kind", "kindnaam", "name", "child"]);
    const groupName = csvValue(row, ["groep", "groepsnaam", "group"]);
    const group = ensureGroup(groupName);

    if (addKidToGroupSilently(group, kidName)) {
      added += 1;
    } else {
      skipped += 1;
    }
  });

  bulkKidsCsv.value = "";
  bulkImportStatus.textContent = `${added} kinderen geïmporteerd, ${skipped} overgeslagen.`;
  renderAll();
  showToast("Kinderen geïmporteerd");
});

bulkUsersForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isManager()) return;

  const text = await readCsvFile(bulkUsersCsv);
  if (!text) return;

  const rows = parseCsv(text);
  let addedLeaders = 0;
  let addedBoard = 0;
  let skipped = 0;

  rows.forEach((row) => {
    const name = csvValue(row, ["naam", "gebruiker", "user", "name"]).trim().replace(/\s+/g, " ");
    if (!name) {
      skipped += 1;
      return;
    }

    const role = roleFromCsv(csvValue(row, ["rol", "type", "functie", "role"]));
    if (role === "manager") {
      if (state.managers.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
        skipped += 1;
        return;
      }

      state.managers.push({
        id: makeId(name, state.managers.map((person) => person.id)),
        name,
        boardRole: csvValue(row, ["functie", "bestuursfunctie", "position"]) || "Bestuurslid",
        intro: csvValue(row, ["intro", "introductie", "omschrijving"]),
        phone: csvValue(row, ["telefoon", "mobiel", "whatsapp", "phone"]),
        photo: csvValue(row, ["foto", "photo", "afbeelding"])
      });
      addedBoard += 1;
      return;
    }

    let leader = state.leaders.find((person) => person.name.toLowerCase() === name.toLowerCase());
    if (!leader) {
      leader = { id: makeId(name, state.leaders.map((person) => person.id)), name };
      state.leaders.push(leader);
      addedLeaders += 1;
    } else {
      skipped += 1;
    }

    csvValue(row, ["groepen", "groep", "groups", "group"])
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((groupName) => {
        const group = ensureGroup(groupName);
        if (group && !group.leaderIds.includes(leader.id)) {
          group.leaderIds.push(leader.id);
        }
      });
  });

  bulkUsersCsv.value = "";
  bulkImportStatus.textContent = `${addedLeaders} groepsleiders en ${addedBoard} bestuursleden geïmporteerd, ${skipped} overgeslagen.`;
  renderAll();
  showToast("Gebruikers geïmporteerd");
});

changeOwnPinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = ownPinInput.value.trim();
  if (!state.currentUser) return;

  if (!isValidPin(pin)) {
    showToast("Gebruik een pincode van 6-10 cijfers");
    return;
  }

  state.userPins[userKey(state.currentUser)] = pin;
  ownPinInput.value = "";
  renderAll();
  showToast("Pincode bijgewerkt");
});

resetPinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isManager()) return;

  const pin = resetPinInput.value.trim();
  if (!isValidPin(pin)) {
    showToast("Gebruik een pincode van 6-10 cijfers");
    return;
  }

  state.userPins[resetPinUser.value] = pin;
  resetPinInput.value = "";
  renderAll();
  showToast("Pincode gereset");
});

resetAllPinsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isManager() || !state.currentUser) return;

  if (resetAllPinsConfirm.value !== "RESET") {
    showToast("Typ RESET om te bevestigen");
    return;
  }

  const ownKey = userKey(state.currentUser);
  const userKeys = [
    ...state.managers.map((person) => userKey({ role: "manager", id: person.id })),
    ...state.leaders.map((person) => userKey({ role: "leader", id: person.id }))
  ];
  let resetCount = 0;

  userKeys.forEach((key) => {
    if (key === ownKey || !state.userPins[key]) return;
    delete state.userPins[key];
    resetCount += 1;
  });

  resetAllPinsConfirm.value = "";
  renderAll();
  showToast(`${resetCount} toegangscodes gereset`);
});

themeToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-option]");
  if (!button) return;
  if (!state.currentUser) return;
  state.userThemes[userKey(state.currentUser)] = button.dataset.themeOption === "dark" ? "dark" : "light";
  renderAll();
  showToast(button.dataset.themeOption === "dark" ? "Donker thema ingesteld" : "Licht thema ingesteld");
});

setupModuleToggle.addEventListener("click", () => {
  if (!isManager()) return;
  state.setupModuleEnabled = !state.setupModuleEnabled;
  if (!state.setupModuleEnabled && state.activeView === "setupView") {
    state.activeView = "homeView";
  }
  renderAll();
  showToast(state.setupModuleEnabled ? "Opbouwmodule aangezet" : "Opbouwmodule uitgezet");
});

managementWorkspace.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-management-target]");
  if (tile) {
    activeManagementPanel = tile.dataset.managementTarget;
    if (activeManagementPanel === "instructions") {
      instructionActivityFilter = "";
      instructionSearch.value = "";
      instructionCategoryFilter.value = "all";
    }
    renderAll();
    return;
  }

  const backButton = event.target.closest("[data-management-back]");
  if (!backButton) return;
  activeManagementPanel = "";
  renderAll();
});

setupTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isManager()) return;

  const title = setupTaskTitle.value.trim().replace(/\s+/g, " ");
  const area = setupTaskArea.value.trim().replace(/\s+/g, " ") || "Algemeen";
  if (!title) {
    showToast("Vul een taak in");
    return;
  }

  state.setupTasks.push({
    id: `setup-${Date.now()}`,
    title,
    area,
    maxPeople: 1,
    assignees: [],
    done: false,
    checkedBy: "",
    checkedAt: ""
  });
  setupTaskTitle.value = "";
  setupTaskArea.value = "";
  renderAll();
  showToast("Opbouwtaak toegevoegd");
});

setupTaskList.addEventListener("click", (event) => {
  const claimButton = event.target.closest("[data-claim-setup]");
  const releaseButton = event.target.closest("[data-release-setup]");
  const checkButton = event.target.closest("[data-check-setup]");
  const reopenButton = event.target.closest("[data-reopen-setup]");
  const removeButton = event.target.closest("[data-remove-setup-task]");
  const decreaseButton = event.target.closest("[data-decrease-setup-capacity]");
  const increaseButton = event.target.closest("[data-increase-setup-capacity]");
  const button = claimButton || releaseButton || checkButton || reopenButton || removeButton || decreaseButton || increaseButton;
  if (!button || !state.currentUser) return;

  const taskId = button.dataset.claimSetup
    || button.dataset.releaseSetup
    || button.dataset.checkSetup
    || button.dataset.reopenSetup
    || button.dataset.removeSetupTask
    || button.dataset.decreaseSetupCapacity
    || button.dataset.increaseSetupCapacity;
  const task = state.setupTasks.find((item) => item.id === taskId);
  if (!task) return;

  if (removeButton || decreaseButton || increaseButton) {
    if (!isManager()) return;

    if (removeButton) {
      state.setupTasks = state.setupTasks.filter((item) => item.id !== removeButton.dataset.removeSetupTask);
      renderAll();
      showToast("Opbouwtaak verwijderd");
      return;
    }

    if (increaseButton) {
      task.maxPeople += 1;
      showToast("Aantal personen verhoogd");
    }

    if (decreaseButton) {
      if (task.maxPeople <= Math.max(1, task.assignees.length)) {
        showToast("Kan niet lager dan het aantal gekoppelde personen");
        return;
      }
      task.maxPeople -= 1;
      showToast("Aantal personen verlaagd");
    }

    renderAll();
    return;
  }

  if (claimButton && !task.done && task.assignees.length < task.maxPeople) {
    const currentKey = userKey(state.currentUser);
    if (!task.assignees.some((person) => person.userKey === currentKey)) {
      task.assignees.push({ userKey: currentKey, name: currentUserName() });
    }
    showToast("Taak opgepakt");
  }

  if (releaseButton && !task.done) {
    task.assignees = task.assignees.filter((person) => person.userKey !== userKey(state.currentUser));
    showToast("Taak vrijgegeven");
  }

  if (checkButton) {
    if (!isManager()) {
      showToast("Alleen bestuursleden kunnen afvinken");
      return;
    }
    task.done = true;
    task.checkedBy = currentUserName();
    task.checkedAt = new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
    showToast("Taak gecontroleerd");
  }

  if (reopenButton) {
    if (!isManager()) return;
    task.done = false;
    task.checkedBy = "";
    task.checkedAt = "";
    showToast("Taak heropend");
  }

  renderAll();
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = feedbackText.value.trim();
  const feedbackGroup = feedbackGroupForCurrentUser();
  if (!text) {
    showToast("Vul eerst een evaluatie in");
    return;
  }

  state.feedback.push({
    id: `feedback-${Date.now()}`,
    category: feedbackCategory.value,
    text,
    userKey: userKey(state.currentUser),
    userName: currentUserName(),
    role: isManager() ? "Bestuurslid" : "Groepsleider",
    groupId: feedbackGroup?.id || "",
    groupName: feedbackGroup?.name || "",
    reactions: {},
    createdAt: new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date())
  });

  feedbackText.value = "";
  feedbackCategory.value = "Algemeen";
  renderAll();
  showToast("Evaluatie verstuurd");
});

clearFeedbackButton.addEventListener("click", () => {
  if (!isManager()) return;
  clearFeedbackConfirm.classList.remove("hidden");
});

feedbackList.addEventListener("click", (event) => {
  const reactionButton = event.target.closest("[data-feedback-reaction]");
  if (reactionButton) {
    const entry = state.feedback.find((item) => item.id === reactionButton.dataset.feedbackId);
    if (!entry || !canReactToFeedback(entry)) return;

    entry.reactions ||= {};
    const currentUserKey = userKey(state.currentUser);
    const reaction = reactionButton.dataset.feedbackReaction;
    if (entry.reactions[currentUserKey] === reaction) {
      delete entry.reactions[currentUserKey];
    } else {
      entry.reactions[currentUserKey] = reaction;
    }

    renderAll();
    return;
  }

  const button = event.target.closest("[data-remove-feedback]");
  if (!button) return;
  if (!isManager()) {
    showToast("Alleen bestuursleden kunnen evaluaties verwijderen");
    return;
  }

  state.feedback = state.feedback.filter((entry) => entry.id !== button.dataset.removeFeedback);
  renderAll();
  showToast("Evaluatie verwijderd");
});

confirmClearFeedbackButton.addEventListener("click", () => {
  if (!isManager()) return;
  state.feedback = [];
  clearFeedbackConfirm.classList.add("hidden");
  renderAll();
  showToast("Evaluaties verwijderd");
});

cancelClearFeedbackButton.addEventListener("click", () => {
  clearFeedbackConfirm.classList.add("hidden");
});

importantInfoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isManager()) {
    showToast("Alleen bestuursleden kunnen info plaatsen");
    return;
  }

  const title = importantInfoTitle.value.trim().replace(/\s+/g, " ");
  const text = importantInfoText.value.trim();
  if (!title || !text) {
    showToast("Vul een titel en tekst in");
    return;
  }

  state.importantInfo.push({
    id: `info-${Date.now()}`,
    urgency: importantInfoUrgency.value,
    title,
    text,
    userName: currentUserName(),
    createdAt: new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date())
  });

  importantInfoUrgency.value = "low";
  importantInfoTitle.value = "";
  importantInfoText.value = "";
  renderAll();
  showToast("Info geplaatst");
});

importantInfoList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-info]");
  if (!button) return;
  if (!isManager()) {
    showToast("Alleen bestuursleden kunnen info verwijderen");
    return;
  }

  state.importantInfo = state.importantInfo.filter((entry) => entry.id !== button.dataset.removeInfo);
  renderAll();
  showToast("Info verwijderd");
});

agreementsList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-agreement]");
  if (toggleButton) {
    const agreementId = toggleButton.dataset.toggleAgreement;
    openAgreementId = openAgreementId === agreementId ? "" : agreementId;
    renderGeneralAgreements();
    requestAnimationFrame(() => {
      agreementsList.querySelector(`[data-toggle-agreement="${CSS.escape(agreementId)}"]`)?.focus({ preventScroll: true });
    });
    return;
  }

});

leadersList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-leader]");
  if (!button) return;
  const leaderId = button.dataset.removeLeader;

  state.leaders = state.leaders.filter((leader) => leader.id !== leaderId);
  state.groups.forEach((group) => {
    group.leaderIds = group.leaderIds.filter((id) => id !== leaderId);
  });
  delete state.userPins[`leader:${leaderId}`];
  delete state.userThemes[`leader:${leaderId}`];
  if (state.currentUser?.role === "leader" && state.currentUser.id === leaderId) {
    state.currentUser = null;
  }
  const visibleGroups = visibleGroupsFor();
  if (!visibleGroups.some((group) => group.id === state.activeGroupId)) {
    state.activeGroupId = visibleGroups[0]?.id || state.groups[0].id;
  }
  renderAll();
});

managersList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-manager]");
  if (!button) return;

  if (state.managers.length === 1) {
    showToast("Er moet minstens één bestuurslid blijven");
    return;
  }

  const managerId = button.dataset.removeManager;
  state.managers = state.managers.filter((manager) => manager.id !== managerId);
  delete state.userPins[`manager:${managerId}`];
  delete state.userThemes[`manager:${managerId}`];
  if (state.currentUser?.role === "manager" && state.currentUser.id === managerId) {
    state.currentUser = null;
    managementUnlocked = false;
  }
  renderAll();
});

managerGroups.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-kid-group]");
  if (!form) return;
  event.preventDefault();

  const input = form.querySelector("input");
  if (addKidToGroup(form.dataset.addKidGroup, input.value)) {
    input.value = "";
    renderAll();
  }
});

managerGroups.addEventListener("change", (event) => {
  const nameInput = event.target.closest("[data-group-name]");
  if (nameInput) {
    const group = state.groups.find((item) => item.id === nameInput.dataset.groupName);
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    if (group && name) {
      group.name = name;
      renderAll();
    }
    return;
  }

});

managerGroups.addEventListener("input", (event) => {
  const searchInput = event.target.closest("[data-leader-search]");
  if (!searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  const picker = searchInput.closest(".leader-picker");
  picker.querySelectorAll("[data-assign-leader]").forEach((button) => {
    button.classList.toggle("hidden", query && !button.textContent.toLowerCase().includes(query));
  });
});

managerGroups.addEventListener("click", (event) => {
  const assignLeaderButton = event.target.closest("[data-assign-leader]");
  if (assignLeaderButton) {
    const group = state.groups.find((item) => item.id === assignLeaderButton.dataset.assignLeader);
    if (group && !group.leaderIds.includes(assignLeaderButton.dataset.leaderId)) {
      group.leaderIds.push(assignLeaderButton.dataset.leaderId);
      renderAll();
    }
    return;
  }

  const unassignLeaderButton = event.target.closest("[data-unassign-leader]");
  if (unassignLeaderButton) {
    const group = state.groups.find((item) => item.id === unassignLeaderButton.dataset.unassignLeader);
    if (group) {
      group.leaderIds = group.leaderIds.filter((id) => id !== unassignLeaderButton.dataset.leaderId);

      const visibleGroups = visibleGroupsFor();
      if (!visibleGroups.some((visibleGroup) => visibleGroup.id === state.activeGroupId)) {
        state.activeGroupId = visibleGroups[0]?.id || state.groups[0].id;
      }

      renderAll();
    }
    return;
  }

  const removeKidButton = event.target.closest("[data-remove-group-kid]");
  if (removeKidButton) {
    removeKidFromGroup(removeKidButton.dataset.removeGroupKid, removeKidButton.dataset.kid);
    renderAll();
    return;
  }

  const deleteGroupButton = event.target.closest("[data-delete-group]");
  if (!deleteGroupButton) return;

  if (state.groups.length === 1) {
    showToast("Er moet minstens één groep blijven");
    return;
  }

  const groupId = deleteGroupButton.dataset.deleteGroup;
  const groupName = state.groups.find((group) => group.id === groupId)?.name || "deze groep";
  if (!window.confirm(`Weet je het zeker? Je verwijdert ${groupName}.`)) {
    return;
  }

  state.groups = state.groups.filter((group) => group.id !== groupId);
  Object.values(state.attendance).forEach((day) => {
    delete day[groupId];
  });

  if (state.activeGroupId === groupId) {
    state.activeGroupId = state.groups[0].id;
  }

  renderAll();
});

document.querySelector("#menuButton").addEventListener("click", () => {
  openView(state.activeView === "managementView" ? "homeView" : "managementView");
});

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (managerPassword.value === managerPasswordValue) {
    managementUnlocked = true;
    activeManagementPanel = "";
    managerPassword.value = "";
    renderAll();
    showToast("Beheer ontgrendeld");
    return;
  }

  managerPassword.value = "";
  showToast("Verkeerd wachtwoord");
});

lockManagementButton.addEventListener("click", () => {
  state.currentUser = null;
  pendingUser = null;
  managementUnlocked = false;
  activeManagementPanel = "";
  renderAll();
  showToast("Vergrendeld");
});

renderAll();
initDatabase();

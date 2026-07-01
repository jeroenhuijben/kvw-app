const storeKey = "summer-attendance-v1";
const backupStoreKey = "summer-attendance-backup-before-db";
const lastUserKey = "summer-attendance-last-user";
const managerPasswordValue = "summer2026";

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
  userPins: {},
  userThemes: {},
  feedback: [],
  importantInfo: [],
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
const schedulePrograms = {
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
        "detail": "Even een momentje rust met de kleuters. Laat elk kind wat ranja en een koekje halen en kom rustig zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
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
        "detail": "Even een momentje rust met de kleuters. Laat elk kind wat ranja en een koekje halen en kom rustig zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
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
        "detail": "Even een momentje rust met de kleuters. Laat elk kind wat ranja en een koekje halen en kom rustig zitten in de kleuterhoek. Er liggen boeken met sprookjes. Verzamel alle kleuters bij elkaar en de beste voorlezer van de groep leest voor.",
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
        "type": "rest"
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

let scheduleDayIndex = 0;
let scheduleCategory = scheduleCategories[0];
let scheduleSwipeStartX = 0;

const roomScheduleDays = [
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

const roomScheduleRooms = [
  "Gymzaal Laagstraat",
  "Gymzaal Wilgenstraat",
  "Aula",
  "Binnenplaats",
  "Sportveld",
  "Extern / overig"
];

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
const prevScheduleDay = document.querySelector("#prevScheduleDay");
const nextScheduleDay = document.querySelector("#nextScheduleDay");
const roomScheduleSwitch = document.querySelector("#roomScheduleSwitch");
const roomScheduleBoard = document.querySelector("#roomScheduleBoard");
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
  localStorage.setItem(storeKey, JSON.stringify(state));
  queueRemoteSave();
}

function sharedStateSnapshot() {
  return {
    groups: state.groups,
    leaders: state.leaders,
    managers: state.managers,
    userPins: state.userPins,
    userThemes: state.userThemes,
    feedback: state.feedback,
    importantInfo: state.importantInfo,
    setupModuleEnabled: state.setupModuleEnabled,
    setupTasks: state.setupTasks,
    days: state.days,
    attendance: state.attendance,
    savedAt: state.savedAt
  };
}

function sharedStateJson() {
  return JSON.stringify(sharedStateSnapshot());
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
  state.activeView = ["homeView", "todayView", "scheduleView", "setupView", "roomScheduleView", "feedbackView", "contactsView", "groupsView", "kidsView", "managementView"].includes(session.activeView)
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
  lastSharedStateJson = sharedStateJson();
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
  if (!data?.state) await saveRemoteState();

  databaseClient
    .channel("kvw-app-state")
    .on("postgres_changes", { event: "*", schema: "public", table: "kvw_app_state", filter: "id=eq.main" }, (payload) => {
      if (!payload.new?.state || payload.new.updated_at === lastRemoteUpdate) return;
      if (remoteUpdatedAtMs(payload.new.updated_at) < lastLocalChangeAt) return;

      const incomingSharedStateJson = JSON.stringify(payload.new.state);
      if (localSavePending && incomingSharedStateJson !== queuedSharedStateJson) return;
      if (localSavePending && incomingSharedStateJson === queuedSharedStateJson) {
        lastRemoteUpdate = payload.new.updated_at || "";
        lastSharedStateJson = incomingSharedStateJson;
        queuedSharedStateJson = "";
        localSavePending = false;
        return;
      }

      applyingRemoteState = true;
      lastRemoteUpdate = payload.new.updated_at || "";
      applySharedState(payload.new.state);
      renderAll();
      applyingRemoteState = false;
      showToast("Database bijgewerkt");
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
  nextState.feedback = Array.isArray(nextState.feedback) ? nextState.feedback : [];
  nextState.importantInfo = Array.isArray(nextState.importantInfo) ? nextState.importantInfo : [];
  nextState.setupModuleEnabled = Boolean(nextState.setupModuleEnabled);
  nextState.setupTasks = Array.isArray(nextState.setupTasks) ? nextState.setupTasks : structuredClone(seed.setupTasks);
  nextState.currentUser = null;

  nextState.leaders = nextState.leaders.map((leader) => ({
    id: leader.id || makeId(leader.name || "leader", nextState.leaders.map((item) => item.id)),
    name: defaultPersonTranslations[leader.name] || leader.name || "Naamloze leider"
  }));

  nextState.managers = nextState.managers.map((manager) => ({
    id: manager.id || makeId(manager.name || "manager", nextState.managers.map((item) => item.id)),
    name: defaultPersonTranslations[manager.name] || manager.name || "Naamloos bestuurslid"
  }));

  nextState.groups = nextState.groups.map((group) => ({
    id: group.id || makeId(group.name || "group", nextState.groups.map((item) => item.id)),
    name: defaultGroupTranslations[group.name] || group.name || "Naamloze groep",
    leaderIds: Array.isArray(group.leaderIds) ? group.leaderIds : [],
    kids: Array.isArray(group.kids) ? group.kids : []
  }));

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

  if (!["homeView", "todayView", "scheduleView", "setupView", "roomScheduleView", "feedbackView", "contactsView", "groupsView", "kidsView", "managementView"].includes(nextState.activeView)) {
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

  managerStats.innerHTML = `
    <article class="stat-tile"><strong>${state.groups.length}</strong><span>groepen</span></article>
    <article class="stat-tile"><strong>${kidCount}</strong><span>kinderen</span></article>
    <article class="stat-tile"><strong>${state.leaders.length + state.managers.length}</strong><span>mensen</span></article>
  `;

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
}

function renderFeedback() {
  const visibleFeedback = isManager()
    ? state.feedback
    : state.feedback.filter((entry) => entry.userKey === userKey(state.currentUser) || entry.userName === currentUserName());

  feedbackList.innerHTML = visibleFeedback
    .slice()
    .reverse()
    .map((entry) => `
      <article class="feedback-entry">
        <div class="feedback-entry-meta">
          <strong>${escapeHTML(feedbackCategoryLabel(entry.category))}</strong>
          <span>${escapeHTML(entry.userName)}</span>
          <span>${escapeHTML(roleLabel(entry.role))}</span>
          <span>${escapeHTML(entry.groupName || "Alle groepen")}</span>
          <span>${escapeHTML(entry.createdAt)}</span>
        </div>
        <p>${escapeHTML(entry.text)}</p>
        ${isManager() ? `<button class="text-button" type="button" data-remove-feedback="${escapeAttribute(entry.id)}">Verwijderen</button>` : ""}
      </article>
    `)
    .join("");

  if (!visibleFeedback.length) {
    feedbackList.innerHTML = `<article class="feedback-entry"><p>${isManager() ? "Nog geen evaluatie ingediend." : "Je hebt nog geen evaluatie ingediend."}</p></article>`;
  }
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

function scheduleActivityMeta(item) {
  const text = `${item.title} ${item.detail}`.toLowerCase();
  const matches = (patterns) => patterns.some((pattern) => pattern.test(text));

  if (matches([/spook/, /kamp/, /slaapplek/, /luchtbed/, /wakker worden/, /wassen/, /gotcha/])) {
    return { className: "camp", label: "Kamp / avond" };
  }

  if (matches([/fruit/, /lunch/, /ranja/, /plaspauze/, /ontbijt/, /friet/, /snack/, /koek/, /snoep/, /pauze/, /drinken/])) {
    return { className: "food", label: "Eten & pauze" };
  }

  if (matches([/leiding aanwezig/, /kinderen aanwezig/, /bussen/, /instappen/, /aankomst/, /verzamelen/, /terugrijden/, /terugfietsen/, /kinderen naar huis/, /schoonmaken/, /evalueren/, /wisselen/, /opruimen/, /vertrek/, /lopen naar/, /teruglopen/, /fietsen naar/, /richting de stad/])) {
    return { className: "logistics", label: "Logistiek" };
  }

  if (matches([/toverland/, /kloostertuin/, /stadspark/, /kapel/, /wijk/, /heukelom/, /extern/])) {
    return { className: "outing", label: "Uitje / extern" };
  }

  if (matches([/knutsel/, /kleurplaat/, /tekenen/, /muts/, /slinger/, /vlaggenlijn/])) {
    return { className: "creative", label: "Creatief" };
  }

  if (matches([/lasergam/, /imposter/, /moordmysterie/, /crazy 88/, /ruilspel/, /contact/, /dirigent/, /quiz/])) {
    return { className: "game", label: "Game / opdracht" };
  }

  if (matches([/theater/, /meeleef/, /film/, /carnaval/, /feest/, /podium/, /afsluiting/])) {
    return { className: "show", label: "Feest / show" };
  }

  if (matches([/stormbaan/, /sport/, /tik/, /trefbal/, /race/, /zeskamp/, /waterpret/, /kwalleballen/, /spelletjes/, /spel –/, /levend stratego/])) {
    return { className: "sport", label: "Sport & spel" };
  }

  return { className: "general", label: "Activiteit" };
}

function renderSchedule() {
  const day = scheduleDays[scheduleDayIndex];
  scheduleDateLabel.textContent = `${day.label} ${day.date}`;
  scheduleDayName.textContent = day.label;
  scheduleDayRange.textContent = day.date;
  prevScheduleDay.disabled = scheduleDayIndex === 0;
  nextScheduleDay.disabled = scheduleDayIndex === scheduleDays.length - 1;

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
    .map((block) => `
      <article class="schedule-row ${block.items.length > 1 ? "parallel-row" : ""}">
        <time class="schedule-time">${block.time}</time>
        <div class="schedule-event-stack">
          ${block.items.length > 1 ? `<span class="parallel-badge">${block.items.length} activiteiten tegelijk</span>` : ""}
          ${block.items.map((item, index) => {
            const meta = scheduleActivityMeta(item);
            return `
              <div class="schedule-event ${meta.className} ${block.items.length > 1 ? "parallel" : ""}">
                ${block.items.length > 1 ? `<span class="parallel-index">Activiteit ${index + 1}</span>` : ""}
                <strong>${escapeHTML(item.title)}</strong>
                ${item.detail ? `<span>${escapeHTML(item.detail)}</span>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `)
    .join("");

  if (!scheduleItems.length) {
    scheduleBoard.innerHTML = `<article class="schedule-row"><time class="schedule-time">-</time><div class="schedule-event rest"><strong>Geen programma</strong><span>Er is voor deze dag en doelgroep nog geen programma ingevuld.</span></div></article>`;
  }
}

function renderRoomSchedule() {
  const day = roomScheduleDays[roomScheduleDayIndex];
  const scheduleStart = 8 * 60;
  const scheduleEnd = 18 * 60;
  const slotMinutes = 15;
  const totalSlots = (scheduleEnd - scheduleStart) / slotMinutes;
  const timeTicks = Array.from({ length: ((scheduleEnd - scheduleStart) / 60) + 1 }, (_, index) => {
    const minutes = scheduleStart + (index * 60);
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

  roomScheduleBoard.innerHTML = `
    <div class="room-timetable" style="--room-count: ${roomScheduleRooms.length}; --slot-count: ${totalSlots};">
      <div class="room-timetable-corner">Tijd</div>
      ${roomScheduleRooms.map((room, index) => `
        <div class="room-timetable-room" style="grid-column: ${index + 2};">${escapeHTML(room)}</div>
      `).join("")}
      ${timeTicks.map((tick) => `
        <time class="room-timetable-time" style="grid-row: ${tick.row};">${escapeHTML(tick.label)}</time>
      `).join("")}
      ${roomScheduleRooms.map((_, index) => `
        <div class="room-timetable-lane" style="grid-column: ${index + 2}; grid-row: 2 / span ${totalSlots};"></div>
      `).join("")}
      ${events.map((event) => `
        <article
          class="room-timetable-event ${event.type}"
          style="grid-column: ${event.column}; grid-row: ${event.rowStart} / span ${event.rowSpan};"
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
    const rowSpan = Math.max(2, Math.round((end - start) / slotMinutes));

    return row.rooms.map((room) => {
      const roomIndex = roomScheduleRooms.indexOf(room.room);
      return {
        activity: room.activity,
        column: (roomIndex === -1 ? roomScheduleRooms.length - 1 : roomIndex) + 2,
        key: `${row.time}-${room.room}-${room.activity}`,
        room: room.room,
        rowStart,
        rowSpan,
        time: row.time,
        type: roomScheduleEventType(room.activity)
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
  renderSetupModule();
  renderSetupManagement();
  renderSchedule();
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

scheduleCategorySwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-schedule-category]");
  if (!button) return;
  scheduleCategory = button.dataset.scheduleCategory;
  renderAll();
});

roomScheduleSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-room-schedule-day]");
  if (!button) return;
  roomScheduleDayIndex = Number(button.dataset.roomScheduleDay);
  hideRoomScheduleDetail();
  renderAll();
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
  scheduleSwipeStartX = event.clientX;
});

scheduleBoard.addEventListener("pointerup", (event) => {
  const deltaX = event.clientX - scheduleSwipeStartX;
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

      state.managers.push({ id: makeId(name, state.managers.map((person) => person.id)), name });
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
    groupName: activeGroup()?.name || "",
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
  renderAll();
  showToast("Vergrendeld");
});

renderAll();
initDatabase();

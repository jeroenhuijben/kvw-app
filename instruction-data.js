(() => {
  const assetRoot = "./assets/game-instructions";
  const importedAt = "2026-08-10T00:00:00.000Z";

  const image = (id, name, file) => ({
    id,
    name,
    type: "image/webp",
    url: `${assetRoot}/${file}`,
    path: "",
    size: 0
  });

  const pdf = (id, name, file) => ({
    id,
    name,
    type: "application/pdf",
    url: `${assetRoot}/${file}`,
    path: "",
    size: 0
  });

  const instruction = ({ id, title, category = "all-groups", summary, activityIds = [], attachments }) => ({
    id: `standaard-${id}`,
    title,
    category,
    summary,
    body: "",
    materials: "",
    safety: "",
    activityIds,
    attachments,
    createdBy: "KVW import",
    updatedAt: importedAt
  });

  window.KVW_INSTRUCTION_LIBRARY_VERSION = 2;
  window.KVW_BUILT_IN_INSTRUCTIONS = [
    instruction({
      id: "feestrace",
      title: "Feestrace",
      summary: "Uitleg voor de vier onderdelen van de Feestrace.",
      activityIds: [
        "programma-kleuters-3-1500-feestrace-op-de-binnenplaats",
        "programma-pupillen-1-1115-feestrace-binnenplaats",
        "programma-jongeren-3-1000-jongeren-2-4-feestrace-binnenplaats",
        "programma-jongeren-3-1115-jongeren-1-3-feestrace-binnenplaats"
      ],
      attachments: [
        image("feestrace-ballonchallenge", "Ballonchallenge", "feestrace-ballonchallenge.webp"),
        image("feestrace-ringenwerpen", "Ringenwerpen", "feestrace-ringenwerpen.webp"),
        image("feestrace-snoephappen", "Snoephappen", "feestrace-snoephappen.webp"),
        image("feestrace-menselijke-slinger", "Menselijke slinger", "feestrace-menselijke-slinger.webp")
      ]
    }),
    instruction({
      id: "zeskamp",
      title: "Zeskamp",
      category: "ouderen",
      summary: "Uitleg voor alle zes onderdelen van de zeskamp.",
      activityIds: [
        "programma-ouderen-3-1500-zeskamp-deel-1",
        "programma-ouderen-3-1600-zeskamp-deel-2"
      ],
      attachments: [
        image("zeskamp-hardlopen", "1. Hardlopen", "zeskamp-hardlopen.webp"),
        image("zeskamp-estafette", "2. Estafette lopen", "zeskamp-estafette.webp"),
        image("zeskamp-touwtrekken", "3. Touwtrekken", "zeskamp-touwtrekken.webp"),
        image("zeskamp-verspringen", "4. Verspringen", "zeskamp-verspringen.webp"),
        image("zeskamp-houtblokken", "5. Houtblokken gooien", "zeskamp-houtblokken.webp"),
        image("zeskamp-rekstokhangen", "6. Rekstokhangen", "zeskamp-rekstokhangen.webp")
      ]
    }),
    instruction({
      id: "taartentrefbal",
      title: "Taartentrefbal",
      summary: "Volledige speluitleg voor Taartentrefbal.",
      activityIds: [
        "programma-kleuters-3-1330-kleuters-3a-3b-4a-4b-spel-taartentrefbal-sportveld",
        "programma-kleuters-3-1415-kleuters-1a-1b-2a-2b-spel-taartentrefbal-sportveld",
        "programma-pupillen-3-1000-taartentrefbal-sportveld"
      ],
      attachments: [
        image("taartentrefbal-1", "Taartentrefbal - pagina 1", "taartentrefbal-1.webp"),
        image("taartentrefbal-2", "Taartentrefbal - pagina 2", "taartentrefbal-2.webp")
      ]
    }),
    instruction({
      id: "waterpret",
      title: "Waterpret en waterspelletjes",
      summary: "Uitleg voor de onderdelen van Waterpret, waaronder Kwalleballen.",
      activityIds: [
        "programma-kleuters-4-1515-waterpret-binnenplaats-optioneel-als-je-al-terug-bent-uit-kloostertuin",
        "programma-pupillen-4-1515-waterspelletjes-sportveld",
        "programma-jongeren-1-1445-waterpret-binnenplaats",
        "programma-jongeren-4-1515-kwalleballen-op-het-sportveld"
      ],
      attachments: [
        image("waterpret-na-de-spellen", "Na de spellen", "waterpret-na-de-spellen.webp"),
        image("waterpret-wie-gooit-er-zes", "Wie gooit er zes?", "waterpret-wie-gooit-er-zes.webp"),
        image("waterpret-bekers-doorgeven", "Bekers doorgeven", "waterpret-bekers-doorgeven.webp"),
        image("waterpret-kwalleballen-1", "Kwalleballen - pagina 1", "waterpret-kwalleballen-1.webp"),
        image("waterpret-kwalleballen-2", "Kwalleballen - pagina 2", "waterpret-kwalleballen-2.webp"),
        image("waterpret-sponzen", "Sponzen", "waterpret-sponzen.webp")
      ]
    }),
    instruction({
      id: "feestbingo",
      title: "Alle dagen feest - bingo",
      summary: "Draaiboek voor de spelleider en bingocontroleurs.",
      activityIds: [
        "programma-kleuters-5-1145-alle-dagen-feest-bingo-aula",
        "programma-pupillen-5-1145-alle-dagen-feest-bingo-aula",
        "programma-ouderen-4-1330-alle-dagen-feest-bingo"
      ],
      attachments: [pdf("feestbingo-draaiboek", "Draaiboek feestbingo", "draaiboek-feestbingo.pdf")]
    }),
    instruction({
      id: "lasergamen",
      title: "Lasergamen",
      summary: "Speluitleg voor alle programmaonderdelen waarin wordt gelasergamed.",
      activityIds: [
        "programma-kleuters-1-1015-kleuters-1a-1b-2a-2b-lasergamen-laagstraat",
        "programma-kleuters-1-1115-kleuters-3a-3b-4a-4b-lasergamen-laagstraat",
        "programma-kleuters-4-1000-theater-en-activiteitenroulatie",
        "programma-pupillen-3-1330-pupillen-1a-1b-en-2a-lasergamen-gymzaal-laagstraat",
        "programma-pupillen-3-1445-pupillen-1a-1b-en-2a-lasergamen-gymzaal-laagstraat",
        "programma-jongeren-3-1000-jongeren-1-3-lasergamen-gymzaal-laagstraat",
        "programma-jongeren-3-1115-jongeren-2-4-lasergamen-gymzaal-laagstraat",
        "programma-ouderen-1-1300-middagroulatie-lasergamen-en-crazy88"
      ],
      attachments: [image("lasergamen", "Lasergamen", "lasergamen.webp")]
    }),
    instruction({
      id: "moeder-moeder",
      title: "Moeder, moeder, hoe laat is het?",
      category: "jongeren",
      summary: "Speluitleg voor het tikspel Moeder, moeder, hoe laat is het?",
      activityIds: [
        "programma-jongeren-4-1300-jongeren-3-en-jongeren-4-tikspel-moeder-moeder-en-vrij-spel-op-het-sport",
        "programma-jongeren-4-1415-jongeren-1-en-jongeren-2-tikspel-moeder-moeder-en-vrij-spel-op-het-sport"
      ],
      attachments: [image("moeder-moeder", "Moeder, moeder, hoe laat is het?", "moeder-moeder-hoe-laat-is-het.webp")]
    }),
    instruction({
      id: "knutselen-vuurpijltjes",
      title: "Vuurpijltjes knutselen",
      category: "kleuters",
      summary: "Knutselinstructie voor het maken van vuurpijltjes.",
      activityIds: ["programma-kleuters-1-1330-knutselen-vuurpijlen"],
      attachments: [image("knutselen-vuurpijltjes", "Vuurpijltjes knutselen", "knutselen-vuurpijltjes.webp")]
    }),
    instruction({
      id: "knutselen-zon",
      title: "Zon knutselen",
      summary: "Knutselinstructie voor het maken van een vrolijke zon.",
      attachments: [image("knutselen-zon", "Zon knutselen", "knutselen-zon.webp")]
    }),
    instruction({
      id: "knutselen-vlaggenlijn",
      title: "Vlaggenlijn knutselen",
      summary: "Knutselinstructie voor het maken van een vlaggenlijn.",
      attachments: [image("knutselen-vlaggenlijn", "Vlaggenlijn knutselen", "knutselen-vlaggenlijn.webp")]
    }),
    instruction({
      id: "knutselen-sterhanger",
      title: "Sterhanger knutselen",
      summary: "Knutselinstructie voor het maken van een sterhanger.",
      attachments: [image("knutselen-sterhanger", "Sterhanger knutselen", "knutselen-sterhanger.webp")]
    }),
    instruction({
      id: "knutselen-waaier",
      title: "Waaier knutselen",
      summary: "Knutselinstructie voor het maken van een feestelijke waaier.",
      attachments: [image("knutselen-waaier", "Waaier knutselen", "knutselen-waaier.webp")]
    }),
    instruction({
      id: "knutselen-verjaardagskroon",
      title: "Verjaardagskroon knutselen",
      summary: "Knutselinstructie voor het maken van een verjaardagskroon.",
      attachments: [image("knutselen-verjaardagskroon", "Verjaardagskroon knutselen", "knutselen-verjaardagskroon.webp")]
    }),
    instruction({
      id: "telefoontje",
      title: "Telefoontje",
      summary: "Geef met kleine knijpjes een geheim telefoontje door.",
      attachments: [image("telefoontje", "Telefoontje", "telefoontje.webp")]
    }),
    instruction({
      id: "zwemmer-redder-haai",
      title: "Zwemmer, redder, haai",
      summary: "Actief tikspel waarin zwemmers elkaar proberen te bevrijden.",
      attachments: [image("zwemmer-redder-haai", "Zwemmer, redder, haai", "zwemmer-redder-haai.webp")]
    }),
    instruction({
      id: "bevrijdingstikkertje",
      title: "Bevrijdingstikkertje",
      summary: "Tikspel waarbij vrije kinderen de getikte kinderen bevrijden.",
      attachments: [image("bevrijdingstikkertje", "Bevrijdingstikkertje", "bevrijdingstikkertje.webp")]
    }),
    instruction({
      id: "ploffen",
      title: "Ploffen",
      summary: "Telspel waarbij steeds één kind afvalt.",
      attachments: [image("ploffen", "Ploffen", "ploffen.webp")]
    }),
    instruction({
      id: "1-2-3-vuurpijl",
      title: "1, 2, 3, vuurpijl!",
      summary: "Ren- en reactiespel met een vuurpijlthema.",
      attachments: [image("1-2-3-vuurpijl", "1, 2, 3, vuurpijl!", "1-2-3-vuurpijl.webp")]
    }),
    instruction({
      id: "lekkerland-viesland",
      title: "Lekkerland en Viesland",
      summary: "Keuzespel rond eten en drinken.",
      attachments: [image("lekkerland-viesland", "Lekkerland en Viesland", "lekkerland-viesland.webp")]
    }),
    instruction({
      id: "chinese-nieuwjaarsdraak",
      title: "Chinese nieuwjaarsdraak",
      summary: "Tikspel waarbij getikte kinderen samen een steeds langere draak vormen.",
      attachments: [image("chinese-nieuwjaarsdraak", "Chinese nieuwjaarsdraak", "chinese-nieuwjaarsdraak.webp")]
    }),
    instruction({
      id: "vuurpijltikkertje",
      title: "Vuurpijltikkertje",
      summary: "Tikspel waarbij kinderen via de wc in een vuurpijl veranderen.",
      attachments: [image("vuurpijltikkertje", "Vuurpijltikkertje", "vuurpijltikkertje.webp")]
    }),
    instruction({
      id: "wie-is-het",
      title: "Wie is het?",
      summary: "Raad met ja- en nee-vragen welk kind de begeleider heeft gekozen.",
      attachments: [image("wie-is-het", "Wie is het?", "wie-is-het.webp")]
    })
  ];
})();

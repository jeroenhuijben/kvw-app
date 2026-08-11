#!/usr/bin/env python3
"""Optimize the supplied instruction images for use in the web app."""

import argparse
from pathlib import Path

from PIL import Image


IMAGE_FILES = {
    "Knutselinstructie zon knutselen.png": "knutselen-zon.webp",
    "Waterpret na de spellen instructie.png": "waterpret-na-de-spellen.webp",
    "Zeskamp 3 Touwtrekken.png": "zeskamp-touwtrekken.webp",
    "Feestrace 3.Snoephappen instructie.png": "feestrace-snoephappen.webp",
    "Telefoontje instructie.png": "telefoontje.webp",
    "Zwemmer, redder, haai instructie.png": "zwemmer-redder-haai.webp",
    "Bevrijdingstikkertje instructie.png": "bevrijdingstikkertje.webp",
    "Knutselinstructie vlaggenlijn knutselen.png": "knutselen-vlaggenlijn.webp",
    "Feestrace 4.Menselijke slinger instructie.png": "feestrace-menselijke-slinger.webp",
    "Lasergamen instructie.png": "lasergamen.webp",
    "Waterpret Wie gooit er zes instructie.png": "waterpret-wie-gooit-er-zes.webp",
    "Zeskamp 1 Hardlopen.png": "zeskamp-hardlopen.webp",
    "Knutselinstructie sterhanger knutselen.png": "knutselen-sterhanger.webp",
    "Zeskamp 2 Estafette lopen.png": "zeskamp-estafette.webp",
    "Ploffen instructie.png": "ploffen.webp",
    "1, 2, 3 Vuurpijl instructie.png": "1-2-3-vuurpijl.webp",
    "Waterpret Bekers doorgeven instructie.png": "waterpret-bekers-doorgeven.webp",
    "Knutselinstructie waaier knutselen.png": "knutselen-waaier.webp",
    "Lekkerland Viesland instructie.png": "lekkerland-viesland.webp",
    "Zeskamp 6 Rekstokhangen.png": "zeskamp-rekstokhangen.webp",
    "Chinese Nieuwjaarsdraak instructie.png": "chinese-nieuwjaarsdraak.webp",
    "Feestrace 1.Ballonchallenge instructie.png": "feestrace-ballonchallenge.webp",
    "Taartentrefbal instructie pagina 1.png": "taartentrefbal-1.webp",
    "Zeskamp 4 Verspringen.png": "zeskamp-verspringen.webp",
    "Vuurpijltikkertje instructie.png": "vuurpijltikkertje.webp",
    "Zeskamp 5 Houtblokken gooien.png": "zeskamp-houtblokken.webp",
    "Taartentrefbal instructie pagina 2.png": "taartentrefbal-2.webp",
    "Moeder, moeder, hoe laat is het instructie.png": "moeder-moeder-hoe-laat-is-het.webp",
    "Waterpret Kwalleballen instructie pagina 2.png": "waterpret-kwalleballen-2.webp",
    "Waterpret Kwalleballen instructie pagina 1.png": "waterpret-kwalleballen-1.webp",
    "Waterpret sponzen instructie.png": "waterpret-sponzen.webp",
    "Wie is het_ instructie.png": "wie-is-het.webp",
    "Feestrace 2.Ringenwerpen instructie.png": "feestrace-ringenwerpen.webp",
    "Knutselinstructie vuurpijltjes knutselen.png": "knutselen-vuurpijltjes.webp",
    "Knutselinstructie verjaardagskroon knutselen.png": "knutselen-verjaardagskroon.webp",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    missing = [name for name in IMAGE_FILES if not (source / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Ontbrekende instructiebestanden: {missing}")

    for source_name, output_name in IMAGE_FILES.items():
        with Image.open(source / source_name) as image:
            image.convert("RGB").save(output / output_name, "WEBP", quality=92, method=6)

    print(f"{len(IMAGE_FILES)} afbeeldingen geoptimaliseerd in {output}")


if __name__ == "__main__":
    main()

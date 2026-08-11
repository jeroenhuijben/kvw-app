#!/usr/bin/env python3
"""Convert the four KVW Word schedules into browser-ready program data."""

import argparse
import json
import re
import unicodedata
from pathlib import Path

from docx import Document


DAY_INDEX = {
    "maandag": 0,
    "dinsdag": 1,
    "woensdag": 2,
    "donderdag": 3,
    "vrijdag": 4,
    "zaterdagavond": 5,
}
TIME_RE = re.compile(r"(?<!\d)([0-2]?\d)[.:](\d{2})(?!\d)")
EXACT_TIME_RE = re.compile(r"^\s*([0-2]?\d)[.:](\d{2})(?:\s*u)?\s*$", re.I)
TIME_RANGE_RE = re.compile(
    r"^\s*([0-2]?\d)[.:](\d{2})\s*[-–—]\s*([0-2]?\d)[.:](\d{2})\s*$"
)
EMBEDDED_TIME_RE = re.compile(r"^\s*([0-2]?\d)[.:](\d{2})\s*:\s*(.+)$", re.S)


def clean_text(value):
    return "\n".join(
        line.strip()
        for line in value.replace("\u00a0", " ").splitlines()
        if line.strip()
    )


def normalize_time(value):
    match = TIME_RE.search(value)
    if not match:
        return None
    return f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"


def exact_time(value):
    match = EXACT_TIME_RE.match(value)
    if not match:
        return None
    return f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"


def time_range(value):
    match = TIME_RANGE_RE.match(value)
    if not match:
        return None
    start = f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"
    end = f"{int(match.group(3)):02d}:{int(match.group(4)):02d}"
    return start, end


def collapse_cells(cells):
    segments = []
    for index, raw_value in enumerate(cells):
        value = clean_text(raw_value)
        if segments and segments[-1]["text"] == value:
            segments[-1]["end"] = index
        else:
            segments.append({"start": index, "end": index, "text": value})
    return segments


def activity_type(title, detail):
    text = f"{title} {detail}".lower()
    patterns = [
        ("camp", r"spook|kamp|slaapplek|luchtbed|wakker worden|wassen|gotcha"),
        ("food", r"fruit|lunch|ranja|plaspauze|ontbijt|friet|snack|koek|snoep|pauze|drinken"),
        ("logistics", r"leiding aanwezig|kinderen aanwezig|bussen|instappen|aankomst|verzamelen|terugrijden|terugfietsen|kinderen naar huis|schoonmaken|evalueren|wisselen|opruimen|vertrek|lopen naar|teruglopen|fietsen naar|richting de stad"),
        ("outing", r"toverland|kloostertuin|stadspark|kapel|wijk|heukelom|extern"),
        ("creative", r"knutsel|kleurplaat|tekenen|muts|slinger|vlaggenlijn|lantaarn"),
        ("game", r"lasergam|imposter|moordmysterie|crazy\s*88|ruilspel|contact|dirigent|quiz|bingo"),
        ("show", r"theater|meeleef|film|carnaval|feest|podium|afsluiting|ranjacantus"),
        ("sport", r"stormbaan|sport|tik|trefbal|race|zeskamp|waterpret|kwalleballen|spelletjes|levend stratego|volleybal|smokkelspel"),
    ]
    for kind, pattern in patterns:
        if re.search(pattern, text):
            return kind
    return "general"


def event(time, title, detail=""):
    title = clean_text(title).replace("\n", " - ")
    detail = clean_text(detail).replace("\n", " ")
    return {
        "time": time,
        "title": title,
        "detail": detail,
        "type": activity_type(title, detail),
    }


def activity_slug(value):
    normalized = unicodedata.normalize("NFD", value.lower())
    without_accents = "".join(character for character in normalized if unicodedata.category(character) != "Mn")
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", without_accents))[:72] or "activiteit"


def assign_activity_ids(programs):
    """Give every program item a deterministic key for instruction links."""
    used_ids = set()
    for category, days in programs.items():
        for day_index, items in enumerate(days):
            for item in items:
                base_id = "-".join([
                    "programma",
                    category,
                    str(day_index + 1),
                    item["time"].replace(":", ""),
                    activity_slug(item["title"]),
                ])
                activity_id = base_id
                duplicate = 2
                while activity_id in used_ids:
                    activity_id = f"{base_id}-{duplicate}"
                    duplicate += 1
                used_ids.add(activity_id)
                item["activityId"] = activity_id


def split_event_text(text):
    lines = [line.strip() for line in clean_text(text).splitlines() if line.strip()]
    if not lines:
        return "", ""

    embedded = EMBEDDED_TIME_RE.match("\n".join(lines))
    if embedded:
        lines = [line.strip() for line in embedded.group(3).splitlines() if line.strip()]

    group_prefix = re.compile(r"^(kleuters|pupillen|jongeren|ouderen)\b|^groep\s+\d", re.I)
    activity_word = re.compile(
        r"tik|laser|knutsel|spel|film|theater|volleybal|feest|stormbaan|waterpret|race|bingo|pauze",
        re.I,
    )
    if len(lines) > 1 and group_prefix.search(lines[0]) and not activity_word.search(lines[0]):
        return f"{lines[0]}: {lines[1]}", " ".join(lines[2:])
    return lines[0], " ".join(lines[1:])


def overlapping_label(headers, segment):
    matches = [
        header["text"]
        for header in headers
        if header["text"]
        and header["start"] <= segment["end"]
        and header["end"] >= segment["start"]
    ]
    label = " / ".join(dict.fromkeys(matches))
    return re.sub(r"^programma\s+", "", label, flags=re.I)


def parse_schedule_table(table):
    rows = [[clean_text(cell.text) for cell in row.cells] for row in table.rows]
    entries = []
    rotation_headers = []
    group_headers = []
    subgrid_headers = []
    subgrid_outer_time = None
    parent_title = ""

    for row_index, row in enumerate(rows[1:], start=1):
        segments = collapse_cells(row)
        if not segments:
            continue

        first = segments[0]
        outer_time = exact_time(first["text"])
        payload = [segment for segment in segments[1:] if segment["text"]]

        if not outer_time:
            meaningful = [segment for segment in segments if segment["text"]]
            if not meaningful:
                continue

            if any(re.match(r"^programma groep", item["text"], re.I) for item in meaningful):
                group_headers = meaningful
                continue

            if first["text"] == "" and len(payload) > 1:
                rotation_headers = payload
                continue

            embedded_segments = []
            for segment in meaningful:
                match = EMBEDDED_TIME_RE.match(segment["text"])
                if match:
                    embedded_segments.append((segment, match))
            if embedded_segments:
                for segment, match in embedded_segments:
                    start = f"{int(match.group(1)):02d}:{int(match.group(2)):02d}"
                    title, detail = split_event_text(match.group(3))
                    label = overlapping_label(group_headers, segment)
                    if label:
                        title = f"{label.rstrip(':')}: {title}"
                    entries.append(event(start, title, detail))
            continue

        if not payload:
            continue

        if subgrid_outer_time and outer_time != subgrid_outer_time:
            subgrid_headers = []
            subgrid_outer_time = None

        first_payload = payload[0]["text"]
        inner_range = time_range(first_payload)
        inner_exact = exact_time(first_payload)
        is_subgrid_heading = first_payload.rstrip(":").lower() == "tijd"

        if is_subgrid_heading:
            subgrid_headers = payload[1:]
            subgrid_outer_time = outer_time
            continue

        if inner_range or inner_exact:
            inner_time = inner_range[0] if inner_range else inner_exact
            end_time = inner_range[1] if inner_range else ""
            activity_segments = payload[1:]
            for segment in activity_segments:
                raw_title, raw_detail = split_event_text(segment["text"])
                column_heading = overlapping_label(subgrid_headers, segment)
                if column_heading:
                    heading_title, heading_detail = split_event_text(column_heading)
                    title = f"{raw_title}: {heading_title}"
                    detail_parts = [heading_detail, raw_detail, f"Tijdblok tot {end_time}" if end_time else ""]
                elif parent_title:
                    title = f"{parent_title}: {raw_title}"
                    detail_parts = [raw_detail, f"Tijdblok tot {end_time}" if end_time else ""]
                else:
                    title = raw_title
                    detail_parts = [raw_detail, f"Tijdblok tot {end_time}" if end_time else ""]
                entries.append(event(inner_time, title, " ".join(part for part in detail_parts if part)))
            continue

        if len(payload) > 1:
            for segment in payload:
                title, detail = split_event_text(segment["text"])
                rotation = overlapping_label(rotation_headers, segment)
                if rotation and segment["start"] == segment["end"]:
                    rotation_title, rotation_detail = split_event_text(rotation)
                    title = f"{title}: {rotation_title}"
                    detail = " ".join(part for part in [rotation_detail, detail] if part)
                entries.append(event(outer_time, title, detail))
            parent_title = ""
            continue

        title, detail = split_event_text(payload[0]["text"])
        entries.append(event(outer_time, title, detail))
        parent_title = title

    deduplicated = []
    seen = set()
    for entry in entries:
        signature = (entry["time"], entry["title"], entry["detail"])
        if signature in seen:
            continue
        seen.add(signature)
        deduplicated.append(entry)

    def chronological_key(item):
        hours, minutes = (int(part) for part in item["time"].split(":"))
        total = (hours * 60) + minutes
        return total + (24 * 60 if hours < 6 else 0)

    return sorted(deduplicated, key=chronological_key)


def schedule_tables(path):
    document = Document(path)
    result = {}
    themes = {}
    for table in document.tables:
        if not table.rows or not table.rows[0].cells:
            continue
        header = clean_text(table.rows[0].cells[0].text)
        match = re.match(
            r"^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdagavond)\b.*2026",
            header,
            re.I,
        )
        if not match:
            continue
        day_index = DAY_INDEX[match.group(1).lower()]
        result[day_index] = parse_schedule_table(table)
        theme_match = re.search(r"Thema:\s*(.+)", header, re.I)
        themes[day_index] = theme_match.group(1).strip() if theme_match else ""
    return [result.get(index, []) for index in range(6)], themes


def compact_kleuter_feestrace(programs):
    """Store the Kleuters Feestrace rotation as one structured schedule item."""
    wednesday = programs["kleuters"][DAY_INDEX["woensdag"]]
    parent = next(
        (item for item in wednesday if item["title"].lower().startswith("feestrace")),
        None,
    )
    if not parent:
        return

    stations = [
        "Ballon challenge",
        "Ringwerpen",
        "Snoephappen",
        "Menselijke slinger",
    ]
    station_pattern = "|".join(re.escape(station) for station in stations)
    assignment_pattern = re.compile(
        rf"^(?P<groups>[^:]+):\s*(?P<station>{station_pattern})$",
        re.I,
    )
    rounds = {}
    matched_items = []

    for item in wednesday:
        match = assignment_pattern.match(item["title"])
        if not match:
            continue
        station = next(
            station for station in stations
            if station.lower() == match.group("station").lower()
        )
        rounds.setdefault(item["time"], []).append({
            "station": station,
            "groups": match.group("groups").strip(),
        })
        matched_items.append(item)

    expected_times = ["15:00", "15:10", "15:20", "15:30"]
    if any(len(rounds.get(time, [])) != len(stations) for time in expected_times):
        return

    parent["rotation"] = {
        "id": "kleuters-feestrace-woensdag",
        "location": "Binnenplaats",
        "rounds": [
            {
                "time": time,
                "assignments": sorted(
                    rounds[time],
                    key=lambda assignment: stations.index(assignment["station"]),
                ),
            }
            for time in expected_times
        ],
        "groups": ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"],
    }
    programs["kleuters"][DAY_INDEX["woensdag"]] = [
        item for item in wednesday if item not in matched_items
    ]


def compact_kleuter_thursday_rotation(programs):
    """Store Thursday morning's four-activity rotation as one schedule item."""
    thursday = programs["kleuters"][DAY_INDEX["donderdag"]]
    parent = next(
        (item for item in thursday if item["title"] == "Theater en diverse activiteiten"),
        None,
    )
    if not parent:
        return

    stations = ["Theater", "Knutselen", "Lasergamen", "Tikspelletjes"]
    assignment_pattern = re.compile(
        rf"^(?P<group>Kleuters\s+[1-4]):\s*(?P<station>{'|'.join(stations)})$",
        re.I,
    )
    rounds = {}
    station_locations = {}
    matched_items = []

    for item in thursday:
        match = assignment_pattern.match(item["title"])
        if not match:
            continue
        station = next(
            name for name in stations
            if name.lower() == match.group("station").lower()
        )
        rounds.setdefault(item["time"], []).append({
            "station": station,
            "groups": match.group("group"),
        })
        station_locations[station] = item["detail"]
        matched_items.append(item)

    expected_times = ["10:00", "10:30", "11:30", "12:00"]
    if any(len(rounds.get(time, [])) != len(stations) for time in expected_times):
        return

    parent["title"] = "Theater en activiteitenroulatie"
    parent["rotation"] = {
        "id": "kleuters-activiteitenroulatie-donderdag",
        "location": "Odulphus",
        "rounds": [
            {
                "time": time,
                "assignments": sorted(
                    rounds[time],
                    key=lambda assignment: stations.index(assignment["station"]),
                ),
            }
            for time in expected_times
        ],
        "groups": ["Kleuters 1", "Kleuters 2", "Kleuters 3", "Kleuters 4"],
        "stationLocations": station_locations,
    }
    programs["kleuters"][DAY_INDEX["donderdag"]] = [
        item
        for item in thursday
        if item not in matched_items
        and not (item["title"] == "Wisselen" and "10:00" <= item["time"] <= "12:00")
    ]


def compact_pupil_taartentrefbal(programs):
    """Store Wednesday's Taartentrefbal matches as one fixture card."""
    wednesday = programs["pupillen"][DAY_INDEX["woensdag"]]
    parent = next(
        (
            item for item in wednesday
            if item["time"] == "10:00"
            and item["title"].lower() == "spel – taartentrefbal (sportveld)"
        ),
        None,
    )
    if not parent:
        return

    match_pattern = re.compile(
        r"^Spel\s+[–-]\s+taartentrefbal\s+\(sportveld\):\s+"
        r"(?P<first>Pupillen\s+\d+)\s+vs\.?\s+(?P<second>Pupillen\s+\d+)$",
        re.I,
    )
    matches = []
    matched_items = []
    for item in wednesday:
        match = match_pattern.match(item["title"])
        if not match:
            continue
        end_match = re.search(r"Tijdblok tot\s+(\d{2}:\d{2})", item["detail"])
        matches.append({
            "time": item["time"],
            "label": f"{item['time']}–{end_match.group(1)}" if end_match else item["time"],
            "assignments": [{
                "station": "Wedstrijd",
                "groups": f"{match.group('first')} vs {match.group('second')}",
            }],
        })
        matched_items.append(item)

    if len(matches) != 3:
        return

    parent["title"] = "Taartentrefbal (sportveld)"
    parent["type"] = "sport"
    parent["rotation"] = {
        "id": "pupillen-taartentrefbal-woensdag",
        "mode": "matches",
        "className": "sport",
        "location": "Sportveld",
        "summary": "3 wedstrijden · 3 rondes",
        "rounds": sorted(matches, key=lambda round_item: round_item["time"]),
        "groups": ["Pupillen 1", "Pupillen 2", "Pupillen 3"],
        "idleLabel": "Aanmoedigen",
    }
    programs["pupillen"][DAY_INDEX["woensdag"]] = [
        item for item in wednesday if item not in matched_items
    ]


def add_to_verland_sweeping(programs):
    """Copy the shared Toverland sweeping instruction to every category."""
    source = next(
        (
            item for item in programs["kleuters"][DAY_INDEX["dinsdag"]]
            if "vegen" in item["title"].lower()
        ),
        None,
    )
    if not source:
        return

    for category in ["pupillen", "jongeren", "ouderen"]:
        tuesday = programs[category][DAY_INDEX["dinsdag"]]
        if any("vegen" in item["title"].lower() for item in tuesday):
            continue
        tuesday.append(source.copy())
        tuesday.sort(key=lambda item: tuple(int(part) for part in item["time"].split(":")))


def structure_youth_film(programs):
    """Split the Wednesday youth film description into a readable timeline."""
    wednesday = programs["jongeren"][DAY_INDEX["woensdag"]]
    film = next(
        (
            item for item in wednesday
            if item["time"] == "13:00" and item["title"].startswith("Film in")
        ),
        None,
    )
    if not film:
        return

    film.update({
        "title": "Film: Encanto",
        "detail": "Laat kinderen vooraf plassen en wat drinken. In de gymzaal wordt niet gedronken; zakjes chips mogen wel mee.",
        "type": "show",
        "rotation": {
            "id": "jongeren-film-woensdag",
            "mode": "timeline",
            "className": "show",
            "location": "Gymzaal Wilgenstraat",
            "summary": "Encanto · 1 uur 49 min",
            "steps": [
                {"time": "13:00", "title": "Start deel 1", "detail": "Duur: 1 uur"},
                {"time": "14:00", "title": "Pauze", "detail": "Plassen, drinken halen en een zakje chips"},
                {"time": "14:20", "title": "Start deel 2", "detail": "Duur: 50 minuten"},
                {"time": "15:10", "title": "Einde film"},
            ],
        },
    })


def compact_older_imposter_schedule(programs):
    """Combine the Monday Imposter sub-events into one example timeline."""
    monday = programs["ouderen"][DAY_INDEX["maandag"]]
    parent = next(
        (
            item for item in monday
            if item["time"] == "10:15" and item["title"] == "Imposter game (aula)"
        ),
        None,
    )
    if not parent:
        return

    children = [
        item for item in monday
        if item["title"].startswith("Imposter game (aula):")
    ]
    if len(children) != 3:
        return

    steps = []
    for item in children:
        end_match = re.search(r"Tijdblok tot\s+(\d{2}:\d{2})", item["detail"])
        steps.append({
            "time": f"{item['time']}–{end_match.group(1)}" if end_match else item["time"],
            "title": item["title"].split(":", 1)[1].strip(),
        })

    parent.update({
        "title": "Imposter game en spellen",
        "detail": "Speel minimaal de Imposter game. Dit is een voorbeeldschema; beslis gerust met je groep welke extra spellen je speelt en hoe lang.",
        "type": "game",
        "rotation": {
            "id": "ouderen-imposter-maandag",
            "mode": "timeline",
            "className": "game",
            "location": "Aula",
            "summary": "3 spellen · voorbeeldschema",
            "steps": steps,
        },
    })
    programs["ouderen"][DAY_INDEX["maandag"]] = [
        item for item in monday if item not in children
    ]


def compact_older_monday_afternoon(programs):
    """Replace the scattered Monday afternoon entries with group routes."""
    monday = programs["ouderen"][DAY_INDEX["maandag"]]
    route_items = [
        item for item in monday
        if re.match(r"^groep\s+[1-3]:", item["title"], re.I)
        and "13:00" <= item["time"] <= "14:45"
    ]
    if len(route_items) != 10:
        return

    parent = next(
        (item for item in route_items if item["time"] == "13:00"),
        None,
    )
    if not parent:
        return

    parent.update({
        "title": "Middagroulatie: Lasergamen en Crazy88",
        "detail": "Bekijk hieronder de route per groep. Lever de Crazy88-formulieren uiterlijk om 15:30 in bij Rob.",
        "type": "game",
        "rotation": {
            "id": "ouderen-middagroulatie-maandag",
            "mode": "groupRoutes",
            "className": "game",
            "location": "Odulphus en de wijk",
            "summary": "3 groepen · 13:00–15:30",
            "groups": ["Groep 1", "Groep 2", "Groep 3"],
            "routes": {
                "Groep 1": [
                    {"time": "13:00–13:45", "title": "Lasergamen", "detail": "Gymzaal Laagstraat"},
                    {"time": "13:45–14:00", "title": "Ranja- en plaspauze"},
                    {"time": "14:00–15:30", "title": "Crazy88", "detail": "In de wijk"},
                ],
                "Groep 2": [
                    {"time": "13:00–13:45", "title": "Crazy88 · deel 1", "detail": "In de wijk"},
                    {"time": "13:45–14:30", "title": "Lasergamen", "detail": "Gymzaal Laagstraat"},
                    {"time": "14:30–14:45", "title": "Ranja- en plaspauze"},
                    {"time": "14:45–15:30", "title": "Crazy88 · deel 2", "detail": "In de wijk"},
                ],
                "Groep 3": [
                    {"time": "13:00–14:30", "title": "Crazy88", "detail": "In de wijk"},
                    {"time": "14:30–14:45", "title": "Ranja- en plaspauze"},
                    {"time": "14:45–15:30", "title": "Lasergamen", "detail": "Gymzaal Laagstraat"},
                ],
            },
        },
    })
    programs["ouderen"][DAY_INDEX["maandag"]] = [
        item for item in monday if item is parent or item not in route_items
    ]


def compact_older_zeskamp(programs):
    """Combine both Wednesday Zeskamp phases into clear rotation cards."""
    wednesday = programs["ouderen"][DAY_INDEX["woensdag"]]
    phase_config = [
        {
            "number": 1,
            "start": "15:00",
            "stations": ["Hardlopen", "Touwtrekken", "Verspringen"],
        },
        {
            "number": 2,
            "start": "16:00",
            "stations": ["Estafette", "Rekstokhangen", "Houtblokken"],
        },
    ]
    remove_items = []

    for phase in phase_config:
        parent = next(
            (
                item for item in wednesday
                if item["time"] == phase["start"]
                and item["title"] == f"Zeskamp - deel {phase['number']}"
            ),
            None,
        )
        if not parent:
            continue

        station_pattern = "|".join(re.escape(station) for station in phase["stations"])
        match_pattern = re.compile(
            rf"^(?P<first>Groep\s+\d+)\s+vs\s+(?P<second>Groep\s+\d+):\s+"
            rf"(?P<station>{station_pattern})$",
            re.I,
        )
        rounds = {}
        phase_items = []
        for item in wednesday:
            match = match_pattern.match(item["title"])
            if not match:
                continue
            station = next(
                name for name in phase["stations"]
                if name.lower() == match.group("station").lower()
            )
            end_match = re.search(r"Tijdblok tot\s+(\d{2}:\d{2})", item["detail"])
            round_data = rounds.setdefault(item["time"], {
                "time": item["time"],
                "label": f"{item['time']}–{end_match.group(1)}" if end_match else item["time"],
                "assignments": [],
            })
            round_data["assignments"].append({
                "station": station,
                "groups": f"{match.group('first')} vs {match.group('second')}",
            })
            phase_items.append(item)

        if len(rounds) != 3 or any(len(round_data["assignments"]) != 3 for round_data in rounds.values()):
            continue

        for round_data in rounds.values():
            round_data["assignments"].sort(
                key=lambda assignment: phase["stations"].index(assignment["station"])
            )
        parent.update({
            "title": f"Zeskamp · deel {phase['number']}",
            "type": "sport",
            "rotation": {
                "id": f"ouderen-zeskamp-woensdag-deel-{phase['number']}",
                "mode": "matches",
                "className": "sport",
                "location": "Kampterrein",
                "summary": "3 onderdelen · 3 rondes",
                "rounds": [rounds[time] for time in sorted(rounds)],
                "groups": [f"Groep {number}" for number in range(1, 7)],
            },
        })
        remove_items.extend(phase_items)

    programs["ouderen"][DAY_INDEX["woensdag"]] = [
        item for item in wednesday if item not in remove_items
    ]


def compact_older_camp_night(programs):
    """Make the Wednesday evening and overnight camp plan explicit."""
    wednesday = programs["ouderen"][DAY_INDEX["woensdag"]]
    titles = [
        "Chillen met die billen",
        "Ranjacantus",
        "Omkleden",
        "Lantaarns maken",
        "Spooktocht",
        "Soep en marshmallows bij het kampvuur",
        "Leiding jongeren en kleuters uiterlijk naar huis",
    ]
    night_items = [item for item in wednesday if item["title"] in titles]
    if len(night_items) != len(titles):
        return

    parent = next((item for item in night_items if item["time"] == "18:00"), None)
    if not parent:
        return

    steps = []
    for item in night_items:
        display_time = (
            f"{item['time']} donderdag"
            if item["time"] in {"00:00", "01:00"}
            else item["time"]
        )
        steps.append({
            "time": display_time,
            "title": item["title"],
            "detail": item["detail"],
        })

    parent.update({
        "title": "Avond- en nachtprogramma",
        "detail": "Het volledige kampavondprogramma, inclusief voorbereiding, spooktocht en gezamenlijke afsluiting bij het kampvuur.",
        "type": "camp",
        "rotation": {
            "id": "ouderen-kampavond-woensdag",
            "mode": "timeline",
            "className": "camp",
            "location": "Kamp Heukelom",
            "summary": "18:00–01:00 · spooktocht om 22:00",
            "steps": steps,
        },
    })
    programs["ouderen"][DAY_INDEX["woensdag"]] = [
        item for item in wednesday if item is parent or item not in night_items
    ]


def compact_older_bingo(programs):
    """Combine Thursday's Bingo rounds and break into one timeline."""
    thursday = programs["ouderen"][DAY_INDEX["donderdag"]]
    parent = next(
        (
            item for item in thursday
            if item["time"] == "13:30" and item["title"] == "Alle dagen feest - Bingo"
        ),
        None,
    )
    if not parent:
        return

    children = [
        item for item in thursday
        if item["title"].startswith("Alle dagen feest - Bingo:")
    ]
    if len(children) != 4:
        return

    steps = []
    for item in children:
        end_match = re.search(r"Tijdblok tot\s+(\d{2}:\d{2})", item["detail"])
        steps.append({
            "time": f"{item['time']}–{end_match.group(1)}" if end_match else item["time"],
            "title": item["title"].split(":", 1)[1].strip(),
        })

    parent.update({
        "title": "Alle dagen feest · Bingo",
        "detail": "Drie bingorondes. Zorg voor één spelleider en twee of drie begeleiders die bingokaarten controleren.",
        "type": "game",
        "rotation": {
            "id": "ouderen-bingo-donderdag",
            "mode": "timeline",
            "className": "game",
            "location": "Kamp Heukelom",
            "summary": "3 rondes · pauze om 14:10",
            "steps": steps,
        },
    })
    programs["ouderen"][DAY_INDEX["donderdag"]] = [
        item for item in thursday if item not in children
    ]


def add_freeflow_feestraces(programs):
    """Add expandable station lists where the source has no timed rotation."""
    pupil_monday = programs["pupillen"][DAY_INDEX["maandag"]]
    pupil_item = next(
        (item for item in pupil_monday if item["time"] == "11:15"),
        None,
    )
    if pupil_item:
        pupil_item.update({
            "title": "Feestrace (binnenplaats)",
            "detail": "De Feestrace bestaat uit vier spellen. Bekijk hieronder welke spellen klaarstaan.",
            "type": "show",
            "rotation": {
                "id": "pupillen-feestrace-maandag",
                "mode": "free",
                "location": "Binnenplaats",
                "stations": [
                    "Ballonchallenge",
                    "Ringen werpen",
                    "Snoephappen",
                    "Menselijke slinger",
                ],
                "groups": ["Alle pupillengroepen"],
            },
        })

    youth_wednesday = programs["jongeren"][DAY_INDEX["woensdag"]]
    youth_stations = [
        "Ranja/water pong",
        "Ballon challenge",
        "Ringen werpen",
        "Snoephappen",
        "Menselijke slinger",
    ]
    for item in youth_wednesday:
        if not re.search(r":\s*Feestrace\b", item["title"], re.I):
            continue
        group_label = item["title"].split(":", 1)[0]
        group_match = re.search(r"Jongeren\s+(\d+)\s*\+\s*(\d+)", group_label, re.I)
        groups = (
            [f"Jongeren {group_match.group(1)}", f"Jongeren {group_match.group(2)}"]
            if group_match
            else [group_label]
        )
        item["rotation"] = {
            "id": f"jongeren-feestrace-woensdag-{item['time'].replace(':', '')}",
            "mode": "free",
            "location": "Binnenplaats",
            "stations": youth_stations,
            "groups": groups,
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kleuters", required=True)
    parser.add_argument("--pupillen", required=True)
    parser.add_argument("--jongeren", required=True)
    parser.add_argument("--ouderen", required=True)
    parser.add_argument("--output", default="program-data.js")
    args = parser.parse_args()

    paths = {
        "kleuters": args.kleuters,
        "pupillen": args.pupillen,
        "jongeren": args.jongeren,
        "ouderen": args.ouderen,
    }
    programs = {}
    themes = {}
    for category, path in paths.items():
        programs[category], themes[category] = schedule_tables(path)

    compact_kleuter_feestrace(programs)
    compact_kleuter_thursday_rotation(programs)
    compact_pupil_taartentrefbal(programs)
    add_to_verland_sweeping(programs)
    structure_youth_film(programs)
    compact_older_imposter_schedule(programs)
    compact_older_monday_afternoon(programs)
    compact_older_zeskamp(programs)
    compact_older_camp_night(programs)
    compact_older_bingo(programs)
    add_freeflow_feestraces(programs)
    assign_activity_ids(programs)

    for category, days in programs.items():
        if len(days) != 6 or any(not day for day in days):
            raise ValueError(f"Onvolledig programma voor {category}")
        for day in days:
            for item in day:
                if not re.fullmatch(r"\d{2}:\d{2}", item["time"]) or not item["title"]:
                    raise ValueError(f"Ongeldige activiteit voor {category}: {item}")

    payload = (
        "// Generated from the four 2026 Word program files.\n"
        f"window.KVW_PROGRAM_DATA = {json.dumps(programs, ensure_ascii=False, indent=2)};\n"
        f"window.KVW_PROGRAM_THEMES = {json.dumps(themes, ensure_ascii=False, indent=2)};\n"
    )
    Path(args.output).write_text(payload, encoding="utf-8")


if __name__ == "__main__":
    main()

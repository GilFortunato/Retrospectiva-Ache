"""Import aggregate BI data from an Excel workbook without executing macros.

Usage: python scripts/import-bi-demografico.py /path/to/source.xlsm
The source file and individual participant records must stay outside this repository.
"""

import argparse
from collections import Counter
from datetime import date
import json
import math
from pathlib import Path
import posixpath
from statistics import mean
from xml.etree import ElementTree as ET
from zipfile import ZipFile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
MISSING = "Não informado"
MINIMUM_COHORT = 5
AGE_ORDER = ["18–24", "25–34", "35–44", "45–54", "55+", "Não informada"]


def read_base(path):
    with ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next((s for s in workbook.findall("m:sheets/m:sheet", NS) if s.attrib["name"] == "Base Tratada"), None)
        if sheet is None:
            raise ValueError("A aba Base Tratada não foi encontrada.")
        relations = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next(r.attrib["Target"] for r in relations if r.attrib["Id"] == sheet.attrib[f"{{{REL}}}id"])
        target = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
        rows = []
        for row in ET.fromstring(archive.read(target)).findall("m:sheetData/m:row", NS):
            cells = {}
            for cell in row.findall("m:c", NS):
                column = "".join(ch for ch in cell.attrib["r"] if ch.isalpha())
                value = cell.findtext("m:v", default="", namespaces=NS)
                kind = cell.attrib.get("t")
                if kind == "s":
                    value = shared[int(value)] if value else ""
                elif kind == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                elif kind not in ("str", "e") and value:
                    try:
                        value = float(value)
                    except ValueError:
                        pass
                cells[column] = value
            rows.append(cells)
    header = rows[0]
    required = {"Participante", "Gênero", "Raça/cor", "Idade", "Cidade", "UF", "Região Brasil", "Região SP", "Área formação", "Situação formação"}
    if not required.issubset(set(header.values())):
        raise ValueError("A estrutura da Base Tratada não corresponde ao BI demográfico.")
    records = [{label: row.get(column, "") for column, label in header.items()} for row in rows[1:] if row.get("A")]
    identities = [str(r["Participante"]).strip().casefold() for r in records]
    if len(identities) != len(set(identities)):
        raise ValueError("Há participantes repetidos. Revise a base antes da importação.")
    if not records:
        raise ValueError("A base está vazia.")
    return records


def label(value):
    return str(value).strip() if value not in (None, "", "—", "-") else MISSING


def valid_age(record):
    age = record["Idade"]
    return float(age) if isinstance(age, (int, float)) and math.isfinite(age) and 18 <= age <= 100 else None


def age_band(record):
    age = valid_age(record)
    if age is None:
        return "Não informada"
    for maximum, band in [(24, "18–24"), (34, "25–34"), (44, "35–44"), (54, "45–54")]:
        if age <= maximum:
            return band
    return "55+"


def distribution(records, field):
    values = Counter(label(r[field]) for r in records)
    return [{"label": name, "count": count} for name, count in sorted(values.items(), key=lambda v: (-v[1], v[0].casefold()))]


def summarize(records):
    total = len(records)
    # Do not publish demographic breakdowns for very small geographic cohorts.
    if total < MINIMUM_COHORT:
        return {"total": total, "restricted": True, "cityCount": None, "stateCount": None, "regionCount": None, "age": None, "distributions": None}
    ages = [valid_age(r) for r in records if valid_age(r) is not None]
    bands = Counter(age_band(r) for r in records)
    sp = [r for r in records if label(r["UF"]) == "SP"]
    cities = distribution(records, "Cidade")
    city_display = [item for item in cities if item["count"] >= 3 and item["label"] != MISSING][:10]
    other_count = sum(item["count"] for item in cities if item["label"] != MISSING) - sum(item["count"] for item in city_display)
    if other_count:
        city_display.append({"label": "Demais localidades", "count": other_count})
    missing_city = sum(item["count"] for item in cities if item["label"] == MISSING)
    if missing_city:
        city_display.append({"label": MISSING, "count": missing_city})
    return {
        "total": total,
        "restricted": False,
        "cityCount": len({label(r["Cidade"]) for r in records} - {MISSING}),
        "stateCount": len({label(r["UF"]) for r in records} - {MISSING}),
        "regionCount": len({label(r["Região Brasil"]) for r in records} - {MISSING}),
        "age": {"mean": round(mean(ages), 4) if ages else None, "valid": len(ages), "invalid": total - len(ages)},
        "distributions": {
            "gender": distribution(records, "Gênero"),
            "race": distribution(records, "Raça/cor"),
            "ageBands": [{"label": name, "count": bands[name]} for name in AGE_ORDER if bands[name]],
            "education": distribution(records, "Área formação"),
            "educationStatus": distribution(records, "Situação formação"),
            "regions": distribution(records, "Região Brasil"),
            "states": distribution(records, "UF"),
            "spRegions": distribution(sp, "Região SP"),
            "cities": city_display,
        },
    }


def build(path, reference_date):
    records = read_base(path)
    regions = sorted({label(r["Região Brasil"]) for r in records} - {MISSING})
    states = sorted({(label(r["UF"]), label(r["Região Brasil"])) for r in records if label(r["UF"]) != MISSING})
    sp_regions = sorted({label(r["Região SP"]) for r in records if label(r["UF"]) == "SP"} - {MISSING})
    slices = {"all": summarize(records)}
    for region in regions:
        slices["region:" + region] = summarize([r for r in records if label(r["Região Brasil"]) == region])
    for state, _ in states:
        slices["state:" + state] = summarize([r for r in records if label(r["UF"]) == state])
    for region in sp_regions:
        slices["sp:" + region] = summarize([r for r in records if label(r["UF"]) == "SP" and label(r["Região SP"]) == region])
    return {
        "source": {"fileName": path.name, "sheet": "Base Tratada", "referenceDate": reference_date, "minimumCohort": MINIMUM_COHORT},
        "filters": {"regions": regions, "states": [{"value": state, "region": region} for state, region in states], "spRegions": sp_regions},
        "slices": slices,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--reference-date", default="2026-09-18", type=lambda value: date.fromisoformat(value).isoformat())
    args = parser.parse_args()
    result = build(args.workbook, args.reference_date)
    destination = Path(__file__).resolve().parents[1] / "src/data/bi-demografico.json"
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"BI importado: {result['slices']['all']['total']} participantes; {len(result['slices'])} recortes consolidados. Nenhum registro individual exportado.")

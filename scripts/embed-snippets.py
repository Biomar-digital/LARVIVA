"""Write docs/larviva-embed-snippets.xlsx: one row per BioMar market site and
page (hatchery stage page / LARVIVA page) with the iframe snippet to paste.

Run: python3 scripts/embed-snippets.py   (needs openpyxl)
"""
import json, os
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://biomar-digital.github.io/LARVIVA/"

# Market sites of biomar.com (Umbraco language variants) and their language.
MARKETS = [
    ("Global", "en", "English"), ("Australia", "en", "English"), ("Costa Rica", "es", "Spanish"),
    ("Danmark", "da", "Danish"), ("Deutschland", "de", "German"), ("Ecuador", "es", "Spanish"),
    ("España", "es", "Spanish"), ("France", "fr", "French"), ("Italia", "it", "Italian"),
    ("Norge", "nb", "Norwegian (Bokmål)"), ("Philippines", "en", "English"), ("Polska", "pl", "Polish"),
    ("Suomi", "fi", "Finnish"), ("Sverige", "sv", "Swedish"), ("Türkiye", "tr", "Turkish"),
    ("United Kingdom", "en", "English"), ("Việt Nam", "vi", "Vietnamese"), ("Ελλάδα", "el", "Greek"),
    ("Chile", "es", "Spanish"), ("中国", "zh", "Chinese (Simplified)"),
]
# Shrimp-led markets: Ecuador sells only shrimp feed (no Fish tab); Costa Rica
# and Viet Nam open on Shrimp with Fish as the second tab.
PORTFOLIO = {"Ecuador": "only=shrimp", "Costa Rica": "start=shrimp", "Việt Nam": "start=shrimp"}
PORTFOLIO_LABEL = {None: "Fish first, Shrimp second", "start=shrimp": "Shrimp first, Fish second", "only=shrimp": "Shrimp only"}

PAGES = [
    ("Hatchery stage page", "embed.html", "larviva-journey-hatchery"),
    ("LARVIVA page", "embed-larviva.html", "larviva-journey-larviva"),
]

def dict_for(lang):
    path = os.path.join(ROOT, "data", "i18n", lang + ".json")
    return json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}

def snippet(url, frame_id, title):
    return (
        '<iframe id="%s"\n'
        '        src="%s"\n'
        '        title="%s"\n'
        '        style="width:100%%;border:0;display:block"\n'
        '        height="650" loading="lazy"></iframe>\n'
        "<script>\n"
        '  window.addEventListener("message", function (e) {\n'
        '    var frame = document.getElementById("%s");\n'
        "    if (!frame || !e.data || e.source !== frame.contentWindow) return;\n"
        '    if (e.data.type === "larviva-journey:height") frame.style.height = e.data.height + "px";\n'
        '    if (e.data.type === "larviva-journey:scroll") {\n'
        "      var y = frame.getBoundingClientRect().top + e.data.top;\n"
        '      if (y < 0 || y > window.innerHeight * 0.7) window.scrollTo({ top: window.pageYOffset + y - 16, behavior: "smooth" });\n'
        "    }\n"
        "  });\n"
        "</script>"
    ) % (frame_id, url, title.replace('"', "&quot;"), frame_id)

wb = Workbook()
ws = wb.active
ws.title = "Snippets"
head = ["Market site", "Language", "Page", "Portfolios", "Module link (preview)", "HTML snippet to paste", "Notes"]
ws.append(head)
for market, lang, lang_name in MARKETS:
    d = dict_for(lang)
    for page, file, frame_id in PAGES:
        params = ([] if lang == "en" else ["lang=" + lang]) + ([PORTFOLIO[market]] if market in PORTFOLIO else [])
        url = BASE + file + ("?" + "&".join(params) if params else "")
        title = d.get("LARVIVA hatchery range", "LARVIVA hatchery range")
        note = "" if lang == "en" or d else "Translation file missing – shows English."
        if lang != "en" and d:
            note = "Machine-assisted translation – please have the local team review."
        ws.append([market, "%s (%s)" % (lang_name, lang), page, PORTFOLIO_LABEL[PORTFOLIO.get(market)], url,
                   snippet(url, frame_id, title), note])

widths = [18, 24, 22, 24, 62, 110, 40]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1F3E77")
for row in ws.iter_rows(min_row=2):
    for c in row:
        c.alignment = Alignment(wrap_text=True, vertical="top")
    row[4].hyperlink = row[4].value
    row[4].font = Font(color="0563C1", underline="single")
    row[5].font = Font(name="Consolas", size=9)
ws.freeze_panes = "A2"
ws.auto_filter.ref = ws.dimensions

info = wb.create_sheet("How to use")
for line in [
    ["How to add the module to a market page"],
    [""],
    ["1. Find the row for the market site and the page (Hatchery stage page or LARVIVA page)."],
    ["2. Copy the whole cell in column F (HTML snippet)."],
    ["3. In Umbraco, open that language variant of the page and paste it into an HTML / embed block that keeps <script> tags."],
    ["4. Save and preview. The module resizes itself; on phones it scrolls to the product card a visitor opens."],
    [""],
    ["Column E opens the module on its own, to check the translation before pasting."],
    ["Column D: which portfolios the market shows. ?start=shrimp opens Shrimp first (Fish still available); ?only=shrimp shows Shrimp only."],
    ["English sites use the link without ?lang=. Other languages add ?lang=xx (es, da, de, fr, it, nb, pl, fi, sv, tr, vi, el, zh)."],
    ["Translations live in data/i18n/<lang>.json in the project (English phrase → translation). Edit there and run npm run build."],
    ["Product links (shrimp) open the global biomar.com product pages in a new tab (see the Product links sheet)."],
]:
    info.append(line)
info.column_dimensions["A"].width = 120
info["A1"].font = Font(bold=True, size=13)

links = wb.create_sheet("Product links")
links.append(["Product", "Shown on", "\"View product details\" opens"])
data = json.loads(open(os.path.join(ROOT, "data", "larviva-journey.en.json"), encoding="utf-8").read())
for pr in data["products"]:
    if pr.get("published") is False or not pr.get("url"):
        continue
    pages = pr.get("pages") or ["hatchery", "larviva"]
    shown = " + ".join({"hatchery": "Hatchery stage page", "larviva": "LARVIVA page"}[p] for p in pages)
    links.append([pr["name"], shown, pr["url"]])
for c in links[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1F3E77")
for i, w in enumerate([26, 36, 70], 1):
    links.column_dimensions[get_column_letter(i)].width = w
for row in links.iter_rows(min_row=2):
    row[2].hyperlink = row[2].value
    row[2].font = Font(color="0563C1", underline="single")

out = os.path.join(ROOT, "docs", "larviva-embed-snippets.xlsx")
wb.save(out)
print("wrote", out, ws.max_row - 1, "rows")

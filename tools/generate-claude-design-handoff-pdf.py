from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "claude-design-asset-production-handoff.pdf"


def register_fonts():
    candidates = [
        ("/System/Library/Fonts/PingFang.ttc", "FindscapeSans"),
        ("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", "FindscapeSans"),
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "FindscapeSans"),
    ]
    for path, name in candidates:
        if Path(path).exists():
            try:
                pdfmetrics.registerFont(TTFont(name, path, subfontIndex=0))
                return name
            except Exception:
                continue
    return "Helvetica"


FONT = register_fonts()
PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#243746")
CORAL = colors.HexColor("#E66A5C")
GREEN = colors.HexColor("#4F8068")
YELLOW = colors.HexColor("#F2C14E")
PALE = colors.HexColor("#F4F6F3")
INK = colors.HexColor("#263238")
MUTED = colors.HexColor("#5F6B70")
LINE = colors.HexColor("#D8DEDA")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName=FONT, fontSize=28, leading=33, textColor=NAVY, spaceAfter=7 * mm))
styles.add(ParagraphStyle(name="Deck", fontName=FONT, fontSize=12, leading=17, textColor=MUTED, spaceAfter=5 * mm))
styles.add(ParagraphStyle(name="H1X", fontName=FONT, fontSize=19, leading=23, textColor=NAVY, spaceBefore=5 * mm, spaceAfter=3 * mm))
styles.add(ParagraphStyle(name="H2X", fontName=FONT, fontSize=13.5, leading=17, textColor=GREEN, spaceBefore=4 * mm, spaceAfter=2 * mm))
styles.add(ParagraphStyle(name="BodyX", fontName=FONT, fontSize=9.2, leading=13.2, textColor=INK, spaceAfter=2.5 * mm))
styles.add(ParagraphStyle(name="SmallX", fontName=FONT, fontSize=7.7, leading=10.5, textColor=MUTED))
styles.add(ParagraphStyle(name="PromptX", fontName=FONT, fontSize=8.6, leading=12.5, textColor=INK, leftIndent=4 * mm, rightIndent=4 * mm, spaceBefore=2 * mm, spaceAfter=3 * mm))
styles.add(ParagraphStyle(name="CalloutX", fontName=FONT, fontSize=9.3, leading=13.3, textColor=NAVY, leftIndent=4 * mm, rightIndent=4 * mm))
styles.add(ParagraphStyle(name="CoverMeta", fontName=FONT, fontSize=9, leading=13, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="Footer", fontName=FONT, fontSize=7.3, leading=9, textColor=MUTED, alignment=TA_CENTER))


def p(text, style="BodyX"):
    return Paragraph(escape(text).replace("\n", "<br/>"), styles[style])


def bullets(items):
    return [Paragraph("• " + escape(item), styles["BodyX"]) for item in items]


def heading(text, level=1):
    return Paragraph(escape(text), styles["H1X" if level == 1 else "H2X"])


def callout(text, color=YELLOW):
    table = Table([[Paragraph(escape(text), styles["CalloutX"])]], colWidths=[166 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.Color(color.red, color.green, color.blue, alpha=0.16)),
        ("BOX", (0, 0), (-1, -1), 0.8, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return table


def data_table(rows, widths):
    content = [[Paragraph(escape(str(cell)), styles["SmallX"]) for cell in row] for row in rows]
    table = Table(content, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8 * mm),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
    ]))
    return table


def decorate_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 10 * mm, PAGE_W, 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(CORAL)
    canvas.rect(0, PAGE_H - 10 * mm, 28 * mm, 10 * mm, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(20 * mm, 15 * mm, PAGE_W - 20 * mm, 15 * mm)
    footer = Paragraph(f"Findscape / Claude Design Asset Handoff · {doc.page}", styles["Footer"])
    footer.wrapOn(canvas, PAGE_W - 40 * mm, 8 * mm)
    footer.drawOn(canvas, 20 * mm, 7 * mm)
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(20 * mm, 19 * mm, PAGE_W - 40 * mm, PAGE_H - 35 * mm, id="body")
    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=16 * mm, bottomMargin=19 * mm)
    doc.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=decorate_page)])
    story = []

    story += [Spacer(1, 24 * mm), p("CLAUDE DESIGN PRODUCTION BRIEF", "Deck"), Paragraph("Findscape Asset Handoff", styles["TitleX"]), p("A production-ready prompt and export contract for the first Cocos Creator hidden-object asset batch.", "Deck")]
    meta = Table([
        [p("PROJECT", "CoverMeta"), p("Findscape Cocos Demo", "CoverMeta")],
        [p("VERSION", "CoverMeta"), p("1.0 · 13 July 2026", "CoverMeta")],
        [p("PRIORITY", "CoverMeta"), p("Batch A first: world map + five target sprites", "CoverMeta")],
        [p("DELIVERY", "CoverMeta"), p("Separate PNG assets + review contact sheet", "CoverMeta")],
    ], colWidths=[32 * mm, 120 * mm])
    meta.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("BOX", (0, 0), (-1, -1), 0, NAVY), ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#52636E")), ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm), ("TOPPADDING", (0, 0), (-1, -1), 3 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm)]))
    story += [Spacer(1, 12 * mm), meta, Spacer(1, 10 * mm), callout("Start with Batch A only. The clean map and target sprites must remain separate runtime assets.", CORAL)]

    story += [heading("1. How To Use This Handoff"), p("Give this PDF to Claude Design. Paste the master prompt below with the PDF attached. Ask for a Batch A contact sheet first, approve the visual family, then request separate production exports. Continue to Batch B and Batch C only after the previous batch is accepted.")]
    prompt = """You are the visual design and asset production partner for Findscape, a cozy mobile hidden-object game built with Cocos Creator. Read the full attached handoff before producing anything. Work in three reviewable batches and begin with Batch A only. Maintain one cohesive visual language: cozy hand-drawn casual game art, soft rounded lines, friendly multicolor palette, clean silhouettes, gentle texture, and strong readability on a phone. The audience is 15-35 and the experience should feel calm, playful, polished, and low-pressure.\n\nThe game map is the main playable surface. Do not bake HUD, labels, target objects, watermarks, signatures, or generated text into the clean map background. Target sprites must be separate transparent PNG assets so the runtime can position and animate them. UI mockups are implementation references; export reusable visual components separately whenever possible.\n\nFollow the exact canvas sizes, transparency requirements, filenames, and safe-area rules in this handoff. Do not combine multiple requested runtime assets into one image unless explicitly called a reference sheet. Avoid photorealism, 3D rendering, heavy gradients, muddy monochrome grading, harsh black outlines, sharp aggressive forms, visual noise, illegible micro-detail, and copyrighted characters or brand marks.\n\nFor each batch, first show a cohesive contact sheet for review. After approval, export each deliverable separately at the specified dimensions. Include a short note listing deviations or design decisions. Start now with Batch A: World and Core Targets."""
    prompt_box = Table([[Paragraph(escape(prompt).replace("\n", "<br/>"), styles["PromptX"])]], colWidths=[166 * mm])
    prompt_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE), ("BOX", (0, 0), (-1, -1), 0.8, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm), ("TOPPADDING", (0, 0), (-1, -1), 3 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm)]))
    story += [KeepTogether([heading("Master Prompt", 2), prompt_box])]

    story += [heading("2. Product And Visual Context"), p("Findscape is a reusable hidden-object game foundation. One large landscape map is panned and zoomed behind a compact portrait-mobile HUD. The runtime places, highlights, removes, animates, and scores separate target sprites."), heading("Five reusable target categories", 2)]
    story += bullets(["Pineapple: classic hidden-object find.", "Balloon: visible tap-to-pop variant.", "Thief: cute tap-to-catch character variant.", "Puppy: friendly hidden-object variant.", "Gem: higher-difficulty hidden treasure."])
    story += [heading("Desired visual system", 2)] + bullets(["Cozy hand-drawn illustration with soft, confident linework.", "Balanced multicolor palette: leafy green, sky blue, coral, sunny yellow, berry red, lavender, and warm neutrals.", "Rounded simplified forms, gentle authored texture, readable local contrast.", "Strong silhouettes at 48-96 px; calm, playful, polished, and low-pressure."])
    story += [heading("Hard exclusions", 2)] + bullets(["No photorealism, glossy 3D, anime rendering, pixel art, or flat corporate vector style.", "No dark mood, weapons, threatening crime imagery, copyrighted characters, or brand marks.", "No heavy gradients, neon bloom, hard black outlines, fake text, watermarks, or signatures.", "No baked HUD or targets in the clean map; no checkerboard baked into transparent assets."])

    story += [heading("3. Batch A - World And Core Targets"), callout("Batch A blocks runtime art integration. Generate and review it before all other assets.", CORAL), heading("A1. Clean Demo Cozy Town Map", 2), p("Filename: source_map_demo_cozy_town_placeholder_YYYYMMDD_01.png\nCanvas: 2400 x 1600 px · opaque PNG · landscape")]
    story += [p("Create a cozy town park and street market with distinct regions: produce market and cafe frontage, central square or fountain, park and picnic area, small shopfronts, trees and planters, benches, baskets, awnings, windows, text-free signs, blankets, crates, and small props. Distribute at least 30 plausible hiding places across the full map while preserving visual paths and mobile readability.")]
    story += [callout("The clean map must contain none of the five gameplay targets: no pineapple, free-floating balloon, sneaky thief, hidden puppy, or loose gem.", YELLOW), heading("Runtime composition anchors", 2)]
    anchors = [["Target", "Coordinate", "Nearby context"], ["Pineapple 1", "420, 980", "Produce stall, basket, patterned market props"], ["Puppy", "720, 1340", "Bench, blanket, planter, low garden"], ["Balloon 1", "980, 360", "Open sky gap, awning, festival string"], ["Thief", "1320, 840", "Kiosk, alley, crates, central crowd gap"], ["Pineapple 2", "1670, 1160", "Cafe table, fruit display, shopfront"], ["Gem", "1880, 1380", "Fountain, flower bed, drain, stonework"], ["Balloon 2", "2040, 520", "Canopy gap, awning, lamp post"]]
    story += [data_table(anchors, [30 * mm, 27 * mm, 109 * mm]), p("Coordinates use the top-left of the 2400 x 1600 image. They guide composition only; never paint targets into the clean map.", "SmallX")]

    story += [heading("A2. Five Separate Target Sprites", 2), p("Export each as a separate 512 x 512 px transparent PNG. Center each object with moderate padding, preserve a complete silhouette, and match the map's linework, lighting, and texture.")]
    targets = [["Filename", "Direction"], ["source_target_pineapple_YYYYMMDD_01.png", "Natural pineapple; leafy crown; yellow-green contrast"], ["source_target_balloon_YYYYMMDD_01.png", "Rounded coral/berry balloon; short soft string; no glossy 3D"], ["source_target_thief_YYYYMMDD_01.png", "Cute sneaky character; cap/mask/satchel; harmless; no weapon"], ["source_target_puppy_YYYYMMDD_01.png", "Friendly small puppy; crouched or peeking pose; simple face"], ["source_target_gem_YYYYMMDD_01.png", "Rounded soft facets and sparkle; teal/berry/violet; not sharp"]]
    acceptance = [heading("Batch A acceptance", 2)] + bullets(["Map reads both as a whole and at 2x zoom, with at least 30 hiding positions.", "True alpha transparency on targets; no floor patch, tile, frame, text, or watermark.", "Targets remain recognizable near 64 px and look native when composited on the map.", "Categories differ by silhouette, not color alone.", "Provide one review-only composite placing all targets at the seven anchor points."])
    story += [data_table(targets, [82 * mm, 84 * mm]), KeepTogether(acceptance)]

    story += [heading("4. Batch B - Icons And Tools"), p("After Batch A approval, export seven separate 256 x 256 px transparent PNG icons. These are simplified close relatives of target sprites. Keep consistent optical scale and safe padding. Do not bake circular button backgrounds."), data_table([["Filename", "Content"], ["source_icon_pineapple_YYYYMMDD_01.png", "Simplified pineapple"], ["source_icon_balloon_YYYYMMDD_01.png", "Simplified balloon"], ["source_icon_thief_YYYYMMDD_01.png", "Cute thief portrait/silhouette"], ["source_icon_puppy_YYYYMMDD_01.png", "Puppy portrait/silhouette"], ["source_icon_gem_YYYYMMDD_01.png", "Simplified gem"], ["source_tool_hint_YYYYMMDD_01.png", "Lightbulb or gentle sparkle beacon; no text"], ["source_tool_magnifier_YYYYMMDD_01.png", "Clear magnifying glass; no text"]], [88 * mm, 78 * mm]), heading("Batch B acceptance", 2)] + bullets(["Readable at 32-48 px.", "Consistent visual weight, padding, and transparent backgrounds.", "Hint and magnifier are distinguishable without labels."])

    story += [heading("5. Batch C - HUD And Feedback"), heading("C1. Portrait HUD Reference", 2), p("Filename: source_ui_hud_reference_YYYYMMDD_01.png\nCanvas: 1080 x 1920 px · opaque PNG"), p("Show the Cozy Town map as the dominant full-screen play surface. Use a compact safe-area-aware top HUD for time, score, and combo; a compact bottom target list with icons and remaining counts; and small hint/magnifier controls near the lower corners. Keep touch targets at least 88 source pixels. Numeric placeholder text is acceptable only to show hierarchy."), callout("This is an implementation reference, not a landing page, phone mockup, poster, or card-heavy concept board. The map must remain visibly playable.", GREEN), heading("C2-C6. Feedback Reference Sheets", 2), p("Export each as a separate 1024 x 1024 px transparent PNG. Show 3-5 separated key states without baked labels. Effects must be feasible with sprites, particles, scale, opacity, and simple tweens.")]
    feedback = [["Filename", "States / tone"], ["source_feedback_find_success_YYYYMMDD_01.png", "Soft ring, sparkles, lift/fly cue · 700 ms"], ["source_feedback_pop_success_YYYYMMDD_01.png", "Rounded burst and soft puff · 500 ms"], ["source_feedback_catch_success_YYYYMMDD_01.png", "Friendly capture stamp shape; no text · 800 ms"], ["source_feedback_hint_reveal_YYYYMMDD_01.png", "Pulse/spotlight that does not cover target · 2000 ms"], ["source_feedback_wrong_tap_YYYYMMDD_01.png", "Subtle ripple/wobble; avoid harsh red · 300 ms"]]
    story += [KeepTogether([data_table(feedback, [90 * mm, 76 * mm])])]

    story += [heading("6. Export Package Contract"), p("Return selected outputs in three folders:"), callout("batch_a_world_targets/\nbatch_b_icons_tools/\nbatch_c_ui_feedback/", NAVY), p("Use exact filenames, replacing YYYYMMDD with the export date. Use _01, _02, etc. only for deliberate alternatives. Never use final, new, copy, or v2."), heading("Every batch includes", 2)] + bullets(["A separate PNG for every requested asset.", "A review contact sheet or composite.", "A short plain-text decision note listing palette, line treatment, deviations, and open questions.", "Layered source is welcome but not required for the first review."])
    story += [heading("Final production checklist", 2)] + bullets(["Exact filenames and dimensions.", "Real alpha transparency where required.", "Clean map has no gameplay targets or HUD.", "No watermark, signature, brand, fake text, or copyrighted character.", "No clipped target silhouette; all assets share one visual family.", "Icons remain legible on mobile; portrait controls respect safe areas.", "Review sheets are identified in the delivery note, not with baked image labels."])

    story += [heading("7. Development Intake"), p("The development team will preserve selected source exports under design/claude-design/source/{assetId}/ and normalize approved files into stable Cocos runtime paths. Semantic asset IDs must not be renamed."), data_table([["Asset role", "Runtime example"], ["Map", "art/maps/demo_cozy_town_placeholder"], ["Target", "art/targets/target_pineapple"], ["Target-list icon", "art/icons/icon_pineapple"], ["Tool icon", "art/icons/tool_hint"], ["Feedback reference", "art/feedback/feedback_find_success"]], [50 * mm, 116 * mm])]

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()

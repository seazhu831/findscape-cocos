from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "design/claude-design/handoffs/stage-4g-dense-region-v1"
OUTPUT = ROOT / "output/pdf/findscape-stage-4g-dense-region-handoff.pdf"


def register_font():
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                pdfmetrics.registerFont(
                    TTFont("FindscapeSans", path, subfontIndex=0)
                )
                return "FindscapeSans"
            except Exception:
                continue
    return "Helvetica"


FONT = register_font()
PAGE_W, PAGE_H = A4
INK = colors.HexColor("#263238")
NAVY = colors.HexColor("#243746")
GREEN = colors.HexColor("#4F8068")
CORAL = colors.HexColor("#E66A5C")
YELLOW = colors.HexColor("#F2C14E")
PALE = colors.HexColor("#F4F6F3")
LINE = colors.HexColor("#D8DEDA")
MUTED = colors.HexColor("#647078")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName=FONT, fontSize=27, leading=32, textColor=NAVY, spaceAfter=6 * mm))
styles.add(ParagraphStyle(name="DeckX", fontName=FONT, fontSize=11.5, leading=16, textColor=MUTED, spaceAfter=4 * mm))
styles.add(ParagraphStyle(name="H1X", fontName=FONT, fontSize=18, leading=22, textColor=NAVY, spaceBefore=3 * mm, spaceAfter=3 * mm))
styles.add(ParagraphStyle(name="H2X", fontName=FONT, fontSize=12.5, leading=16, textColor=GREEN, spaceBefore=2.5 * mm, spaceAfter=1.5 * mm))
styles.add(ParagraphStyle(name="BodyX", fontName=FONT, fontSize=9, leading=12.8, textColor=INK, spaceAfter=2.2 * mm))
styles.add(ParagraphStyle(name="SmallX", fontName=FONT, fontSize=7.4, leading=10, textColor=INK))
styles.add(ParagraphStyle(name="TinyX", fontName=FONT, fontSize=6.8, leading=8.8, textColor=MUTED))
styles.add(ParagraphStyle(name="PromptX", fontName=FONT, fontSize=8.1, leading=11.4, textColor=INK))
styles.add(ParagraphStyle(name="FooterX", fontName=FONT, fontSize=7.2, leading=9, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="MetaX", fontName=FONT, fontSize=8.7, leading=12, textColor=colors.white))
styles.add(ParagraphStyle(name="TableHeaderX", fontName=FONT, fontSize=7.4, leading=10, textColor=colors.white))


def paragraph(text, style="BodyX"):
    return Paragraph(escape(text).replace("\n", "<br/>"), styles[style])


def heading(text, level=1):
    return Paragraph(escape(text), styles["H1X" if level == 1 else "H2X"])


def bullet_list(items):
    return [Paragraph("• " + escape(item), styles["BodyX"]) for item in items]


def callout(text, color=YELLOW):
    box = Table([[paragraph(text, "BodyX")]], colWidths=[166 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.Color(color.red, color.green, color.blue, alpha=0.14)),
        ("BOX", (0, 0), (-1, -1), 0.8, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    return box


def data_table(rows, widths, font="SmallX"):
    content = [
        [
            Paragraph(
                escape(str(cell)),
                styles["TableHeaderX" if row_index == 0 else font],
            )
            for cell in row
        ]
        for row_index, row in enumerate(rows)
    ]
    table = Table(content, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 1.6 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.6 * mm),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
    ]))
    return table


def decorate_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 9 * mm, PAGE_W, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(CORAL)
    canvas.rect(0, PAGE_H - 9 * mm, 25 * mm, 9 * mm, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(20 * mm, 15 * mm, PAGE_W - 20 * mm, 15 * mm)
    footer = Paragraph(
        f"Findscape / Stage 4G Dense Region Handoff · {doc.page}",
        styles["FooterX"],
    )
    footer.wrapOn(canvas, PAGE_W - 40 * mm, 8 * mm)
    footer.drawOn(canvas, 20 * mm, 7 * mm)
    canvas.restoreState()


def image_box(path, width, height):
    image = Image(str(path), width=width, height=height, kind="proportional")
    box = Table([[image]], colWidths=[width + 6 * mm], rowHeights=[height + 6 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return box


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(20 * mm, 19 * mm, PAGE_W - 40 * mm, PAGE_H - 34 * mm, id="body")
    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4)
    doc.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=decorate_page)])
    story = []

    story += [
        Spacer(1, 23 * mm),
        paragraph("CLAUDE DESIGN PRODUCTION BRIEF", "DeckX"),
        Paragraph("Findscape Dense Region Batch v1", styles["TitleX"]),
        paragraph("A focused Stage 4G asset package for concealment, ambient actors, and layered scene composition.", "DeckX"),
    ]
    meta = Table([
        [paragraph("ISSUE", "MetaX"), paragraph("#75 / Stage 4G", "MetaX")],
        [paragraph("REGION", "MetaX"), paragraph("Lower Garden / 1000 x 760", "MetaX")],
        [paragraph("MAP", "MetaX"), paragraph("demo_cozy_town / 1600 x 2400", "MetaX")],
        [paragraph("DELIVERY", "MetaX"), paragraph("9 runtime assets + previews + manifest", "MetaX")],
        [paragraph("VERSION", "MetaX"), paragraph("1.0 / 22 July 2026", "MetaX")],
    ], colWidths=[32 * mm, 120 * mm])
    meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#52636E")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    story += [Spacer(1, 10 * mm), meta, Spacer(1, 8 * mm), callout("Create the contact sheet and aligned composite preview first. Generate separate production PNGs only after that visual family is approved.", CORAL)]

    story += [PageBreak(), heading("1. Master Prompt")]
    prompt = (
        "You are the visual design and production partner for Findscape, a cozy portrait mobile hidden-object game built with Cocos Creator. Read this full handoff and use every supplied reference image. Create one production-ready dense scene slice named findscape_dense_region_batch_v1. Extend the supplied lower garden crop without replacing or repainting the base map. Preserve the existing cozy hand-drawn language: soft rounded brown linework, flat but gently textured color, friendly multicolor palette, simple readable silhouettes, and the current map scale and top-down/three-quarter perspective.\n\n"
        "Return a contact sheet and a 1000 x 760 aligned composite preview first. After approval, export every listed runtime asset separately with true transparency and return the completed manifest. Never bake the crop, HUD, text, targets, hit areas, success effects, checkerboards, or watermarks into runtime PNGs. Do not generate a new full map or any unlisted asset.\n\n"
        "Animated actor frames must be full replacement frames. Every frame must contain the complete actor; sparse delta frames, isolated limbs, masks, and partial overlays are rejected. Follow exact filenames, dimensions, anchors, positions, render roles, and concealment intent in this document. Record any allowed position adjustment in decision_note.md and manifest.json."
    )
    prompt_box = Table([[paragraph(prompt, "PromptX")]], colWidths=[166 * mm])
    prompt_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ]))
    story += [prompt_box, heading("Visual Direction", 2)] + bullet_list([
        "Match the supplied map's line weight, palette, gentle texture, perspective, and optical scale.",
        "Use cohesive object clusters, not rectangular grass, path, plaza, or floor patches.",
        "Keep strong silhouettes and readable local contrast at default mobile zoom and 1.5x focused zoom.",
        "Avoid photorealism, glossy 3D, anime, pixel art, hard black outlines, neon effects, fake text, brands, and copyrighted characters.",
    ])

    story += [PageBreak(), heading("2. Authored Region")]
    region = PACKAGE / "references/reference_region_lower_garden.png"
    story += [image_box(region, 166 * mm, 126.16 * mm), paragraph("Immutable reference crop. Map bounds: x 320, y 1500, width 1000, height 760. Top-left map origin.", "TinyX")]
    targets = []
    for filename, label in [
        ("reference_target_puppy.png", "Puppy / 480,1980"),
        ("reference_target_gem.png", "Gem / 1200,2090"),
        ("reference_target_balloon.png", "Balloon / 1170,1620"),
    ]:
        targets.append(
            Table(
                [[image_box(PACKAGE / "references" / filename, 30 * mm, 30 * mm)], [paragraph(label, "SmallX")]],
                colWidths=[52 * mm],
                hAlign="CENTER",
            )
        )
    target_table = Table([targets], colWidths=[55.3 * mm] * 3, hAlign="LEFT")
    target_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story += [heading("Existing Target References", 2), target_table, callout("The crop is a fixed background reference. Target sprites remain independent and must never be painted into an occluder or decoration.", YELLOW)]

    story += [PageBreak(), heading("3. Runtime Asset List")]
    rows = [
        ["Asset ID", "Role / position", "Export"],
        ["garden_picnic_basket", "static decoration / 570,1710", "384x384"],
        ["garden_planter_cluster", "warm-shape decoy / 410,1935", "512x512"],
        ["garden_scattered_toys", "static decoration / 960,1880", "512x384"],
        ["garden_blue_glass_cluster", "gem-color decoy / 1080,2170", "384x384"],
        ["actor_gardener_kneeling", "ambient actor / 760,1840", "6 x 512x512"],
        ["actor_reader_seated", "ambient actor / 980,2070", "6 x 512x512"],
        ["occluder_puppy_planter", "puppy foreground / 480,1995", "512x512"],
        ["occluder_gem_flower_basket", "gem foreground / 1200,2105", "512x512"],
        ["occluder_lane_shrub", "depth foreground / 700,2190", "640x512"],
    ]
    story += [data_table(rows, [68 * mm, 70 * mm, 28 * mm]), paragraph("All exports are separate 8-bit RGBA PNGs. Suggested positions may move by at most 40 map pixels; record changes in the decision note and manifest.", "SmallX")]
    story += [heading("Concealment Intent", 2)] + bullet_list([
        "Puppy planter: cover lower body and one side, leaving about 55% visible. Keep the face or one ear discoverable at focused zoom.",
        "Gem flower basket: cover lower and side edges, leaving about 42% visible. Blue glass and flowers may create color similarity without copying the gem silhouette.",
        "Balloon remains unobstructed so the same region continues to work in Balloon Blast mode.",
        "Occluders are independent foreground sprites. Concealment comes from render order, never from masks or target-shaped holes.",
    ])
    story += [heading("Ambient Actor Motion", 2)] + bullet_list([
        "Gardener: subtle breathing plus one hand tending a plant; knees and ground contact fixed.",
        "Reader: subtle breathing plus a small page or hand movement; seated baseline fixed.",
        "Exactly six complete frames named frame_00.png through frame_05.png at 6 fps seamless loop.",
        "Every frame uses the same 512x512 canvas, center anchor, optical scale, line weight, and baseline.",
        "Frame 00 is the static fallback. No sparse overlays, isolated limbs, masks, or delta frames.",
    ])

    story += [PageBreak(), heading("4. Package And Manifest Contract")]
    package_text = (
        "findscape_dense_region_batch_v1/\n"
        "  README.md / decision_note.md / manifest.json\n"
        "  contact_sheet.png / region_composite_preview.png\n"
        "  static/ (4 named PNGs)\n"
        "  actors/actor_gardener_kneeling/frame_00.png ... frame_05.png\n"
        "  actors/actor_reader_seated/frame_00.png ... frame_05.png\n"
        "  occluders/ (3 named PNGs)"
    )
    story += [callout(package_text, NAVY), heading("Composite Preview", 2)] + bullet_list([
        "Exactly 1000 x 760 using the supplied crop as an unchanged background.",
        "Place every new asset plus the three supplied targets at final manifest coordinates.",
        "Show occluders in final render order. Composite is review-only, not a runtime map replacement.",
    ])
    story += [heading("Manifest Fields", 2)] + bullet_list([
        "Stable asset ID, exact source file, proposed runtime path, kind, layer, and render order.",
        "Final map position, native canvas size, normalized anchor, and activation policy.",
        "Actor frame order, fps, loop, stable baseline, and SHA-256 per frame.",
        "Occluded target entity, intended visible ratio, edge placement, and visual-similarity tags.",
        "SHA-256 for every PNG. Start from the supplied manifest-template.json.",
    ])
    story += [heading("Exact Runtime Path Family", 2), data_table([
        ["Role", "Runtime path"],
        ["Static", "art/dense/lower_garden/{assetId}"],
        ["Actor frames", "art/dense/lower_garden/{actorId}/frame_XX"],
        ["Occluder", "art/dense/lower_garden/{assetId}"],
    ], [42 * mm, 124 * mm])]

    story += [PageBreak(), heading("5. Acceptance And Delivery")]
    story += bullet_list([
        "Composite looks native at default and 1.5x zoom with no pasted rectangles, perspective mismatch, or scale drift.",
        "Every runtime PNG has true alpha, a complete uncropped silhouette, and no text, watermark, checkerboard, HUD, hit area, or target marker.",
        "Puppy is about 55% visible, gem about 42% visible, and balloon unobstructed.",
        "Every actor frame contains at least 75% of frame 00's visible subject pixels and keeps a stable baseline.",
        "Static clusters increase density without reproducing target silhouettes or making taps visually ambiguous.",
        "Manifest filenames, dimensions, anchors, positions, render roles, and hashes match actual exports.",
    ])
    story += [heading("Out Of Scope", 2)] + bullet_list([
        "No full-map replacement, background repaint, new game mode, target category, HUD, icon, audio, or success effect.",
        "No atlas, sprite sheet, layered source requirement, Cocos .anim file, or extra unlisted asset.",
    ])
    story += [Spacer(1, 4 * mm), callout("Delivery folder: ~/Downloads/findscape_dense_region_batch_v1\nNotify Codex after download. Intake will preserve raw exports, validate alpha and manifest contracts, then normalize approved assets into Cocos runtime paths.", CORAL)]

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()

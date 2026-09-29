"""PDF report generation (reportlab). Import is guarded so the app runs even
if reportlab is unavailable — report metadata/preview is always produced; only
the binary artifact requires the library."""
from __future__ import annotations

from typing import Any


def pdf_available() -> bool:
    try:
        import reportlab  # noqa: F401
        return True
    except Exception:  # pragma: no cover
        return False


def build_pdf(title: str, preview: dict[str, Any]) -> bytes:
    """Render an audit-ready PDF from the report preview DTO."""
    from io import BytesIO

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=title)
    styles = getSampleStyleSheet()
    story: list = []

    story.append(Paragraph("AI Network Compliance Platform", styles["Title"]))
    story.append(Paragraph(title, styles["Heading2"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Executive Summary", styles["Heading3"]))
    story.append(Paragraph(preview.get("executive_summary", ""), styles["BodyText"]))
    story.append(Spacer(1, 10))

    device = preview.get("device")
    if device:
        story.append(Paragraph("Device Information", styles["Heading3"]))
        rows = [[k.replace("_", " ").title(), str(v)] for k, v in device.items()]
        t = Table([["Field", "Value"], *rows], hAlign="LEFT")
        t.setStyle(_table_style())
        story.append(t)
        story.append(Spacer(1, 10))

    story.append(Paragraph(f"Compliance Score: {preview.get('compliance_score', 0)}%",
                           styles["Heading3"]))
    story.append(Spacer(1, 6))

    fw = preview.get("framework_results", [])
    if fw:
        story.append(Paragraph("Framework Results", styles["Heading3"]))
        data = [["Framework", "Score", "Pass", "Fail"]] + [
            [f["framework"], f"{f['score']}%", str(f["passed"]), str(f["failed"])]
            for f in fw
        ]
        t = Table(data, hAlign="LEFT")
        t.setStyle(_table_style())
        story.append(t)
        story.append(Spacer(1, 10))

    findings = preview.get("findings", [])
    if findings:
        story.append(Paragraph("Findings", styles["Heading3"]))
        data = [["Severity", "Title", "Evidence", "Remediation"]] + [
            [f.get("severity", ""), f.get("title", ""), f.get("evidence", ""),
             f.get("remediation", "")]
            for f in findings
        ]
        t = Table(data, hAlign="LEFT", colWidths=[60, 150, 150, 150])
        t.setStyle(_table_style())
        story.append(t)

    doc.build(story)
    return buf.getvalue()


def _table_style():
    from reportlab.lib import colors
    from reportlab.platypus import TableStyle

    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f2740")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c8d2dc")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f6fa")]),
        ]
    )

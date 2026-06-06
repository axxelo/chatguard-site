#!/usr/bin/env python3
"""Build a ChatGuard Communications Surveillance Audit Pack PDF from engine output."""
import json, sys, datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, KeepTogether)
from reportlab.lib.enums import TA_LEFT

INK   = colors.HexColor("#0F1420")
AMBER = colors.HexColor("#B8731A")
GREEN = colors.HexColor("#1E9E73")
RED   = colors.HexColor("#C0392B")
MUTED = colors.HexColor("#5B6577")
LINE  = colors.HexColor("#D7DCE5")
ZEBRA = colors.HexColor("#F6F8FB")

data = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/audit.json"))
out  = sys.argv[2] if len(sys.argv) > 2 else "ChatGuard-Audit-Pack-sample.pdf"
ORG  = "Meridian Securities"
PERIOD = "06 June 2026, 08:00–10:00 BST"
REF  = "CG-AUD-2026-0601"
now  = datetime.datetime.utcnow().strftime("%d %b %Y %H:%M UTC")

ss = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=20, textColor=INK, spaceAfter=2, alignment=TA_LEFT)
SUB= ParagraphStyle("SUB", parent=ss["Normal"], fontName="Helvetica", fontSize=10.5, textColor=MUTED, spaceAfter=2)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=13, textColor=INK, spaceBefore=16, spaceAfter=7)
BODY=ParagraphStyle("BODY", parent=ss["Normal"], fontName="Helvetica", fontSize=9.5, textColor=INK, leading=14)
SMALL=ParagraphStyle("SMALL", parent=ss["Normal"], fontName="Helvetica", fontSize=8, textColor=MUTED, leading=11)
CELL=ParagraphStyle("CELL", parent=ss["Normal"], fontName="Helvetica", fontSize=8.5, textColor=INK, leading=11)

story=[]
def rule(c=LINE): story.append(HRFlowable(width="100%", thickness=0.8, color=c, spaceBefore=6, spaceAfter=6))

# ---- header ----
story.append(Paragraph("ChatGuard", H1))
story.append(Paragraph("Communications Surveillance — Audit Pack &nbsp;·&nbsp; A product of AXTRADE SAS", SUB))
rule(INK)
meta = [["Client", ORG, "Reference", REF],
        ["Review period", PERIOD, "Generated", now],
        ["Channels", "Bloomberg IB chat", "Prepared for", "Compliance / Regulator"]]
t = Table(meta, colWidths=[26*mm, 64*mm, 28*mm, 52*mm])
t.setStyle(TableStyle([
    ("FONT",(0,0),(-1,-1),"Helvetica",8.5),
    ("TEXTCOLOR",(0,0),(0,-1),MUTED),("TEXTCOLOR",(2,0),(2,-1),MUTED),
    ("FONT",(1,0),(1,-1),"Helvetica-Bold",8.5),("FONT",(3,0),(3,-1),"Helvetica-Bold",8.5),
    ("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2)]))
story.append(t)

# ---- executive summary ----
s=data["stats"]
story.append(Paragraph("Executive summary", H2))
def kpi(lbl,val,c=INK):
    return [Paragraph(f'<font color="{c}"><b>{val}</b></font>',ParagraphStyle("k",parent=BODY,fontSize=15)),
            Paragraph(lbl,SMALL)]
cards=[[kpi("Messages analysed",s["messages"]), kpi("Deals reconstructed",s["deals"],AMBER),
        kpi("Filled",s["filled"],AMBER), kpi("Total flags",s["flags"],GREEN),
        kpi("High-severity",s.get("highFlags",0),RED)]]
ct=Table(cards, colWidths=[34*mm]*5)
ct.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.8,LINE),("INNERGRID",(0,0),(-1,-1),0.8,LINE),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
    ("LEFTPADDING",(0,0),(-1,-1),10)]))
story.append(ct)
story.append(Spacer(1,4))
story.append(Paragraph(f"During the review period, {s['messages']} messages across {s['users']} participants were analysed. "
    f"{s['deals']} trade enquiries were reconstructed into deals ({s['filled']} filled). "
    f"{s['flags']} message(s) were flagged for review, of which {s.get('highFlags',0)} were high severity and warrant escalation.", BODY))

# ---- flags by typology ----
story.append(Paragraph("Flags by market-abuse typology", H2))
typ=data.get("typologies",{})
trows=[["Typology","Count"]]+[[k,str(v)] for k,v in typ.items()]
tt=Table(trows,colWidths=[120*mm,30*mm])
tt.setStyle(TableStyle([("FONT",(0,0),(-1,-1),"Helvetica",9),("FONT",(0,0),(-1,0),"Helvetica-Bold",9),
    ("TEXTCOLOR",(0,0),(-1,0),colors.white),("BACKGROUND",(0,0),(-1,0),INK),
    ("LINEBELOW",(0,0),(-1,-1),0.5,LINE),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,ZEBRA]),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8)]))
story.append(tt)

# ---- flagged messages (evidence) ----
story.append(Paragraph("Flagged messages — evidence", H2))
fr=[["Time","From","Sev","Typology","Message"]]
for f in data["flags"]:
    fr.append([f.get("time","—"),f.get("sender",""),f.get("sev",""),f.get("typology",""),
               Paragraph(f.get("body","").replace("&","&amp;").replace("<","&lt;"),CELL)])
ft=Table(fr,colWidths=[14*mm,16*mm,14*mm,38*mm,68*mm],repeatRows=1)
sevcolor={"high":RED,"medium":AMBER,"low":MUTED}
stylecmds=[("FONT",(0,0),(-1,-1),"Helvetica",8.5),("FONT",(0,0),(-1,0),"Helvetica-Bold",8.5),
    ("TEXTCOLOR",(0,0),(-1,0),colors.white),("BACKGROUND",(0,0),(-1,0),INK),
    ("VALIGN",(0,0),(-1,-1),"TOP"),("LINEBELOW",(0,1),(-1,-1),0.4,LINE),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,ZEBRA]),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),6)]
for i,f in enumerate(data["flags"],start=1):
    stylecmds.append(("TEXTCOLOR",(2,i),(2,i),sevcolor.get(f.get("sev"),MUTED)))
    stylecmds.append(("FONT",(2,i),(2,i),"Helvetica-Bold",8.5))
ft.setStyle(TableStyle(stylecmds))
story.append(ft)

# ---- reconstructed deals ----
story.append(Paragraph("Reconstructed deals", H2))
dr=[["ID","Instrument","Class","Size","Status","Price","Counterparty"]]
for d in data["deals"]:
    dr.append([d["id"],d.get("inst") or "—",d.get("assetClass") or "—",d.get("size") or "—",
               d.get("status"),d.get("fillPrice") or d.get("quotePrice") or "—",d.get("cp") or "—"])
dt=Table(dr,colWidths=[12*mm,28*mm,20*mm,18*mm,22*mm,30*mm,40*mm],repeatRows=1)
dt.setStyle(TableStyle([("FONT",(0,0),(-1,-1),"Helvetica",8.5),("FONT",(0,0),(-1,0),"Helvetica-Bold",8.5),
    ("TEXTCOLOR",(0,0),(-1,0),colors.white),("BACKGROUND",(0,0),(-1,0),INK),
    ("LINEBELOW",(0,1),(-1,-1),0.4,LINE),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,ZEBRA]),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),6)]))
story.append(dt)

# ---- counterparties ----
story.append(Paragraph("Counterparties (resolved across aliases)", H2))
cr=[["Counterparty","Aliases","Mentions"]]
for c in data["counterparties"]:
    cr.append([c["name"], ", ".join(c.get("aliases",[])), str(c["mentions"])])
cct=Table(cr,colWidths=[45*mm,75*mm,30*mm])
cct.setStyle(TableStyle([("FONT",(0,0),(-1,-1),"Helvetica",8.5),("FONT",(0,0),(-1,0),"Helvetica-Bold",8.5),
    ("TEXTCOLOR",(0,0),(-1,0),colors.white),("BACKGROUND",(0,0),(-1,0),INK),
    ("LINEBELOW",(0,1),(-1,-1),0.4,LINE),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,ZEBRA]),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),6)]))
story.append(cct)

# ---- methodology + sign-off ----
story.append(Paragraph("Methodology &amp; disclaimer", H2))
story.append(Paragraph("Flags are produced by ChatGuard's extraction engine using lexical and pattern rules mapped to "
    "market-abuse typologies. They are indicators for human review, not determinations of wrongdoing. This pack is "
    "generated from captured communications held in the client's perimeter. ChatGuard does not provide legal advice; "
    "monitoring must comply with applicable employment and data-protection law (incl. UK GDPR).", SMALL))
story.append(Spacer(1,16))
so=Table([["Reviewed by","Date","Signature"],["","",""]],colWidths=[60*mm,40*mm,50*mm])
so.setStyle(TableStyle([("FONT",(0,0),(-1,0),"Helvetica-Bold",9),("TEXTCOLOR",(0,0),(-1,0),MUTED),
    ("LINEBELOW",(0,1),(-1,1),0.8,INK),("TOPPADDING",(0,1),(-1,1),22)]))
story.append(so)

def footer(c,d):
    c.setFont("Helvetica",7.5); c.setFillColor(MUTED)
    c.drawString(20*mm,12*mm,f"ChatGuard Audit Pack · {REF} · CONFIDENTIAL")
    c.drawRightString(190*mm,12*mm,f"Page {c.getPageNumber()}")

doc=SimpleDocTemplate(out,pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=18*mm,bottomMargin=20*mm,
                      title="ChatGuard Audit Pack",author="ChatGuard — AXTRADE SAS")
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print("PDF written:",out)

"""Create a simple PDF for testing the Doctavian signature flow"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
import json

doc = SimpleDocTemplate("templates/cost-report.pdf", pagesize=letter,
                        rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=30)
heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=12)

story = []

# Title
story.append(Paragraph("CloudCost AI - Cost Analysis Report", title_style))
story.append(Spacer(1, 0.5*inch))

# Summary
story.append(Paragraph("Summary", heading_style))
story.append(Paragraph("Application: Test App", styles['Normal']))
story.append(Paragraph("Generated: 2026-09-01", styles['Normal']))
story.append(Paragraph("Estimated Complexity: Medium", styles['Normal']))
story.append(Spacer(1, 0.3*inch))

# Services table
story.append(Paragraph("Identified Services", heading_style))
data = [
    ['Service', 'Provider', 'Category', 'Monthly Cost'],
    ['EC2', 'AWS', 'Compute', '$500'],
    ['RDS', 'AWS', 'Database', '$300'],
    ['S3', 'AWS', 'Storage', '$200'],
]
table = Table(data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
story.append(table)
story.append(Spacer(1, 0.3*inch))

# Cost projections
story.append(Paragraph("Cost Projections", heading_style))
proj_data = [
    ['Users', 'Estimated Monthly Cost'],
    ['1,000', '$1,000'],
    ['10,000', '$5,000'],
    ['100,000', '$25,000'],
]
proj_table = Table(proj_data, colWidths=[2*inch, 3*inch])
proj_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
story.append(proj_table)
story.append(Spacer(1, 0.5*inch))

# Signature line
story.append(Paragraph("Sign below to acknowledge this cost analysis:", styles['Normal']))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph("_______________________________________", styles['Normal']))
story.append(Paragraph("Signature", styles['Normal']))
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("_______________________________________", styles['Normal']))
story.append(Paragraph("Date", styles['Normal']))

doc.build(story)
print("PDF saved: templates/cost-report.pdf")

export const PYTHON_TEMPLATE = `"""PROFESSIONAL DXF TEMPLATE - A3 SHEET (420x297mm)
Edit only the DRAWING SECTION at the bottom
"""

import ezdxf
from ezdxf.enums import TextEntityAlignment
from datetime import date

# Create new document
doc = ezdxf.new("R2018")
doc.units = ezdxf.units.MM
doc.header["$MEASUREMENT"] = 1

# ========== SHEET SETUP ==========
SHEET = {
    'width': 420,
    'height': 297,
    'margin': 10,
    'titleblock_height': 50,
    'notes_width': 120,
    'revtable_width': 90
}

DRAWING_AREA = {
    'minX': SHEET['margin'] + SHEET['notes_width'] + 10,
    'maxX': SHEET['width'] - SHEET['margin'] - SHEET['revtable_width'] - 10,
    'minY': SHEET['margin'] + SHEET['titleblock_height'] + 10,
    'maxY': SHEET['height'] - SHEET['margin'] - 10
}
DRAWING_AREA['width'] = DRAWING_AREA['maxX'] - DRAWING_AREA['minX']
DRAWING_AREA['height'] = DRAWING_AREA['maxY'] - DRAWING_AREA['minY']
DRAWING_AREA['centerX'] = DRAWING_AREA['minX'] + DRAWING_AREA['width'] / 2
DRAWING_AREA['centerY'] = DRAWING_AREA['minY'] + DRAWING_AREA['height'] / 2

# ========== LINETYPES ==========
doc.linetypes.add("HIDDEN", pattern=[5, -2.5])
doc.linetypes.add("CENTER", pattern=[12.5, -2.5, 2.5, -2.5])
doc.linetypes.add("PHANTOM", pattern=[12.5, -2.5, 2.5, -2.5, 2.5, -2.5])

# ========== TEXT STYLES ==========
doc.styles.add("TITLE", font="arial.ttf")
doc.styles.add("SUBTITLE", font="arial.ttf")
doc.styles.add("ANNOTATION", font="arial.ttf")
doc.styles.add("DIMENSION", font="arial.ttf")
doc.styles.add("NOTES", font="arial.ttf")

# ========== DIMENSION STYLES ==========
dimstyle = doc.dimstyles.new("ISO-25")
dimstyle.dxf.dimtxsty = "DIMENSION"
dimstyle.dxf.dimtxt = 2
dimstyle.dxf.dimasz = 2

# ========== LAYERS ==========
doc.layers.add("M-OUTL", color=7, linetype="CONTINUOUS")
doc.layers.add("M-VISIBLE", color=7, linetype="CONTINUOUS")
doc.layers.add("M-HIDDEN", color=2, linetype="HIDDEN")
doc.layers.add("M-CENTER", color=4, linetype="CENTER")
doc.layers.add("M-SECTION", color=1, linetype="PHANTOM")
doc.layers.add("M-HATCH", color=8, linetype="CONTINUOUS")
doc.layers.add("DIMENSIONS", color=4, linetype="CONTINUOUS")
doc.layers.add("TEXT", color=7, linetype="CONTINUOUS")
doc.layers.add("NOTES", color=2, linetype="CONTINUOUS")
doc.layers.add("LEADERS", color=4, linetype="CONTINUOUS")
doc.layers.add("SYMBOLS", color=7, linetype="CONTINUOUS")
doc.layers.add("TABLES", color=7, linetype="CONTINUOUS")
doc.layers.add("TITLEBLOCK", color=7, linetype="CONTINUOUS")
doc.layers.add("BORDER", color=7, linetype="CONTINUOUS")

# ========== BLOCKS ==========
sec_mark = doc.blocks.new("SECTION_MARK")
sec_mark.add_circle((0, 0), 8, dxfattribs={'layer': 'SYMBOLS'})
sec_mark.add_line((-12, 0), (-8, 0), dxfattribs={'layer': 'SYMBOLS'})
sec_mark.add_line((8, 0), (12, 0), dxfattribs={'layer': 'SYMBOLS'})

det_circle = doc.blocks.new("DETAIL_CIRCLE")
det_circle.add_circle((0, 0), 10, dxfattribs={'layer': 'SYMBOLS'})

# ========== FIXED ELEMENTS ==========
msp = doc.modelspace()

# Border
msp.add_lwpolyline([
    (SHEET['margin'], SHEET['margin']),
    (SHEET['width'] - SHEET['margin'], SHEET['margin']),
    (SHEET['width'] - SHEET['margin'], SHEET['height'] - SHEET['margin']),
    (SHEET['margin'], SHEET['height'] - SHEET['margin']),
    (SHEET['margin'], SHEET['margin'])
], dxfattribs={'layer': 'BORDER'})

# Title Block
TB = {
    'x': SHEET['margin'],
    'y': SHEET['margin'],
    'width': SHEET['width'] - 2 * SHEET['margin'],
    'height': SHEET['titleblock_height']
}

msp.add_lwpolyline([
    (TB['x'], TB['y']),
    (TB['x'] + TB['width'], TB['y']),
    (TB['x'] + TB['width'], TB['y'] + TB['height']),
    (TB['x'], TB['y'] + TB['height']),
    (TB['x'], TB['y'])
], dxfattribs={'layer': 'TITLEBLOCK'})

msp.add_line((TB['x'], TB['y'] + 15), (TB['x'] + TB['width'], TB['y'] + 15), dxfattribs={'layer': 'TITLEBLOCK'})
msp.add_line((TB['x'], TB['y'] + 30), (TB['x'] + TB['width'], TB['y'] + 30), dxfattribs={'layer': 'TITLEBLOCK'})
msp.add_line((TB['x'] + TB['width'] * 0.6, TB['y']), (TB['x'] + TB['width'] * 0.6, TB['y'] + 30), dxfattribs={'layer': 'TITLEBLOCK'})
msp.add_line((TB['x'] + TB['width'] * 0.8, TB['y']), (TB['x'] + TB['width'] * 0.8, TB['y'] + 30), dxfattribs={'layer': 'TITLEBLOCK'})

msp.add_text("AI ENGINEERING DESIGN", dxfattribs={'layer': 'TITLEBLOCK', 'style': 'SUBTITLE', 'height': 3}).set_placement((TB['x'] + 5, TB['y'] + TB['height'] - 7), align=TextEntityAlignment.LEFT)
msp.add_text("AUTOMATED CAD GENERATION", dxfattribs={'layer': 'TITLEBLOCK', 'style': 'TITLE', 'height': 3.5}).set_placement((TB['x'] + 5, TB['y'] + 32), align=TextEntityAlignment.LEFT)
msp.add_text("DWG NO: AUTO-GEN-001", dxfattribs={'layer': 'TITLEBLOCK', 'height': 2.5}).set_placement((TB['x'] + 5, TB['y'] + 18), align=TextEntityAlignment.LEFT)
msp.add_text("SCALE: 1:1", dxfattribs={'layer': 'TITLEBLOCK', 'height': 2}).set_placement((TB['x'] + 5, TB['y'] + 3), align=TextEntityAlignment.LEFT)
msp.add_text(f"DATE: {date.today()}", dxfattribs={'layer': 'TITLEBLOCK', 'height': 2}).set_placement((TB['x'] + TB['width'] * 0.8 + 5, TB['y'] + 18), align=TextEntityAlignment.LEFT)

# General Notes
NOTES = {
    'x': SHEET['margin'] + 5,
    'y': TB['y'] + TB['height'] + 10
}

msp.add_text("GENERAL NOTES:", dxfattribs={'layer': 'NOTES', 'style': 'ANNOTATION', 'height': 2.5}).set_placement((NOTES['x'], NOTES['y'] + 100), align=TextEntityAlignment.LEFT)
notes_list = ["1. ALL DIMS IN MM", "2. AUTO-GENERATED", "3. VERIFY DESIGN", "4. CHECK STANDARDS"]
for i, note in enumerate(notes_list):
    msp.add_text(note, dxfattribs={'layer': 'NOTES', 'style': 'NOTES', 'height': 1.8}).set_placement((NOTES['x'], NOTES['y'] + 95 - i * 5), align=TextEntityAlignment.LEFT)

# Revision Table
REV = {
    'x': SHEET['width'] - SHEET['margin'] - SHEET['revtable_width'],
    'y': TB['y'] + TB['height'] + 10,
    'width': SHEET['revtable_width'],
    'height': 40
}

msp.add_text("REVISIONS", dxfattribs={'layer': 'TABLES', 'style': 'ANNOTATION', 'height': 2.5}).set_placement((REV['x'], REV['y'] + REV['height'] + 3), align=TextEntityAlignment.LEFT)
msp.add_lwpolyline([
    (REV['x'], REV['y']),
    (REV['x'] + REV['width'], REV['y']),
    (REV['x'] + REV['width'], REV['y'] + REV['height']),
    (REV['x'], REV['y'] + REV['height']),
    (REV['x'], REV['y'])
], dxfattribs={'layer': 'TABLES'})

# ========== DRAWING SECTION - EDIT BELOW ==========
`;

export const SYSTEM_PROMPT_ANALYSIS = `You are an expert engineering analyst specializing in mechanical, structural, and civil engineering. Your role is to:

1. Understand engineering problems from natural language descriptions
2. Ask clarifying questions when requirements are unclear or incomplete
3. Perform detailed engineering analysis (stress, deflection, thermal, etc.)
4. Provide clear explanations of your analysis and assumptions
5. Generate detailed specifications for CAD drawings

When a user describes an engineering problem:
- Ask for missing critical parameters (dimensions, materials, loads, boundary conditions)
- State your assumptions clearly
- Show relevant calculations
- Explain the engineering reasoning
- Provide a clear specification for the drawing

Be conversational but technically precise. Keep responses focused and actionable.`;

export const SYSTEM_PROMPT_CODE_GEN = `You are an expert Python programmer specializing in ezdxf CAD generation. Your role is to generate production-quality Python code that creates DXF drawings.

CRITICAL REQUIREMENTS:
1. **NEVER create a new document** - doc and msp are ALREADY defined in the template
2. **NEVER import ezdxf or other modules** - all imports are ALREADY done
3. **NEVER create or define layers** - all layers are ALREADY defined
4. **ONLY generate drawing commands** - lines, polylines, circles, dimensions, text, etc.
5. Use the pre-defined DRAWING_AREA constants for positioning
6. Use the pre-defined layers (M-VISIBLE, M-HIDDEN, M-CENTER, DIMENSIONS, TEXT, etc.)
7. Add dimensions to all critical features
8. Include annotations and labels
9. Use proper engineering drawing standards

Available constants (ALREADY DEFINED):
- doc: ezdxf document (ALREADY CREATED)
- msp: modelspace (ALREADY DEFINED)
- DRAWING_AREA['centerX'], DRAWING_AREA['centerY']: Center of drawing area
- DRAWING_AREA['width'], DRAWING_AREA['height']: Available drawing space
- TextEntityAlignment: ALREADY IMPORTED
- math module: You CAN import this if needed

Available layers (ALREADY CREATED):
- M-VISIBLE, M-HIDDEN, M-CENTER, M-SECTION, M-HATCH
- DIMENSIONS, TEXT, NOTES, LEADERS, SYMBOLS, TABLES

Example drawing code (CORRECT):
\`\`\`python
import math  # You can import math if needed

# Calculate dimensions for a circular arc frame
radius = 100
arc_length = math.pi * radius  # Half circle

# Draw arc points
arc_points = []
for i in range(51):
    angle = math.pi * i / 50
    x = DRAWING_AREA['centerX'] + radius * math.cos(angle)
    y = DRAWING_AREA['centerY'] + radius * math.sin(angle)
    arc_points.append((x, y))

# Add arc to drawing
msp.add_lwpolyline(arc_points, dxfattribs={'layer': 'M-VISIBLE'})

# Add dimensions
dim = msp.add_linear_dim(
    base=(DRAWING_AREA['centerX'], DRAWING_AREA['centerY'] - 50),
    p1=(DRAWING_AREA['centerX'] - radius, DRAWING_AREA['centerY']),
    p2=(DRAWING_AREA['centerX'] + radius, DRAWING_AREA['centerY']),
    dimstyle='ISO-25',
    dxfattribs={'layer': 'DIMENSIONS'}
)

# Add label
text = msp.add_text(
    f"RADIUS = {radius} mm",
    dxfattribs={'layer': 'TEXT', 'height': 3}
)
text.set_placement((DRAWING_AREA['centerX'], DRAWING_AREA['centerY'] + radius + 20), align=TextEntityAlignment.MIDDLE_CENTER)
\`\`\`

WRONG EXAMPLE (DO NOT DO THIS):
\`\`\`python
import ezdxf  # ❌ WRONG - already imported
doc = ezdxf.new('R2010')  # ❌ WRONG - doc already exists
msp = doc.modelspace()  # ❌ WRONG - msp already exists
doc.layers.add("M-VISIBLE", color=7)  # ❌ WRONG - layers already defined
\`\`\`

Generate ONLY the drawing commands. No document creation. No layer definitions. Production-ready code.`;

export const SYSTEM_PROMPT_DESIGN_SUMMARY = `You are a professional engineering design writer. Your role is to create concise, professional design summaries for CAD drawings.

Given an engineering analysis and design description, create a structured design summary in JSON format with:

1. **title**: A short, descriptive title (max 60 chars)
2. **description**: A brief 1-2 sentence description of what the design is
3. **dimensions**: Array of key dimensions, each with:
   - label: What the dimension measures
   - value: The dimension value with units (e.g., "150 mm", "45°")
4. **rationale**: 2-3 sentences explaining how this design solves the user's problem

Guidelines:
- Be concise and professional
- Use engineering terminology appropriately
- Focus on key specifications and dimensions
- Explain design decisions clearly
- Format dimensions consistently with units

Return ONLY valid JSON in this exact format:
\`\`\`json
{
  "title": "Design Title",
  "description": "Brief description",
  "dimensions": [
    {"label": "Dimension Name", "value": "Value with unit"}
  ],
  "rationale": "Why this design works"
}
\`\`\``;

export const SYSTEM_PROMPT_IMAGE_PROMPTS = `You are an expert at crafting precise image generation prompts for engineering illustrations. Your role is to create 5 highly specific, focused prompts for an AI image generator (Gemini) to produce professional engineering illustrations.

Given an engineering analysis, create 5 distinct prompts for these view types:
1. **Isometric 3D**: A clean isometric technical illustration
2. **Engineering Sketch**: A hand-drawn technical sketch with annotations
3. **Front View**: An orthographic front view projection
4. **Top View**: An orthographic top view projection  
5. **3D Rendering**: A photorealistic 3D rendering

CRITICAL REQUIREMENTS:
- Each prompt must be concise (2-3 sentences max)
- Focus ONLY on the key engineering features
- NO unnecessary text or context
- Use professional engineering terminology
- Specify visual style (CAD-style, sketch, orthographic, photorealistic)
- Include dimensional context when relevant
- Mention materials and finishes for rendering

Return ONLY a JSON array with 5 prompts in this exact format:
\`\`\`json
[
  "Prompt for isometric 3D view",
  "Prompt for engineering sketch",
  "Prompt for front view",
  "Prompt for top view",
  "Prompt for 3D rendering"
]
\`\`\`

Example for "cantilever beam 2m long":
\`\`\`json
[
  "Clean isometric 3D technical illustration of a 2-meter steel cantilever beam with visible I-beam cross-section, showing mounting plate and load point. CAD-style rendering with dimension lines, white background.",
  "Hand-drawn engineering sketch of cantilever beam showing 2000mm length dimension, fixed support detail, and load arrow. Technical linework with annotations, blueprint aesthetic.",
  "Orthographic front view of cantilever beam showing I-beam profile, mounting bolts, and vertical load. Engineering drawing style with clean lines, white background.",
  "Orthographic top view of cantilever beam showing 2000mm length, mounting plate holes, and load position. Technical drawing with dimensions, CAD aesthetic.",
  "Photorealistic 3D rendering of steel cantilever beam with brushed metal finish, professional studio lighting, showing structural details and mounting hardware."
]
\`\`\`

Be specific and concise. No fluff.`;


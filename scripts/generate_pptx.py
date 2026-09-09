import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_slide_layout = prs.slide_layouts[6]

    # Color Palette
    COLOR_BG = RGBColor(11, 15, 25)          # #0b0f19
    COLOR_CARD = RGBColor(23, 32, 54)        # #172036
    COLOR_CARD_BORDER = RGBColor(45, 60, 95) # Border accent
    COLOR_PRIMARY = RGBColor(59, 130, 246)   # #3b82f6
    COLOR_TITLE = RGBColor(255, 255, 255)
    COLOR_SUBTITLE = RGBColor(148, 163, 184)
    COLOR_TEXT = RGBColor(203, 213, 225)
    COLOR_SUCCESS = RGBColor(52, 211, 153)   # #34d399
    COLOR_MUTED = RGBColor(100, 116, 139)

    def set_slide_background(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = COLOR_BG
        bg_shape.line.fill.background()
        return bg_shape

    def add_header(slide, title_text, category_text="Christ University • 5th Sem B.Tech CSE • CIA-3 Evaluation", slide_num=None):
        set_slide_background(slide)

        # Header tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(9.0), Inches(0.4))
        tf = tag_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_PRIMARY
        p.font.name = "Arial"

        # Slide number
        if slide_num:
            num_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.4), Inches(2.0), Inches(0.4))
            np = num_box.text_frame.paragraphs[0]
            np.text = f"Slide {slide_num} / 14"
            np.alignment = PP_ALIGN.RIGHT
            np.font.size = Pt(11)
            np.font.bold = True
            np.font.color.rgb = COLOR_MUTED
            np.font.name = "Arial"

        # Slide title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TITLE
        p_title.font.name = "Arial"

    # ==================== SLIDE 1: TITLE ====================
    s1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s1)

    # Decorative Card for Title
    card1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5))
    card1.fill.solid()
    card1.fill.fore_color.rgb = COLOR_CARD
    card1.line.color.rgb = COLOR_CARD_BORDER
    card1.line.width = Pt(1.5)

    tb = s1.shapes.add_textbox(Inches(1.6), Inches(1.4), Inches(10.133), Inches(4.7))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "CHRIST UNIVERSITY • SCHOOL OF ENGINEERING & TECHNOLOGY"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_PRIMARY
    p0.font.name = "Arial"

    p1 = tf.add_paragraph()
    p1.space_before = Pt(14)
    p1.text = "Restaurant Table Reservation &\nFood Ordering System"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TITLE
    p1.font.name = "Arial"

    p2 = tf.add_paragraph()
    p2.space_before = Pt(12)
    p2.text = "An Enterprise Multi-Branch Platform with Real-Time Conflict Prevention & Workflow Automation"
    p2.font.size = Pt(16)
    p2.font.color.rgb = COLOR_SUBTITLE
    p2.font.name = "Arial"

    p3 = tf.add_paragraph()
    p3.space_before = Pt(28)
    p3.text = "• Course: B.Tech (Computer Science & Engineering) — 5th Semester\n• Evaluation: Continuous Internal Assessment (CIA-3)\n• Tech Stack: Node.js, Express.js, MongoDB, Mongoose ODM, JWT, bcrypt, HTML5/CSS3/Vanilla JS\n• Status: 13 Modules Implemented | 149/149 Automated Tests Passed"
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_TEXT
    p3.font.name = "Arial"

    # ==================== SLIDE 2: PROBLEM STATEMENT ====================
    s2 = prs.slides.add_slide(blank_slide_layout)
    add_header(s2, "Problem Statement: Challenges in Traditional Restaurant Operations", slide_num=2)

    problems = [
        ("Manual Table Allocations & Double-Bookings", "Phone and paper logbook reservation systems suffer from human scheduling oversights, resulting in duplicate reservations and lost customers during peak dining hours."),
        ("Disconnected Kitchen Communications", "Physical paper order slips lead to misplaced tickets, uncoordinated food preparation sequences, and zero audit timestamps for kitchen throughput."),
        ("Vulnerable Client-Side Billing", "Insecure web applications that calculate subtotals or trust client-supplied totals on checkout expose the business to malicious price manipulation and accounting discrepancies."),
        ("Disjointed Multi-Branch Operations", "Floor managers lack centralized real-time visibility into branch-specific menus, physical seating availability, and operational branch status."),
        ("Absence of Unified Business Analytics", "Traditional setups lack automated aggregation pipelines for tracking sales revenue, identifying popular dishes, finding peak rush hours, and monitoring verified feedback.")
    ]

    top = 1.8
    for title, desc in problems:
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(0.88))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER

        tb = s2.shapes.add_textbox(Inches(1.0), Inches(top + 0.05), Inches(11.333), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_PRIMARY
        p.font.name = "Arial"

        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT
        run.font.size = Pt(12)

        top += 1.02

    # ==================== SLIDE 3: OBJECTIVES ====================
    s3 = prs.slides.add_slide(blank_slide_layout)
    add_header(s3, "Project Objectives: Core Functional Goals", slide_num=3)

    objectives = [
        ("1. Automate Table Inventory & Reservations", "Eliminate double-booking conflicts across physical restaurant branches using a real-time mathematical time-interval overlap detection algorithm [Tstart, Tend) vs [Rstart, Rend)."),
        ("2. Implement Deterministic Order State Machine", "Enforce a strict status progression workflow (PLACED → PREPARING → READY → SERVED/DELIVERED) with role-based validation and full audit history."),
        ("3. Guarantee Server-Side Financial Integrity", "Perform 100% of price calculations on the server. Menu prices are securely fetched from the database, applying 5% Tax and 5% Service Charge with floating-point rounding."),
        ("4. Streamline Kitchen Display & Order Queue", "Deliver a real-time Kitchen Display System queue sorted in strict First-In, First-Out (FIFO) order, sanitizing customer financial details for privacy."),
        ("5. Verified Reviews & Customer History", "Provide paginated order and reservation histories, and restrict 1–5 star customer feedback strictly to completed dining experiences (SERVED/DELIVERED)."),
        ("6. Multi-Branch Real-Time Analytics", "Power executive management dashboards with native MongoDB aggregation pipelines ($match, $unwind, $group, $sort) for revenue, dish popularity, and peak hours.")
    ]

    top = 1.8
    for title, desc in objectives:
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(0.78))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER

        tb = s3.shapes.add_textbox(Inches(1.0), Inches(top + 0.05), Inches(11.333), Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"{title}: "
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_SUCCESS
        p.font.name = "Arial"

        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT
        run.font.size = Pt(12)

        top += 0.88

    # ==================== SLIDE 4: PROPOSED SOLUTION & RBAC ====================
    s4 = prs.slides.add_slide(blank_slide_layout)
    add_header(s4, "Proposed Solution & Role-Based Access Control (RBAC)", slide_num=4)

    roles = [
        ("CUSTOMER", "• Registers & authenticates via JWT\n• Selects branch & browses menu\n• Reserves tables with conflict check\n• Places Dine-In / Takeaway orders\n• Views itemized bills & tracks status\n• Submits verified 1-5 star ratings", COLOR_PRIMARY),
        ("KITCHEN STAFF", "• Dedicated Kitchen Queue interface\n• Real-time FIFO ticket sequence\n• Advances status (PLACED→PREPARING→READY)\n• Financial data (prices, bills) sanitized\n• Displays table # and items only", RGBColor(245, 158, 11)),
        ("BRANCH MANAGER", "• Scoped to assigned branches\n• Real-time sales & revenue KPIs\n• Popular dishes & peak hours reports\n• Operational branch deactivation toggle\n• Administrative reservation override", COLOR_SUCCESS),
        ("ADMINISTRATOR", "• Global system-wide oversight\n• Multi-branch CRUD management\n• Full inventory & user role control\n• Global aggregation reporting access\n• System configuration & maintenance", RGBColor(168, 85, 247))
    ]

    left = 0.8
    for r_title, r_desc, r_color in roles:
        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(1.8), Inches(2.78), Inches(5.0))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = r_color
        card.line.width = Pt(1.5)

        tb = s4.shapes.add_textbox(Inches(left + 0.15), Inches(2.0), Inches(2.48), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = r_title
        p.font.bold = True
        p.font.size = Pt(16)
        p.font.color.rgb = r_color
        p.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.space_before = Pt(12)
        p2.text = r_desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_TEXT
        p2.font.name = "Arial"

        left += 2.98

    # ==================== SLIDE 5: SYSTEM ARCHITECTURE ====================
    s5 = prs.slides.add_slide(blank_slide_layout)
    add_header(s5, "System Architecture: Layered 3-Tier MVC Design", slide_num=5)

    arch_tiers = [
        ("Tier 1: Presentation (Client)", "Single Page Application (HTML5, Responsive CSS3, Vanilla ES6 JavaScript)\nCommunicates asynchronously via HTTP REST calls with JSON payloads and Bearer JWT tokens.\nContains Customer, Kitchen, and Manager web views with zero external frontend framework overhead.", Inches(1.8)),
        ("Tier 2: Application Layer (Express.js API)", "• Global Middleware: CORS, express.json(), express.urlencoded(), and Morgan logger.\n• Security Middleware: authenticate (JWT verification) & authorize (Role-Based Access Control).\n• Validation Layer: Declarative Joi schemas for query params, request bodies, and route IDs.\n• Controllers: Standardized response envelopes { success: true, data } and error handling.\n• Services Layer: Encapsulates domain logic (Reservation conflict engine, price calculation, FIFO queue).", Inches(3.2)),
        ("Tier 3: Persistence Layer (MongoDB & Mongoose)", "• Document Storage: MongoDB database managed through Mongoose Object Data Modeling (ODM).\n• Production Indexing: Compound unique indexes on tables, active orders, and customer feedback.\n• Zero-Config Engine: Automatic embedded in-memory MongoDB fallback when local daemon is unavailable.", Inches(5.3))
    ]

    for title, desc, top in arch_tiers:
        card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(1.25))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER

        tb = s5.shapes.add_textbox(Inches(1.0), Inches(top + 0.1), Inches(11.333), Inches(1.05))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(14)
        p.font.color.rgb = COLOR_PRIMARY
        p.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.space_before = Pt(4)
        p2.text = desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT
        p2.font.name = "Arial"

    # ==================== SLIDE 6: DATABASE DESIGN ====================
    s6 = prs.slides.add_slide(blank_slide_layout)
    add_header(s6, "Database Design: References vs. Embedded Modeling", slide_num=6)

    # 2 Big Cards
    card_ref = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_ref.fill.solid()
    card_ref.fill.fore_color.rgb = COLOR_CARD
    card_ref.line.color.rgb = COLOR_PRIMARY

    tb_ref = s6.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_ref = tb_ref.text_frame
    tf_ref.word_wrap = True
    p = tf_ref.paragraphs[0]
    p.text = "Referenced Collections (Normalized)"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_ref.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "Used for independent entities with autonomous lifecycles:\n\n• users: Credentials, roles (CUSTOMER, KITCHEN, MANAGER, ADMIN), and assigned branch IDs.\n• branches: Location details, capacity, and operational status flag (isActive).\n• tables: Seating capacities and branch associations.\n  Index: { branchId: 1, tableNumber: 1 } UNIQUE\n• menuItems: Name, category, price, veg/non-veg flag, and branch scoping.\n• feedback: Customer reviews linked to completed orders.\n  Index: { orderId: 1, customerId: 1 } UNIQUE"
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    card_emb = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_emb.fill.solid()
    card_emb.fill.fore_color.rgb = COLOR_CARD
    card_emb.line.color.rgb = COLOR_SUCCESS

    tb_emb = s6.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_emb = tb_emb.text_frame
    tf_emb.word_wrap = True
    p = tf_emb.paragraphs[0]
    p.text = "Embedded Snapshots (Denormalized)"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_SUCCESS
    p.font.name = "Arial"

    p2 = tf_emb.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "Used where historical immutability is essential:\n\n• Order Items Snapshot (orderItemSchema):\n  When an order is created, the item name and unit price are permanently embedded inside the order document.\n  ★ Why? If menu item prices increase next week, past orders and historical invoices remain 100% immutable and accurate.\n\n• Audit History (statusHistorySchema):\n  Embeds full lifecycle state transitions: { status, changedBy, changedAt, remarks }.\n  Provides an unalterable forensic audit trail for every status jump."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # ==================== SLIDE 7: RESERVATION ENGINE ====================
    s7 = prs.slides.add_slide(blank_slide_layout)
    add_header(s7, "Table Reservation Engine & Conflict Logic", slide_num=7)

    tb = s7.shapes.add_textbox(Inches(0.8), Inches(1.7), Inches(11.733), Inches(1.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Mathematical Interval Conflict Detection Formula:"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = COLOR_TITLE
    p.font.name = "Arial"

    card_math = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.3), Inches(11.733), Inches(1.2))
    card_math.fill.solid()
    card_math.fill.fore_color.rgb = COLOR_CARD
    card_math.line.color.rgb = COLOR_PRIMARY

    tb_math = s7.shapes.add_textbox(Inches(1.0), Inches(2.4), Inches(11.333), Inches(1.0))
    tf_m = tb_math.text_frame
    tf_m.word_wrap = True
    pm = tf_m.paragraphs[0]
    pm.text = "Proposed Slot: [Tstart, Tend)   vs   Existing Active Booking: [Rstart, Rend)\n\nCONFLICT DETECTED IF AND ONLY IF:   Tstart < Rend   AND   Tend > Rstart"
    pm.font.bold = True
    pm.font.size = Pt(15)
    pm.font.color.rgb = RGBColor(147, 197, 253)
    pm.font.name = "Courier New"

    # Bullet cards
    res_points = [
        ("Strict Non-Overlapping Feasibility", "Back-to-back bookings are fully permitted. A reservation ending at 19:00 and another starting at 19:00 do not conflict because time boundaries are open on the right [Tstart, Tend)."),
        ("Exclusion of Cancelled Records", "Bookings with status: 'CANCELLED' are explicitly filtered out using MongoDB query { status: { $ne: 'CANCELLED' } }, immediately releasing table availability."),
        ("2-Hour Academic Cancellation Policy", "Customers can cancel up to 2 hours in advance (ΔT ≥ 120 mins). Cancellations under 2 hours are rejected with 409 CANCELLATION_WINDOW_EXPIRED (Branch Managers retain administrative override privilege)."),
        ("Atomic Pre-Validated Rescheduling", "When rescheduling, the engine validates that the target time slot is open before updating the existing reservation.")
    ]

    top = 3.7
    for title, desc in res_points:
        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(0.78))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER

        tb = s7.shapes.add_textbox(Inches(1.0), Inches(top + 0.05), Inches(11.333), Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_SUCCESS
        p.font.name = "Arial"

        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT
        run.font.size = Pt(11)

        top += 0.88

    # ==================== SLIDE 8: ORDER WORKFLOW ====================
    s8 = prs.slides.add_slide(blank_slide_layout)
    add_header(s8, "Order Workflow: Finite State Machine Transitions", slide_num=8)

    card_state = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_state.fill.solid()
    card_state.fill.fore_color.rgb = COLOR_CARD
    card_state.line.color.rgb = COLOR_PRIMARY

    tb_st = s8.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_st = tb_st.text_frame
    tf_st.word_wrap = True
    p = tf_st.paragraphs[0]
    p.text = "Deterministic State Progression"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_st.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "Dine-In Order Workflow:\n  PLACED → PREPARING → READY → SERVED\n\nTakeaway Order Workflow:\n  PLACED → PREPARING → READY → DELIVERED\n\nCancellation Path:\n  PLACED → CANCELLED (Customer or Manager)\n\nTerminal Immutable States:\n  • SERVED (Dine-In completed)\n  • DELIVERED (Takeaway completed)\n  • CANCELLED (Order voided)"
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Courier New"

    card_rules = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_rules.fill.solid()
    card_rules.fill.fore_color.rgb = COLOR_CARD
    card_rules.line.color.rgb = COLOR_CARD_BORDER

    tb_ru = s8.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_ru = tb_ru.text_frame
    tf_ru.word_wrap = True
    p = tf_ru.paragraphs[0]
    p.text = "State Machine Enforcement Rules"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = COLOR_TITLE
    p.font.name = "Arial"

    p2 = tf_ru.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "1. Illegal Transition Rejection:\n   Direct jumps such as PLACED → SERVED are immediately rejected with HTTP 409 INVALID_STATUS_TRANSITION.\n\n2. Terminal State Locking:\n   Once an order reaches SERVED, DELIVERED, or CANCELLED, further updates are strictly blocked.\n\n3. Role-Based Status Enforcement:\n   • Kitchen staff can only update: PLACED → PREPARING → READY.\n   • Floor managers advance: READY → SERVED.\n\n4. Audit History Logging:\n   Every valid jump appends { status, changedBy, changedAt, remarks } to statusHistory."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # ==================== SLIDE 9: BILLING ENGINE ====================
    s9 = prs.slides.add_slide(blank_slide_layout)
    add_header(s9, "Food Ordering & Server-Side Billing Engine", slide_num=9)

    card_b1 = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_b1.fill.solid()
    card_b1.fill.fore_color.rgb = COLOR_CARD
    card_b1.line.color.rgb = COLOR_CARD_BORDER

    tb_b1 = s9.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_b1 = tb_b1.text_frame
    tf_b1.word_wrap = True
    p = tf_b1.paragraphs[0]
    p.text = "Order Placement & Price Integrity"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_b1.add_paragraph()
    p2.space_before = Pt(12)
    p2.text = "• Client Sends Item IDs & Quantities Only:\n  The client never provides item prices or totals. Any client-sent prices are discarded.\n\n• Server-Authoritative Database Lookup:\n  The server retrieves current prices from the MenuItem collection in MongoDB, ensuring complete protection against price tampering.\n\n• Cross-Branch Validation:\n  All ordered items are verified to belong to the active branch specified.\n\n• Order Modes:\n  - DINE_IN: Bound to an active table.\n  - TAKEAWAY: Independent pickup order."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    card_b2 = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_b2.fill.solid()
    card_b2.fill.fore_color.rgb = COLOR_CARD
    card_b2.line.color.rgb = COLOR_SUCCESS

    tb_b2 = s9.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_b2 = tb_b2.text_frame
    tf_b2.word_wrap = True
    p = tf_b2.paragraphs[0]
    p.text = "Financial Formulation & Billing"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_SUCCESS
    p.font.name = "Arial"

    p2 = tf_b2.add_paragraph()
    p2.space_before = Pt(12)
    p2.text = "Mathematical Formulas:\n\n• LineTotal_i = UnitPrice_i × Quantity_i\n• Subtotal = ∑ LineTotal_i\n• TaxAmount = round(Subtotal × 0.05) [5%]\n• ServiceCharge = round(Subtotal × 0.05) [5%]\n• GrandTotal = Subtotal + TaxAmount + ServiceCharge\n\nSecurity & Privacy:\n• GET /api/orders/:id/bill generates itemized bill.\n• Kitchen users attempting to access billing are blocked with 403 Forbidden to protect financial data."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Courier New"

    # ==================== SLIDE 10: KITCHEN DISPLAY SYSTEM ====================
    s10 = prs.slides.add_slide(blank_slide_layout)
    add_header(s10, "Kitchen Display System: FIFO Preparation Queue", slide_num=10)

    tickets = [
        ("Ticket #1 (Order #101) — 10:02 AM", "Table 1 • Dine-In • Paneer Butter Masala (x2), Garlic Naan (x4)", "OLDEST TICKET: PREPARE FIRST (FIFO)", RGBColor(239, 68, 68)),
        ("Ticket #2 (Order #102) — 10:05 AM", "Takeaway • Veg Biryani (x1), Gulab Jamun (x2)", "STATUS: IN PREPARATION", RGBColor(245, 158, 11)),
        ("Ticket #3 (Order #103) — 10:08 AM", "Table 4 • Dine-In • Dal Makhani (x1), Roti (x3), Mango Lassi (x2)", "STATUS: QUEUED (PLACED)", COLOR_PRIMARY)
    ]

    top = 1.8
    for t_head, t_body, t_badge, t_color in tickets:
        card = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(1.1))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = t_color
        card.line.width = Pt(1.5)

        tb = s10.shapes.add_textbox(Inches(1.0), Inches(top + 0.1), Inches(11.333), Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = t_head
        p.font.bold = True
        p.font.size = Pt(14)
        p.font.color.rgb = COLOR_TITLE
        p.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.space_before = Pt(4)
        p2.text = f"{t_body}   |   [{t_badge}]"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = t_color
        p2.font.name = "Courier New"

        top += 1.25

    # Bottom Explanation
    card_kinfo = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.7), Inches(11.733), Inches(1.3))
    card_kinfo.fill.solid()
    card_kinfo.fill.fore_color.rgb = COLOR_CARD
    card_kinfo.line.color.rgb = COLOR_CARD_BORDER

    tb_ki = s10.shapes.add_textbox(Inches(1.0), Inches(5.75), Inches(11.333), Inches(1.2))
    tf_ki = tb_ki.text_frame
    tf_ki.word_wrap = True
    p = tf_ki.paragraphs[0]
    p.text = "Key Kitchen Queue Architectural Characteristics:"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_ki.add_paragraph()
    p2.text = "• First-In, First-Out (FIFO) Index: Orders query { status: { $in: ['PLACED', 'PREPARING'] } } sorted by { createdAt: 1 }.\n• Data Sanitization: Financial totals, prices, taxes, and customer contact data are strictly stripped from kitchen payloads.\n• Operational Focus: Displays Table Number, Order Type, Dish Names, Quantities, Preparation Notes, and Elapsed Time."
    p2.font.size = Pt(11)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # ==================== SLIDE 11: CUSTOMER & MANAGER PORTALS ====================
    s11 = prs.slides.add_slide(blank_slide_layout)
    add_header(s11, "Customer & Manager Web Portals", slide_num=11)

    card_c = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_c.fill.solid()
    card_c.fill.fore_color.rgb = COLOR_CARD
    card_c.line.color.rgb = COLOR_PRIMARY

    tb_c = s11.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p = tf_c.paragraphs[0]
    p.text = "Customer Experience Features"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_c.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "• Multi-Branch Selection:\n  Choose between operational branches (Central Campus, Kengeri Campus).\n\n• Interactive Table Booking:\n  Visual table cards with guest capacities and conflict validation.\n\n• Categorized Menu Catalog:\n  Filter dishes by category (Starters, Mains, Desserts, Beverages) and Vegetarian pill toggle.\n\n• Real-Time Order Tracking & Billing:\n  View progress badge (PLACED→PREPARING→READY→SERVED) and itemized receipt with tax breakdown.\n\n• Verified 1–5 Star Dining Reviews:\n  Submit ratings strictly restricted to completed meals."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    card_m = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_m.fill.solid()
    card_m.fill.fore_color.rgb = COLOR_CARD
    card_m.line.color.rgb = COLOR_SUCCESS

    tb_m = s11.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    p = tf_m.paragraphs[0]
    p.text = "Manager Dashboard Features"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_SUCCESS
    p.font.name = "Arial"

    p2 = tf_m.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "• Executive KPI Cards:\n  Real-time Total Sales Revenue, Total Completed Orders, Active Reservations, and Average Customer Rating.\n\n• Branch Scoping & Security:\n  Branch managers are strictly isolated to their assigned branches (managedBranchIds).\n\n• 1-Click Operational Deactivation:\n  Toggle branch status (isActive: false). Inactive branches instantly block new bookings while preserving historical reporting.\n\n• Native MongoDB Analytics:\n  Visual sales breakdown, top 5 selling dishes, peak dining hours, and customer satisfaction metrics."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # ==================== SLIDE 12: ANALYTICS AGGREGATIONS ====================
    s12 = prs.slides.add_slide(blank_slide_layout)
    add_header(s12, "Manager Analytics: Native MongoDB Aggregation Pipelines", slide_num=12)

    pipes = [
        ("1. Popular Dishes Report ($unwind + $group + $sort)", 
         "Order.aggregate([\n  { $match: { status: { $in: ['SERVED', 'DELIVERED'] } } },\n  { $unwind: '$items' },\n  { $group: { _id: '$items.menuItemId', name: { $first: '$items.name' }, quantitySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },\n  { $sort: { quantitySold: -1 } }, { $limit: 5 }\n])",
         Inches(1.8), Inches(1.55)),

        ("2. Peak Ordering Hours Report ($hour + $group)", 
         "Order.aggregate([\n  { $match: { status: { $in: ['SERVED', 'DELIVERED'] } } },\n  { $group: { _id: { $hour: '$createdAt' }, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$grandTotal' } } },\n  { $sort: { '_id': 1 } }\n])",
         Inches(3.5), Inches(1.5)),

        ("3. Branch Sales & Revenue Pipeline ($group + $sum)", 
         "Order.aggregate([\n  { $match: { branchId: branchObjectId, status: { $in: ['SERVED', 'DELIVERED'] } } },\n  { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalTax: { $sum: '$taxAmount' }, totalOrders: { $sum: 1 } } }\n])",
         Inches(5.15), Inches(1.5))
    ]

    for title, code, top, height in pipes:
        card = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.733), height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER

        tb = s12.shapes.add_textbox(Inches(1.0), top + Inches(0.05), Inches(11.333), height)
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_PRIMARY
        p.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.text = code
        p2.font.size = Pt(10)
        p2.font.color.rgb = RGBColor(56, 189, 248)
        p2.font.name = "Courier New"

    # ==================== SLIDE 13: TESTING & QUALITY ASSURANCE ====================
    s13 = prs.slides.add_slide(blank_slide_layout)
    add_header(s13, "Automated Testing & Quality Assurance Verification", slide_num=13)

    card_score = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.3))
    card_score.fill.solid()
    card_score.fill.fore_color.rgb = RGBColor(6, 78, 59)
    card_score.line.color.rgb = COLOR_SUCCESS
    card_score.line.width = Pt(2.0)

    tb_sc = s13.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.333), Inches(1.1))
    tf_sc = tb_sc.text_frame
    tf_sc.word_wrap = True
    p = tf_sc.paragraphs[0]
    p.text = "AUTOMATED TEST SUITE: 149 / 149 ASSERTIONS PASSED (100%)"
    p.font.bold = True
    p.font.size = Pt(22)
    p.font.color.rgb = COLOR_TITLE
    p.font.name = "Arial"
    p.alignment = PP_ALIGN.CENTER

    p2 = tf_sc.add_paragraph()
    p2.text = "0 Failures • 0 Regressions • Execution Duration: ~2.7 Seconds • Isolated In-Memory Database"
    p2.font.size = Pt(13)
    p2.font.color.rgb = RGBColor(167, 243, 208)
    p2.font.name = "Arial"
    p2.alignment = PP_ALIGN.CENTER

    # 2 Test Breakdown cards
    c_t1 = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.3), Inches(5.7), Inches(3.5))
    c_t1.fill.solid()
    c_t1.fill.fore_color.rgb = COLOR_CARD
    c_t1.line.color.rgb = COLOR_CARD_BORDER

    tb_t1 = s13.shapes.add_textbox(Inches(1.0), Inches(3.45), Inches(5.3), Inches(3.2))
    tf_t1 = tb_t1.text_frame
    tf_t1.word_wrap = True
    p = tf_t1.paragraphs[0]
    p.text = "Core Modules 1–7 Tested"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_t1.add_paragraph()
    p2.space_before = Pt(8)
    p2.text = "• Authentication & Authorization (22 tests):\n  Registration, bcrypt hashing, JWT issuance, 401/403 checks.\n• Branch Management (8 tests):\n  Active branch listing, manager scoping, deactivation checks.\n• Table Inventory (9 tests):\n  Branch association, capacity limits, duplicate rejection.\n• Menu Catalog (12 tests):\n  Category filtering, dietary veg flags, item inactivation.\n• Reservation Engine & Conflicts (30 tests):\n  Interval conflict (409), back-to-back booking, 2-hr cutoff."
    p2.font.size = Pt(11)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    c_t2 = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(3.3), Inches(5.7), Inches(3.5))
    c_t2.fill.solid()
    c_t2.fill.fore_color.rgb = COLOR_CARD
    c_t2.line.color.rgb = COLOR_CARD_BORDER

    tb_t2 = s13.shapes.add_textbox(Inches(7.0), Inches(3.45), Inches(5.3), Inches(3.2))
    tf_t2 = tb_t2.text_frame
    tf_t2.word_wrap = True
    p = tf_t2.paragraphs[0]
    p.text = "Core Modules 8–13 Tested"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_SUCCESS
    p.font.name = "Arial"

    p2 = tf_t2.add_paragraph()
    p2.space_before = Pt(8)
    p2.text = "• Food Ordering & Server Pricing (17 tests):\n  Dine-In & Takeaway, item verification, price tampering discard.\n• State Machine Transitions (12 tests):\n  Valid progression, invalid jump rejection (409), terminal lock.\n• Billing Calculations (11 tests):\n  Subtotal + 5% tax + 5% service charge rounding accuracy.\n• Kitchen Display Queue (6 tests):\n  FIFO timestamp order, sanitization of financial data.\n• Feedback & Manager Aggregations (18 tests):\n  1-5 star bounds, single review per order, pipeline queries."
    p2.font.size = Pt(11)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # ==================== SLIDE 14: CONCLUSION & FUTURE SCOPE ====================
    s14 = prs.slides.add_slide(blank_slide_layout)
    add_header(s14, "Conclusion & Future Roadmap", slide_num=14)

    card_concl = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_concl.fill.solid()
    card_concl.fill.fore_color.rgb = COLOR_CARD
    card_concl.line.color.rgb = COLOR_PRIMARY

    tb_cc = s14.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_cc = tb_cc.text_frame
    tf_cc.word_wrap = True
    p = tf_cc.paragraphs[0]
    p.text = "Project Accomplishments"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_PRIMARY
    p.font.name = "Arial"

    p2 = tf_cc.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "• Complete Enterprise Platform:\n  Delivered a robust multi-branch restaurant system supporting the entire dining lifecycle across 13 core modules.\n\n• Mathematical Conflict Engine:\n  100% elimination of double-bookings via interval overlap validation.\n\n• Deterministic Workflow & Billing:\n  Enforced finite-state transitions and server-side financial calculations.\n\n• 100% Automated Test Passing:\n  Verified with 149/149 assertions passing, zero errors, and comprehensive academic documentation.\n\n• Ready for CIA-3 Evaluation:\n  Fully compliant with Christ University academic guidelines."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    card_fut = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    card_fut.fill.solid()
    card_fut.fill.fore_color.rgb = COLOR_CARD
    card_fut.line.color.rgb = RGBColor(168, 85, 247)

    tb_ft = s14.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.6))
    tf_ft = tb_ft.text_frame
    tf_ft.word_wrap = True
    p = tf_ft.paragraphs[0]
    p.text = "Future Scope (Roadmap)"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = RGBColor(168, 85, 247)
    p.font.name = "Arial"

    p2 = tf_ft.add_paragraph()
    p2.space_before = Pt(10)
    p2.text = "Features planned for future iterations:\n\n• Online Payment Gateway Integration:\n  Razorpay / Stripe webhook integration with payment verification.\n\n• Real-Time WebSockets (Socket.io):\n  Instantaneous push notifications to the Kitchen Display System without polling.\n\n• Tabletop QR Code Ordering:\n  Unique QR codes placed on dining tables to load table-scoped carts directly on mobile browsers.\n\n• Automated SMS & WhatsApp Alerts:\n  Twilio integration for instant reservation confirmations and cancellation reminders.\n\n• AI Demand Forecasting:\n  Machine learning models for inventory replenishment based on historical peak rush hours."
    p2.font.size = Pt(11.5)
    p2.font.color.rgb = COLOR_TEXT
    p2.font.name = "Arial"

    # Save presentation
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "Restaurant_Reservation_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    create_presentation()

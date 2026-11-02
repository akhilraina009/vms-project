import sys
import os
import pptx
from pptx.enum.text import PP_ALIGN

def set_para_text(p, text):
    """Update paragraph text while preserving the first run's font formatting."""
    if p.runs:
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ""
    else:
        p.text = text

def build_vms_presentation():
    src_path = r"C:\Users\CY2152_akhil\Downloads\2023A1R008_JaidevSingh_PII701_PPT.pptx"
    dest_path_local = r"Z:\vms-project\VMS_Mid_Semester_Evaluation_PPT.pptx"
    dest_path_downloads = r"C:\Users\CY2152_akhil\Downloads\2023A1R009_AkhilRaina_PII701_PPT.pptx"
    
    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return False
        
    prs = pptx.Presentation(src_path)
    print(f"Loaded template with {len(prs.slides)} slides.")
    
    # ----------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # ----------------------------------------------------
    s1 = prs.slides[0]
    # Shape 4 contains the title, evaluation, and student details
    s1_shape4 = s1.shapes[4]
    set_para_text(s1_shape4.text_frame.paragraphs[13], "Submitted By: Akhil Raina (2023A1R009)")
    set_para_text(s1_shape4.text_frame.paragraphs[14], "Internship: Software Intern, CoverYou / Sourceworx AI Pvt. Ltd")
    set_para_text(s1_shape4.text_frame.paragraphs[15], "Duration: 12 October’26 to 1 March’27")
    
    # ----------------------------------------------------
    # SLIDE 2: TABLE OF CONTENTS
    # ----------------------------------------------------
    s2 = prs.slides[1]
    s2_shape1 = s2.shapes[1]
    set_para_text(s2_shape1.text_frame.paragraphs[0], "Introduction & Internship Overview")
    set_para_text(s2_shape1.text_frame.paragraphs[1], "Internship Journey & Key Learnings")
    set_para_text(s2_shape1.text_frame.paragraphs[2], "Project 1: Enterprise Visitor Management (VMS Core)")
    set_para_text(s2_shape1.text_frame.paragraphs[3], "Project 2: IT Asset Custody & Security Verification")
    set_para_text(s2_shape1.text_frame.paragraphs[4], "Results & Outputs")
    set_para_text(s2_shape1.text_frame.paragraphs[5], "Challenges & Solutions")
    set_para_text(s2_shape1.text_frame.paragraphs[6], "Conclusion & Future Scope")
    set_para_text(s2_shape1.text_frame.paragraphs[7], "References")
    
    # ----------------------------------------------------
    # SLIDE 3: ORGANIZATION & MY ROLE
    # ----------------------------------------------------
    s3 = prs.slides[2]
    # S5: ABOUT THE ORGANIZATION
    # S6: Org details
    s3_s6 = s3.shapes[6]
    set_para_text(s3_s6.text_frame.paragraphs[0], "Organization: CoverYou / Sourceworx AI Pvt. Ltd")
    set_para_text(s3_s6.text_frame.paragraphs[1], "Industry: Enterprise Cloud, InsurTech & Security SaaS")
    set_para_text(s3_s6.text_frame.paragraphs[2], "Mode: Hybrid / Remote Development")
    set_para_text(s3_s6.text_frame.paragraphs[3], "Duration: 12 Oct 2026 – 1 Mar 2027")
    
    # S10: CLIENTS I BUILD FOR -> SYSTEMS I BUILD FOR
    s3_s10 = s3.shapes[10]
    set_para_text(s3_s10.text_frame.paragraphs[0], "SYSTEMS I BUILD FOR")
    s3_s11 = s3.shapes[11]
    set_para_text(s3_s11.text_frame.paragraphs[0], "VMS Enterprise (CoverYou): High-throughput visitor ingress, touch NDA & optical QR badges")
    set_para_text(s3_s11.text_frame.paragraphs[1], "Security & IT Gate: Real-time SSE dispatch, edge barcode scanner & hardware custody reconciliation")
    
    # S12: MY ROLE
    # S15, S18, S21: Role bullet points
    s3_s15 = s3.shapes[15]
    set_para_text(s3_s15.text_frame.paragraphs[0], "Build features end to end: database, FastAPI backend and React 19 portals")
    s3_s18 = s3.shapes[18]
    set_para_text(s3_s18.text_frame.paragraphs[0], "Engineer real-time SSE feeds, optical QR scanning and hardware asset clearance")
    s3_s21 = s3.shapes[21]
    set_para_text(s3_s21.text_frame.paragraphs[0], "Harden system security: per-tab session isolation, address deduplication & mobile UI")
    
    # ----------------------------------------------------
    # SLIDE 4: INTERNSHIP JOURNEY TILL NOW
    # ----------------------------------------------------
    s4 = prs.slides[3]
    # Stage 1
    s4_s5 = s4.shapes[5]
    set_para_text(s4_s5.text_frame.paragraphs[0], "STAGE 1  Architecture & Schema")
    set_para_text(s4_s5.text_frame.paragraphs[1], "12 – 16 Oct")
    s4_s6 = s4.shapes[6]
    set_para_text(s4_s6.text_frame.paragraphs[0], "Studied decoupled 3-tier architecture (FastAPI + React 19)")
    set_para_text(s4_s6.text_frame.paragraphs[1], "Designed 3NF database schema (Visitors, Visits, Assets)")
    set_para_text(s4_s6.text_frame.paragraphs[2], "Provisioned localized PostgreSQL and Redis with Docker")
    
    # Stage 2
    s4_s9 = s4.shapes[9]
    set_para_text(s4_s9.text_frame.paragraphs[0], "STAGE 2  Security & Edge Scanning")
    set_para_text(s4_s9.text_frame.paragraphs[1], "17 – 23 Oct")
    s4_s10 = s4.shapes[10]
    set_para_text(s4_s10.text_frame.paragraphs[0], "Integrated html5-qrcode WebAssembly optical webcam scanner")
    set_para_text(s4_s10.text_frame.paragraphs[1], "Built Server-Sent Events (SSE) live feed pipeline for guard desk")
    set_para_text(s4_s10.text_frame.paragraphs[2], "Implemented cryptographic UUIDv4 tokens & digital NDA canvas")
    
    # Stage 3
    s4_s13 = s4.shapes[13]
    set_para_text(s4_s13.text_frame.paragraphs[0], "STAGE 3  Workflows & Hardening")
    set_para_text(s4_s13.text_frame.paragraphs[1], "24 – 29 Oct")
    s4_s14 = s4.shapes[14]
    set_para_text(s4_s14.text_frame.paragraphs[0], "Engineered IT Department technical portal with dual hardware custody")
    set_para_text(s4_s14.text_frame.paragraphs[1], "Built unified Checkout History Dossier with audit log reconciliation")
    set_para_text(s4_s14.text_frame.paragraphs[2], "Achieved 100% mobile responsiveness (0px+) and per-tab auth isolation")
    
    # ----------------------------------------------------
    # SLIDE 5: LEARNINGS & SKILLS ACQUIRED
    # ----------------------------------------------------
    s5 = prs.slides[4]
    # S5 Backend
    s5_s6 = s5.shapes[6]
    set_para_text(s5_s6.text_frame.paragraphs[0], "Python 3.12+, FastAPI, Uvicorn, SQLAlchemy, AsyncPG, Redis Pub/Sub")
    # S10 Frontend
    s5_s11 = s5.shapes[11]
    set_para_text(s5_s11.text_frame.paragraphs[0], "React 19, Vite, Tailwind CSS, html5-qrcode (WASM), Canvas API")
    # S15 System Design
    s5_s16 = s5.shapes[16]
    set_para_text(s5_s16.text_frame.paragraphs[0], "Decoupled 3-tier architecture, 3NF normalization, Server-Sent Events (SSE)")
    # S20 Testing & Quality
    s5_s21 = s5.shapes[21]
    set_para_text(s5_s21.text_frame.paragraphs[0], "pytest API test suites, cryptographic hashing, audit logs, Git")
    # S25 Security Domain
    s5_s25 = s5.shapes[25]
    set_para_text(s5_s25.text_frame.paragraphs[0], "Security & Compliance")
    s5_s26 = s5.shapes[26]
    set_para_text(s5_s26.text_frame.paragraphs[0], "Digital NDA compliance, physical hardware tracking, RBAC, session isolation")
    # S30 Soft Skills
    s5_s31 = s5.shapes[31]
    set_para_text(s5_s31.text_frame.paragraphs[0], "Technical writing, architecture roadmaps, sprint execution, client demos")
    
    # ----------------------------------------------------
    # SLIDE 6: PROJECT 1: VMS CORE
    # ----------------------------------------------------
    s6 = prs.slides[5]
    # S0 Title
    set_para_text(s6.shapes[0].text_frame.paragraphs[0], "Project 1: Enterprise Visitor Management (VMS Core)")
    # S3 Goal & Details
    s6_s3 = s6.shapes[3]
    set_para_text(s6_s3.text_frame.paragraphs[0], "Goal: run enterprise facility ingress, visitor verification, and egress digitally")
    set_para_text(s6_s3.text_frame.paragraphs[1], "Users: lobby receptionists, security guards, host employees, IT admins, visitors")
    set_para_text(s6_s3.text_frame.paragraphs[2], "Covers: public registration kiosk, digital NDA, live guard feed, optical checkout, analytics")
    set_para_text(s6_s3.text_frame.paragraphs[3], "Scale: enterprise campus handling high-throughput visitor traffic across multiple gates")
    # S5 Contribution
    set_para_text(s6.shapes[5].text_frame.paragraphs[0], "8 feature releases, 15,000+ lines across FastAPI backend, React 19 UI and test suites")
    # S10 Frontend
    set_para_text(s6.shapes[10].text_frame.paragraphs[0], "Frontend")
    set_para_text(s6.shapes[10].text_frame.paragraphs[1], "React 19 + Vite")
    # S14 API
    set_para_text(s6.shapes[14].text_frame.paragraphs[0], "API")
    set_para_text(s6.shapes[14].text_frame.paragraphs[1], "FastAPI REST + SSE (Python)")
    # S18 Data
    set_para_text(s6.shapes[18].text_frame.paragraphs[0], "Data")
    set_para_text(s6.shapes[18].text_frame.paragraphs[1], "PostgreSQL 16 + Redis")
    # S22 Quality
    set_para_text(s6.shapes[22].text_frame.paragraphs[0], "Quality")
    set_para_text(s6.shapes[22].text_frame.paragraphs[1], "pytest + API test scripts")
    
    # ----------------------------------------------------
    # SLIDE 7: VISITOR LIFECYCLE WORKFLOW
    # ----------------------------------------------------
    s7 = prs.slides[6]
    set_para_text(s7.shapes[0].text_frame.paragraphs[0], "Visitor Lifecycle Workflow")
    # Step 1
    set_para_text(s7.shapes[2].text_frame.paragraphs[0], "1. Register")
    set_para_text(s7.shapes[3].text_frame.paragraphs[0], "Visitor registers via kiosk / phone QR")
    # Step 2
    set_para_text(s7.shapes[4].text_frame.paragraphs[0], "2. Sign NDA")
    set_para_text(s7.shapes[5].text_frame.paragraphs[0], "Touchscreen digital signature captured")
    # Step 3
    set_para_text(s7.shapes[6].text_frame.paragraphs[0], "3. Issue Pass")
    set_para_text(s7.shapes[7].text_frame.paragraphs[0], "Cryptographic UUIDv4 QR badge generated")
    # Step 4
    set_para_text(s7.shapes[8].text_frame.paragraphs[0], "4. Check-in")
    set_para_text(s7.shapes[9].text_frame.paragraphs[0], "Guard scans QR; SSE live alert notifies host")
    # Step 5
    set_para_text(s7.shapes[10].text_frame.paragraphs[0], "5. In-Facility")
    set_para_text(s7.shapes[11].text_frame.paragraphs[0], "Active visit dossier & hardware custody badge")
    # Step 6
    set_para_text(s7.shapes[12].text_frame.paragraphs[0], "6. Checkout")
    set_para_text(s7.shapes[13].text_frame.paragraphs[0], "Egress optical scan, assets cleared & closed")
    # Role-Based Access
    set_para_text(s7.shapes[17].text_frame.paragraphs[0], "ROLE-BASED ACCESS")
    s7_s18 = s7.shapes[18]
    set_para_text(s7_s18.text_frame.paragraphs[0], "4 specialized portals: Guard Desk, IT Department, Reception, Admin")
    set_para_text(s7_s18.text_frame.paragraphs[1], "Strict per-tab sessionStorage authStorage preventing cross-portal conflicts")
    set_para_text(s7_s18.text_frame.paragraphs[2], "Each role accesses strictly scoped operations and security controls")
    # Compliance Gate
    set_para_text(s7.shapes[22].text_frame.paragraphs[0], "EGRESS & COMPLIANCE GATE")
    s7_s23 = s7.shapes[23]
    set_para_text(s7_s23.text_frame.paragraphs[0], "Mandatory digital NDA signature on file prior to active badge issuance")
    set_para_text(s7_s23.text_frame.paragraphs[1], "Every declared hardware asset must be cleared by security during exit audit")
    set_para_text(s7_s23.text_frame.paragraphs[2], "Strict zero-override checkout gate prevents unauthorized hardware exfiltration")
    
    # ----------------------------------------------------
    # SLIDE 8: FEATURES I BUILT FOR VMS CORE
    # ----------------------------------------------------
    s8 = prs.slides[7]
    set_para_text(s8.shapes[0].text_frame.paragraphs[0], "Features I Built for VMS Core")
    # Card 1
    set_para_text(s8.shapes[4].text_frame.paragraphs[0], "Self-Service Lobby Kiosk")
    set_para_text(s8.shapes[5].text_frame.paragraphs[0], "Touchscreen registration, webcam visitor photo capture, instant optical QR pass")
    # Card 2
    set_para_text(s8.shapes[8].text_frame.paragraphs[0], "Real-Time Guard Dispatch")
    set_para_text(s8.shapes[9].text_frame.paragraphs[0], "Server-Sent Events (SSE) streaming incoming visitors to guard console with audio chime")
    # Card 3
    set_para_text(s8.shapes[12].text_frame.paragraphs[0], "Optical Edge QR Scanner")
    set_para_text(s8.shapes[13].text_frame.paragraphs[0], "Zero-latency WebAssembly barcode scanning (html5-qrcode) via tablet/laptop webcams")
    # Card 4
    set_para_text(s8.shapes[16].text_frame.paragraphs[0], "Interactive Visitor Dossier")
    set_para_text(s8.shapes[17].text_frame.paragraphs[0], "Unified modal with visitor photo, host employee, purpose, and check-in timeline")
    # Card 5
    set_para_text(s8.shapes[20].text_frame.paragraphs[0], "Digital NDA Signature Canvas")
    set_para_text(s8.shapes[21].text_frame.paragraphs[0], "HTML5 touch canvas capturing legal consent embedded into permanent visit audit record")
    # Card 6
    set_para_text(s8.shapes[24].text_frame.paragraphs[0], "Automated Nightly Reconciliation")
    set_para_text(s8.shapes[25].text_frame.paragraphs[0], "Scheduled background worker auto-closing active sessions past 24 hours to prevent stale data")
    
    # ----------------------------------------------------
    # SLIDE 9: SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    s9 = prs.slides[8]
    set_para_text(s9.shapes[0].text_frame.paragraphs[0], "VMS System Architecture")
    # Center boxes
    set_para_text(s9.shapes[2].text_frame.paragraphs[0], "Visitor Lobby Kiosk")
    set_para_text(s9.shapes[2].text_frame.paragraphs[1], "React 19  ·  Public QR Pass")
    set_para_text(s9.shapes[3].text_frame.paragraphs[0], "Security Guard Desk")
    set_para_text(s9.shapes[3].text_frame.paragraphs[1], "Edge Scanner  ·  Live SSE Feed")
    set_para_text(s9.shapes[4].text_frame.paragraphs[0], "IT Department Gate")
    set_para_text(s9.shapes[4].text_frame.paragraphs[1], "Hardware Custody  ·  Pre-Approvals")
    # DB box
    set_para_text(s9.shapes[12].text_frame.paragraphs[0], "Decoupled Three-Tier Architecture")
    set_para_text(s9.shapes[13].text_frame.paragraphs[0], "PostgreSQL 16 (Relational 3NF) + Redis (In-Memory Sub-millisecond Cache)")
    # HOW IT WORKS
    set_para_text(s9.shapes[14].text_frame.paragraphs[0], "HOW IT WORKS")
    s9_s15 = s9.shapes[15]
    set_para_text(s9_s15.text_frame.paragraphs[0], "Visitors register on kiosk or mobile devices; API tokenizes identity with UUIDv4")
    set_para_text(s9_s15.text_frame.paragraphs[1], "Redis caches active visitor sessions for sub-2ms validation at security gates")
    set_para_text(s9_s15.text_frame.paragraphs[2], "Real-time Server-Sent Events (SSE) push arrival alerts to guard consoles instantly")
    set_para_text(s9_s15.text_frame.paragraphs[3], "Dual custody separation isolates visitor personal hardware from company IT assets")
    set_para_text(s9_s15.text_frame.paragraphs[4], "Normalized 3NF PostgreSQL database maintains complete, immutable audit trail")
    set_para_text(s9_s15.text_frame.paragraphs[5], "100% mobile-first design system responsive from 0px up with per-tab session isolation")
    
    # ----------------------------------------------------
    # SLIDE 10: ASSET CUSTODY: ONE SOURCE OF TRUTH
    # ----------------------------------------------------
    s10 = prs.slides[9]
    set_para_text(s10.shapes[0].text_frame.paragraphs[0], "Asset Custody: One Source of Truth")
    set_para_text(s10.shapes[2].text_frame.paragraphs[0], "BEFORE")
    s10_s4 = s10.shapes[4]
    set_para_text(s10_s4.text_frame.paragraphs[0], "Hardware noted on paper registers; serial numbers unverified")
    set_para_text(s10_s4.text_frame.paragraphs[1], "Security guards had no link between visitor pass and carried devices")
    set_para_text(s10_s4.text_frame.paragraphs[2], "Exit inspection was subjective with high risk of data exfiltration")
    set_para_text(s10_s4.text_frame.paragraphs[3], "Company IT equipment loaned to vendors lacked formal custody tracking")
    
    set_para_text(s10.shapes[5].text_frame.paragraphs[0], "AFTER")
    s10_s7 = s10.shapes[7]
    set_para_text(s10_s7.text_frame.paragraphs[0], "Assets modeled as first-class entities with UUIDv4 and serial numbers")
    set_para_text(s10_s7.text_frame.paragraphs[1], "Dual custody classification: Visitor Hardware vs. Issued Company IT Assets")
    set_para_text(s10_s7.text_frame.paragraphs[2], "Guard portal enforces mandatory item-by-item clearance before checkout")
    set_para_text(s10_s7.text_frame.paragraphs[3], "Immutable audit log with inspection timestamps, photos, and officer IDs")
    
    set_para_text(s10.shapes[12].text_frame.paragraphs[0], "Delivered: Unified Checkout History Dossier with interactive inspection cards and clearance badges")
    
    # ----------------------------------------------------
    # SLIDE 11: CRYPTOGRAPHIC TOKENIZATION & QR ENGINE
    # ----------------------------------------------------
    s11 = prs.slides[10]
    set_para_text(s11.shapes[0].text_frame.paragraphs[0], "Cryptographic Tokenization & QR Pass Engine")
    set_para_text(s11.shapes[2].text_frame.paragraphs[0], "Every visit is assigned an unguessable UUIDv4 token rendered as a high-density QR code. Edge scanners decode the token and validate against Redis in under 2ms.")
    
    s11_s3 = s11.shapes[3]
    set_para_text(s11_s3.text_frame.paragraphs[0], "Token Validation Latency =")
    set_para_text(s11_s3.text_frame.paragraphs[1], "Redis In-Memory Lookup (< 2ms) + Cryptographic Token Check")
    set_para_text(s11_s3.text_frame.paragraphs[2], "Tamper-proof: Expired or unapproved passes are rejected immediately at gate")
    
    set_para_text(s11.shapes[7].text_frame.paragraphs[0], "IN THE GUARD DOSSIER")
    s11_s8 = s11.shapes[8]
    set_para_text(s11_s8.text_frame.paragraphs[0], "Real-time visitor photo verification against webcam feed")
    set_para_text(s11_s8.text_frame.paragraphs[1], "Host employee clearance status & contact details")
    set_para_text(s11_s8.text_frame.paragraphs[2], "Itemized hardware asset clearance badges")
    
    set_para_text(s11.shapes[9].text_frame.paragraphs[0], "7 SECURITY PILLARS")
    set_para_text(s11.shapes[10].text_frame.paragraphs[0], "1   Cryptographic UUIDv4 tokens")
    set_para_text(s11.shapes[11].text_frame.paragraphs[0], "2   Sub-2ms Redis cache validation")
    set_para_text(s11.shapes[12].text_frame.paragraphs[0], "3   Edge optical barcode scanning")
    set_para_text(s11.shapes[13].text_frame.paragraphs[0], "4   Server-Sent Event host alerts")
    set_para_text(s11.shapes[14].text_frame.paragraphs[0], "5   Digital NDA signature watermark")
    set_para_text(s11.shapes[15].text_frame.paragraphs[0], "6   Dual hardware custody verification")
    set_para_text(s11.shapes[16].text_frame.paragraphs[0], "7   Immutable PostgreSQL audit logging")
    
    # ----------------------------------------------------
    # SLIDE 12: PROJECT 2: IT ASSET & VISIT PORTAL
    # ----------------------------------------------------
    s12 = prs.slides[11]
    set_para_text(s12.shapes[0].text_frame.paragraphs[0], "Project 2: IT Department Asset & Visit Portal")
    set_para_text(s12.shapes[2].text_frame.paragraphs[0], "The IT Department requires specialized vetting for vendors, contractors, and critical data-center visitors carrying sensitive hardware.")
    
    s12_s6 = s12.shapes[6]
    set_para_text(s12_s6.text_frame.paragraphs[0], "PRE-APPROVAL & PASS PORTAL")
    set_para_text(s12_s6.text_frame.paragraphs[1], "Vendor Pre-Registration")
    s12_s7 = s12.shapes[7]
    set_para_text(s12_s7.text_frame.paragraphs[0], "Pre-register technical visitors and scheduled vendor service contractors")
    set_para_text(s12_s7.text_frame.paragraphs[1], "Host IT manager reviews and issues digitally signed entry authorization")
    set_para_text(s12_s7.text_frame.paragraphs[2], "Mobile-friendly QR passes delivered directly to vendor phones ahead of visit")
    set_para_text(s12.shapes[8].text_frame.paragraphs[0], "Tools: FastAPI, PostgreSQL, AsyncPG, React 19")
    
    s12_s12 = s12.shapes[12]
    set_para_text(s12_s12.text_frame.paragraphs[0], "HARDWARE CUSTODY TRACKING")
    set_para_text(s12_s12.text_frame.paragraphs[1], "Dual Custody Reconciliation")
    s12_s13 = s12.shapes[13]
    set_para_text(s12_s13.text_frame.paragraphs[0], "Log visitor laptops, diagnostic tools, server disks, and replacement modules")
    set_para_text(s12_s13.text_frame.paragraphs[1], "Photographic evidence capture of serial numbers during ingress")
    set_para_text(s12_s13.text_frame.paragraphs[2], "Strict custody reconciliation: Company IT assets issued vs. personal gear")
    set_para_text(s12_s13.text_frame.paragraphs[3], "Unified checkout history tracking every custody transfer event")
    set_para_text(s12_s13.text_frame.paragraphs[4], "Unit tests for asset validation and serial deduplication services")
    set_para_text(s12.shapes[14].text_frame.paragraphs[0], "Tools: Python-multipart, Pillow (PIL), Canvas API, Tailwind CSS")
    
    # ----------------------------------------------------
    # SLIDE 13: HARDWARE CUSTODY WORKFLOW
    # ----------------------------------------------------
    s13 = prs.slides[12]
    set_para_text(s13.shapes[0].text_frame.paragraphs[0], "Hardware Custody & Verification Workflow")
    # Step 1
    set_para_text(s13.shapes[2].text_frame.paragraphs[0], "1. Declare")
    set_para_text(s13.shapes[3].text_frame.paragraphs[0], "Visitor registers hardware with serials & photos")
    # Step 2
    set_para_text(s13.shapes[4].text_frame.paragraphs[0], "2. Inspect")
    set_para_text(s13.shapes[5].text_frame.paragraphs[0], "IT security audits device and verifies serial numbers")
    # Step 3
    set_para_text(s13.shapes[6].text_frame.paragraphs[0], "3. Classify")
    set_para_text(s13.shapes[7].text_frame.paragraphs[0], "Dual custody tagged: personal gear vs. company property")
    # Step 4
    set_para_text(s13.shapes[8].text_frame.paragraphs[0], "4. Active")
    set_para_text(s13.shapes[9].text_frame.paragraphs[0], "Live badge displays \"Assets In Custody\" throughout visit")
    # Step 5
    set_para_text(s13.shapes[10].text_frame.paragraphs[0], "5. Reconcile")
    set_para_text(s13.shapes[11].text_frame.paragraphs[0], "Every asset inspected and cleared before checkout")
    
    # Formula box
    s13_s12 = s13.shapes[12]
    set_para_text(s13_s12.text_frame.paragraphs[0], "Gate Clearance Rule =")
    set_para_text(s13_s12.text_frame.paragraphs[1], "All Declared Assets Cleared (Status: True) + Host Sign-off")
    set_para_text(s13.shapes[13].text_frame.paragraphs[0], "Zero-tolerance security: System strictly locks checkout if any asset remains uncleared.")
    
    set_para_text(s13.shapes[17].text_frame.paragraphs[0], "CUSTODY RECONCILIATION")
    set_para_text(s13.shapes[18].text_frame.paragraphs[0], "Dual inspection cards, photo comparison modal, and immutable audit logs ensure zero asset loss")
    
    # ----------------------------------------------------
    # SLIDE 14: SYSTEM AUDIT: KEY FINDINGS
    # ----------------------------------------------------
    s14 = prs.slides[13]
    set_para_text(s14.shapes[0].text_frame.paragraphs[0], "System Audit & Hardening: Key Findings")
    # Table shape 2
    table = s14.shapes[2].table
    # Row 0: Headers
    table.cell(0, 0).text = "Finding"
    table.cell(0, 1).text = "Risk"
    table.cell(0, 2).text = "Proposed fix"
    # Row 1
    table.cell(1, 0).text = "Multi-tab session bleeding across portals"
    table.cell(1, 1).text = "Guard and visitor credentials clashing"
    table.cell(1, 2).text = "Per-tab sessionStorage authStorage isolation"
    # Row 2
    table.cell(2, 0).text = "Repeating dummy visitor addresses"
    table.cell(2, 1).text = "Database bloat and duplicate visitor profiles"
    table.cell(2, 2).text = "Smart address deduplication algorithm"
    # Row 3
    table.cell(3, 0).text = "Modal overflow on mobile devices"
    table.cell(3, 1).text = "Guard unable to click checkout buttons on phone"
    table.cell(3, 2).text = "Full responsive CSS redesign from 0px up"
    # Row 4
    table.cell(4, 0).text = "Uncleared hardware exiting facility"
    table.cell(4, 1).text = "Unauthorized data exfiltration or asset loss"
    table.cell(4, 2).text = "Strict checkout validation gate & audit trail"
    # Row 5
    table.cell(5, 0).text = "Dangling active visits past 24 hours"
    table.cell(5, 1).text = "Inaccurate campus occupancy counts"
    table.cell(5, 2).text = "Automated nightly cron job (AUTO_CLOSED state)"
    
    set_para_text(s14.shapes[3].text_frame.paragraphs[0], "Source: VMS Enterprise Architecture & Security Hardening Review, October 2026")
    
    # ----------------------------------------------------
    # SLIDE 15: RESULTS & OUTPUTS
    # ----------------------------------------------------
    s15 = prs.slides[14]
    set_para_text(s15.shapes[0].text_frame.paragraphs[0], "Results & Outputs")
    # Card 1
    set_para_text(s15.shapes[3].text_frame.paragraphs[0], "8+")
    set_para_text(s15.shapes[4].text_frame.paragraphs[0], "major git feature releases")
    # Card 2
    set_para_text(s15.shapes[6].text_frame.paragraphs[0], "15K+")
    set_para_text(s15.shapes[7].text_frame.paragraphs[0], "lines of clean code added")
    # Card 3
    set_para_text(s15.shapes[9].text_frame.paragraphs[0], "4")
    set_para_text(s15.shapes[10].text_frame.paragraphs[0], "enterprise portals unified")
    # Card 4
    set_para_text(s15.shapes[12].text_frame.paragraphs[0], "100%")
    set_para_text(s15.shapes[13].text_frame.paragraphs[0], "mobile responsive (from 0px up)")
    # Card 5
    set_para_text(s15.shapes[15].text_frame.paragraphs[0], "18+")
    set_para_text(s15.shapes[16].text_frame.paragraphs[0], "backend REST & SSE routes")
    # Card 6
    set_para_text(s15.shapes[18].text_frame.paragraphs[0], "<2ms")
    set_para_text(s15.shapes[19].text_frame.paragraphs[0], "Redis cache lookup latency")
    # Card 7
    set_para_text(s15.shapes[21].text_frame.paragraphs[0], "41+")
    set_para_text(s15.shapes[22].text_frame.paragraphs[0], "verified visit dossiers logged")
    # Card 8
    set_para_text(s15.shapes[24].text_frame.paragraphs[0], "0")
    set_para_text(s15.shapes[25].text_frame.paragraphs[0], "unauthorized egress incidents")
    # Bottom caption
    set_para_text(s15.shapes[26].text_frame.paragraphs[0], "Reports & Artifacts: VMS Execution Strategy, Security Hardening Review, and Launch Video")
    
    # ----------------------------------------------------
    # SLIDE 16: CHALLENGES & SOLUTIONS
    # ----------------------------------------------------
    s16 = prs.slides[15]
    set_para_text(s16.shapes[0].text_frame.paragraphs[0], "Challenges & Solutions")
    # Row 1
    set_para_text(s16.shapes[4].text_frame.paragraphs[0], "Hardware assets were unmonitored during facility exit")
    set_para_text(s16.shapes[6].text_frame.paragraphs[0], "Relational asset tracking with serial numbers and mandatory clearance gate")
    # Row 2
    set_para_text(s16.shapes[7].text_frame.paragraphs[0], "Client network latency slowed lobby check-in lines")
    set_para_text(s16.shapes[9].text_frame.paragraphs[0], "Edge-based optical QR scanning via WebAssembly (html5-qrcode)")
    # Row 3
    set_para_text(s16.shapes[10].text_frame.paragraphs[0], "Guard desk operations needed on mobile and tablet screens")
    set_para_text(s16.shapes[12].text_frame.paragraphs[0], "Full responsive redesign from 0px up, resolving modal overflow and clipping")
    # Row 4
    set_para_text(s16.shapes[13].text_frame.paragraphs[0], "Multi-tab usage caused session bleeding across user roles")
    set_para_text(s16.shapes[15].text_frame.paragraphs[0], "Isolated auth state using per-tab sessionStorage with role-based route guards")
    
    # ----------------------------------------------------
    # SLIDE 17: CONCLUSION & FUTURE SCOPE
    # ----------------------------------------------------
    s17 = prs.slides[16]
    set_para_text(s17.shapes[0].text_frame.paragraphs[0], "Conclusion & Future Scope")
    # Conclusion bullet points
    s17_s6 = s17.shapes[6]
    set_para_text(s17_s6.text_frame.paragraphs[0], "Architected and delivered a complete enterprise Visitor and Asset Management System")
    set_para_text(s17_s6.text_frame.paragraphs[1], "Implemented decoupled 3-tier architecture with FastAPI, PostgreSQL, Redis, and React 19")
    set_para_text(s17_s6.text_frame.paragraphs[2], "Solved critical physical security challenges via dual hardware custody reconciliation")
    set_para_text(s17_s6.text_frame.paragraphs[3], "Achieved zero-latency optical edge scanning, real-time SSE feeds, and 0px+ mobile UI")
    # Future scope bullet points
    s17_s11 = s17.shapes[11]
    set_para_text(s17_s11.text_frame.paragraphs[0], "Facial recognition kiosk integration for automated seamless visitor verification")
    set_para_text(s17_s11.text_frame.paragraphs[1], "Automated Slack & Microsoft Teams webhooks for instant host arrival notifications")
    set_para_text(s17_s11.text_frame.paragraphs[2], "RFID / NFC badge encoder integration for physical speed-gates and turnstiles")
    set_para_text(s17_s11.text_frame.paragraphs[3], "AI-driven behavioral anomaly detection for unauthorized off-hours access")
    
    # ----------------------------------------------------
    # SLIDE 18: REFERENCES
    # ----------------------------------------------------
    s18 = prs.slides[17]
    set_para_text(s18.shapes[0].text_frame.paragraphs[0], "References")
    s18_s2 = s18.shapes[2]
    set_para_text(s18_s2.text_frame.paragraphs[0], "[1]  FastAPI Documentation, tiangolo.com/fastapi.")
    set_para_text(s18_s2.text_frame.paragraphs[1], "[2]  PostgreSQL 16 Global Development Group, “PostgreSQL Documentation”, postgresql.org/docs.")
    set_para_text(s18_s2.text_frame.paragraphs[2], "[3]  Redis In-Memory Data Store, “Redis Documentation & Pub/Sub Patterns”, redis.io/docs.")
    set_para_text(s18_s2.text_frame.paragraphs[3], "[4]  React 19 Documentation, react.dev; “Vite Build Tool”, vite.dev.")
    set_para_text(s18_s2.text_frame.paragraphs[4], "[5]  html5-qrcode, “WebAssembly Barcode & Optical QR Scanner”, github.com/mebjas/html5-qrcode.")
    set_para_text(s18_s2.text_frame.paragraphs[5], "[6]  Tailwind CSS, “Modern Utility-First CSS Framework”, tailwindcss.com.")
    set_para_text(s18_s2.text_frame.paragraphs[6], "[7]  NIST SP 800-53 Rev. 5, “Security and Privacy Controls for Information Systems”, csrc.nist.gov.")
    set_para_text(s18_s2.text_frame.paragraphs[7], "[8]  OWASP Foundation, “OWASP API Security Top 10 & Session Management Guide”, owasp.org.")
    set_para_text(s18_s2.text_frame.paragraphs[8], "[9]  pytest, “pytest: Robust Unit & Integration Testing in Python”, docs.pytest.org.")
    
    # ----------------------------------------------------
    # SLIDE 19: THANK YOU
    # ----------------------------------------------------
    s19 = prs.slides[18]
    set_para_text(s19.shapes[0].text_frame.paragraphs[0], "Thank You")
    
    # Save to both target locations
    prs.save(dest_path_local)
    print(f"Saved local presentation to: {dest_path_local}")
    prs.save(dest_path_downloads)
    print(f"Saved downloads presentation to: {dest_path_downloads}")
    return True

if __name__ == "__main__":
    success = build_vms_presentation()
    if success:
        print("Successfully generated VMS presentation!")
    else:
        print("Failed to generate VMS presentation.")

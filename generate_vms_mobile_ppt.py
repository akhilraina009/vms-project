import sys
import os
import pptx
from pptx.util import Inches

def set_para_text(p, text):
    """Update paragraph text while preserving the first run's font formatting."""
    if p.runs:
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ""
    else:
        p.text = text

def build_vms_mobile_presentation():
    src_path = r"C:\Users\CY2152_akhil\Downloads\2023A1R008_JaidevSingh_PII701_PPT.pptx"
    dest_path_local = r"Z:\vms-project\VMS_Mid_Semester_Evaluation_PPT.pptx"
    dest_path_downloads = r"C:\Users\CY2152_akhil\Downloads\2023A1R009_AkhilRaina_PII701_PPT.pptx"
    
    img_mobile_dash = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\95bd7037-a11b-44c1-a980-637e20d565fe\.user_uploaded\media_1793360282542_774f32fe.png"
    img_mobile_dir = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\95bd7037-a11b-44c1-a980-637e20d565fe\.user_uploaded\media_1793360677555_79289de9.png"
    
    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return False
        
    prs = pptx.Presentation(src_path)
    print(f"Loaded template with {len(prs.slides)} slides.")
    
    # ----------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # ----------------------------------------------------
    s1 = prs.slides[0]
    s1_shape4 = s1.shapes[4]
    set_para_text(s1_shape4.text_frame.paragraphs[2], "Mid Semester Evaluation (PII-701) — Mobile VMS")
    set_para_text(s1_shape4.text_frame.paragraphs[13], "Submitted By: Akhil Raina (2023A1R009)")
    set_para_text(s1_shape4.text_frame.paragraphs[14], "Internship: Software Intern (Mobile UX/Eng), CoverYou / Sourceworx AI Pvt. Ltd")
    set_para_text(s1_shape4.text_frame.paragraphs[15], "Duration: 12 October’26 to 1 March’27")
    
    # ----------------------------------------------------
    # SLIDE 2: TABLE OF CONTENTS
    # ----------------------------------------------------
    s2 = prs.slides[1]
    s2_shape1 = s2.shapes[1]
    set_para_text(s2_shape1.text_frame.paragraphs[0], "Mobile-First Architecture Overview")
    set_para_text(s2_shape1.text_frame.paragraphs[1], "Mobile Engineering Journey & Key Learnings")
    set_para_text(s2_shape1.text_frame.paragraphs[2], "Project 1: Mobile Security Command Dashboard")
    set_para_text(s2_shape1.text_frame.paragraphs[3], "Project 2: Mobile Visitors Directory & Identity Registry")
    set_para_text(s2_shape1.text_frame.paragraphs[4], "Mobile Performance & Quantitative Results")
    set_para_text(s2_shape1.text_frame.paragraphs[5], "Responsive Challenges & Viewport Solutions")
    set_para_text(s2_shape1.text_frame.paragraphs[6], "Conclusion & Mobile Future Scope")
    set_para_text(s2_shape1.text_frame.paragraphs[7], "References")
    
    # ----------------------------------------------------
    # SLIDE 3: ORGANIZATION & MY ROLE (MOBILE SPECIALIZATION)
    # ----------------------------------------------------
    s3 = prs.slides[2]
    s3_s6 = s3.shapes[6]
    set_para_text(s3_s6.text_frame.paragraphs[0], "Organization: CoverYou / Sourceworx AI Pvt. Ltd")
    set_para_text(s3_s6.text_frame.paragraphs[1], "Industry: Enterprise Cloud, InsurTech & Mobile Security SaaS")
    set_para_text(s3_s6.text_frame.paragraphs[2], "Mode: Hybrid / Remote Mobile Development")
    set_para_text(s3_s6.text_frame.paragraphs[3], "Duration: 12 Oct 2026 – 1 Mar 2027")
    
    s3_s10 = s3.shapes[10]
    set_para_text(s3_s10.text_frame.paragraphs[0], "MOBILE PLATFORMS I BUILD FOR")
    s3_s11 = s3.shapes[11]
    set_para_text(s3_s11.text_frame.paragraphs[0], "Security Command Dashboard: Real-time smartphone command center for gate officers, admissions & active egress")
    set_para_text(s3_s11.text_frame.paragraphs[1], "Visitors Directory & Registry: Mobile identity hub managing 120+ visitors, 19 companies, search & direct checkout")
    
    s3_s12 = s3.shapes[12]
    set_para_text(s3_s12.text_frame.paragraphs[0], "MY ROLE (MOBILE ENGINEERING)")
    s3_s15 = s3.shapes[15]
    set_para_text(s3_s15.text_frame.paragraphs[0], "Architect mobile-first layouts: responsive CSS from 0px up, zero horizontal clipping, fluid cards")
    s3_s18 = s3.shapes[18]
    set_para_text(s3_s18.text_frame.paragraphs[0], "Engineer touch-native workflows: touch NDA canvas, mobile camera optical QR scanning, & haptics")
    s3_s21 = s3.shapes[21]
    set_para_text(s3_s21.text_frame.paragraphs[0], "Harden mobile directory: smart address deduplication, instant filter pills, & 0px+ modal fixes")
    
    # ----------------------------------------------------
    # SLIDE 4: INTERNSHIP JOURNEY (MOBILE MILESTONES)
    # ----------------------------------------------------
    s4 = prs.slides[3]
    s4_s5 = s4.shapes[5]
    set_para_text(s4_s5.text_frame.paragraphs[0], "STAGE 1  Mobile Layout Architecture")
    set_para_text(s4_s5.text_frame.paragraphs[1], "12 – 16 Oct")
    s4_s6 = s4.shapes[6]
    set_para_text(s4_s6.text_frame.paragraphs[0], "Audited legacy desktop views on mobile viewports (320px–430px)")
    set_para_text(s4_s6.text_frame.paragraphs[1], "Established mobile-first CSS architecture with CSS grid & flexbox")
    set_para_text(s4_s6.text_frame.paragraphs[2], "Built viewport-adaptive layouts for handheld guard devices")
    
    s4_s9 = s4.shapes[9]
    set_para_text(s4_s9.text_frame.paragraphs[0], "STAGE 2  Touch UX & Camera Scanning")
    set_para_text(s4_s9.text_frame.paragraphs[1], "17 – 23 Oct")
    s4_s10 = s4.shapes[10]
    set_para_text(s4_s10.text_frame.paragraphs[0], "Integrated mobile camera autofocus for optical QR scanning via WASM")
    set_para_text(s4_s10.text_frame.paragraphs[1], "Built touch-responsive digital signature pad for visitor NDA on phone")
    set_para_text(s4_s10.text_frame.paragraphs[2], "Implemented mobile-optimized Server-Sent Events (SSE) alert banners")
    
    s4_s13 = s4.shapes[13]
    set_para_text(s4_s13.text_frame.paragraphs[0], "STAGE 3  Directory & Viewport Hardening")
    set_para_text(s4_s13.text_frame.paragraphs[1], "24 – 29 Oct")
    s4_s14 = s4.shapes[14]
    set_para_text(s4_s14.text_frame.paragraphs[0], "Engineered Mobile Visitors Directory (120 records, 19 companies, filter pills)")
    set_para_text(s4_s14.text_frame.paragraphs[1], "Implemented smart address deduplication and eliminated database repeat bloat")
    set_para_text(s4_s14.text_frame.paragraphs[2], "Resolved modal horizontal overflow and left-side clipping across 0px+ screens")
    
    # ----------------------------------------------------
    # SLIDE 5: LEARNINGS & SKILLS (MOBILE FOCUS)
    # ----------------------------------------------------
    s5 = prs.slides[4]
    s5_s5 = s5.shapes[5]
    set_para_text(s5_s5.text_frame.paragraphs[0], "Mobile Frontend")
    s5_s6 = s5.shapes[6]
    set_para_text(s5_s6.text_frame.paragraphs[0], "React 19, Tailwind CSS, Viewport Units (dvh/svh), Touch Event Listeners, Canvas API")
    
    s5_s10 = s5.shapes[10]
    set_para_text(s5_s10.text_frame.paragraphs[0], "Mobile API & Streaming")
    s5_s11 = s5.shapes[11]
    set_para_text(s5_s11.text_frame.paragraphs[0], "FastAPI async endpoints, lightweight JSON payloads, low-bandwidth SSE feeds")
    
    s5_s15 = s5.shapes[15]
    set_para_text(s5_s15.text_frame.paragraphs[0], "Responsive Architecture")
    s5_s16 = s5.shapes[16]
    set_para_text(s5_s16.text_frame.paragraphs[0], "0px-up fluid design, CSS subgrid, dynamic safe-area insets (env(safe-area-inset))")
    
    s5_s20 = s5.shapes[20]
    set_para_text(s5_s20.text_frame.paragraphs[0], "Directory & Data Engine")
    s5_s21 = s5.shapes[21]
    set_para_text(s5_s21.text_frame.paragraphs[0], "Client-side search, smart address deduplication, multi-filter pill state")
    
    s5_s25 = s5.shapes[25]
    set_para_text(s5_s25.text_frame.paragraphs[0], "Mobile Security & UX")
    s5_s26 = s5.shapes[26]
    set_para_text(s5_s26.text_frame.paragraphs[0], "SessionStorage tab isolation, 48px touch targets, direct Pass & Checkout triggers")
    
    s5_s30 = s5.shapes[30]
    set_para_text(s5_s30.text_frame.paragraphs[0], "Soft Skills")
    s5_s31 = s5.shapes[31]
    set_para_text(s5_s31.text_frame.paragraphs[0], "Mobile usability testing, defect triage for edge screen sizes, responsive documentation")
    
    # ----------------------------------------------------
    # SLIDE 6: PROJECT 1: MOBILE SECURITY COMMAND DASHBOARD (WITH REAL IMAGE 1!)
    # ----------------------------------------------------
    s6 = prs.slides[5]
    set_para_text(s6.shapes[0].text_frame.paragraphs[0], "Project 1: Mobile Security Command Dashboard")
    s6_s3 = s6.shapes[3]
    set_para_text(s6_s3.text_frame.paragraphs[0], "Goal: enable guards to run full gate operations directly from handheld smartphones")
    set_para_text(s6_s3.text_frame.paragraphs[1], "Users: roaming security guards, lobby officers, entrance gate staff, smartphone users")
    set_para_text(s6_s3.text_frame.paragraphs[2], "Covers: live mobile dashboard, 1-tap admission, phone camera QR scan, mobile dossier")
    set_para_text(s6_s3.text_frame.paragraphs[3], "Scale: sub-400px screens with live occupancy metrics & instant Pass & Checkout action")
    
    set_para_text(s6.shapes[5].text_frame.paragraphs[0], "8 mobile releases, 15,000+ lines of responsive CSS, touch components, and mobile routes\nStack: React 19 + Tailwind Mobile · FastAPI · WebAssembly Camera Scanner · Redis (<2ms)")
    
    # Remove right-side placeholder shapes to make clean room for Image 1
    to_remove_s6 = [s for s in s6.shapes if s.left.inches > 5.5]
    for s in to_remove_s6:
        s._element.getparent().remove(s._element)
        
    # Insert Real Mobile Mockup 1 (Security Command Dashboard)
    if os.path.exists(img_mobile_dash):
        s6.shapes.add_picture(img_mobile_dash, Inches(6.0), Inches(1.8), Inches(2.9), Inches(5.3))
        print("Embedded Real Mobile Mockup 1 on Slide 6!")
    
    # ----------------------------------------------------
    # SLIDE 7: MOBILE VISITOR LIFECYCLE WORKFLOW
    # ----------------------------------------------------
    s7 = prs.slides[6]
    set_para_text(s7.shapes[0].text_frame.paragraphs[0], "Mobile Visitor Lifecycle Workflow")
    set_para_text(s7.shapes[2].text_frame.paragraphs[0], "1. Mobile Scan")
    set_para_text(s7.shapes[3].text_frame.paragraphs[0], "Visitor scans gate placard with smartphone camera")
    set_para_text(s7.shapes[4].text_frame.paragraphs[0], "2. Touch Form")
    set_para_text(s7.shapes[5].text_frame.paragraphs[0], "Mobile-optimized 1-column responsive form")
    set_para_text(s7.shapes[6].text_frame.paragraphs[0], "3. Touch NDA")
    set_para_text(s7.shapes[7].text_frame.paragraphs[0], "Visitor draws legal signature on phone screen")
    set_para_text(s7.shapes[8].text_frame.paragraphs[0], "4. Mobile Pass")
    set_para_text(s7.shapes[9].text_frame.paragraphs[0], "High-contrast optical QR pass saved to phone")
    set_para_text(s7.shapes[10].text_frame.paragraphs[0], "5. Guard Mobile")
    set_para_text(s7.shapes[11].text_frame.paragraphs[0], "Guard scans guest pass on phone in under 2s")
    set_para_text(s7.shapes[12].text_frame.paragraphs[0], "6. Mobile Exit")
    set_para_text(s7.shapes[13].text_frame.paragraphs[0], "Guard verifies assets & exits visitor with 1 tap")
    
    set_para_text(s7.shapes[17].text_frame.paragraphs[0], "ROLE-BASED MOBILE NAVIGATION")
    s7_s18 = s7.shapes[18]
    set_para_text(s7_s18.text_frame.paragraphs[0], "Tailored mobile viewports: bottom app bar, collapsible drawer, & thumb-zone actions")
    set_para_text(s7_s18.text_frame.paragraphs[1], "Strict per-tab sessionStorage authStorage preventing cross-portal conflicts on mobile tabs")
    set_para_text(s7_s18.text_frame.paragraphs[2], "Each mobile role accesses strictly scoped operations with oversized tap targets")
    
    set_para_text(s7.shapes[22].text_frame.paragraphs[0], "MOBILE COMPLIANCE GATE")
    s7_s23 = s7.shapes[23]
    set_para_text(s7_s23.text_frame.paragraphs[0], "Mandatory touchscreen NDA signature on file prior to active badge issuance")
    set_para_text(s7_s23.text_frame.paragraphs[1], "Real-time mobile asset checklist prevents exit if hardware remains uncleared")
    set_para_text(s7_s23.text_frame.paragraphs[2], "Zero-override security lock ensures compliance directly on roaming guard devices")
    
    # ----------------------------------------------------
    # SLIDE 8: FEATURES I BUILT FOR MOBILE VIEW
    # ----------------------------------------------------
    s8 = prs.slides[7]
    set_para_text(s8.shapes[0].text_frame.paragraphs[0], "Features I Built for Mobile View")
    set_para_text(s8.shapes[4].text_frame.paragraphs[0], "Mobile Security Command Hub")
    set_para_text(s8.shapes[5].text_frame.paragraphs[0], "Dark-mode header with live gate status, occupancy chips, and 1-tap quick action buttons")
    set_para_text(s8.shapes[8].text_frame.paragraphs[0], "Phone Camera Optical Scanner")
    set_para_text(s8.shapes[9].text_frame.paragraphs[0], "Native smartphone back-camera integration with continuous autofocus and instant QR decode")
    set_para_text(s8.shapes[12].text_frame.paragraphs[0], "Touch-Optimized Visitor Cards")
    set_para_text(s8.shapes[13].text_frame.paragraphs[0], "Thumb-friendly list view of visitors with status badges, host tags, and Pass & Checkout buttons")
    set_para_text(s8.shapes[16].text_frame.paragraphs[0], "Fluid Modal Dossiers")
    set_para_text(s8.shapes[17].text_frame.paragraphs[0], "Responsive bottom-sheet modals with dynamic scrolling, eliminating viewport clipping")
    set_para_text(s8.shapes[20].text_frame.paragraphs[0], "Visitors Directory & Registry")
    set_para_text(s8.shapes[21].text_frame.paragraphs[0], "Mobile directory managing 120 visitors, 19 companies, instant search & deduplication")
    set_para_text(s8.shapes[24].text_frame.paragraphs[0], "Mobile Quick Actions Bar")
    set_para_text(s8.shapes[25].text_frame.paragraphs[0], "Sticky bottom touch navigation: Scan QR, Create Visit, and Checkout accessible with one thumb")
    
    # ----------------------------------------------------
    # SLIDE 9: MOBILE SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    s9 = prs.slides[8]
    set_para_text(s9.shapes[0].text_frame.paragraphs[0], "Mobile System Architecture")
    set_para_text(s9.shapes[2].text_frame.paragraphs[0], "Mobile Visitor Pass")
    set_para_text(s9.shapes[2].text_frame.paragraphs[1], "React 19  ·  PWA Mobile Web")
    set_para_text(s9.shapes[3].text_frame.paragraphs[0], "Mobile Guard Dashboard")
    set_para_text(s9.shapes[3].text_frame.paragraphs[1], "Phone Camera  ·  Live SSE Feed")
    set_para_text(s9.shapes[4].text_frame.paragraphs[0], "Mobile Visitors Directory")
    set_para_text(s9.shapes[4].text_frame.paragraphs[1], "120 Visitors  ·  19 Companies")
    set_para_text(s9.shapes[12].text_frame.paragraphs[0], "Decoupled Mobile-First Architecture")
    set_para_text(s9.shapes[13].text_frame.paragraphs[0], "FastAPI Lightweight Endpoints + Redis Mobile Session Cache (<2ms)")
    
    set_para_text(s9.shapes[14].text_frame.paragraphs[0], "HOW IT WORKS (MOBILE PERSPECTIVE)")
    s9_s15 = s9.shapes[15]
    set_para_text(s9_s15.text_frame.paragraphs[0], "Viewports adapt from 320px up to tablets using fluid CSS clamp and flex layouts")
    set_para_text(s9_s15.text_frame.paragraphs[1], "Phone camera captures optical QR frames directly in WebAssembly without video lag")
    set_para_text(s9_s15.text_frame.paragraphs[2], "Server-Sent Events push lightweight notifications (<2KB) with minimal mobile battery drain")
    set_para_text(s9_s15.text_frame.paragraphs[3], "Mobile assets & visitors display as swipeable cards with instant Details, Pass & Checkout")
    set_para_text(s9_s15.text_frame.paragraphs[4], "Safe-area insets ensure the interface is never obscured by camera notches or home bars")
    set_para_text(s9_s15.text_frame.paragraphs[5], "Per-tab sessionStorage prevents mobile browser multi-tab logout collisions")
    
    # ----------------------------------------------------
    # SLIDE 10: MOBILE ASSET CUSTODY: ONE SOURCE OF TRUTH
    # ----------------------------------------------------
    s10 = prs.slides[9]
    set_para_text(s10.shapes[0].text_frame.paragraphs[0], "Mobile Asset Custody: One Source of Truth")
    set_para_text(s10.shapes[2].text_frame.paragraphs[0], "BEFORE (DESKTOP / PAPER)")
    s10_s4 = s10.shapes[4]
    set_para_text(s10_s4.text_frame.paragraphs[0], "Guards had to walk back to fixed desktop PCs to verify laptop serial numbers")
    set_para_text(s10_s4.text_frame.paragraphs[1], "Bulky desktop forms crashed and horizontally overflowed on smartphone screens")
    set_para_text(s10_s4.text_frame.paragraphs[2], "No way to snap photo proof of hardware at the gate during physical bag checks")
    set_para_text(s10_s4.text_frame.paragraphs[3], "Critical delays created long queues and lobby congestion during peak rush")
    
    set_para_text(s10.shapes[5].text_frame.paragraphs[0], "AFTER (MOBILE-FIRST REVOLUTION)")
    s10_s7 = s10.shapes[7]
    set_para_text(s10_s7.text_frame.paragraphs[0], "Roaming guards inspect assets directly at vehicle or lobby gates using smartphones")
    set_para_text(s10_s7.text_frame.paragraphs[1], "Native phone camera captures serial number photos and uploads them in real time")
    set_para_text(s10_s7.text_frame.paragraphs[2], "Mobile-responsive asset inspection cards with tap-to-verify toggle buttons")
    set_para_text(s10_s7.text_frame.paragraphs[3], "Uncleared hardware highlights an amber warning badge directly on the guard's phone")
    
    set_para_text(s10.shapes[12].text_frame.paragraphs[0], "Delivered: 100% mobile-responsive Checkout History Dossier with touch inspection cards and photo verification")
    
    # ----------------------------------------------------
    # SLIDE 11: MOBILE OPTICAL SCANNING & SECURITY ENGINE
    # ----------------------------------------------------
    s11 = prs.slides[10]
    set_para_text(s11.shapes[0].text_frame.paragraphs[0], "Mobile Optical Scanning & Security Engine")
    set_para_text(s11.shapes[2].text_frame.paragraphs[0], "Guards scan visitor QR passes directly using phone cameras. Edge-based WebAssembly decodes the unguessable UUIDv4 token locally on the device in under 15ms.")
    
    s11_s3 = s11.shapes[3]
    set_para_text(s11_s3.text_frame.paragraphs[0], "Mobile Verification Speed =")
    set_para_text(s11_s3.text_frame.paragraphs[1], "Device Edge Scan (<15ms) + Redis Cache Lookup (<2ms) = <20ms Total")
    set_para_text(s11_s3.text_frame.paragraphs[2], "Zero proprietary hardware: Turns any Android or iOS smartphone into an enterprise gate terminal")
    
    set_para_text(s11.shapes[7].text_frame.paragraphs[0], "IN THE MOBILE GUARD DOSSIER")
    s11_s8 = s11.shapes[8]
    set_para_text(s11_s8.text_frame.paragraphs[0], "Full-screen high-contrast visitor portrait verification on phone")
    set_para_text(s11_s8.text_frame.paragraphs[1], "1-tap phone dialer and WhatsApp quick-contact to host employee")
    set_para_text(s11_s8.text_frame.paragraphs[2], "Itemized hardware asset clearance badges with touch toggle")
    
    set_para_text(s11.shapes[9].text_frame.paragraphs[0], "7 MOBILE SECURITY ADVANTAGES")
    set_para_text(s11.shapes[10].text_frame.paragraphs[0], "1   Zero external hardware cost (uses phone camera)")
    set_para_text(s11.shapes[11].text_frame.paragraphs[0], "2   Instant edge QR decoding via WebAssembly")
    set_para_text(s11.shapes[12].text_frame.paragraphs[0], "3   Thumb-zone navigation for 1-handed operation")
    set_para_text(s11.shapes[13].text_frame.paragraphs[0], "4   Low-bandwidth SSE event streaming (<2KB payload)")
    set_para_text(s11.shapes[14].text_frame.paragraphs[0], "5   Offline-tolerant Redis active session cache")
    set_para_text(s11.shapes[15].text_frame.paragraphs[0], "6   Touch-responsive digital signature verification")
    set_para_text(s11.shapes[16].text_frame.paragraphs[0], "7   100% safe-area compliance on notched phones")
    
    # ----------------------------------------------------
    # SLIDE 12: PROJECT 2: MOBILE VISITORS DIRECTORY & REGISTRY (WITH REAL IMAGE 2!)
    # ----------------------------------------------------
    s12 = prs.slides[11]
    set_para_text(s12.shapes[0].text_frame.paragraphs[0], "Project 2: Mobile Visitors Directory & Registry")
    set_para_text(s12.shapes[2].text_frame.paragraphs[0], "Engineering an enterprise-grade mobile directory hub to search, audit, and manage registered visitors and corporate affiliations on phones.")
    
    s12_s6 = s12.shapes[6]
    set_para_text(s12_s6.text_frame.paragraphs[0], "IDENTITY & DIRECTORY REGISTRY")
    set_para_text(s12_s6.text_frame.paragraphs[1], "120 Visitors · 19 Companies")
    s12_s7 = s12.shapes[7]
    set_para_text(s12_s7.text_frame.paragraphs[0], "Instant mobile search by name, company, email with reactive filter pills\nReal-time status tracking: separating general registered visitors from Inside occupants\nSmart address deduplication preventing database bloat and repeating addresses\nMulti-action touch cards with dynamic triggers: Details, Pass, and direct Check Out\nFluid flexbox card styling that never wraps or clips contact details on small screens")
    
    set_para_text(s12.shapes[8].text_frame.paragraphs[0], "Tools: React 19 Mobile, Tailwind CSS, FastAPI, PostgreSQL, AsyncPG")
    
    # Remove right-side placeholder shapes to make clean room for Image 2
    to_remove_s12 = [s for s in s12.shapes if s.left.inches > 5.0]
    for s in to_remove_s12:
        s._element.getparent().remove(s._element)
        
    # Insert Real Mobile Mockup 2 (Visitors Directory & Registry)
    if os.path.exists(img_mobile_dir):
        s12.shapes.add_picture(img_mobile_dir, Inches(5.8), Inches(1.85), Inches(2.9), Inches(5.25))
        print("Embedded Real Mobile Mockup 2 on Slide 12!")
    
    # ----------------------------------------------------
    # SLIDE 13: MOBILE DIRECTORY & ONSITE LIFECYCLE
    # ----------------------------------------------------
    s13 = prs.slides[12]
    set_para_text(s13.shapes[0].text_frame.paragraphs[0], "Mobile Directory & Onsite Lifecycle")
    set_para_text(s13.shapes[2].text_frame.paragraphs[0], "1. Search & Filter")
    set_para_text(s13.shapes[3].text_frame.paragraphs[0], "Instant search across 120 records & 19 companies via pills")
    set_para_text(s13.shapes[4].text_frame.paragraphs[0], "2. Card Identity")
    set_para_text(s13.shapes[5].text_frame.paragraphs[0], "Review phone, email, corporate affiliation, & location")
    set_para_text(s13.shapes[6].text_frame.paragraphs[0], "3. Live Status")
    set_para_text(s13.shapes[7].text_frame.paragraphs[0], "Visual badge distinguishes Registered vs. Inside occupants")
    set_para_text(s13.shapes[8].text_frame.paragraphs[0], "4. Quick Pass")
    set_para_text(s13.shapes[9].text_frame.paragraphs[0], "1-tap access to digital optical QR pass from directory card")
    set_para_text(s13.shapes[10].text_frame.paragraphs[0], "5. Direct Checkout")
    set_para_text(s13.shapes[11].text_frame.paragraphs[0], "Instant Check Out button closes visit without modal lag")
    
    s13_s12 = s13.shapes[12]
    set_para_text(s13_s12.text_frame.paragraphs[0], "Directory Response Rule =")
    set_para_text(s13_s12.text_frame.paragraphs[1], "Client-Side Search (<5ms) + Real-Time Indexing (120 Records / 19 Companies)")
    set_para_text(s13.shapes[13].text_frame.paragraphs[0], "Zero lag: Instant reactive filtering with smart address deduplication.")
    
    set_para_text(s13.shapes[17].text_frame.paragraphs[0], "MOBILE DIRECTORY AUDIT")
    set_para_text(s13.shapes[18].text_frame.paragraphs[0], "Eliminates paper rosters by giving guards a complete, searchable campus directory right on smartphones")
    
    # ----------------------------------------------------
    # SLIDE 14: SYSTEM AUDIT: MOBILE VIEWPORT FIXES
    # ----------------------------------------------------
    s14 = prs.slides[13]
    set_para_text(s14.shapes[0].text_frame.paragraphs[0], "System Audit & Hardening: Mobile Viewport Fixes")
    table = s14.shapes[2].table
    table.cell(0, 0).text = "Mobile Defect"
    table.cell(0, 1).text = "User Impact"
    table.cell(0, 2).text = "Applied Engineering Fix"
    
    table.cell(1, 0).text = "Modal horizontal overflow"
    table.cell(1, 1).text = "Content pushed off-screen on phones (<375px)"
    table.cell(1, 2).text = "Replaced fixed widths with max-w-full & fluid grid"
    
    table.cell(2, 0).text = "Left-side modal clipping"
    table.cell(2, 1).text = "Text and buttons cut off on narrow viewports"
    table.cell(2, 2).text = "Added margin: auto with dynamic viewport padding"
    
    table.cell(3, 0).text = "Right-side gutter & white space"
    table.cell(3, 1).text = "Unwanted horizontal scrollbar on mobile browsers"
    table.cell(3, 2).text = "Enforced overflow-x: hidden & box-sizing: border-box"
    
    table.cell(4, 0).text = "Repeating dummy visitor addresses"
    table.cell(4, 1).text = "Directory card bloat and duplicate visitor rows"
    table.cell(4, 2).text = "Smart address deduplication algorithm in database"
    
    table.cell(5, 0).text = "Small touch target tap misses"
    table.cell(5, 1).text = "Guards misclicking Pass & Checkout buttons"
    table.cell(5, 2).text = "Expanded hitboxes to standard 48px minimum touch targets"
    
    set_para_text(s14.shapes[3].text_frame.paragraphs[0], "Source: VMS Mobile Responsiveness & Viewport Audit Report, October 2026")
    
    # ----------------------------------------------------
    # SLIDE 15: MOBILE RESULTS & PERFORMANCE METRICS
    # ----------------------------------------------------
    s15 = prs.slides[14]
    set_para_text(s15.shapes[0].text_frame.paragraphs[0], "Mobile Results & Performance Metrics")
    set_para_text(s15.shapes[3].text_frame.paragraphs[0], "0px+")
    set_para_text(s15.shapes[4].text_frame.paragraphs[0], "fully responsive from 0px up")
    set_para_text(s15.shapes[6].text_frame.paragraphs[0], "100%")
    set_para_text(s15.shapes[7].text_frame.paragraphs[0], "zero horizontal overflow on phones")
    set_para_text(s15.shapes[9].text_frame.paragraphs[0], "120")
    set_para_text(s15.shapes[10].text_frame.paragraphs[0], "directory visitors searchable on mobile")
    set_para_text(s15.shapes[12].text_frame.paragraphs[0], "<15ms")
    set_para_text(s15.shapes[13].text_frame.paragraphs[0], "on-device camera QR scan speed")
    set_para_text(s15.shapes[15].text_frame.paragraphs[0], "19")
    set_para_text(s15.shapes[16].text_frame.paragraphs[0], "corporate affiliations mapped")
    set_para_text(s15.shapes[18].text_frame.paragraphs[0], "<2ms")
    set_para_text(s15.shapes[19].text_frame.paragraphs[0], "Redis mobile cache response")
    set_para_text(s15.shapes[21].text_frame.paragraphs[0], "48px")
    set_para_text(s15.shapes[22].text_frame.paragraphs[0], "minimum touch target compliance")
    set_para_text(s15.shapes[24].text_frame.paragraphs[0], "0")
    set_para_text(s15.shapes[25].text_frame.paragraphs[0], "viewport clipping defects remaining")
    set_para_text(s15.shapes[26].text_frame.paragraphs[0], "Reports & Artifacts: VMS Mobile Execution Strategy, Viewport Audit Review, and Mobile Demo Video")
    
    # ----------------------------------------------------
    # SLIDE 16: MOBILE CHALLENGES & SOLUTIONS
    # ----------------------------------------------------
    s16 = prs.slides[15]
    set_para_text(s16.shapes[0].text_frame.paragraphs[0], "Mobile Challenges & Solutions")
    set_para_text(s16.shapes[4].text_frame.paragraphs[0], "Fixed-width desktop modals clipped and scrolled horizontally on phones")
    set_para_text(s16.shapes[6].text_frame.paragraphs[0], "Re-engineered all modals into fluid bottom-sheets using max-w-[calc(100vw-24px)] and CSS flex")
    set_para_text(s16.shapes[7].text_frame.paragraphs[0], "Repeating dummy visitor addresses bloated mobile directory cards")
    set_para_text(s16.shapes[9].text_frame.paragraphs[0], "Implemented smart address deduplication algorithm to sanitize and collapse repeating locations")
    set_para_text(s16.shapes[10].text_frame.paragraphs[0], "Small screens caused accidental tap misclicks on Pass and Checkout actions")
    set_para_text(s16.shapes[12].text_frame.paragraphs[0], "Implemented touch-first card UI with 48px tap targets, distinct action colors, and tactile spacing")
    set_para_text(s16.shapes[13].text_frame.paragraphs[0], "Mobile browser tab-switching caused session credential leakage")
    set_para_text(s16.shapes[15].text_frame.paragraphs[0], "Engineered isolated sessionStorage auth storage per browser tab with automatic session lock")
    
    # ----------------------------------------------------
    # SLIDE 17: CONCLUSION & MOBILE FUTURE SCOPE
    # ----------------------------------------------------
    s17 = prs.slides[16]
    set_para_text(s17.shapes[0].text_frame.paragraphs[0], "Conclusion & Mobile Future Scope")
    s17_s6 = s17.shapes[6]
    set_para_text(s17_s6.text_frame.paragraphs[0], "Successfully transformed VMS into a 100% mobile-first enterprise security platform")
    set_para_text(s17_s6.text_frame.paragraphs[1], "Delivered zero-overflow, 0px-up responsive UI across Command Dashboard and Directory")
    set_para_text(s17_s6.text_frame.paragraphs[2], "Empowered roaming security personnel with full gate operations on standard smartphones")
    set_para_text(s17_s6.text_frame.paragraphs[3], "Eliminated hardware costs by replacing dedicated physical scanners with mobile webcams")
    
    s17_s11 = s17.shapes[11]
    set_para_text(s17_s11.text_frame.paragraphs[0], "Offline Progressive Web App (PWA) with service workers for gate operations during Wi-Fi drops")
    set_para_text(s17_s11.text_frame.paragraphs[1], "Native biometric authentication (FaceID / Fingerprint) for instant guard authentication")
    set_para_text(s17_s11.text_frame.paragraphs[2], "Mobile Push Notifications (WebPush API) alerting host employees directly on lock screens")
    set_para_text(s17_s11.text_frame.paragraphs[3], "BLE (Bluetooth Low Energy) beacon detection for automated hands-free visitor badge check-in")
    
    # ----------------------------------------------------
    # SLIDE 18: REFERENCES
    # ----------------------------------------------------
    s18 = prs.slides[17]
    set_para_text(s18.shapes[0].text_frame.paragraphs[0], "References")
    s18_s2 = s18.shapes[2]
    set_para_text(s18_s2.text_frame.paragraphs[0], "[1]  W3C Web Content Accessibility Guidelines (WCAG) 2.1 – Mobile Touch Targets & Viewport Scaling.")
    set_para_text(s18_s2.text_frame.paragraphs[1], "[2]  Google Chrome Mobile Web Standards, “Responsive Web Design Basics”, web.dev/responsive-web-design.")
    set_para_text(s18_s2.text_frame.paragraphs[2], "[3]  html5-qrcode, “Zero-Latency WebAssembly Camera Scanner for Mobile Browsers”, github.com/mebjas/html5-qrcode.")
    set_para_text(s18_s2.text_frame.paragraphs[3], "[4]  Apple Human Interface Guidelines, “Designing for Mobile Viewports & Safe Areas”, developer.apple.com.")
    set_para_text(s18_s2.text_frame.paragraphs[4], "[5]  Tailwind CSS Mobile-First Documentation, tailwindcss.com/docs/responsive-design.")
    set_para_text(s18_s2.text_frame.paragraphs[5], "[6]  FastAPI Documentation, “High-Performance Asynchronous APIs for Mobile Clients”, tiangolo.com/fastapi.")
    set_para_text(s18_s2.text_frame.paragraphs[6], "[7]  Redis Documentation, “Sub-Millisecond In-Memory Caching for Mobile Gate Terminals”, redis.io.")
    set_para_text(s18_s2.text_frame.paragraphs[7], "[8]  MDN Web Docs, “Touch Events & Viewport Meta Configuration”, developer.mozilla.org.")
    set_para_text(s18_s2.text_frame.paragraphs[8], "[9]  pytest, “Automated API & Responsive Testing Framework”, docs.pytest.org.")
    
    # ----------------------------------------------------
    # SLIDE 19: THANK YOU
    # ----------------------------------------------------
    s19 = prs.slides[18]
    set_para_text(s19.shapes[0].text_frame.paragraphs[0], "Thank You")
    
    prs.save(dest_path_local)
    print(f"Saved local mobile presentation to: {dest_path_local}")
    prs.save(dest_path_downloads)
    print(f"Saved downloads mobile presentation to: {dest_path_downloads}")
    return True

if __name__ == "__main__":
    success = build_vms_mobile_presentation()
    if success:
        print("Successfully generated VMS Mobile presentation!")
    else:
        print("Failed to generate VMS Mobile presentation.")

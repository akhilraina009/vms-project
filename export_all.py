import os
import base64
import subprocess
import shutil

# Read the profile image and convert to base64
img_path = 'z:/vms-project/aayush_profile.png'
with open(img_path, 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode('utf-8')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Aayush Koushal - Resume</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #334155;
    background: #ffffff;
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    display: flex;
    overflow: hidden;
  }}
  
  /* Sidebar */
  .sidebar {{
    width: 72mm;
    height: 297mm;
    background: #1B2A4A;
    color: #ffffff;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }}
  .avatar-container {{
    text-align: center;
    margin-bottom: 20px;
  }}
  .avatar {{
    width: 130px;
    height: 130px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }}
  .side-section {{
    margin-bottom: 18px;
  }}
  .side-title {{
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #ffffff;
    border-bottom: 1.5px solid #2C4A75;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }}
  .contact-item {{
    font-size: 9.5px;
    color: #e2e8f0;
    margin-bottom: 7px;
    line-height: 1.35;
    display: flex;
    align-items: flex-start;
    gap: 7px;
  }}
  .contact-item span.icon {{
    color: #93c5fd;
    font-size: 11px;
    line-height: 1;
  }}
  .edu-item {{
    margin-bottom: 9px;
  }}
  .edu-deg {{
    font-size: 10px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.25;
  }}
  .edu-sub {{
    font-size: 8.5px;
    color: #93c5fd;
    margin-top: 1px;
  }}
  .skills-list, .lang-list {{
    list-style: none;
  }}
  .skills-list li, .lang-list li {{
    font-size: 9.2px;
    color: #f1f5f9;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .skills-list li::before, .lang-list li::before {{
    content: "•";
    color: #60a5fa;
    font-size: 12px;
  }}

  /* Main Content */
  .main {{
    flex: 1;
    height: 297mm;
    padding: 28px 26px 24px 26px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }}
  .header {{
    border-bottom: 2px solid #1B2A4A;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }}
  .header h1 {{
    font-size: 26px;
    font-weight: 800;
    color: #1B2A4A;
    letter-spacing: 1px;
    line-height: 1.1;
    text-transform: uppercase;
  }}
  .header .sub {{
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 1.5px;
    margin-top: 4px;
    text-transform: uppercase;
  }}
  
  .section {{
    margin-bottom: 14px;
  }}
  .sec-heading {{
    font-size: 12px;
    font-weight: 700;
    color: #1B2A4A;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .sec-heading::before {{
    content: "■";
    font-size: 9px;
    color: #1B2A4A;
  }}
  
  .profile-text {{
    font-size: 9.2px;
    line-height: 1.45;
    color: #334155;
    text-align: justify;
  }}
  
  .exp-card {{
    margin-bottom: 10px;
  }}
  .exp-header {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }}
  .exp-company {{
    font-size: 11px;
    font-weight: 700;
    color: #1B2A4A;
  }}
  .exp-badge {{
    font-size: 9.5px;
    font-weight: 600;
    color: #0e7490;
    background: #e0f2fe;
    padding: 2px 7px;
    border-radius: 4px;
  }}
  .exp-role {{
    font-size: 9.5px;
    font-style: italic;
    color: #64748b;
    margin-bottom: 4px;
  }}
  .exp-bullets {{
    list-style: none;
    padding-left: 2px;
  }}
  .exp-bullets li {{
    font-size: 8.8px;
    line-height: 1.35;
    color: #334155;
    margin-bottom: 3px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }}
  .exp-bullets li::before {{
    content: "•";
    color: #0e7490;
    font-size: 11px;
    line-height: 1;
  }}

  .activities-list {{
    list-style: none;
    padding-left: 2px;
  }}
  .activities-list li {{
    font-size: 8.8px;
    line-height: 1.35;
    color: #334155;
    margin-bottom: 3px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }}
  .activities-list li::before {{
    content: "•";
    color: #0e7490;
    font-size: 11px;
    line-height: 1;
  }}

  .personal-grid {{
    display: grid;
    grid-template-columns: 140px 1fr;
    row-gap: 3px;
    font-size: 8.8px;
    padding-left: 4px;
  }}
  .pg-label {{
    font-weight: 600;
    color: #64748b;
  }}
  .pg-val {{
    color: #334155;
  }}

  .dec-text {{
    font-size: 8.5px;
    font-style: italic;
    color: #475569;
    line-height: 1.35;
    margin-bottom: 12px;
  }}

  .footer-sig {{
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
  }}
  .contact-footer {{
    font-size: 8.5px;
    color: #64748b;
    line-height: 1.4;
  }}
  .sig-block {{
    text-align: right;
  }}
  .sig-line {{
    width: 140px;
    border-bottom: 1px solid #94a3b8;
    margin-bottom: 4px;
    margin-left: auto;
  }}
  .sig-name {{
    font-size: 10px;
    font-weight: 700;
    color: #1B2A4A;
  }}
</style>
</head>
<body>

  <!-- LEFT SIDEBAR -->
  <aside class="sidebar">
    <div class="avatar-container">
      <img class="avatar" src="data:image/png;base64,{img_b64}" alt="Aayush Koushal">
    </div>

    <!-- Contact -->
    <div class="side-section">
      <div class="side-title">CONTACT</div>
      <div class="contact-item">
        <span class="icon">📞</span>
        <span>+91 77889401465</span>
      </div>
      <div class="contact-item">
        <span class="icon">✉</span>
        <span>aayushkoushal@gmail.com</span>
      </div>
      <div class="contact-item">
        <span class="icon">📍</span>
        <span>Tikri / Katra, Jammu &amp; Kashmir</span>
      </div>
    </div>

    <!-- Education -->
    <div class="side-section">
      <div class="side-title">EDUCATION</div>
      <div class="edu-item">
        <div class="edu-deg">Bachelor's Degree (Graduation)</div>
        <div class="edu-sub">Graduate | Regular Degree</div>
      </div>
      <div class="edu-item">
        <div class="edu-deg">One Year Computer Diploma</div>
        <div class="edu-sub">Diploma in Computer Applications (DCA)</div>
      </div>
      <div class="edu-item">
        <div class="edu-deg">Higher Secondary &amp; High School</div>
        <div class="edu-sub">J&amp;K State Board (JKBOSE)</div>
      </div>
    </div>

    <!-- Key Skills -->
    <div class="side-section">
      <div class="side-title">KEY SKILLS</div>
      <ul class="skills-list">
        <li>Retail Sales &amp; Marketing</li>
        <li>Medicine Dispensing Support</li>
        <li>Pharmacy Counter Operations</li>
        <li>Inventory &amp; Stock Handling</li>
        <li>Customer Service &amp; Counseling</li>
        <li>Computer Operations &amp; DCA</li>
        <li>POS Billing &amp; Cash Management</li>
        <li>Effective Communication</li>
        <li>Client Relationship Building</li>
      </ul>
    </div>

    <!-- Languages -->
    <div class="side-section">
      <div class="side-title">LANGUAGES</div>
      <ul class="lang-list">
        <li>English</li>
        <li>Hindi</li>
        <li>Dogri</li>
      </ul>
    </div>
  </aside>

  <!-- RIGHT MAIN CONTENT -->
  <main class="main">
    <header class="header">
      <h1>AAYUSH KOUSHAL</h1>
      <div class="sub">SALES &amp; PHARMACEUTICAL RETAIL PROFESSIONAL</div>
    </header>

    <!-- Profile -->
    <section class="section">
      <div class="sec-heading">PROFILE</div>
      <p class="profile-text">
        Disciplined, enthusiastic, and results-driven Graduate with over 5 years of rich, hands-on experience in pharmaceutical store operations and commercial retail sales. Possesses 3 years of valuable healthcare retail expertise at Jamwal Medical Hall managing prescription handling, medicine dispensing, inventory monitoring, and patient assistance, along with 2 years of proven sales performance at Amol Agency in Katra. Certified with a 1-Year Diploma in Computer Applications (DCA), providing strong capability in computerized billing, inventory record-keeping, and customer service to drive store productivity and customer satisfaction.
      </p>
    </section>

    <!-- Work Experience -->
    <section class="section">
      <div class="sec-heading">WORK EXPERIENCE</div>

      <!-- Jamwal Medical Hall -->
      <div class="exp-card">
        <div class="exp-header">
          <span class="exp-company">Jamwal Medical Hall, Tikri</span>
          <span class="exp-badge">3 Years Experience</span>
        </div>
        <div class="exp-role">Medical Store Assistant &amp; Sales Executive</div>
        <ul class="exp-bullets">
          <li>Accurately dispensed prescribed medications, OTC products, and healthcare essentials following proper pharmaceutical guidelines.</li>
          <li>Assisted customers with dosage directions, product inquiries, and delivered courteous, empathetic healthcare support.</li>
          <li>Maintained computerized stock records, tracked batch numbers and expiry dates, and facilitated timely stock replenishment.</li>
          <li>Managed point-of-sale (POS) billing, cash/digital payments, and maintained organized supplier account ledgers.</li>
        </ul>
      </div>

      <!-- Amol Agency -->
      <div class="exp-card">
        <div class="exp-header">
          <span class="exp-company">Amol Agency, Katra</span>
          <span class="exp-badge">2 Years Experience</span>
        </div>
        <div class="exp-role">Sales Executive / Salesman</div>
        <ul class="exp-bullets">
          <li>Managed front-line customer engagement, product demonstrations, and achieved assigned sales targets in Katra.</li>
          <li>Established lasting relationships with retail customers and commercial accounts, assessing needs and recommending items.</li>
          <li>Maintained attractive merchandise displays, managed shelf restocking, and conducted periodic stock verification.</li>
          <li>Swiftly resolved customer inquiries, promoting repeat footfall and long-term customer retention.</li>
        </ul>
      </div>
    </section>

    <!-- Other Activities & Certifications -->
    <section class="section">
      <div class="sec-heading">OTHER ACTIVITIES &amp; HIGHLIGHTS</div>
      <ul class="activities-list">
        <li>Completed 1-Year Diploma in Computer Applications (DCA) covering MS Word, MS Excel, PowerPoint, Internet &amp; Computer Operations.</li>
        <li>Participated actively in local community health awareness drives and free medical assistance checkup camps.</li>
        <li>Recognized for exceptional punctuality, dependable team collaboration, and client relationship handling.</li>
      </ul>
    </section>

    <!-- Personal Details -->
    <section class="section">
      <div class="sec-heading">PERSONAL DETAILS</div>
      <div class="personal-grid">
        <div class="pg-label">• Father's Name</div>
        <div class="pg-val">: Mr. Koushal</div>
        <div class="pg-label">• Date of Birth</div>
        <div class="pg-val">: [DD/MM/YYYY]</div>
        <div class="pg-label">• Nationality</div>
        <div class="pg-val">: Indian</div>
        <div class="pg-label">• Gender</div>
        <div class="pg-val">: Male</div>
        <div class="pg-label">• Marital Status</div>
        <div class="pg-val">: Unmarried / Single</div>
        <div class="pg-label">• Permanent Address</div>
        <div class="pg-val">: Tikri / Katra, Jammu &amp; Kashmir, India</div>
      </div>
    </section>

    <!-- Declaration -->
    <section class="section" style="margin-bottom: 0;">
      <div class="sec-heading">DECLARATION</div>
      <p class="dec-text">
        I hereby declare that all the information furnished above is true, complete, and correct to the best of my knowledge &amp; belief.
      </p>
    </section>

    <!-- Footer Signature -->
    <div class="footer-sig">
      <div class="contact-footer">
        Phone: +91 77889401465<br>
        Email: aayushkoushal@gmail.com
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">(Aayush Koushal)</div>
      </div>
    </div>
  </main>

</body>
</html>
"""

html_path = "z:/vms-project/Aayush_Koushal_Resume.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"HTML saved to {html_path}")

# Run Microsoft Edge headless to generate PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_path = r"z:\vms-project\Aayush_Koushal_Resume.pdf"

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Converting HTML to PDF via Edge...")
subprocess.run(cmd, check=True)
print(f"PDF generated successfully at {pdf_path}")

# Copy DOCX, PDF, and HTML to user's Downloads and Desktop folders
downloads_dir = r"C:\Users\CY2152_akhil\Downloads"
desktop_dir = r"C:\Users\CY2152_akhil\Desktop"

docx_source = r"z:\vms-project\Aayush_Koushal_Resume.docx"

for folder in [downloads_dir, desktop_dir]:
    shutil.copy2(docx_source, os.path.join(folder, "Aayush_Koushal_Resume.docx"))
    shutil.copy2(pdf_path, os.path.join(folder, "Aayush_Koushal_Resume.pdf"))
    shutil.copy2(html_path, os.path.join(folder, "Aayush_Koushal_Resume.html"))
    print(f"Copied files to {folder}")

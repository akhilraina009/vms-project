path = r'z:\vms-project\frontend\src\PublicRegistration.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add photoFileInputRef
target_ref = "  const streamRef = useRef(null);\n"
repl_ref = """  const streamRef = useRef(null);
  const photoFileInputRef = useRef(null);

  function handlePhotoFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select a valid image file (JPEG or PNG).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setCameraError("Image size must be smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setCameraError("");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };
    reader.onerror = () => {
      setCameraError("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  }
"""

if target_ref in text:
    text = text.replace(target_ref, repl_ref, 1)
    print("SUCCESS added photoFileInputRef & handlePhotoFileChange")
else:
    print("target_ref not found")

# 2. Add upload button in JSX
target_jsx = """          <div className="public-actions">
            <button type="button" onClick={startCamera}>
              <Camera size={17} /> {photo ? "Retake photo" : "Open camera"}
            </button>

            {cameraActive && (
              <button type="button" onClick={capturePhoto}>
                Capture photo
              </button>
            )}
          </div>"""

repl_jsx = """          <input
            type="file"
            ref={photoFileInputRef}
            accept="image/png, image/jpeg, image/jpg"
            style={{ display: "none" }}
            onChange={handlePhotoFileChange}
          />

          <div className="public-actions">
            <button type="button" onClick={startCamera}>
              <Camera size={17} /> {photo ? "Retake with camera" : "Open camera"}
            </button>

            {cameraActive && (
              <button type="button" onClick={capturePhoto}>
                Capture photo
              </button>
            )}

            <button type="button" onClick={() => photoFileInputRef.current?.click()}>
              <Upload size={17} /> Upload photo file
            </button>

            {photo && (
              <button
                type="button"
                className="public-remove-button"
                style={{ margin: 0 }}
                onClick={() => setPhoto("")}
              >
                <X size={15} /> Remove photo
              </button>
            )}
          </div>"""

# Normalize for CRLF
target_jsx_norm = target_jsx.replace("\r\n", "\n")
text_norm = text.replace("\r\n", "\n")
repl_jsx_norm = repl_jsx.replace("\r\n", "\n")

if target_jsx_norm in text_norm:
    text_norm = text_norm.replace(target_jsx_norm, repl_jsx_norm, 1)
    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(text_norm)
    print("SUCCESS updated JSX in PublicRegistration.jsx")
else:
    print("target_jsx not found in text")

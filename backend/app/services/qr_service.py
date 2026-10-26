import io
import qrcode


VMS_BASE_URL = "http://192.168.20.182:8000"


def generate_visit_qr(visit_id: str) -> bytes:

    # Always convert the visit ID to the standard UUID string format
    visit_id = str(visit_id)

    scan_url = f"{VMS_BASE_URL}/visits/scan/{visit_id}"

    print()
    print("========================================")
    print("QR GENERATED")
    print("Visit ID :", visit_id)
    print("QR URL   :", scan_url)
    print("========================================")
    print()

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )

    qr.add_data(scan_url)
    qr.make(fit=True)

    image = qr.make_image()

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    return buffer.getvalue()
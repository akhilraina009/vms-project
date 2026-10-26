
import QRCode from "qrcode";

const registrationUrl =
  "https://192.168.20.182:5173/register-visitor";

await QRCode.toFile("./reception-registration-qr.png", registrationUrl, {
  width: 1200,
  margin: 4,
  errorCorrectionLevel: "H",
  color: {
    dark: "#102A43",
    light: "#FFFFFF",
  },
});

console.log("Reception QR code created successfully.");
console.log(`Registration URL: ${registrationUrl}`);
console.log("File: reception-registration-qr.png");

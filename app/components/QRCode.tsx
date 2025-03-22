export function QRCode({ className = "" }: { className?: string }) {
  return (
    <img
      src="/splitgqrcode.png"
      alt="Split the G QR Code"
      className={`${className}`}
    />
  );
}

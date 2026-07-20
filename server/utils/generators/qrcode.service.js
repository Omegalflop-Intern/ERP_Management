import QRCode from 'qrcode';

export async function generateQRCodeBuffer(text) {
  try {
    const pngBuffer = await QRCode.toBuffer(text || 'https://brothersmobile.bd', {
      type: 'png',
      width: 150,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
    return pngBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    return null;
  }
}

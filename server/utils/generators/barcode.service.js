import bwipjs from 'bwip-js';

export async function generateBarcodeBuffer(text) {
  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: text || 'INV-00000',
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
      backgroundcolor: 'FFFFFF',
      barcolor: '0F172A',
      textcolor: '0F172A',
    });
    return pngBuffer;
  } catch (error) {
    console.error('Error generating barcode buffer:', error);
    return null;
  }
}

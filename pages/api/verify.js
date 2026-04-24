import Tesseract from 'tesseract.js';
import axios from 'axios';

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ message: 'Mana bukti transfernya bos?' });

  try {
    const buffer = Buffer.from(image, 'base64');

    // 1. Scan Gambar pake Tesseract
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    
    // 2. Cari RRN (12 digit angka)
    // Kita bersihkan spasi dulu biar regex lebih akurat
    const cleanText = text.replace(/\s/g, '');
    const rrnMatch = cleanText.match(/\d{12}/);
    const rrn = rrnMatch ? rrnMatch[0] : null;

    if (!rrn) {
      return res.status(400).json({ message: "Gagal baca RRN. Pastikan foto struk tegak & jelas!" });
    }

    // 3. Tarik Mutasi Qiospay
    const qiosApi = process.env.NEXT_PUBLIC_QIOSPAY_API;
    const { data: response } = await axios.get(qiosApi);

    // 4. Verifikasi Logika
    // Cari transaksi yang RRN-nya cocok dan nominalnya 1 (perak)
    const isValid = response.data.find(trx => 
      (trx.buyer_reff === rrn || trx.issuer_reff === rrn) && parseInt(trx.amount) >= 1
    );

    if (isValid) {
      return res.status(200).json({ 
        success: true, 
        message: `✅ PEMBAYARAN VALID! RRN: ${rrn}. Pesanan Pizza diproses!` 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: `❌ RRN ${rrn} tidak ditemukan di mutasi. Tunggu 1 menit ya.` 
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error: Tesseract/API lagi down." });
  }
}

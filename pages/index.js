import { useState } from 'react';
import { qrisdynamicgenerator, qrisimagegenerator } from "@misterdevs/qris-static-to-dynamic";

export default function PizzaMerchant() {
  const [qrImg, setQrImg] = useState(null);
  const [status, setStatus] = useState('Ready to order?');
  const [loading, setLoading] = useState(false);

  const qrisStatic = process.env.NEXT_PUBLIC_QRIS_STATIC;

  // Generate QRIS Dinamis Rp1
  const handleOrder = async () => {
    setLoading(true);
    try {
      const dynamic = qrisdynamicgenerator(qrisStatic, 1, 2, 0);
      const image = await qrisimagegenerator(dynamic, 2, 6);
      setQrImg(image);
      setStatus("QRIS Siap! Bayar Rp1 lalu upload struk.");
    } catch (e) {
      setStatus("Gagal buat QRIS.");
    }
    setLoading(false);
  };

  // Upload Struk ke API
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Lagi verifikasi struk (OCR)...");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      setStatus(data.message);
    };
  };

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <h1 style={{color: '#ff4757'}}>🍕 PIZZA 1 PERAK</h1>
        <img src="https://www.freeiconspng.com/uploads/pizza-png-15.png" width="150" />
        <h2>Pepperoni Hemat</h2>
        <p>Bayar cuma <b>Rp 1</b> pake QRIS</p>
        
        {!qrImg ? (
          <button onClick={handleOrder} disabled={loading} style={styles.button}>
            {loading ? 'Sabar...' : 'BELI SEKARANG'}
          </button>
        ) : (
          <div style={styles.paymentBox}>
            <img src={qrImg} width="200" />
            <p style={{color: '#333'}}>Upload Struk Disini:</p>
            <input type="file" onChange={handleFileUpload} accept="image/*" />
          </div>
        )}
        
        <div style={styles.status}>{status}</div>
      </div>
    </div>
  );
}

const styles = {
  body: { background: '#121212', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  card: { background: '#1e1e1e', padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #333' },
  button: { background: '#ff4757', border: 'none', padding: '12px 25px', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  paymentBox: { background: '#fff', padding: '15px', borderRadius: '10px', marginTop: '20px' },
  status: { marginTop: '20px', padding: '10px', borderLeft: '4px solid #ff4757', background: '#222', fontSize: '0.9rem' }
};

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment, collection, addDoc } from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [freeCount, setFreeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      // Check free count
      const userDoc = await getDoc(doc(db, 'users', u.uid));
      if (userDoc.exists()) {
        setFreeCount(userDoc.data().videoCount || 0);
      }
      // Check subscription
      const subDoc = await getDoc(doc(db, 'subscriptions', u.uid));
      if (subDoc.exists()) {
        const expiry = new Date(subDoc.data().expiry);
        if (expiry > new Date() && subDoc.data().active) {
          setIsSubscribed(true);
        }
      }
    });
    return () => unsub();
  }, []);

  const generateVideo = async () => {
    if (!prompt) return alert('Enter prompt');
    
    // BLOCK LOGIC
    if (freeCount >= 2 && !isSubscribed) {
      alert(`You used ${freeCount} free videos. Please subscribe to continue.`);
      router.push('/plans');
      return;
    }

    setLoading(true);
    setVideoUrl('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        // Increase count if not subscribed
        if (!isSubscribed) {
          const newCount = freeCount + 1;
          setFreeCount(newCount);
          await setDoc(doc(db, 'users', user.uid), {
            videoCount: newCount,
            email: user.email,
            lastVideo: new Date().toISOString()
          }, { merge: true });
        }
        // Save history
        await addDoc(collection(db, 'history'), {
          uid: user.uid,
          prompt,
          videoUrl: data.videoUrl,
          createdAt: new Date().toISOString()
        });
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (e) {
      alert('Error generating');
    }
    setLoading(false);
  };

  if (!user) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#fff', padding: '20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>AI Video App</h2>
          <button onClick={() => router.push('/plans')} style={{ padding: '8px 14px', background: isSubscribed ? '#00ff88' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            {isSubscribed ? '✅ Subscribed' : `${2 - freeCount} Free Left`}
          </button>
        </div>

        <div style={{ marginTop: '30px', background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>
            {isSubscribed ? '∞ Unlimited generation active' : `You have ${Math.max(0, 2 - freeCount)} free videos left. After that, subscription required.`}
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your video... e.g. A Nigerian boy dancing in Lagos street, cinematic"
            style={{ width: '100%', height: '100px', marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#0a0a0a', color: '#fff', border: '1px solid #333' }}
          />
          <button
            onClick={generateVideo}
            disabled={loading}
            style={{ width: '100%', marginTop: '12px', padding: '14px', background: loading ? '#444' : '#00ff88', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
          >
            {loading ? 'Generating... (30s)' : isSubscribed ? 'Generate Video ∞' : freeCount >= 2 ? 'Subscribe to Generate' : `Generate (${2 - freeCount} free left)`}
          </button>
        </div>

        {videoUrl && (
          <div style={{ marginTop: '20px' }}>
            <video src={videoUrl} controls autoPlay style={{ width: '100%', borderRadius: '12px' }} />
            <a href={videoUrl} download style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: '#00ff88' }}>Download Video</a>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => router.push('/plans')} style={{ color: '#888', background: 'none', border: 'none', textDecoration: 'underline' }}>View Plans: Daily ₦2000 - Yearly ₦60000</button>
        </div>
      </div>
    </div>
  );
}
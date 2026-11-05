import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { firebaseConfigured, getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [freeCount, setFreeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!firebaseConfigured) return;

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setFreeCount(userDoc.data().videoCount || 0);
      }

      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', currentUser.uid));
      if (subscriptionDoc.exists()) {
        const expiry = new Date(subscriptionDoc.data().expiry);
        if (expiry > new Date() && subscriptionDoc.data().active) {
          setIsSubscribed(true);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const generateVideo = async () => {
    if (!prompt.trim()) return alert('Enter prompt');

    const db = getFirebaseDb();
    if (!db || !user) {
      alert('Account setup is required before generating videos.');
      return;
    }

    if (freeCount >= 2 && !isSubscribed) {
      alert(`You used ${freeCount} free videos. Please subscribe to continue.`);
      router.push('/plans');
      return;
    }

    setLoading(true);
    setVideoUrl('');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        if (!isSubscribed) {
          const newCount = freeCount + 1;
          setFreeCount(newCount);
          await setDoc(doc(db, 'users', user.uid), {
            videoCount: newCount,
            email: user.email,
            lastVideo: new Date().toISOString(),
          }, { merge: true });
        }

        await addDoc(collection(db, 'history'), {
          uid: user.uid,
          prompt,
          videoUrl: data.videoUrl,
          createdAt: new Date().toISOString(),
        });
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error generating');
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseConfigured) {
    return (
      <>
        <Head>
          <title>AI Video Studio</title>
          <meta name="description" content="Create videos with AI and choose a plan that fits your workflow." />
          <meta name="theme-color" content="#080b09" />
        </Head>
        <main className="home-fallback">
          <section className="home-fallback-card" aria-labelledby="home-title">
            <p className="eyebrow">AI VIDEO STUDIO</p>
            <h1 id="home-title">Bring your next idea to life.</h1>
            <p className="home-fallback-copy">
              The studio is ready to explore. Choose a plan to continue to secure Monnify checkout.
            </p>
            <Link className="button-primary" href="/plans">View plans</Link>
            <p className="setup-note">
              Sign-in and video generation need Firebase project settings before they can be enabled.
            </p>
          </section>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <main className="loading-screen" aria-live="polite">
        <p>Loading your studio...</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#fff', padding: '20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>AI Video App</h2>
          <button onClick={() => router.push('/plans')} style={{ padding: '8px 14px', background: isSubscribed ? '#00ff88' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            {isSubscribed ? 'Subscribed' : `${2 - freeCount} Free Left`}
          </button>
        </div>

        <div style={{ marginTop: '30px', background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>
            {isSubscribed ? 'Unlimited generation active' : `You have ${Math.max(0, 2 - freeCount)} free videos left. After that, subscription required.`}
          </p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe your video, for example: a Nigerian boy dancing in a Lagos street, cinematic"
            style={{ width: '100%', height: '100px', marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#0a0a0a', color: '#fff', border: '1px solid #333' }}
          />
          <button
            onClick={generateVideo}
            disabled={loading}
            style={{ width: '100%', marginTop: '12px', padding: '14px', background: loading ? '#444' : '#00ff88', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
          >
            {loading ? 'Generating...' : isSubscribed ? 'Generate video' : freeCount >= 2 ? 'Subscribe to generate' : `Generate (${2 - freeCount} free left)`}
          </button>
        </div>

        {videoUrl && (
          <div style={{ marginTop: '20px' }}>
            <video src={videoUrl} controls autoPlay style={{ width: '100%', borderRadius: '12px' }} />
            <a href={videoUrl} download style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: '#00ff88' }}>Download video</a>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => router.push('/plans')} style={{ color: '#888', background: 'none', border: 'none', textDecoration: 'underline' }}>View plans: Daily ₦2,000 to Yearly ₦60,000</button>
        </div>
      </div>
    </div>
  );
}

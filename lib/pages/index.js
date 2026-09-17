import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tool, setTool] = useState("seedance-2.5");
  const [tools, setTools] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tools').then(r=>r.json()).then(setTools);
  }, []);

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ userId: auth.currentUser.uid, prompt, tool })
    });
    const data = await res.json();
    setVideo(data.video);
    setLoading(false);
  }

  return (
    <div style={{padding:20}}>
      <h1>🎬 AI Video App - By You</h1>
      <p>2 Free Trials for new users only</p>
      
      <select value={tool} onChange={e=>setTool(e.target.value)}>
        {tools.map(t=> <option key={t.id} value={t.id}>{t.name} {t.new?'🆕':''}</option>)}
      </select>

      <textarea placeholder="Describe your video e.g. Nigerian student honesty story" 
        value={prompt} onChange={e=>setPrompt(e.target.value)}
        style={{width:'100%', height:100, marginTop:10}} />

      <button onClick={generate} style={{width:'100%', padding:15, background:'black', color:'white', marginTop:10}}>
        {loading ? "Generating..." : "Generate Video"}
      </button>

      {video && <video src={video} controls style={{width:'100%', marginTop:20}} />}
    </div>
  )
}

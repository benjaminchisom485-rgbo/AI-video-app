import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      let userCred;
      if (isSignup) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        // New user gets 2 free trials ONE TIME
        await setDoc(doc(db, "users", userCred.user.uid), {
          email: email,
          trialsLeft: 2,
          hasUsedFreeTrial: false,
          premiumUntil: null,
          createdAt: new Date()
        });
        alert("Account created! You have 2 FREE videos.");
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/"); // Go to generator
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{padding:20, maxWidth:400, margin:'auto', marginTop:50}}>
      <h1>🎬 AI Video App</h1>
      <h3>{isSignup ? "Create Account" : "Login"}</h3>
      <p style={{fontSize:13, color:'gray'}}>
        {isSignup ? "New users get 2 FREE trials (one time only)" : "Welcome back"}
      </p>

      <input 
        type="email" 
        placeholder="Your Email" 
        value={email} 
        onChange={e=>setEmail(e.target.value)}
        style={{width:'100%', padding:12, marginTop:10}} 
      />
      
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={e=>setPassword(e.target.value)}
        style={{width:'100%', padding:12, marginTop:10}} 
      />

      <button 
        onClick={handleAuth}
        style={{width:'100%', padding:15, background:'black', color:'white', marginTop:15, border:'none'}}>
        {isSignup ? "Create Account & Get 2 Free" : "Login"}
      </button>

      <p onClick={()=>setIsSignup(!isSignup)} style={{textAlign:'center', marginTop:15, color:'blue', cursor:'pointer'}}>
        {isSignup ? "Already have account? Login" : "New here? Create Account"}
      </p>

      <div style={{marginTop:30, padding:15, background:'#f5f5f5', fontSize:12}}>
        <b>Premium Plans:</b><br/>
        Daily ₦2,500<br/>
        Weekly ₦7,500<br/>
        Monthly ₦20,000<br/>
        Yearly ₦60,000<br/>
        Payment to OPay: 8034051759
      </div>
    </div>
  );
      }

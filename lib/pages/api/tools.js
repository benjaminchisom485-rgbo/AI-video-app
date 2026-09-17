import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
// ... keep your other codes

// Inside the Home function, add this:
const router = useRouter();
useEffect(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) router.push("/login");
  });
}, []);

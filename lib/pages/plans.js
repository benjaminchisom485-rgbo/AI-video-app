import { useEffect } from 'react';

const plans = [
  { name: "Daily", price: 2000, id: "daily" },
  { name: "Weekly", price: 7500, id: "weekly" },
  { name: "Monthly", price: 20000, id: "monthly" },
  { name: "Yearly", price: 60000, id: "yearly" },
];

export default function Plans() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js";
    document.body.appendChild(s);
  }, []);

  const pay = (plan) => {
    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `${plan.id}-${Date.now()}`,
      amount: plan.price,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd,opay",
      customer: { email: "user@gmail.com" },
      customizations: {
        title: `AI Video - ${plan.name}`,
        description: `${plan.name} access`,
      },
      callback: (res) => {
        fetch("/api/verify-flutterwave", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ transaction_id: res.transaction_id, plan: plan.id })
        }).then(() => window.location.href = "/");
      }
    });
  };

  return (
    <div style={{padding:"20px", maxWidth:"600px", margin:"auto"}}>
      <h2 style={{textAlign:"center"}}>Choose Your Plan</h2>
      {plans.map(p => (
        <div key={p.id} style={{border:"1px solid #ddd", padding:"20px", margin:"15px 0", borderRadius:"12px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <h3>{p.name}</h3>
            <p>₦{p.price.toLocaleString()}</p>
          </div>
          <button onClick={()=>pay(p)} style={{padding:"10px 20px", background:"black", color:"white", border:"none", borderRadius:"8px"}}>
            Subscribe
          </button>
        </div>
      ))}
    </div>
  );
    }

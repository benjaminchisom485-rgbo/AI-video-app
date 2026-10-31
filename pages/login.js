export default function Plans() {
  const plans = [
    {name:"Daily", price:2500, days:1},
    {name:"Weekly", price:7500, days:7},
    {name:"Monthly", price:20000, days:30},
    {name:"Yearly", price:60000, days:365},
  ];

  const pay = (plan) => {
    // This will pop Paystack and money goes to your OPay 8034051759
    alert(`Pay ₦${plan.price} to OPay 8034051759 via Paystack. After payment, your premium will activate.`);
    // Paystack integration code from before goes here
  }

  return (
    <div style={{padding:20}}>
      <h2>Choose Plan</h2>
      {plans.map(p=> (
        <div key={p.name} style={{border:'1px solid #ccc', padding:15, margin:10}}>
          <h3>{p.name} - ₦{p.price}</h3>
          <button onClick={()=>pay(p)}>Subscribe</button>
        </div>
      ))}
    </div>
  )
    }

"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase/client";
import { signInWithPopup } from "firebase/auth";
import { Event } from "@/types";

interface RegisterModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModal({ event, onClose, onSuccess }: RegisterModalProps) {
  const [step, setStep] = useState<"checking" | "login" | "form" | "processing" | "done">("checking");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setForm((f) => ({ 
          ...f, 
          name: f.name || user.displayName || "", 
          email: f.email || user.email || "" 
        }));
        setStep("form");
      } else {
        setStep("login");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setForm({ name: user.displayName || "", email: user.email || "", phone: "" });
      setStep("form");
    } catch (err: any) {
      setError("Login failed. Please try again.");
    }
  };

  const getToken = async () => {
    const user = auth.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      try {
        const token = await user.getIdToken();
        if (token) return token;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('anx_token') || localStorage.getItem('session');
      if (localToken) return localToken;
    }
    throw new Error("Not authenticated");
  };

  const handleFreeRegister = async () => {
    setStep("processing");
    setError("");
    try {
      const token = await getToken();
      // Use consolidated events API route
      const res = await fetch(`/api/v1/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (data.paymentRequired) {
        initializeRazorpayPayment(data.orderId, data.amount, token);
      } else {
        setStep("done");
        setTimeout(onSuccess, 1800);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      setStep("form");
    }
  };

  const initializeRazorpayPayment = async (orderId: string, amount: number, token: string) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummykey",
      amount: amount * 100,
      currency: "INR",
      name: "ANX Platform",
      description: `Registration for ${event.title}`,
      order_id: orderId,
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },
      handler: async function (response: any) {
        setStep("processing");
        try {
          const verifyRes = await fetch("/api/v1/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId: event.id,
              name: form.name,
              email: form.email,
              phone: form.phone,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) throw new Error(verifyData.message);
          setStep("done");
          setTimeout(onSuccess, 1800);
        } catch (err: any) {
          setError(err.message || "Payment verification failed.");
          setStep("form");
        }
      },
      theme: {
        color: "#0f1f4a",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      setError("Payment failed: " + response.error.description);
      setStep("form");
    });
    rzp.open();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) { 
      setError("Name and email are required."); 
      return; 
    }
    handleFreeRegister();
  };

  const isFree = event.price === 0;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Register for Event</h2>
            <p className="modal-subtitle">{event.title}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {step === "checking" && <div className="state-center"><div className="spinner" /></div>}

        {step === "login" && (
          <div className="login-body">
            <p className="login-msg">Please sign in to register for this event.</p>
            {error && <div className="error-box">{error}</div>}
            <button className="google-btn" onClick={handleGoogleLogin}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="modal-body">
            {error && <div className="error-box">{error}</div>}
            <div className="field">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="price-row">
              <span>Registration Fee</span>
              {isFree ? (
                <span className="price-free">FREE</span>
              ) : (
                <span className="price-paid">₹{event.price}</span>
              )}
            </div>
            <button className="submit-btn" onClick={handleSubmit}>
              {isFree ? "Confirm Registration" : "Proceed to Payment"}
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="state-center"><div className="spinner" /><p>Processing...</p></div>
        )}

        {step === "done" && (
          <div className="state-center">
            <div className="success-icon">✓</div>
            <h3>You're Registered!</h3>
            <p>Check your email for confirmation details.</p>
          </div>
        )}
      </div>

      {/* Load Razorpay script dynamically inside the component */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

      <style jsx>{`
        .overlay { position:fixed;inset:0;background:rgba(15,31,74,0.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px; }
        .modal { background:#fff;border-radius:12px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;animation:slideUp 0.25s ease; }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal-header { padding:20px 24px;background:#0f1f4a;display:flex;align-items:flex-start;justify-content:space-between; }
        .modal-title { font-size:16px;font-weight:700;color:#fff;margin:0 0 2px; }
        .modal-subtitle { font-size:13px;color:rgba(255,255,255,0.65);margin:0; }
        .close-btn { background:none;border:none;color:rgba(255,255,255,0.7);font-size:18px;cursor:pointer;padding:0; }
        .login-body { padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:16px; }
        .login-msg { font-size:14px;color:#475569;text-align:center;margin:0; }
        .google-btn { display:flex;align-items:center;gap:12px;padding:12px 24px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:14px;font-weight:600;color:#0f172a;cursor:pointer;transition:all 0.18s;font-family:inherit;width:100%;justify-content:center; }
        .google-btn:hover { background:#f8fafc;box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .modal-body { padding:24px;display:flex;flex-direction:column;gap:16px; }
        .error-box { background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:13px; }
        .field { display:flex;flex-direction:column;gap:6px; }
        .field label { font-size:13px;font-weight:600;color:#374151; }
        .field input { border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:14px;color:#0f172a;outline:none;transition:border-color 0.18s;font-family:inherit; }
        .field input:focus { border-color:#0f1f4a; }
        .price-row { display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#374151; }
        .price-free { color:#16a34a; }
        .price-paid { color:#f59e0b; }
        .submit-btn { background:#0f1f4a;color:#fff;border:none;padding:13px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.18s;font-family:inherit; }
        .submit-btn:hover { background:#1e3a8a; }
        .state-center { padding:48px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;color:#374151; }
        .state-center h3 { margin:0;font-size:18px;color:#0f172a; }
        .state-center p { margin:0;color:#64748b;font-size:14px; }
        .spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#0f1f4a;border-radius:50%;animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .success-icon { width:56px;height:56px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;font-weight:700; }
      `}</style>
    </div>
  );
}

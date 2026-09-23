import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronRight,
  CircleUserRound,
  Compass,
  Home,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
  X,
} from "lucide-react";
import "./styles.css";
import { calculateDemoBudget, validateTripInput } from "./services/validation";

const temples = [
  {
    name: "Meenakshi Sundareswarar Temple",
    city: "Madurai",
    type: "Temple",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Ramanathaswamy Temple",
    city: "Rameswaram",
    type: "Pilgrimage",
    image: "https://images.unsplash.com/photo-1600100397608-f010b6c4f7a5?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Brihadeeswarar Temple",
    city: "Thanjavur",
    type: "Heritage",
    image: "https://images.unsplash.com/photo-1605537964076-3cb0ea6f6a0a?auto=format&fit=crop&w=900&q=80",
  },
];

const rentals = [
  { vehicle: "Scooter", model: "Automatic scooter", price: 450, distance: "1.2 km", deposit: 2000 },
  { vehicle: "Bike", model: "125cc commuter bike", price: 650, distance: "2.1 km", deposit: 2500 },
  { vehicle: "Car", model: "Compact hatchback", price: 1800, distance: "2.8 km", deposit: 5000 },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [guest, setGuest] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [days, setDays] = useState(3);
  const [plan, setPlan] = useState(null);

  const demoBudget = useMemo(
    () => calculateDemoBudget({ travellers, days }),
    [travellers, days]
  );
  const estimatedBudget = demoBudget.total;

  function createPlan() {
    const cleanFrom = from.trim();
    const cleanTo = to.trim();
    if (!cleanFrom || !cleanTo) {
      setPlan({ invalid: true, message: "Please enter both a source and a destination." });
      setActiveTab("plan");
      return;
    }
    if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) {
      setPlan({
        invalid: true,
        message: "Source and destination are the same. Choose another destination or explore this city locally.",
      });
      setActiveTab("plan");
      return;
    }
    setPlan({
      invalid: false,
      message: `Draft itinerary for ${travellers} traveller${travellers === 1 ? "" : "s"}: ${cleanFrom} → ${cleanTo}.`,
    });
    setActiveTab("plan");
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function continueGuest() {
    setGuest(true);
    setAuthOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab("home")} aria-label="TripMate home">
          <span className="brand-mark">T</span>
          <span>TripMate <b>AI</b></span>
        </button>
        <nav className="desktop-nav">
          {[["home", "Home"], ["explore", "Explore"], ["plan", "Plan"], ["trips", "My Trips"]].map(([key, label]) => (
            <button className={activeTab === key ? "nav-link active" : "nav-link"} onClick={() => setActiveTab(key)} key={key}>{label}</button>
          ))}
        </nav>
        <div className="top-actions">
          <span className="guest-pill">{guest ? "Guest mode" : "Signed in"}</span>
          <button className="icon-button" onClick={() => openAuth("login")} aria-label="Account"><CircleUserRound size={20} /></button>
        </div>
      </header>

      <main>
        {activeTab === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow"><Sparkles size={15} /> Travel planning with evidence</span>
                <h1>Plan the trip.<br /><span>Enjoy the journey.</span></h1>
                <p>TripMate brings routes, stays, rentals, temples, attractions and transparent budgets into one simple travel workspace.</p>
              </div>
              <TripSearch from={from} to={to} setFrom={setFrom} setTo={setTo} travellers={travellers} setTravellers={setTravellers} days={days} setDays={setDays} onPlan={createPlan} />
            </section>

            <section className="section">
              <div className="section-heading"><div><span className="eyebrow">Explore</span><h2>Made for every kind of traveller</h2></div><button className="text-button" onClick={() => setActiveTab("explore")}>See all <ArrowRight size={16} /></button></div>
              <div className="feature-grid">
                <Feature icon={<Users />} title="Family trips" text="Comfort-aware itineraries for adults, children and seniors." />
                <Feature icon={<TrainFront />} title="Every journey" text="Compare train, bus, flight, taxi, ferry and local travel options." />
                <Feature icon={<CarFront />} title="Local rentals" text="Find nearby bikes, scooters and cars with rental terms and deposits." />
                <Feature icon={<ShieldCheck />} title="Trust by design" text="See LIVE, VERIFIED, ESTIMATED and UNAVAILABLE data states." />
              </div>
            </section>

            <section className="section muted-section">
              <div className="section-heading"><div><span className="eyebrow">Pilgrimage</span><h2>Discover places with context</h2></div></div>
              <div className="card-grid">{temples.map((temple) => <PlaceCard key={temple.name} place={temple} />)}</div>
            </section>
          </>
        )}

        {activeTab === "explore" && <Explore />}
        {activeTab === "plan" && <PlanView plan={plan} estimatedBudget={estimatedBudget} from={from} to={to} travellers={travellers} days={days} />}
        {activeTab === "trips" && <TripsView guest={guest} onLogin={() => openAuth("login")} />}
      </main>

      <div className="mobile-nav">
        {[["home", Home, "Home"], ["explore", Compass, "Explore"], ["plan", Sparkles, "Plan"], ["trips", CalendarDays, "My Trips"], ["more", Menu, "More"]].map(([key, Icon, label]) => (
          <button className={activeTab === key ? "mobile-nav-item active" : "mobile-nav-item"} onClick={() => key === "more" ? openAuth("login") : setActiveTab(key)} key={key}><Icon size={20} /><span>{label}</span></button>
        ))}
      </div>

      {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onGuest={continueGuest} />}
    </div>
  );
}

function TripSearch({ from, to, setFrom, setTo, travellers, setTravellers, days, setDays, onPlan }) {
  return (
    <div className="planner-card">
      <div className="planner-title"><div><span className="eyebrow">AI trip planner</span><h3>Where are you going?</h3></div><span className="status-dot">Guest ready</span></div>
      <div className="field-row">
        <label><span>From</span><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Bhimavaram" /></label>
        <ArrowRight className="route-arrow" size={20} />
        <label><span>Destination</span><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Madurai" /></label>
      </div>
      <div className="field-row compact">
        <label><span>Travellers</span><input type="number" min="1" max="30" value={travellers} onChange={(e) => setTravellers(Number(e.target.value))} /></label>
        <label><span>Days</span><input type="number" min="1" max="60" value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
      </div>
      <button className="primary-button" onClick={onPlan}><Sparkles size={18} /> Create my trip <ArrowRight size={18} /></button>
      <p className="helper">Dynamic prices and availability are only shown when verified by a connected source.</p>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return <article className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>;
}

function PlaceCard({ place }) {
  return <article className="place-card"><img src={place.image} alt={place.name} /><div className="place-content"><span className="tag">{place.type}</span><h3>{place.name}</h3><p><MapPin size={14} /> {place.city}</p><button className="outline-button">View details <ChevronRight size={16} /></button></div></article>;
}

function Explore() {
  return <section className="page-section"><div className="page-header"><span className="eyebrow">Explore</span><h1>Find your next place</h1><p>Browse destinations, pilgrimage places and local travel ideas.</p></div><div className="search-box"><Search size={19} /><input placeholder="Search destinations, temples, attractions..." /></div><div className="card-grid">{temples.map((temple) => <PlaceCard key={temple.name} place={temple} />)}</div><div className="rental-panel"><div><span className="eyebrow">Local rentals</span><h2>Rent a bike or car near your destination</h2><p>Provider listings can show distance, rental duration, deposit, documents and booking/contact options.</p></div><div className="rental-list">{rentals.map((rental) => <div className="rental-row" key={rental.model}><div className="rental-icon"><CarFront size={20} /></div><div className="rental-info"><b>{rental.model}</b><span>{rental.distance} away · Deposit ₹{rental.deposit.toLocaleString()}</span></div><strong>₹{rental.price}/day</strong><button className="outline-button">Details</button></div>)}</div></div></section>;
}

function PlanView({ plan, estimatedBudget, from, to, travellers, days }) {
  return <section className="page-section"><div className="page-header"><span className="eyebrow">Your plan</span><h1>{from && to ? `${from} → ${to}` : "Build your itinerary"}</h1><p>{travellers} traveller{travellers === 1 ? "" : "s"} · {days} day{days === 1 ? "" : "s"}</p></div>{plan?.invalid && <div className="alert danger">{plan.message}</div>}{!plan && <div className="empty-card"><Sparkles size={28} /><h2>No itinerary yet</h2><p>Start on Home and enter a valid source and destination.</p></div>}{plan && !plan.invalid && <><div className="route-banner"><div><span>Draft itinerary</span><h2>{plan.message}</h2></div><span className="data-status">ESTIMATED</span></div><div className="plan-grid"><div className="timeline">{Array.from({ length: Math.min(days, 6) }, (_, index) => <div className="timeline-item" key={index}><span className="day-number">{index + 1}</span><div><b>Day {index + 1}</b><p>Travel, explore verified places, add meals and choose local transport. Exact schedules appear when a connected provider supplies them.</p></div></div>)}</div><div className="budget-card"><span className="eyebrow">Budget preview</span><h2>₹{estimatedBudget.toLocaleString()}</h2><p>Estimated group total for {travellers} traveller{travellers === 1 ? "" : "s"}. This is not a live quote.</p><div className="budget-line"><span>Intercity transport</span><b>₹{(travellers * 900).toLocaleString()}</b></div><div className="budget-line"><span>Stay</span><b>₹{(days * 1800).toLocaleString()}</b></div><div className="budget-line"><span>Food</span><b>₹{(travellers * days * 450).toLocaleString()}</b></div><div className="budget-line"><span>Local travel</span><b>₹{(days * 650).toLocaleString()}</b></div></div></div></>}</section>;
}

function TripsView({ guest, onLogin }) {
  return <section className="page-section"><div className="page-header"><span className="eyebrow">My Trips</span><h1>Your travel workspace</h1><p>Save and sync trips after signing in.</p></div>{guest ? <div className="empty-card"><CircleUserRound size={32} /><h2>You're browsing as a guest</h2><p>Your current planning session can work without an account. Sign in to save trips across devices.</p><button className="primary-button small" onClick={onLogin}>Login / Sign up</button></div> : <div className="empty-card"><h2>No saved trips yet</h2></div>}</section>;
}

function AuthModal({ mode, setMode, onClose, onGuest }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="auth-modal"><button className="close-button" onClick={onClose}><X /></button><div className="auth-head"><span className="brand-mark">T</span><span className="eyebrow">TripMate AI</span><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Continue your travel planning." : "Save trips and sync them across devices."}</p></div><button className="google-button">Continue with Google</button><div className="divider"><span>or</span></div><label>Email<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="primary-button">{mode === "login" ? "Login" : "Create account"}</button><button className="guest-button" onClick={onGuest}>Skip for now · Continue as guest</button><p className="switch-auth">{mode === "login" ? "New to TripMate?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Login"}</button></p></div></div>;
}

createRoot(document.getElementById("root")).render(<App />);

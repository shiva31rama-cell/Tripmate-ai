import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
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
import { createDemoTrip } from "./services/tripPlanner";
import { demoRentals, demoTemples } from "./data/demoData";
import { DATA_STATUS, TRAVEL_MODES } from "./types";
import { STATUS_LABELS } from "./services/provenance";
import { loadGuestTrips, removeGuestTrip, saveGuestTrips } from "./services/guestTrips";

const featureCards = [
  { icon: <Users />, title: "Family trips", text: "Comfort-aware planning for adults, children and seniors." },
  { icon: <TrainFront />, title: "Every journey", text: "Organize train, bus, flight, taxi, ferry and local travel." },
  { icon: <CarFront />, title: "Local rentals", text: "Keep vehicle price, deposit, documents and terms visible." },
  { icon: <ShieldCheck />, title: "Trust by design", text: "Every value carries a clear data status and source boundary." },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [guest, setGuest] = useState(() => window.localStorage.getItem("tripmate.session.mode") !== "signed-in");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [days, setDays] = useState(3);
  const [plan, setPlan] = useState(null);
  const [guestTrips, setGuestTrips] = useState(() => loadGuestTrips());
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreType, setExploreType] = useState("all");
  const [rentalType, setRentalType] = useState("all");

  useEffect(() => {
    saveGuestTrips(guestTrips);
  }, [guestTrips]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tripmate.session.mode", guest ? "guest" : "signed-in");
    } catch {
      // Session preference is best-effort only.
    }
  }, [guest]);

  const demoBudget = useMemo(
    () => calculateDemoBudget({ travellers, days }),
    [travellers, days]
  );

  const filteredTemples = useMemo(() => {
    const query = exploreQuery.trim().toLowerCase();
    return demoTemples.filter((place) => {
      const matchesQuery =
        !query ||
        [place.name, place.city, place.state, place.type]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesType =
        exploreType === "all" || place.type.toLowerCase() === exploreType;
      return matchesQuery && matchesType;
    });
  }, [exploreQuery, exploreType]);

  const filteredRentals = useMemo(
    () =>
      demoRentals.filter(
        (rental) =>
          rentalType === "all" ||
          rental.vehicleType.toLowerCase() === rentalType
      ),
    [rentalType]
  );

  function createPlan() {
    const result = createDemoTrip({ from, to, travellers, days });

    if (!result.ok) {
      setPlan({ invalid: true, ...result.validation });
      setActiveTab("plan");
      return;
    }

    const trip = {
      ...result.trip,
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      budget: demoBudget,
    };

    setPlan(trip);
    setGuestTrips((current) => [trip, ...current.filter((item) => item.id !== trip.id)]);
    setActiveTab("plan");
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function continueGuest() {
    setGuest(true);
    setAuthOpen(false);
  }

  function startLocalExplore() {
    setActiveTab("explore");
    if (from.trim()) setExploreQuery(from.trim());
  }

  function openSavedTrip(trip) {
    setFrom(trip.source);
    setTo(trip.destination);
    setTravellers(trip.travellers);
    setDays(trip.days);
    setPlan(trip);
    setActiveTab("plan");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab("home")} aria-label="TripMate home">
          <span className="brand-mark">T</span>
          <span>TripMate <b>AI</b></span>
        </button>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {[["home", "Home"], ["explore", "Explore"], ["plan", "Plan"], ["trips", "My Trips"]].map(
            ([key, label]) => (
              <button
                className={activeTab === key ? "nav-link active" : "nav-link"}
                onClick={() => setActiveTab(key)}
                key={key}
              >
                {label}
              </button>
            )
          )}
        </nav>

        <div className="top-actions">
          <span className="guest-pill">{guest ? "Guest mode" : "Signed in"}</span>
          <button className="icon-button" onClick={() => openAuth("login")} aria-label="Account">
            <CircleUserRound size={20} />
          </button>
        </div>
      </header>

      <main>
        {activeTab === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <Sparkles size={15} /> Travel planning with evidence
                </span>
                <h1>
                  Plan the trip.
                  <br />
                  <span>Enjoy the journey.</span>
                </h1>
                <p>
                  TripMate brings routes, stays, rentals, temples, attractions and transparent
                  budgets into one simple travel workspace.
                </p>
              </div>

              <TripSearch
                from={from}
                to={to}
                setFrom={setFrom}
                setTo={setTo}
                travellers={travellers}
                setTravellers={setTravellers}
                days={days}
                setDays={setDays}
                onPlan={createPlan}
              />
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Designed around you</span>
                  <h2>Travel planning, not tab juggling</h2>
                </div>
              </div>
              <div className="feature-grid">
                {featureCards.map((item) => <Feature key={item.title} {...item} />)}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Pilgrimage</span>
                  <h2>Discover places with context</h2>
                </div>
                <button className="text-button" onClick={() => setActiveTab("explore")}>
                  See all <ArrowRight size={16} />
                </button>
              </div>

              <div className="card-grid">
                {demoTemples.map((temple) => <PlaceCard key={temple.id} place={temple} />)}
              </div>
            </section>

            <section className="section muted-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Data promise</span>
                  <h2>Clear about what TripMate knows</h2>
                </div>
              </div>
              <div className="status-grid">
                {Object.entries(STATUS_LABELS)
                  .filter(([key]) => key !== "USER_PROVIDED")
                  .map(([key, label]) => (
                    <div className="status-card" key={key}>
                      <StatusBadge status={key} />
                      <p>
                        {key === DATA_STATUS.LIVE && "Current provider value returned at request time."}
                        {key === DATA_STATUS.VERIFIED_SNAPSHOT && "Source-backed value stored with a verification timestamp."}
                        {key === DATA_STATUS.ESTIMATED && "A calculation based on explicit assumptions, not a provider quote."}
                        {key === DATA_STATUS.UNAVAILABLE && "No reliable value is substituted or guessed."}
                        {key === DATA_STATUS.DEMO && "Prototype placeholder, clearly separated from live travel facts."}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "explore" && (
          <Explore
            query={exploreQuery}
            setQuery={setExploreQuery}
            type={exploreType}
            setType={setExploreType}
            places={filteredTemples}
            rentalType={rentalType}
            setRentalType={setRentalType}
            rentals={filteredRentals}
          />
        )}

        {activeTab === "plan" && (
          <PlanView
            plan={plan}
            estimatedBudget={demoBudget}
            from={from}
            to={to}
            travellers={travellers}
            days={days}
            onCreate={createPlan}
            onLocalExplore={startLocalExplore}
          />
        )}

        {activeTab === "trips" && (
          <TripsView
            guest={guest}
            trips={guestTrips}
            onLogin={() => openAuth("login")}
            onOpenTrip={openSavedTrip}
            onRemoveTrip={(id) => setGuestTrips((current) => removeGuestTrip(current, id))}
          />
        )}
      </main>

      <div className="mobile-nav">
        {[["home", Home, "Home"], ["explore", Compass, "Explore"], ["plan", Sparkles, "Plan"], ["trips", CalendarDays, "My Trips"], ["more", Menu, "More"]].map(
          ([key, Icon, label]) => (
            <button
              className={activeTab === key ? "mobile-nav-item active" : "mobile-nav-item"}
              onClick={() => (key === "more" ? openAuth("login") : setActiveTab(key))}
              key={key}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          )
        )}
      </div>

      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onGuest={continueGuest}
        />
      )}
    </div>
  );
}

function TripSearch({ from, to, setFrom, setTo, travellers, setTravellers, days, setDays, onPlan }) {
  const validation = validateTripInput({ from, to, travellers, days });
  const hasInput = Boolean(from || to || String(travellers) !== "2" || String(days) !== "3");

  return (
    <form
      className="planner-card"
      onSubmit={(event) => {
        event.preventDefault();
        onPlan();
      }}
    >
      <div className="planner-title">
        <div>
          <span className="eyebrow">AI trip planner</span>
          <h3>Where are you going?</h3>
        </div>
        <StatusBadge status={DATA_STATUS.DEMO} />
      </div>

      <div className="field-row">
        <label>
          <span>From</span>
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Bhimavaram" />
        </label>
        <ArrowRight className="route-arrow" size={20} />
        <label>
          <span>Destination</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Madurai" />
        </label>
      </div>

      <div className="field-row compact">
        <label>
          <span>Travellers</span>
          <input
            type="number"
            min="1"
            max="30"
            value={travellers}
            onChange={(e) => setTravellers(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Days</span>
          <input
            type="number"
            min="1"
            max="60"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
      </div>

      {hasInput && !validation.valid && <div className="inline-error" role="alert">{validation.message}</div>}

      <button className="primary-button" type="submit">
        <Sparkles size={18} /> Create my trip <ArrowRight size={18} />
      </button>
      <p className="helper">
        Live prices, schedules and availability appear only after a verified source is connected.
      </p>
    </form>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`data-status status-${String(status).toLowerCase()}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function PlaceCard({ place }) {
  return (
    <article className="place-card">
      <div className="image-wrap">
        <img src={place.image} alt={place.name} loading="lazy" />
        <StatusBadge status={place.status} />
      </div>
      <div className="place-content">
        <span className="tag">{place.type}</span>
        <h3>{place.name}</h3>
        <p><MapPin size={14} /> {place.city}, {place.state}</p>
        <div className="place-actions">
          <button
            className="outline-button"
            onClick={() => window.open(place.officialSource, "_blank", "noopener,noreferrer")}
          >
            Official source <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Explore({ query, setQuery, type, setType, places, rentalType, setRentalType, rentals }) {
  const availableTypes = [...new Set(demoTemples.map((place) => place.type))];

  return (
    <section className="page-section">
      <div className="page-header">
        <span className="eyebrow">Explore</span>
        <h1>Find your next place</h1>
        <p>
          Browse destination ideas and pilgrimage places while keeping prototype data visibly
          separated from live information.
        </p>
      </div>

      <div className="search-box">
        <Search size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search destinations, temples, attractions..."
          aria-label="Search destinations"
        />
      </div>

      <div className="filter-row">
        <button className={type === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setType("all")}>
          All
        </button>
        {availableTypes.map((item) => (
          <button
            className={type === item.toLowerCase() ? "filter-chip active" : "filter-chip"}
            key={item}
            onClick={() => setType(item.toLowerCase())}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {places.length ? (
          places.map((temple) => <PlaceCard key={temple.id} place={temple} />)
        ) : (
          <div className="empty-card grid-span-all">
            <Search size={28} />
            <h2>No demo places match</h2>
            <p>Try a broader search. Live discovery will be added behind a provider boundary.</p>
          </div>
        )}
      </div>

      <div className="rental-panel">
        <div>
          <span className="eyebrow">Local rentals</span>
          <h2>Rent a bike or car near your destination</h2>
          <p>
            A real listing should include total rental cost, deposit, fuel policy, documents,
            insurance, pickup/return, cancellation and booking source.
          </p>

          <div className="filter-row">
            {["all", "scooter", "bike", "car"].map((item) => (
              <button
                className={rentalType === item ? "filter-chip active" : "filter-chip"}
                key={item}
                onClick={() => setRentalType(item)}
              >
                {item === "all" ? "All vehicles" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="rental-list">
          {rentals.map((rental) => (
            <div className="rental-row" key={rental.id}>
              <div className="rental-icon"><CarFront size={20} /></div>
              <div className="rental-info">
                <b>{rental.model}</b>
                <span>
                  {rental.distanceKm} km away · Deposit ₹{rental.deposit.toLocaleString()} ·{" "}
                  {STATUS_LABELS[rental.status]}
                </span>
              </div>
              <strong>₹{rental.dailyPrice.toLocaleString()}/day</strong>
              <button
                className="outline-button"
                onClick={() => window.alert("This is a demo rental listing. Connect a provider before enabling booking.")}
              >
                Details
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mode-panel">
        <div>
          <span className="eyebrow">Travel modes</span>
          <h2>Compare by journey type</h2>
        </div>
        <div className="mode-chip-grid">
          {TRAVEL_MODES.map((mode) => (
            <span className="mode-chip" key={mode.id}>
              <Check size={14} /> {mode.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanView({ plan, estimatedBudget, from, to, travellers, days, onCreate, onLocalExplore }) {
  return (
    <section className="page-section">
      <div className="page-header">
        <span className="eyebrow">Your plan</span>
        <h1>{from && to ? `${from} → ${to}` : "Build your itinerary"}</h1>
        <p>{travellers} traveller{travellers === 1 ? "" : "s"} · {days} day{days === 1 ? "" : "s"}</p>
      </div>

      {plan?.invalid && (
        <div className="alert danger" role="alert">
          <b>{plan.code === "SAME_LOCATION" ? "Local exploration instead?" : "Trip details need attention"}</b>
          <p>{plan.message}</p>
          {plan.code === "SAME_LOCATION" && (
            <button className="outline-button" onClick={onLocalExplore}>Explore this city locally</button>
          )}
        </div>
      )}

      {!plan && (
        <div className="empty-card">
          <Sparkles size={28} />
          <h2>No itinerary yet</h2>
          <p>Start on Home and enter a valid source and destination.</p>
          <button className="primary-button small" onClick={onCreate}>Create draft trip</button>
        </div>
      )}

      {plan && !plan.invalid && (
        <>
          <div className="route-banner">
            <div>
              <span>Draft itinerary</span>
              <h2>{plan.source} → {plan.destination}</h2>
              <p>Created {new Date(plan.createdAt).toLocaleString()}</p>
            </div>
            <StatusBadge status={plan.dataStatus} />
          </div>

          <div className="notice-card">
            <ShieldCheck size={20} />
            <div>
              <b>Prototype data boundary</b>
              <p>{plan.note}</p>
            </div>
          </div>

          <div className="plan-grid">
            <div className="timeline">
              {Array.from({ length: Math.min(plan.days, 6) }, (_, index) => (
                <div className="timeline-item" key={index}>
                  <span className="day-number">{index + 1}</span>
                  <div>
                    <b>Day {index + 1}</b>
                    <p>
                      Travel, explore verified places, add meals and choose local transport.
                      Exact schedules appear when a connected provider supplies them.
                    </p>
                  </div>
                </div>
              ))}
              {plan.days > 6 && (
                <div className="empty-card compact-empty">
                  <p>Days 7–{plan.days} are reserved for the connected itinerary engine.</p>
                </div>
              )}
            </div>

            <div className="budget-card">
              <span className="eyebrow">Budget preview</span>
              <h2>₹{estimatedBudget.total.toLocaleString()}</h2>
              <p>
                Estimated group total for {travellers} traveller{travellers === 1 ? "" : "s"}.
                This is not a live quote.
              </p>
              {estimatedBudget.items.map((item) => (
                <div className="budget-line" key={item.category}>
                  <span>{item.category}</span>
                  <b>₹{item.amount.toLocaleString()}</b>
                </div>
              ))}
              <div className="budget-summary">
                <span>Per person</span><b>₹{Math.round(estimatedBudget.perPerson).toLocaleString()}</b>
                <span>Per day</span><b>₹{Math.round(estimatedBudget.perDay).toLocaleString()}</b>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TripsView({ guest, trips, onLogin, onOpenTrip, onRemoveTrip }) {
  return (
    <section className="page-section">
      <div className="page-header">
        <span className="eyebrow">My Trips</span>
        <h1>Your travel workspace</h1>
        <p>Guest trips are stored locally in this browser. Sign in later to sync trips across devices.</p>
      </div>

      {trips.length > 0 ? (
        <div className="saved-trip-grid">
          {trips.map((trip) => (
            <article className="saved-trip-card" key={trip.id}>
              <div>
                <StatusBadge status={trip.dataStatus} />
                <h3>{trip.source} → {trip.destination}</h3>
                <p>{trip.travellers} traveller{trip.travellers === 1 ? "" : "s"} · {trip.days} days</p>
                <span>₹{trip.budget?.total?.toLocaleString() ?? "—"} demo budget</span>
              </div>
              <div className="saved-trip-actions">
                <button className="outline-button" onClick={() => onOpenTrip(trip)}>Open</button>
                <button className="text-button danger-text" onClick={() => onRemoveTrip(trip.id)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <CircleUserRound size={32} />
          <h2>No saved trips yet</h2>
          <p>
            Your planning session works without an account. Create a trip and it will stay in
            this browser.
          </p>
          {guest && <button className="primary-button small" onClick={onLogin}>Login / Sign up</button>}
        </div>
      )}

      {!guest && <div className="empty-card"><h2>Account sync is next</h2><p>Supabase auth and persistent trip sync will plug into this same trip model.</p></div>}
    </section>
  );
}

function DemoSubmissionNotice({ title, text }) {
  return (
    <div className="notice-card" role="status">
      <ShieldCheck size={20} />
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  );
}

function AuthModal({ mode, setMode, onClose, onGuest }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal">
        <button className="close-button" onClick={onClose} aria-label="Close"><X /></button>

        <div className="auth-head">
          <span className="brand-mark">T</span>
          <span className="eyebrow">TripMate AI</span>
          <h2 id="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p>{mode === "login" ? "Continue your travel planning." : "Save trips and sync them across devices."}</p>
        </div>

        {submitted ? (
          <div className="success-card">
            <Check size={25} />
            <h3>Auth UI is ready</h3>
            <p>
              Connect Supabase Auth to replace this prototype submission with a real session.
              Guest mode stays available.
            </p>
            <button className="primary-button" onClick={onGuest}>Continue as guest</button>
          </div>
        ) : (
          <>
            <button className="google-button" onClick={() => setSubmitted(true)}>
              Continue with Google
            </button>

            <div className="divider"><span>or</span></div>

            <label>
              Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="••••••••" />
            </label>

            <button className="primary-button" onClick={() => setSubmitted(true)}>
              {mode === "login" ? "Login" : "Create account"}
            </button>

            <button className="guest-button" onClick={onGuest}>
              Skip for now · Continue as guest
            </button>

            <p className="switch-auth">
              {mode === "login" ? "New to TripMate?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

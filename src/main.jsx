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
import { buildLiveTrip, searchMapPlaces } from "./services/liveTravel";
import { supabase, isSupabaseConfigured } from "./services/supabaseClient";
import { deleteCloudTrip, listCloudTrips, saveCloudTrip } from "./services/cloudTrips";
import { buildTravelSearchLinks } from "./services/travelLinks";

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
  const [guest, setGuest] = useState(true);
  const [user, setUser] = useState(null);
  const [cloudTrips, setCloudTrips] = useState([]);
  const [syncNotice, setSyncNotice] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [days, setDays] = useState(3);
  const [plan, setPlan] = useState(null);
  const [guestTrips, setGuestTrips] = useState(() => loadGuestTrips());
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreType, setExploreType] = useState("all");
  const [rentalType, setRentalType] = useState("all");
  const [livePlaces, setLivePlaces] = useState([]);
  const [livePlacesLocation, setLivePlacesLocation] = useState("");
  const [livePlacesCheckedAt, setLivePlacesCheckedAt] = useState("");
  const [livePlacesError, setLivePlacesError] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isImportingGuestTrips, setIsImportingGuestTrips] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => {
    saveGuestTrips(guestTrips);
  }, [guestTrips]);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;

    async function applySession(session) {
      const nextUser = session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
      setGuest(!nextUser);
      if (!nextUser) {
        setCloudTrips([]);
        return;
      }
      try {
        const saved = await listCloudTrips(supabase, nextUser.id);
        if (mounted) {
          setCloudTrips(saved);
          setSyncNotice("");
        }
      } catch (error) {
        if (mounted) {
          setCloudTrips([]);
          setSyncNotice(
            "Cloud sync could not load. Check your Supabase URL/key and apply migrations 001–003. " +
            (error instanceof Error ? error.message : "")
          );
        }
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => applySession(data?.session))
      .catch((error) => {
        if (mounted) setSyncNotice(error instanceof Error ? error.message : "Could not restore your session.");
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setAuthOpen(false);
      Promise.resolve().then(() => applySession(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  async function searchExplorePlaces() {
    const query = exploreQuery.trim();
    if (query.length < 3) {
      setLivePlacesError("Enter at least three characters, then search the live map.");
      return;
    }
    setIsSearchingPlaces(true);
    setLivePlacesError("");
    try {
      const result = await searchMapPlaces({ query });
      setLivePlaces(result.places || []);
      setLivePlacesLocation(result.location?.name || query);
      setLivePlacesCheckedAt(result.checkedAt || "");
    } catch (error) {
      setLivePlaces([]);
      setLivePlacesLocation("");
      setLivePlacesError(error instanceof Error ? error.message : "Live map search is temporarily unavailable.");
    } finally {
      setIsSearchingPlaces(false);
    }
  }

  async function createPlan() {
    const validation = validateTripInput({ from, to, travellers, days });

    if (!validation.valid) {
      setPlan({ invalid: true, ...validation });
      setActiveTab("plan");
      return;
    }

    setIsPlanning(true);
    setPlan({ loading: true, source: from.trim(), destination: to.trim(), travellers, days });
    setActiveTab("plan");

    try {
      const live = await buildLiveTrip({ from, to, travellers, days });
      const trip = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        source: live.context.trip.source,
        destination: live.context.trip.destination,
        travellers,
        days,
        dataStatus: live.status,
        context: live.context,
        ai: live.ai,
        budget: live.context.budget,
        note: "Route, destination discovery and weather are live open-data results. Booking fares and availability remain unavailable unless an authorized provider is connected.",
      };
      setPlan(trip);
      if (user && supabase) {
        try {
          const saved = await saveCloudTrip(supabase, user.id, trip);
          setCloudTrips((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
          setPlan(saved);
          setSyncNotice("Trip saved to your TripMate account.");
        } catch (error) {
          setGuestTrips((current) => [trip, ...current.filter((item) => item.id !== trip.id)]);
          setSyncNotice(
            "Cloud save failed; this trip is saved in this browser instead. " +
            (error instanceof Error ? error.message : "")
          );
        }
      } else {
        setGuestTrips((current) => [trip, ...current.filter((item) => item.id !== trip.id)]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live travel service is unavailable. Please retry.";
      setPlan({
        invalid: true,
        code: message.toLowerCase().includes("same verified place") || message.toLowerCase().includes("source and destination are the same")
          ? "SAME_LOCATION"
          : "LIVE_SERVICE_UNAVAILABLE",
        message,
      });
    } finally {
      setIsPlanning(false);
    }
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function continueGuest() {
    setGuest(true);
    setAuthOpen(false);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) setSyncNotice(error.message);
    else {
      setUser(null);
      setCloudTrips([]);
      setGuest(true);
      setAuthOpen(false);
      setSyncNotice("Signed out. Guest trips remain in this browser.");
    }
  }

  async function removeSavedTrip(trip) {
    if (trip?.storage === "cloud" && user && supabase) {
      try {
        await deleteCloudTrip(supabase, user.id, trip.id);
        setCloudTrips((current) => current.filter((item) => item.id !== trip.id));
        setSyncNotice("Trip removed from your account.");
      } catch (error) {
        setSyncNotice(error instanceof Error ? error.message : "Could not remove this cloud trip.");
      }
    } else {
      setGuestTrips((current) => removeGuestTrip(current, trip.id));
    }
  }

  async function importGuestTrips() {
    if (!user || !supabase || guestTrips.length === 0) return;
    setIsImportingGuestTrips(true);
    const remaining = [];
    const imported = [];
    for (const trip of guestTrips) {
      try {
        imported.push(await saveCloudTrip(supabase, user.id, trip));
      } catch {
        remaining.push(trip);
      }
    }
    setCloudTrips((current) => {
      const importedIds = new Set(imported.map((trip) => trip.id));
      return [...imported, ...current.filter((trip) => !importedIds.has(trip.id))];
    });
    setGuestTrips(remaining);
    setSyncNotice(remaining.length
      ? `Synced ${imported.length} browser trip(s); ${remaining.length} could not sync and remain saved locally. Check that migrations 001–003 are applied.`
      : `Moved ${imported.length} browser trip(s) into your TripMate account.`);
    setIsImportingGuestTrips(false);
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
          <span className="guest-pill">{guest ? "Guest mode" : (user?.email || "Signed in")}</span>
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
                isPlanning={isPlanning}
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
            livePlaces={livePlaces}
            livePlacesLocation={livePlacesLocation}
            livePlacesCheckedAt={livePlacesCheckedAt}
            livePlacesError={livePlacesError}
            isSearchingPlaces={isSearchingPlaces}
            onLiveSearch={searchExplorePlaces}
          />
        )}

        {activeTab === "plan" && (
          <PlanView
            plan={plan}
            estimatedBudget={demoBudget}
            isPlanning={isPlanning}
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
            trips={[...cloudTrips, ...guestTrips]}
            syncNotice={syncNotice}
            localTripCount={guestTrips.length}
            isImportingGuestTrips={isImportingGuestTrips}
            onImportGuestTrips={importGuestTrips}
            onLogin={() => openAuth("login")}
            onOpenTrip={openSavedTrip}
            onRemoveTrip={removeSavedTrip}
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
          configured={isSupabaseConfigured}
          user={user}
          onSignOut={signOut}
          onAuthSuccess={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}

function TripSearch({ from, to, setFrom, setTo, travellers, setTravellers, days, setDays, onPlan, isPlanning }) {
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
        <span className="data-status">Live lookup</span>
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

      <button className="primary-button" type="submit" disabled={isPlanning}>
        <Sparkles size={18} /> {isPlanning ? "Checking live sources…" : "Create my trip"} <ArrowRight size={18} />
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

function Explore({
  query, setQuery, type, setType, places, rentalType, setRentalType, rentals,
  livePlaces, livePlacesLocation, livePlacesCheckedAt, livePlacesError, isSearchingPlaces, onLiveSearch,
}) {
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

      <section className="live-search-panel">
        <div className="live-search-heading">
          <div>
            <span className="eyebrow">Live map discovery</span>
            <h2>Find mapped places near a city or landmark</h2>
            <p>Search runs only when you press the button. Results come from OpenStreetMap; mapped coverage and opening details can be incomplete.</p>
          </div>
          <button className="primary-button small" type="button" onClick={onLiveSearch} disabled={isSearchingPlaces || query.trim().length < 3}>
            <Search size={16} /> {isSearchingPlaces ? "Searching map…" : "Search live places"}
          </button>
        </div>
        {livePlacesError && <p className="inline-error" role="alert">{livePlacesError}</p>}
        {livePlacesLocation && (
          <p className="live-search-meta">
            Results near {livePlacesLocation}
            {livePlacesCheckedAt ? ` · checked ${new Date(livePlacesCheckedAt).toLocaleString()}` : ""}
          </p>
        )}
        {isSearchingPlaces && <p role="status">Checking the live map provider…</p>}
        {!isSearchingPlaces && livePlaces.length > 0 && (
          <div className="live-place-grid">
            {livePlaces.map((place) => {
              const lat = Number(place.latitude), lon = Number(place.longitude);
              const mapUrl = Number.isFinite(lat) && Number.isFinite(lon)
                ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
                : "https://www.openstreetmap.org/";
              return (
                <article className="live-place-card" key={place.id || place.name}>
                  <span className="live-badge">LIVE · OpenStreetMap</span>
                  <h3>{place.name}</h3>
                  <p>{[place.category, place.religion, place.denomination].filter(Boolean).join(" · ").replaceAll("_", " ") || "Mapped place"}</p>
                  {place.openingHours && <small>OSM opening-hours tag: {place.openingHours} · confirm with venue</small>}
                  <a href={place.osmUrl || mapUrl} target="_blank" rel="noreferrer noopener">View source map ↗</a>
                  {place.website && <a href={place.website} target="_blank" rel="noreferrer noopener">Listed website ↗</a>}
                  {place.wikidata && /^Q\d+$/.test(place.wikidata) && <a href={`https://www.wikidata.org/wiki/${place.wikidata}`} target="_blank" rel="noreferrer noopener">Wikidata record ↗</a>}
                </article>
              );
            })}
          </div>
        )}
        {!isSearchingPlaces && !livePlaces.length && !livePlacesError && (
          <p className="live-search-meta">Enter a city or landmark in the search field above, then choose “Search live places”.</p>
        )}
        <p className="live-search-footnote">A zero-result search means no matching mapped features were returned, not that the place does not exist. Always confirm opening hours, access and pilgrimage rules with the venue.</p>
      </section>

      <div className="card-grid">
        {places.length ? (
          places.map((temple) => <PlaceCard key={temple.id} place={temple} />)
        ) : (
          <div className="empty-card grid-span-all">
            <Search size={28} />
            <h2>No demo places match</h2>
            <p>Try a broader search, or use the live map search above.</p>
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

function PlanView({ plan, estimatedBudget, isPlanning, from, to, travellers, days, onCreate, onLocalExplore }) {
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

      {(isPlanning || plan?.loading) && (
        <div className="empty-card" role="status" aria-live="polite">
          <Sparkles size={28} />
          <h2>Checking live travel sources…</h2>
          <p>Verifying both locations, then checking road routing, nearby mapped places and current weather. Booking prices are not part of these open-data services.</p>
        </div>
      )}

      {!plan && !isPlanning && (
        <div className="empty-card">
          <Sparkles size={28} />
          <h2>No itinerary yet</h2>
          <p>Start on Home and enter a valid source and destination.</p>
          <button className="primary-button small" onClick={onCreate}>Create live trip</button>
        </div>
      )}

      {plan && !plan.invalid && !plan.loading && (
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
              <b>Live open-data boundary</b>
              <p>{plan.note}</p>
              {plan.context?.destination?.checkedAt && <small>Location checked: {new Date(plan.context.destination.checkedAt).toLocaleString()}</small>}
              {Array.isArray(plan.sources) && <div className="source-links">{plan.sources.map((source) => <a href={source} target="_blank" rel="noreferrer noopener" key={source}>{new URL(source).hostname} ↗</a>)}</div>}
            </div>
          </div>

          {plan.context?.route && (
            <div className="status-grid">
              <div className="status-card">
                <span className="eyebrow">Live route</span>
                <h3>{Number.isFinite(plan.context.route.distanceKm) ? `${plan.context.route.distanceKm} km` : "Unavailable"}</h3>
                <p>{Number.isFinite(plan.context.route.distanceKm) && Number.isFinite(plan.context.route.durationMinutes)
                  ? `Driving distance · ${plan.context.route.durationMinutes} min · ${plan.context.route.provider}`
                  : (plan.context.route.message || "A driving route could not be verified.")}</p>
              </div>
              <div className="status-card">
                <span className="eyebrow">Live weather</span>
                <h3>{plan.context.weather ? `${plan.context.weather.temperatureC}°C` : "Unavailable"}</h3>
                <p>
                  {plan.context.weather
                    ? `Feels ${plan.context.weather.apparentTemperatureC}°C · wind ${plan.context.weather.windSpeedKmh} km/h`
                    : "Weather provider did not return current data."}
                </p>
              </div>
              <div className="status-card">
                <span className="eyebrow">Nearby places</span>
                <h3>{plan.context.nearbyPlaces?.length ?? 0}</h3>
                <p>OSM places of interest and places of worship found near the destination.</p>
              </div>
            </div>
          )}

          {plan.ai && (
            <div className="notice-card">
              <Sparkles size={20} />
              <div>
                <b>AI itinerary</b>
                <p>{plan.ai.summary || "Generated from the validated live context."}</p>
                {[...(Array.isArray(plan.ai.dataWarnings) ? plan.ai.dataWarnings : []), ...(Array.isArray(plan.context?.providerWarnings) ? plan.context.providerWarnings : [])].length > 0 && (
                  <ul>
                    {[...(Array.isArray(plan.ai.dataWarnings) ? plan.ai.dataWarnings : []), ...(Array.isArray(plan.context?.providerWarnings) ? plan.context.providerWarnings : [])].slice(0, 8).map((warning, index) => <li key={String(index) + warning}>{warning}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="booking-handoff-card">
            <div>
              <span className="eyebrow">Booking handoffs</span>
              <h2>Continue your trip research</h2>
              <p>These links open external search/booking sites. TripMate has not checked their fares, inventory, schedules or availability, and no booking is made here.</p>
            </div>
            <div className="travel-link-grid">
              {buildTravelSearchLinks(plan.source, plan.destination).map((item) => (
                <a className="travel-link" href={item.url} target="_blank" rel="noreferrer noopener" key={item.id}>
                  <span>{item.label}</span>
                  <small>{item.provider}</small>
                  <b>Open site ↗</b>
                </a>
              ))}
            </div>
          </div>

          <div className="plan-grid">
            <div className="timeline">
              {Array.from({ length: Math.min(plan.days, 6) }, (_, index) => {
                const aiDay = Array.isArray(plan.ai?.days) ? plan.ai.days[index] : null;
                const places = plan.context?.nearbyPlaces?.slice(index * 3, index * 3 + 3) ?? [];
                const activities = Array.isArray(aiDay?.activities) ? aiDay.activities : Array.isArray(aiDay?.items) ? aiDay.items : [];
                return (
                  <div className="timeline-item" key={index}>
                    <span className="day-number">{index + 1}</span>
                    <div>
                      <b>{aiDay?.title || ("Day " + (index + 1))}</b>
                      <p>{aiDay?.summary || "Use the mapped places below as discovery suggestions; opening hours and entry details still need confirmation."}</p>
                      {activities.length > 0 && (
                        <ul className="activity-list">
                          {activities.slice(0, 8).map((activity, activityIndex) => {
                            const title = typeof activity === "string" ? activity : activity?.title || activity?.name || "Suggested activity";
                            const detail = typeof activity === "object" ? activity?.description || activity?.notes : "";
                            return <li key={String(activityIndex) + title}><b>{title}</b>{detail ? <span> — {detail}</span> : null}</li>;
                          })}
                        </ul>
                      )}
                      {places.length > 0 && (
                        <div className="live-place-list">
                          {places.map((place) => {
                            const lat = Number(place.latitude), lon = Number(place.longitude);
                            const mapUrl = Number.isFinite(lat) && Number.isFinite(lon)
                              ? "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lon + "#map=16/" + lat + "/" + lon
                              : "https://www.openstreetmap.org/";
                            return <a key={place.id || place.name} href={mapUrl} target="_blank" rel="noreferrer noopener">{place.name} ↗</a>;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {plan.days > 6 && (
                <div className="empty-card compact-empty">
                  <p>Days 7–{plan.days} are reserved for the connected itinerary engine.</p>
                </div>
              )}
            </div>

            <div className="budget-card">
              <span className="eyebrow">Budget & booking data</span>
              <StatusBadge status={plan.budget?.status || plan.context?.budget?.status || "UNAVAILABLE"} />
              {plan.dataStatus === "DEMO" ? (
                <>
                  <h2>₹{estimatedBudget.total.toLocaleString()}</h2>
                  <p>Illustrative demo estimate for {travellers} traveller{travellers === 1 ? "" : "s"} — not a quote and not based on live provider prices.</p>
                  {estimatedBudget.items.map((item) => (
                    <div className="budget-line" key={item.category}><span>{item.category}</span><b>₹{item.amount.toLocaleString()}</b></div>
                  ))}
                  <div className="budget-summary"><span>Per person (demo)</span><b>₹{Math.round(estimatedBudget.perPerson).toLocaleString()}</b><span>Per day (demo)</span><b>₹{Math.round(estimatedBudget.perDay).toLocaleString()}</b></div>
                </>
              ) : (
                <>
                  <h2>Not available yet</h2>
                  <p>{plan.context?.budget?.message || "Live transport fares, accommodation prices and booking availability are not connected. No total is estimated or presented as a quote."}</p>
                  <div className="budget-line"><span>Live fares</span><b>Unavailable</b></div>
                  <div className="budget-line"><span>Live stays</span><b>Unavailable</b></div>
                  <div className="budget-line"><span>Live rentals</span><b>Unavailable</b></div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TripsView({
  guest, trips, syncNotice, localTripCount, isImportingGuestTrips,
  onImportGuestTrips, onLogin, onOpenTrip, onRemoveTrip,
}) {
  return (
    <section className="page-section">
      <div className="page-header">
        <span className="eyebrow">My Trips</span>
        <h1>Your travel workspace</h1>
        <p>{guest ? "Guest trips stay in this browser. Sign in to save new plans and sync them across devices." : "Your account trips are stored in Supabase and protected by row-level security."}</p>
        {syncNotice && <div className="sync-notice" role="status">{syncNotice}</div>}
        {!guest && localTripCount > 0 && (
          <div className="sync-notice">
            <b>{localTripCount} trip(s) are still only in this browser.</b>
            <p>Import them into your account to access them on other devices. Any previous demo prices stay labelled as demo data.</p>
            <button className="primary-button small" type="button" onClick={onImportGuestTrips} disabled={isImportingGuestTrips}>
              {isImportingGuestTrips ? "Importing trips…" : "Import browser trips to account"}
            </button>
          </div>
        )}
      </div>

      {trips.length > 0 ? (
        <div className="saved-trip-grid">
          {trips.map((trip) => (
            <article className="saved-trip-card" key={trip.id}>
              <div>
                <StatusBadge status={trip.dataStatus} />
                <h3>{trip.source} → {trip.destination}</h3>
                <p>{trip.travellers} traveller{trip.travellers === 1 ? "" : "s"} · {trip.days} days</p>
                <span>{trip.budget?.status === "DEMO" && Number.isFinite(trip.budget?.total)
                    ? `₹${trip.budget.total.toLocaleString()} illustrative demo estimate`
                    : (Number.isFinite(trip.budget?.total) ? `₹${trip.budget.total.toLocaleString()} saved budget` : "Booking budget unavailable")}</span>
              </div>
              <div className="saved-trip-actions">
                <button className="outline-button" onClick={() => onOpenTrip(trip)}>Open</button>
                <button className="text-button danger-text" onClick={() => onRemoveTrip(trip)}>Remove</button>
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

      {!guest && <div className="sync-summary"><ShieldCheck size={18} /><span>Account sync enabled. New live trip records and their source context are stored with your account.</span></div>}
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

function AuthModal({ mode, setMode, onClose, onGuest, configured, user, onSignOut, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!supabase || !configured) {
      setError("Cloud authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.");
      return;
    }
    setPending(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: email.trim().split("@")[0] },
          },
        });
        if (authError) throw authError;
        if (data?.session) {
          onAuthSuccess();
        } else {
          setNotice("Account request accepted. Check your email for the Supabase confirmation link, then return here to log in.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        onAuthSuccess();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed. Check your details and Supabase settings.");
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    setNotice("");
    if (!supabase || !configured) {
      setError("Configure Supabase first, then enable Google in Authentication → Providers.");
      return;
    }
    setPending(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in could not be started.");
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal">
        <button className="close-button" onClick={onClose} aria-label="Close">
          <X />
        </button>

        <div className="auth-head">
          <span className="brand-mark">T</span>
          <span className="eyebrow">TripMate AI</span>
          <h2 id="auth-title">{user ? "Your account" : mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p>{user ? user.email : mode === "login" ? "Sign in to sync saved trips across devices." : "Create an account to keep your trips in sync."}</p>
        </div>

        {!configured && !user && (
          <div className="auth-config-note">
            <b>Guest mode is ready.</b>
            <p>To enable real accounts, add your Supabase project URL and publishable/anon key to <code>.env</code>. Never put a service-role key in frontend code.</p>
          </div>
        )}

        {user ? (
          <div className="success-card">
            <Check size={25} />
            <h3>Signed in</h3>
            <p>Your new trips can be saved to your Supabase project. Existing cloud trips load from your account when sync is available.</p>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <button className="primary-button" type="button" onClick={onSignOut} disabled={pending}>Sign out</button>
            <button className="guest-button" type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submitAuth}>
            <button className="google-button" type="button" onClick={signInWithGoogle} disabled={!configured || pending}>
              {pending ? "Please wait…" : "Continue with Google"}
            </button>

            <div className="divider"><span>or use email</span></div>

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                maxLength={128}
              />
            </label>

            {error && <p className="inline-error" role="alert">{error}</p>}
            {notice && <div className="auth-success-note" role="status">{notice}</div>}

            <button className="primary-button" type="submit" disabled={!configured || pending}>
              {pending ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
            </button>

            <button className="guest-button" type="button" onClick={onGuest}>
              Skip for now · Continue as guest
            </button>

            <p className="switch-auth">
              {mode === "login" ? "New to TripMate?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setMode(mode === "login" ? "signup" : "login");
                }}
              >
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

import React, { useMemo, useState } from "react";
import { Bus, Footprints, LocateFixed, MapPin, MessageCircle, Navigation, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { askLocalGuide, searchLocalGuide } from "../services/liveTravel";

const COPY = {
  en: {
    eyebrow: "YOUR ON-THE-GROUND COMPANION", title: "New city? Start nearby.",
    intro: "See mapped places around you, compare nearby distances, and check a walking route before paying for a short ride.",
    find: "Find places near me", searchingLocation: "Getting your location…", searchingPlaces: "Checking nearby map data…",
    permission: "Your location is requested only after you tap the button. TripMate does not add it to saved trips.",
    radius: "Search radius",
    filters: { all: "All nearby", food: "Food", essentials: "Essentials", culture: "Culture & worship", transport: "Transport", sights: "Places to see", other: "Other" },
    emptyTitle: "Find your first nearby options", emptyBody: "Look for nearby food, public-transport stops, essentials, places of worship and attractions.",
    results: "nearby mapped places", updated: "checked", live: "LIVE MAP DATA", estimated: "ESTIMATED",
    straightLine: "straight-line distance", about: "about", minutesWalk: "min walk", walking: "Walking directions",
    transit: "Public transport", viewMap: "Open map source",
    noResults: "No mapped places were returned within this radius. That does not prove there are no places here; map coverage may be incomplete.",
    geolocationUnsupported: "This browser does not support location access. You can still search the city from Explore.",
    permissionDenied: "Location permission was denied. Allow location access in your browser settings or search by city in Explore.",
    unavailableLocation: "Your device could not determine a location. Try again where you have a clearer signal.",
    locationTimeout: "Location lookup took too long. Please try again.",
    providerError: "The nearby map service could not respond. Check your connection and try again.",
    guideTipTitle: "A smarter way to move around",
    guideTip: "For a short trip, compare walking first. Open walking directions to check the actual route. If the path seems isolated, lacks sidewalks, is blocked, or it is late, choose a trusted local transport option instead of taking an unsafe shortcut.",
    transportNote: "This opens Google Maps. Transit choices, timings and fares appear only when its local data supports them; TripMate has not verified a live fare or departure.",
    attribution: "Nearby names and categories come from OpenStreetMap. Coverage, pedestrian access and opening details can be incomplete. Confirm the route and local conditions before setting off.",
    estimateNote: "Walking time is an estimate based on distance and an assumed detour; the real route can be longer.",
    verifyVenue: "confirm with the venue",
    askTitle: "Ask your local guide",
    askIntro: "Ask about nearby options, practical walking choices or what to check next. Search nearby first for place-aware answers.",
    travellingAs: "Travelling",
    solo: "Solo traveller",
    twoPeople: "Two people",
    questionPlaceholder: "e.g. Is there a nearby place to eat, and how can I walk there?",
    askButton: "Ask TripMate",
    asking: "Thinking…",
    answerTitle: "TripMate's suggestion",
    answerNote: "AI guidance is not a live transport timetable or a verified venue update.",
    askError: "The AI guide is unavailable right now. The nearby map results still work; please try again later.",
  },
  te: {
    eyebrow: "మీ ప్రయాణానికి స్థానిక సహాయకుడు", title: "కొత్త ఊరా? దగ్గర నుంచే మొదలుపెట్టండి.",
    intro: "మీ దగ్గర మ్యాప్‌లో ఉన్న ప్రదేశాలను చూడండి. చిన్న దూరానికి డబ్బు ఖర్చు చేసే ముందు నడక మార్గాన్ని పరిశీలించండి.",
    find: "నా దగ్గర ప్రదేశాలు చూపించు", searchingLocation: "మీ స్థానాన్ని గుర్తిస్తోంది…", searchingPlaces: "దగ్గరలోని మ్యాప్ సమాచారాన్ని చూస్తోంది…",
    permission: "మీరు ఈ బటన్ నొక్కినప్పుడే స్థాన అనుమతి అడుగుతాం. TripMate మీ స్థానాన్ని సేవ్ చేసిన ట్రిప్‌లలో చేర్చదు.",
    radius: "వెతకాల్సిన పరిధి",
    filters: { all: "అన్నీ", food: "ఆహారం", essentials: "అవసరాలు", culture: "సంస్కృతి & ప్రార్థనా స్థలాలు", transport: "రవాణా", sights: "చూడదగిన ప్రదేశాలు", other: "ఇతరాలు" },
    emptyTitle: "దగ్గరలోని ఎంపికలను చూడండి", emptyBody: "దగ్గరలోని భోజన స్థలాలు, ప్రజా రవాణా స్టాప్‌లు, అవసరమైన సేవలు, ప్రార్థనా స్థలాలు, సందర్శన ప్రదేశాలను వెతకండి.",
    results: "మ్యాప్‌లోని దగ్గరి ప్రదేశాలు", updated: "తనిఖీ చేసిన సమయం", live: "లైవ్ మ్యాప్ సమాచారం", estimated: "అంచనా",
    straightLine: "సూటి దూరం", about: "సుమారు", minutesWalk: "నిమిషాల నడక", walking: "నడక మార్గం",
    transit: "ప్రజా రవాణా", viewMap: "మ్యాప్ మూలాన్ని చూడండి",
    noResults: "ఈ పరిధిలో మ్యాప్‌లోని ప్రదేశాలు లభించలేదు. నిజంగా ప్రదేశాలు లేవని దీని అర్థం కాదు; మ్యాప్ సమాచారం అసంపూర్ణంగా ఉండవచ్చు.",
    geolocationUnsupported: "ఈ బ్రౌజర్‌లో స్థాన గుర్తింపు లేదు. Exploreలో నగరం పేరు వెతకవచ్చు.",
    permissionDenied: "స్థాన అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించండి లేదా Exploreలో నగరాన్ని వెతకండి.",
    unavailableLocation: "మీ పరికరం స్థానాన్ని గుర్తించలేకపోయింది. మంచి సిగ్నల్ ఉన్న చోట మళ్లీ ప్రయత్నించండి.",
    locationTimeout: "స్థానాన్ని గుర్తించడానికి ఎక్కువ సమయం పట్టింది. మళ్లీ ప్రయత్నించండి.",
    providerError: "దగ్గరి ప్రదేశాల మ్యాప్ సేవ స్పందించలేదు. ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
    guideTipTitle: "తెలివిగా ప్రయాణించే మార్గం",
    guideTip: "చిన్న దూరం అయితే ముందుగా నడకను పరిశీలించండి. అసలు మార్గం చూడటానికి నడక దిశలను తెరవండి. మార్గం నిర్మానుష్యంగా ఉంటే, ఫుట్‌పాత్ లేకపోతే, మూసి ఉంటే లేదా ఆలస్యమైతే, ప్రమాదకరమైన షార్ట్‌కట్ బదులు నమ్మకమైన స్థానిక రవాణాను ఎంచుకోండి.",
    transportNote: "ఇది Google Mapsను తెరుస్తుంది. స్థానిక సమాచారం ఉన్నప్పుడే రవాణా ఎంపికలు, సమయాలు, ఛార్జీలు కనిపిస్తాయి; TripMate ప్రత్యక్ష ఛార్జీ లేదా బయలుదేరే సమయాన్ని ధృవీకరించలేదు.",
    attribution: "ప్రదేశాల పేర్లు, వర్గాలు OpenStreetMap నుంచి వస్తాయి. సమాచారం, నడక దారి, తెరిచి ఉన్న సమయాలు అసంపూర్ణంగా ఉండవచ్చు. బయలుదేరే ముందు మార్గం, స్థానిక పరిస్థితులు నిర్ధారించండి.",
    estimateNote: "నడక సమయం దూరం, ఊహించిన అదనపు మార్గంపై ఆధారమైన అంచనా మాత్రమే; నిజమైన దారి ఎక్కువ కావచ్చు.",
    verifyVenue: "స్థలంతో నిర్ధారించండి",
    askTitle: "మీ స్థానిక గైడ్‌ను అడగండి",
    askIntro: "దగ్గరలోని ఎంపికలు, నడక మార్గాలు లేదా తర్వాత ఏమి తనిఖీ చేయాలో అడగండి. ప్రదేశాల ఆధారంగా సమాధానం పొందాలంటే ముందుగా దగ్గరలో వెతకండి.",
    travellingAs: "ప్రయాణికులు",
    solo: "ఒక్కరే ప్రయాణం",
    twoPeople: "ఇద్దరు",
    questionPlaceholder: "ఉదా: దగ్గరలో భోజనం చేసే చోటు ఉందా? అక్కడికి ఎలా నడిచి వెళ్లాలి?",
    askButton: "TripMateను అడగండి",
    asking: "ఆలోచిస్తోంది…",
    answerTitle: "TripMate సూచన",
    answerNote: "AI సూచన ప్రత్యక్ష రవాణా సమయ పట్టిక లేదా ధృవీకరించిన ప్రదేశ సమాచారం కాదు.",
    askError: "AI గైడ్ ప్రస్తుతం అందుబాటులో లేదు. దగ్గరి మ్యాప్ ఫలితాలు పనిచేస్తూనే ఉంటాయి; తర్వాత మళ్లీ ప్రయత్నించండి.",
  },
  hi: {
    eyebrow: "आपका स्थानीय यात्रा साथी", title: "नया शहर? आस-पास से शुरू करें।",
    intro: "अपने आस-पास मैप पर दर्ज जगहें देखें। छोटी दूरी के लिए पैसे खर्च करने से पहले पैदल रास्ता जाँचें।",
    find: "मेरे पास की जगहें खोजें", searchingLocation: "आपकी लोकेशन प्राप्त हो रही है…", searchingPlaces: "आस-पास का मैप डेटा देखा जा रहा है…",
    permission: "लोकेशन की अनुमति केवल बटन दबाने पर माँगी जाती है। TripMate इसे आपकी सेव की गई यात्राओं में नहीं जोड़ता।",
    radius: "खोज का दायरा",
    filters: { all: "सभी", food: "खाना", essentials: "ज़रूरी सेवाएँ", culture: "संस्कृति और पूजा स्थल", transport: "परिवहन", sights: "घूमने की जगहें", other: "अन्य" },
    emptyTitle: "पास के विकल्प देखें", emptyBody: "पास के भोजनालय, सार्वजनिक परिवहन स्टॉप, ज़रूरी सेवाएँ, पूजा स्थल और आकर्षण खोजें।",
    results: "मैप पर मिली आस-पास की जगहें", updated: "जाँच का समय", live: "लाइव मैप डेटा", estimated: "अनुमानित",
    straightLine: "सीधी दूरी", about: "लगभग", minutesWalk: "मिनट पैदल", walking: "पैदल रास्ता",
    transit: "सार्वजनिक परिवहन", viewMap: "मैप स्रोत खोलें",
    noResults: "इस दायरे में मैप पर कोई जगह नहीं मिली। इसका मतलब यह नहीं कि वहाँ जगहें नहीं हैं; मैप की जानकारी अधूरी हो सकती है।",
    geolocationUnsupported: "यह ब्राउज़र लोकेशन नहीं बता सकता। Explore में शहर का नाम खोज सकते हैं।",
    permissionDenied: "लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें या Explore में शहर खोजें।",
    unavailableLocation: "आपका डिवाइस लोकेशन पता नहीं कर पाया। बेहतर सिग्नल वाली जगह से फिर कोशिश करें।",
    locationTimeout: "लोकेशन मिलने में बहुत समय लगा। कृपया फिर कोशिश करें।",
    providerError: "आस-पास की मैप सेवा जवाब नहीं दे सकी। इंटरनेट जाँचकर फिर कोशिश करें।",
    guideTipTitle: "आस-पास जाने का समझदार तरीका",
    guideTip: "छोटी दूरी के लिए पहले पैदल जाने का विकल्प देखें। असली रास्ता जाँचने के लिए पैदल दिशा खोलें। रास्ता सुनसान लगे, फुटपाथ न हो, रास्ता बंद हो या देर हो गई हो, तो असुरक्षित शॉर्टकट के बजाय भरोसेमंद स्थानीय परिवहन चुनें।",
    transportNote: "यह Google Maps खोलेगा। सार्वजनिक परिवहन, समय और किराया तभी दिखेंगे जब उस क्षेत्र का डेटा उपलब्ध होगा; TripMate ने लाइव किराया या प्रस्थान समय की पुष्टि नहीं की है।",
    attribution: "जगहों के नाम और श्रेणियाँ OpenStreetMap से हैं। कवरेज, पैदल पहुँच और खुलने के समय की जानकारी अधूरी हो सकती है। निकलने से पहले रास्ता और स्थानीय स्थिति जाँच लें।",
    estimateNote: "पैदल समय दूरी और अनुमानित अतिरिक्त रास्ते पर आधारित है; वास्तविक रास्ता लंबा हो सकता है।",
    verifyVenue: "स्थल से पुष्टि करें",
    askTitle: "अपने स्थानीय गाइड से पूछें",
    askIntro: "पास के विकल्पों, पैदल जाने के तरीके या आगे क्या जाँचना है, इसके बारे में पूछें। जगहों पर आधारित जवाब के लिए पहले पास की जगहें खोजें।",
    travellingAs: "यात्रा में",
    solo: "अकेले यात्री",
    twoPeople: "दो लोग",
    questionPlaceholder: "उदाहरण: पास में खाने की जगह है? वहाँ पैदल कैसे पहुँचूँ?",
    askButton: "TripMate से पूछें",
    asking: "सोच रहा है…",
    answerTitle: "TripMate का सुझाव",
    answerNote: "AI की सलाह लाइव परिवहन समय-सारणी या सत्यापित स्थल अपडेट नहीं है।",
    askError: "AI गाइड अभी उपलब्ध नहीं है। पास के मैप परिणाम फिर भी काम करते हैं; बाद में दोबारा कोशिश करें।",
  },
};

const LANGUAGE_LOCALES = { en: "en-IN", te: "te-IN", hi: "hi-IN" };

function distanceLabel(metres, copy) {
  if (!Number.isFinite(metres)) return "";
  return metres >= 1000
    ? (metres / 1000).toFixed(1) + " km " + copy.straightLine
    : Math.round(metres) + " m " + copy.straightLine;
}

function directionsUrl(origin, place, mode) {
  const destination = Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))
    ? String(place.latitude) + "," + String(place.longitude)
    : place.name;
  const params = new URLSearchParams({
    api: "1",
    origin: String(origin.latitude) + "," + String(origin.longitude),
    destination,
    travelmode: mode,
  });
  return "https://www.google.com/maps/dir/?" + params.toString();
}

export default function LocalGuide({ language = "en" }) {
  const t = COPY[language] || COPY.en;
  const [radius, setRadius] = useState("1000");
  const [filter, setFilter] = useState("all");
  const [coordinates, setCoordinates] = useState(null);
  const [places, setPlaces] = useState([]);
  const [checkedAt, setCheckedAt] = useState("");
  const [providerStatus, setProviderStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [question, setQuestion] = useState("");
  const [travellers, setTravellers] = useState("1");
  const [answer, setAnswer] = useState("");
  const [answerLanguage, setAnswerLanguage] = useState("en");
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");

  const filteredPlaces = useMemo(() => {
    const filtered = places.filter((place) => filter === "all" || place.guideCategory === filter);
    return [...filtered].sort((a, b) => Number(a.distanceMeters || 0) - Number(b.distanceMeters || 0));
  }, [places, filter]);

  async function findNearby() {
    setError("");
    if (!navigator.geolocation) {
      setError(t.geolocationUnsupported);
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, maximumAge: 60000, timeout: 15000,
        });
      });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoordinates(point);
      const result = await searchLocalGuide({ ...point, radiusMeters: Number(radius) });
      const nextPlaces = Array.isArray(result.places) ? result.places : [];
      setPlaces(nextPlaces);
      setCheckedAt(result.checkedAt || "");
      setProviderStatus(result.status || "UNAVAILABLE");
      setMessage(result.message || "");
      setHasSearched(true);
      if (result.status !== "LIVE") setError(t.providerError);
    } catch (lookupError) {
      if (typeof lookupError?.code === "number") {
        if (lookupError.code === 1) setError(t.permissionDenied);
        else if (lookupError.code === 3) setError(t.locationTimeout);
        else setError(t.unavailableLocation);
      } else {
        setError(t.providerError);
      }
      setPlaces([]);
      setProviderStatus("UNAVAILABLE");
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitQuestion(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3) return;
    setIsAsking(true);
    setAskError("");
    setAnswer("");
    try {
      const result = await askLocalGuide({
        question: trimmedQuestion,
        language,
        travellers: Number(travellers),
        places: places.slice(0, 30),
      });
      setAnswer(result.answer || "");
      setAnswerLanguage(language);
      if (!result.answer) setAskError(t.askError);
    } catch {
      setAskError(t.askError);
    } finally {
      setIsAsking(false);
    }
  }

  const categories = ["all", "food", "essentials", "culture", "transport", "sights"];
  const locale = LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES.en;

  return (
    <section className="page-section local-guide-page">
      <div className="page-header local-guide-header">
        <span className="eyebrow"><Footprints size={15} /> {t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      <section className="local-guide-start">
        <div className="local-guide-start-copy">
          <span className="local-guide-pin"><LocateFixed size={22} /></span>
          <div><h2>{t.find}</h2><p>{t.permission}</p></div>
        </div>
        <div className="local-guide-controls">
          <label className="radius-select">
            <span>{t.radius}</span>
            <select value={radius} onChange={(event) => setRadius(event.target.value)}>
              <option value="500">500 m</option>
              <option value="1000">1 km</option>
              <option value="2000">2 km</option>
              <option value="5000">5 km</option>
            </select>
          </label>
          <button className="primary-button" type="button" onClick={findNearby} disabled={isLoading}>
            {isLoading ? <RefreshCw size={17} className="guide-spin" /> : <LocateFixed size={17} />}
            {isLoading ? (coordinates ? t.searchingPlaces : t.searchingLocation) : t.find}
          </button>
        </div>
      </section>

      <section className="local-guide-tip">
        <div className="local-guide-tip-icon"><ShieldCheck size={21} /></div>
        <div><h3>{t.guideTipTitle}</h3><p>{t.guideTip}</p></div>
      </section>

      {error && <p className="inline-error local-guide-error" role="alert">{error}</p>}

      {hasSearched && (
        <section className="local-guide-results" aria-live="polite">
          <div className="local-guide-results-heading">
            <div>
              <span className="eyebrow">{providerStatus === "LIVE" ? t.live : t.estimated}</span>
              <h2>{filteredPlaces.length} {t.results}</h2>
              {checkedAt && <p>{t.updated}: {new Date(checkedAt).toLocaleString(locale)}</p>}
            </div>
            <MapPin size={23} />
          </div>

          <div className="local-guide-filters" aria-label={t.radius}>
            {categories.map((category) => (
              <button
                type="button"
                className={filter === category ? "filter-chip active" : "filter-chip"}
                key={category}
                onClick={() => setFilter(category)}
              >{t.filters[category]}</button>
            ))}
          </div>

          {filteredPlaces.length === 0 && <div className="empty-card local-guide-empty"><h3>{t.noResults}</h3></div>}

          {filteredPlaces.length > 0 && (
            <div className="local-guide-grid">
              {filteredPlaces.map((place) => (
                <article className="local-guide-place" key={place.id || (place.name + "-" + place.latitude + "-" + place.longitude)}>
                  <div className="local-guide-place-top">
                    <span className="local-guide-live">{t.live}</span>
                    <span className="local-guide-distance">{distanceLabel(Number(place.distanceMeters), t)}</span>
                  </div>
                  <h3>{place.name}</h3>
                  <p className="local-guide-place-category">{t.filters[place.guideCategory] || t.filters.other}</p>
                  {Number.isFinite(Number(place.estimatedWalkMinutes)) && (
                    <p className="local-guide-walk-estimate"><Footprints size={15} /> {t.about} {place.estimatedWalkMinutes} {t.minutesWalk}</p>
                  )}
                  {place.openingHours && <small className="local-guide-hours">{place.openingHours} · {t.verifyVenue}</small>}
                  <div className="local-guide-place-actions">
                    {coordinates && (
                      <>
                        <a href={directionsUrl(coordinates, place, "walking")} target="_blank" rel="noreferrer noopener"><Footprints size={15} /> {t.walking}</a>
                        <a href={directionsUrl(coordinates, place, "transit")} target="_blank" rel="noreferrer noopener"><Bus size={15} /> {t.transit}</a>
                      </>
                    )}
                    {place.osmUrl && <a href={place.osmUrl} target="_blank" rel="noreferrer noopener"><Navigation size={15} /> {t.viewMap}</a>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="local-guide-transport-note">{t.transportNote}</p>
          {message && <p className="local-guide-provider-message">{message}</p>}
        </section>
      )}

      <section className="local-guide-ask">
        <div className="local-guide-ask-heading">
          <span className="local-guide-pin"><MessageCircle size={21} /></span>
          <div>
            <span className="eyebrow">{t.askTitle}</span>
            <p>{t.askIntro}</p>
          </div>
        </div>
        <form className="local-guide-ask-form" onSubmit={submitQuestion}>
          <label className="guide-travellers">
            <span>{t.travellingAs}</span>
            <select value={travellers} onChange={(event) => setTravellers(event.target.value)}>
              <option value="1">{t.solo}</option>
              <option value="2">{t.twoPeople}</option>
            </select>
          </label>
          <label className="local-guide-question-label">
            <span>{t.askTitle}</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t.questionPlaceholder}
              rows={3}
              maxLength={500}
              required
              minLength={3}
            />
          </label>
          <button className="primary-button" type="submit" disabled={isAsking || question.trim().length < 3}>
            {isAsking ? <RefreshCw size={17} className="guide-spin" /> : <Send size={17} />}
            {isAsking ? t.asking : t.askButton}
          </button>
        </form>
        {askError && <p className="inline-error" role="alert">{askError}</p>}
        {answer && answerLanguage === language && (
          <article className="local-guide-answer" aria-live="polite">
            <h3>{t.answerTitle}</h3>
            <p>{answer}</p>
            <small>{t.answerNote}</small>
          </article>
        )}
      </section>

      <div className="local-guide-footer">
        <ShieldCheck size={18} />
        <p>{t.estimateNote} {t.attribution}</p>
      </div>
    </section>
  );
}

function normalisePlace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function buildTravelSearchLinks(source, destination) {
  const from = normalisePlace(source);
  const to = normalisePlace(destination);
  if (!from || !to) return [];

  const routeQuery = encodeURIComponent(`${from} to ${to}`);
  const destinationQuery = encodeURIComponent(to);
  return [
    {
      id: "trains",
      label: "Train tickets",
      provider: "IRCTC · official railway booking portal",
      url: "https://www.irctc.co.in/nget/train-search",
    },
    {
      id: "flights",
      label: "Flights",
      provider: "Google Flights · route search",
      url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${from} to ${to}`)}`,
    },
    {
      id: "buses",
      label: "Bus tickets",
      provider: "redBus · enter this route on the provider site",
      url: "https://www.redbus.in/",
    },
    {
      id: "stays",
      label: "Hotels and stays",
      provider: "Google Hotels · destination search",
      url: `https://www.google.com/travel/hotels?q=${destinationQuery}`,
    },
    {
      id: "rentals",
      label: "Local bike and car rentals",
      provider: "Google Maps · local business search",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`bike car rental in ${to}`)}`,
    },
    {
      id: "local-transport",
      label: "Local taxis and autos",
      provider: "Google Maps · local business search",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`taxi auto cab in ${to}`)}`,
    },
    {
      id: "food",
      label: "Restaurants and food",
      provider: "Google Maps · local business search",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants in ${to}`)}`,
    },
    {
      id: "official-tourism",
      label: "Official India tourism guide",
      provider: "Incredible India · Ministry of Tourism",
      url: "https://www.incredibleindia.gov.in/en",
    },
    {
      id: "ap-tourism",
      label: "Andhra Pradesh tourism (if relevant)",
      provider: "Official APTDC tourism and accommodation portal",
      url: "https://tourism.ap.gov.in/home",
    },
    {
      id: "places",
      label: "Nearby places",
      provider: "OpenStreetMap · map and place search",
      url: `https://www.openstreetmap.org/search?query=${routeQuery}`,
    },
  ];
}

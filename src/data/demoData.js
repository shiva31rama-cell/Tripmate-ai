import { DATA_STATUS } from "../types";

export const demoTemples = [
  {
    id: "madurai-meenakshi",
    name: "Meenakshi Sundareswarar Temple",
    city: "Madurai",
    state: "Tamil Nadu",
    type: "Temple",
    status: DATA_STATUS.DEMO,
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    officialSource: "https://maduraimeenakshi.hrce.tn.gov.in/",
  },
  {
    id: "rameswaram-ramanathaswamy",
    name: "Ramanathaswamy Temple",
    city: "Rameswaram",
    state: "Tamil Nadu",
    type: "Pilgrimage",
    status: DATA_STATUS.DEMO,
    image:
      "https://images.unsplash.com/photo-1600100397608-f010b6c4f7a5?auto=format&fit=crop&w=1200&q=80",
    officialSource: "https://rameswaramramanathar.hrce.tn.gov.in/",
  },
  {
    id: "thanjavur-brihadeeswarar",
    name: "Brihadeeswarar Temple",
    city: "Thanjavur",
    state: "Tamil Nadu",
    type: "Heritage",
    status: DATA_STATUS.DEMO,
    image:
      "https://images.unsplash.com/photo-1605537964076-3cb0ea6f6a0a?auto=format&fit=crop&w=1200&q=80",
    officialSource:
      "https://thanjavur.nic.in/tourist-place/big-brihadeeshwara-temple/",
  },
];

export const demoRentals = [
  {
    id: "demo-scooter-1",
    vehicleType: "Scooter",
    model: "Automatic scooter",
    dailyPrice: 450,
    distanceKm: 1.2,
    deposit: 2000,
    status: DATA_STATUS.DEMO,
    bookingUrl: null,
  },
  {
    id: "demo-bike-1",
    vehicleType: "Bike",
    model: "125cc commuter bike",
    dailyPrice: 650,
    distanceKm: 2.1,
    deposit: 2500,
    status: DATA_STATUS.DEMO,
    bookingUrl: null,
  },
  {
    id: "demo-car-1",
    vehicleType: "Car",
    model: "Compact hatchback",
    dailyPrice: 1800,
    distanceKm: 2.8,
    deposit: 5000,
    status: DATA_STATUS.DEMO,
    bookingUrl: null,
  },
];

export const herds = [{ id: "h1", name: "Alpha Herd" }, { id: "h2", name: "Beta Herd" }];

export const families = [
  { id: "f1", name: "Family One", herdId: "h1" },
  { id: "f2", name: "Family Two", herdId: "h1" },
  { id: "f3", name: "Family Three", herdId: "h2" },
];

export const positions = [
  { herdId: "h1", familyId: "f1", time: 10, lat: 1, lon: 1 },
  { herdId: "h1", familyId: "f1", time: 20, lat: 2, lon: 2 },
  { herdId: "h2", familyId: "f3", time: 15, lat: -1, lon: -1 },
];

export const events = [
  { type: "Feeding", lat: 1, lon: 1, time: 12 },
  { type: "Conflict", lat: -1, lon: -1, time: 17 },
];

export const stats: Record<string, { time: number; size: number; health: number }[]> = {
  f1: [
    { time: 10, size: 5, health: 80 },
    { time: 20, size: 6, health: 85 },
  ],
  f3: [
    { time: 15, size: 4, health: 70 },
  ],
};

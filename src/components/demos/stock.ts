export type DemoPhotoSet = {
  hero: string;
  gallery: string[];
};

function photo(id: string, width = 1600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

const SETS: Record<string, DemoPhotoSet> = {
  construction: {
    hero: photo("photo-1541888946425-d81bb19240f5", 2000),
    gallery: [
      photo("photo-1503387762-592deb58ef4e"),
      photo("photo-1504307651254-35680f356dfd"),
      photo("photo-1486406146926-c627a92ad1ab"),
      photo("photo-1581094794329-c8112a89af12"),
      photo("photo-1503387837-b154d5074bd2"),
      photo("photo-1589939705384-5185137a7f0f"),
    ],
  },
  real_estate: {
    hero: photo("photo-1600585154340-be6161a56a0c", 2000),
    gallery: [
      photo("photo-1560518883-ce09059eeffa"),
      photo("photo-1600607687939-ce8a6c25118c"),
      photo("photo-1600566753190-17f0baa2a6c3"),
    ],
  },
  restaurant: {
    hero: photo("photo-1517248135467-4c7edcad34c4", 2000),
    gallery: [
      photo("photo-1414235077428-338989a2e8c0"),
      photo("photo-1559339352-11d035aa65de"),
      photo("photo-1466978913421-dad2ebd01d17"),
    ],
  },
  hotel: {
    hero: photo("photo-1566073771259-6a8506099945", 2000),
    gallery: [
      photo("photo-1582719478250-c89cae4dc85b"),
      photo("photo-1578683010236-d716f9a3f461"),
      photo("photo-1520250497591-112f2f40a3f4"),
    ],
  },
  school: {
    hero: photo("photo-1523050854058-8df90110c9f1", 2000),
    gallery: [
      photo("photo-1571260899304-425eee4c7efc"),
      photo("photo-1509062522246-3755977927d7"),
    ],
  },
  beauty: {
    hero: photo("photo-1560066984-138dadb4c035", 2000),
    gallery: [
      photo("photo-1522337360788-8b13dee7a37e"),
      photo("photo-1487412947147-5cebf100ffc2"),
    ],
  },
  ecommerce: {
    hero: photo("photo-1441986300917-64674bd600d8", 2000),
    gallery: [
      photo("photo-1483985988355-763728e1935b"),
      photo("photo-1445205170230-053ca3d8fd52"),
      photo("photo-1490481651871-ab68de25d43d"),
    ],
  },
  professional_services: {
    hero: photo("photo-1497366216548-37526070297c", 2000),
    gallery: [
      photo("photo-1521737604893-d14cc237f11d"),
      photo("photo-1454165804606-c3d57bc86b40"),
    ],
  },
};

export const DEMO_PHOTO_CAPTION =
  "Demonstration photography — licensed stock, not this business’s own projects or premises.";

export function stockFor(templateKey: string): DemoPhotoSet {
  return SETS[templateKey] ?? SETS.professional_services;
}

import { Influencer } from '../types';

// Expanded Mock Database to support filtering demo
const MOCK_DB: Omit<Influencer, 'matchScore'>[] = [
  // --- Instagram ---
  {
    id: '1',
    name: "Elara Vance",
    handle: "@elara.vibe",
    platform: "Instagram",
    location: "Los Angeles, USA",
    followers: "42.5K",
    er: "8.4%",
    likes: "3.2K",
    value: "$1,200",
    avatarUrl: "https://picsum.photos/seed/elara/200/200",
    niche: ["Fashion", "Lifestyle", "Sustainable"]
  },
  {
    id: '2',
    name: "Marcus Chen",
    handle: "@marcus.lens",
    platform: "Instagram",
    location: "New York, USA",
    followers: "28.1K",
    er: "7.1%",
    likes: "1.8K",
    value: "$850",
    avatarUrl: "https://picsum.photos/seed/marcus/200/200",
    niche: ["Technology", "Photography", "Travel"]
  },
  {
    id: '3',
    name: "Sarah Jenkins",
    handle: "@sarah.daily",
    platform: "Instagram",
    location: "London, UK",
    followers: "155K",
    er: "6.5%",
    likes: "12.1K",
    value: "$2,500",
    avatarUrl: "https://picsum.photos/seed/sarah/200/200",
    niche: ["Health", "Food", "Wellness"]
  },
  {
    id: '8',
    name: "Chef Davi",
    handle: "@davi.cooks",
    platform: "Instagram",
    location: "Chicago, USA",
    followers: "85K",
    er: "5.2%",
    likes: "4K",
    value: "$1,800",
    avatarUrl: "https://picsum.photos/seed/davi/200/200",
    niche: ["Food", "Cooking"]
  },
  {
    id: '10',
    name: "Elena Rostova",
    handle: "@elena.style",
    platform: "Instagram",
    location: "Berlin, Germany",
    followers: "12K",
    er: "9.5%",
    likes: "1.2K",
    value: "$400",
    avatarUrl: "https://picsum.photos/seed/elena/200/200",
    niche: ["Fashion", "Minimalism"]
  },
  {
    id: '11',
    name: "Jake & Fin",
    handle: "@adventure.bros",
    platform: "Instagram",
    location: "Sydney, Australia",
    followers: "350K",
    er: "4.1%",
    likes: "15K",
    value: "$4,200",
    avatarUrl: "https://picsum.photos/seed/jake/200/200",
    niche: ["Travel", "Adventure"]
  },

  // --- YouTube ---
  {
    id: '4',
    name: "Alex Rivera",
    handle: "@alex.tech",
    platform: "YouTube",
    location: "Austin, USA",
    followers: "680K",
    er: "3.9%",
    likes: "25K",
    value: "$5,500",
    avatarUrl: "https://picsum.photos/seed/alex/200/200",
    niche: ["Technology", "Reviews"]
  },
  {
    id: '5',
    name: "Mike Chen",
    handle: "@circuit.break",
    platform: "YouTube",
    location: "Toronto, Canada",
    followers: "120K",
    er: "6.8%",
    likes: "8.5K",
    value: "$2,200",
    avatarUrl: "https://picsum.photos/seed/mike/200/200",
    niche: ["Technology", "Gaming"]
  },
  {
    id: '12',
    name: "Yoga with Jen",
    handle: "@jen.flow",
    platform: "YouTube",
    location: "Los Angeles, USA",
    followers: "1.2M",
    er: "5.5%",
    likes: "45K",
    value: "$8,500",
    avatarUrl: "https://picsum.photos/seed/jen/200/200",
    niche: ["Health", "Yoga", "Wellness"]
  },

  // --- TikTok ---
  {
    id: '6',
    name: "Bella Hadid",
    handle: "@bella.looks",
    platform: "TikTok",
    location: "Milan, Italy",
    followers: "2.1M",
    er: "4.5%",
    likes: "85K",
    value: "$12,000",
    avatarUrl: "https://picsum.photos/seed/bella/200/200",
    niche: ["Fashion", "Modeling"]
  },
  {
    id: '7',
    name: "Urban Fit",
    handle: "@urban.fit",
    platform: "TikTok",
    location: "New York, USA",
    followers: "320K",
    er: "7.2%",
    likes: "22K",
    value: "$3,500",
    avatarUrl: "https://picsum.photos/seed/urban/200/200",
    niche: ["Health", "Fitness", "Fashion"]
  },
  {
    id: '13',
    name: "Comedy Central",
    handle: "@laugh.out",
    platform: "TikTok",
    location: "London, UK",
    followers: "5.5M",
    er: "12.5%",
    likes: "600K",
    value: "$25,000",
    avatarUrl: "https://picsum.photos/seed/laugh/200/200",
    niche: ["Entertainment", "Comedy"]
  },
  {
    id: '14',
    name: "Eco Warrior",
    handle: "@green.life",
    platform: "TikTok",
    location: "Portland, USA",
    followers: "45K",
    er: "15.2%",
    likes: "8K",
    value: "$950",
    avatarUrl: "https://picsum.photos/seed/eco/200/200",
    niche: ["Sustainability", "Lifestyle"]
  }
];

// --- Helper Functions ---

export const parseFollowerCount = (countStr: string): number => {
    const num = parseFloat(countStr.replace(/[^0-9.]/g, ''));
    if (countStr.toUpperCase().includes('M')) return num * 1000000;
    if (countStr.toUpperCase().includes('K')) return num * 1000;
    return num;
};

export const getInfluencerTier = (followers: string): string => {
    const count = parseFollowerCount(followers);
    if (count < 10000) return 'Nano';
    if (count < 100000) return 'Micro';
    if (count < 1000000) return 'Macro';
    return 'Mega';
};

export const getAllInfluencers = (): Influencer[] => {
    return MOCK_DB.map(inf => ({
        ...inf,
        matchScore: Math.floor(Math.random() * 30) + 60 // Random score for browse mode
    }));
};

export const findMatchingInfluencers = (industry: string, platform: string): Influencer[] => {
  // Heuristic matching
  const filtered = MOCK_DB.filter(inf => {
    // Basic platform match (loose)
    const platformMatch = inf.platform.toLowerCase().includes(platform.toLowerCase()) || platform.toLowerCase().includes(inf.platform.toLowerCase());
    // Industry match check (if any niche matches the industry)
    const industryMatch = inf.niche.some(n => 
      industry.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(industry.toLowerCase()) || industry === 'Other'
    );
    return platformMatch || industryMatch;
  });

  const results = filtered.length > 0 ? filtered : MOCK_DB.slice(0, 3);

  // Mock match scores relative to the search
  return results.slice(0, 4).map(inf => ({
    ...inf,
    matchScore: Math.floor(Math.random() * (99 - 85) + 85) 
  }));
};
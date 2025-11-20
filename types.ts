
export enum GoalType {
  AWARENESS = 'awareness',
  LAUNCH = 'launch',
  SALES = 'sales',
  UGC = 'ugc',
  EVENT = 'event',
  COMMUNITY = 'community',
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string; // Instagram, YouTube, TikTok
  location: string;
  followers: string;
  er: string; // Engagement Rate
  likes: string;
  value: string; // Estimated cost
  matchScore: number; // 0-100
  matchDetails?: string[]; // Explanation of the score
  avatarUrl: string;
  niche: string[];
}

export interface BrandProfile {
  story: string;
  mission: string;
  values: string[];
  tone: string;
}

export interface ContentIdea {
  title: string;
  description: string;
}

export interface Strategy {
  platformName: string;
  targetRange: string;
  frequency: string;
  reasoning: string;
  contentIdeas: Array<ContentIdea | string>; // Union type for backward compatibility
  northStar: string; // Refined goal statement
  goalReasoning: string;
  creatorPersona: string; // New: Description of the ideal creator vibe
}

export interface DashboardData {
  brand: BrandProfile;
  strategy: Strategy;
  creators: Influencer[];
}

export interface FormData {
  businessName: string;
  industry: string;
  location: string;
  reach: string;
  hasWebsite: boolean | null;
  websiteUrl: string;
  businessDescription: string;
  goal: GoalType | '';
  goalDescription: string;
  refinedGoal: string;
}

export interface UserProfile {
  email: string;
  password?: string; // For mock auth validation
  formData: FormData | null;
  dashboardData: DashboardData | null;
  isPremium: boolean;
}

export interface User {
  email: string;
  name: string;
  isPremium: boolean;
}

// Add callback type for regeneration
export type RegenerateStrategyHandler = (newGoalDescription: string) => Promise<void>;

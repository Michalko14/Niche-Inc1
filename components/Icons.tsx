
import React from 'react';
import { 
  ChevronRight, 
  Check, 
  Sparkles, 
  Globe, 
  Target, 
  Loader2, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Users,
  Megaphone,
  Rocket,
  DollarSign,
  Camera,
  Calendar,
  LayoutGrid,
  Compass,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Filter,
  SlidersHorizontal,
  Bookmark,
  LogOut,
  TrendingUp,
  Award,
  Lock,
  CreditCard,
  ShieldCheck,
  Star,
  X,
  Settings,
  Upload,
  Mail,
  Bell,
  Moon
} from 'lucide-react';

// --- Custom Brand Icons with Official Paths ---

export const InstagramLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient)" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f09433" />
        <stop offset="0.25" stopColor="#e6683c" />
        <stop offset="0.5" stopColor="#dc2743" />
        <stop offset="0.75" stopColor="#cc2366" />
        <stop offset="1" stopColor="#bc1888" />
      </linearGradient>
    </defs>
  </svg>
);

export const YoutubeLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="#FF0000"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
  </svg>
);

export const TikTokLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="#000000"/>
  </svg>
);

export const GoogleLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Icons = {
  ChevronRight,
  Check,
  Sparkles,
  Globe,
  Target,
  Loader2,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Zap,
  Instagram: InstagramLogo,
  Youtube: YoutubeLogo,
  TikTok: TikTokLogo,
  Google: GoogleLogo,
  Users,
  Megaphone,
  Rocket,
  DollarSign,
  Camera,
  Calendar,
  LayoutGrid,
  Compass,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Filter,
  SlidersHorizontal,
  Bookmark,
  LogOut,
  TrendingUp,
  Award,
  Lock,
  CreditCard,
  ShieldCheck,
  Star,
  X,
  Settings,
  Upload,
  Mail,
  Bell,
  Moon
};

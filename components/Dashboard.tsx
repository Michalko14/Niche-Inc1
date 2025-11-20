
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardData, FormData, GoalType, Influencer, BrandProfile, RegenerateStrategyHandler, ContentIdea } from '../types';
import { Icons } from './Icons';
import { getAllInfluencers, getInfluencerTier } from '../services/influencerData';

interface Props {
  data: DashboardData;
  formData: FormData;
  onLogout: () => void;
  onUpdateBrand: (brand: BrandProfile) => void;
  onRegenerateStrategy: RegenerateStrategyHandler;
  isPremium: boolean;
  onUpgrade: () => Promise<void>;
}

type Tab = 'strategy' | 'explore' | 'community' | 'favorites' | 'settings';

// --- Mappings for Smart Suggestions ---
const INDUSTRY_NICHES: Record<string, string[]> = {
    'Technology': ['Gadgets', 'Coding', 'Gaming', 'AI Tools', 'Desk Setups'],
    'Fashion & Beauty': ['Streetwear', 'Luxury', 'Clean Beauty', 'Sustainable Fashion', 'GRWM'],
    'Food & Beverage': ['Plant Based', 'Mixology', 'Fine Dining', 'Home Cooking', 'Meal Prep'],
    'Health & Wellness': ['Yoga', 'Mental Health', 'Fitness', 'Biohacking', 'Nutrition'],
    'Travel & Hospitality': ['Luxury Travel', 'Backpacking', 'Van Life', 'Hidden Gems', 'Solo Travel'],
    'Finance': ['Crypto', 'Personal Finance', 'Investing', 'Real Estate'],
    'Education': ['Study Hacks', 'Career Advice', 'Languages', 'Science'],
    'E-commerce': ['Unboxing', 'Hauls', 'Reviews', 'Lifestyle'],
    'Other': ['Lifestyle', 'Comedy', 'DIY', 'Art']
};

// --- Helper Functions ---

const calculateMatchScore = (inf: Influencer, formData: FormData, strategyPlatform: string, strategyGoal: string) => {
    let score = 40; // Base score
    const details = [];

    // 1. Brand Fit (30pts) - Niche/Industry Alignment
    const isIndustryMatch = inf.niche.some(n => 
        formData.industry.toLowerCase().includes(n.toLowerCase()) || 
        n.toLowerCase().includes(formData.industry.toLowerCase()) ||
        (formData.industry === 'Technology' && n === 'Tech') // common alias
    );
    
    if (isIndustryMatch) {
        score += 30;
        details.push("Brand Fit: Industry Match");
    }

    // 2. Locality (20pts) - Geographic Relevance
    const userLocParts = formData.location.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
    const isLocationMatch = userLocParts.some(part => inf.location.toLowerCase().includes(part));
    
    if (isLocationMatch) {
        score += 20;
        details.push("Locality: Proximity Match");
    }

    // 3. Platform (15pts) - Strategy Alignment
    // Check if platform matches strategy
    if (inf.platform.toLowerCase() === strategyPlatform.toLowerCase()) {
        score += 15;
        details.push("Platform: Strategy Aligned");
    }

    // 4. Intent (15pts) - Goal/Tier Optimization
    const tier = getInfluencerTier(inf.followers);
    let isTierMatch = false;
    let goalLabel = "";
    
    if (strategyGoal === GoalType.AWARENESS || strategyGoal === GoalType.LAUNCH) {
        if (tier === 'Macro' || tier === 'Mega') { isTierMatch = true; goalLabel = "Mass Reach"; }
    } else if (strategyGoal === GoalType.SALES || strategyGoal === GoalType.UGC) {
        if (tier === 'Nano' || tier === 'Micro') { isTierMatch = true; goalLabel = "High Conversion"; }
    } else {
        if (tier === 'Micro' || tier === 'Macro') { isTierMatch = true; goalLabel = "Community Engagement"; }
    }

    if (isTierMatch) {
        score += 15;
        details.push(`Intent: ${goalLabel}`);
    }

    // Add deterministic jitter based on ID so scores aren't identical
    const variance = (parseInt(inf.id) * 7) % 5; 
    score += variance;

    return {
        score: Math.min(99, score),
        details
    };
};

const getTierLabelFromRange = (range: string): string => {
    if (!range) return 'Creator';
    const lowerRange = range.toLowerCase();
    if (lowerRange.includes('k') && !lowerRange.includes('m')) {
        if (range.includes('100k') || range.includes('200k')) return 'Macro-Influencer';
        return 'Micro-Influencer';
    }
    if (lowerRange.includes('m')) return 'Mega-Influencer';
    return 'Nano-Influencer';
};

// --- Helper Components for UI ---

const PlatformIcon = ({ name, className = "w-6 h-6" }: { name: string, className?: string }) => {
    const n = (name || '').toLowerCase();
    if (n.includes('instagram')) return <Icons.Instagram className={className} />;
    if (n.includes('youtube')) return <Icons.Youtube className={className} />;
    if (n.includes('tiktok')) return <Icons.TikTok className={className} />;
    return <Icons.Globe className={className} />;
};

const GoalIcon = ({ goalId, className }: { goalId: string, className?: string }) => {
    const props = className ? { className } : {};
    switch (goalId) {
        case GoalType.AWARENESS: return <Icons.Megaphone {...props} />;
        case GoalType.LAUNCH: return <Icons.Rocket {...props} />;
        case GoalType.SALES: return <Icons.DollarSign {...props} />;
        case GoalType.UGC: return <Icons.Camera {...props} />;
        case GoalType.EVENT: return <Icons.Calendar {...props} />;
        default: return <Icons.Target {...props} />;
    }
};

const InfluencerCard = ({ 
    creator, 
    isFavorite, 
    onToggleFavorite,
    showMatchScore = true 
}: { 
    creator: Influencer, 
    isFavorite: boolean, 
    onToggleFavorite: (id: string) => void,
    showMatchScore?: boolean
}) => {
    const tier = getInfluencerTier(creator.followers);
    
    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-green-50 text-green-700 border-green-200";
        if (score >= 75) return "bg-blue-50 text-blue-700 border-blue-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full z-0">
            <div className="relative h-64 w-full overflow-hidden shrink-0">
                <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(creator.id); }}
                        className={`p-2 rounded-full backdrop-blur-md shadow-sm transition-all ${isFavorite ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Icons.Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {showMatchScore && (
                        <div className="group/score relative">
                            <div className={`backdrop-blur-md px-3 py-1.5 rounded-full border flex items-center gap-1 shadow-sm animate-in zoom-in cursor-help ${getScoreColor(creator.matchScore)}`}>
                                <Icons.Sparkles className="w-3 h-3 fill-current" />
                                <span className="text-xs font-bold">{creator.matchScore}%</span>
                            </div>
                            <div className="hidden lg:block absolute top-full right-0 mt-2 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover/score:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl transform translate-y-2 group-hover/score:translate-y-0 duration-200">
                                <div className="font-bold mb-2 border-b border-gray-700 pb-2 flex items-center justify-between">
                                    <span>Match Breakdown</span>
                                    <span className="text-gray-400">{creator.matchScore}/100</span>
                                </div>
                                {creator.matchDetails && creator.matchDetails.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {creator.matchDetails.map((d, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <Icons.Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" /> 
                                                <span className="leading-tight">{d}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-500 italic">General recommendation based on platform data.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {tier} Influencer
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-white/20 backdrop-blur-md rounded-full">
                            <PlatformIcon name={creator.platform} className="w-3 h-3 text-white fill-current" />
                        </div>
                        <h3 className="text-lg font-bold leading-tight">{creator.handle}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                        <span className="font-medium">{creator.platform}</span>
                        <span>•</span>
                        <span>{creator.location}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <div className="grid grid-cols-3 gap-2 mb-6 border-b border-gray-100 pb-6">
                    <div>
                        <div className="text-lg font-bold text-gray-900">{creator.followers}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Followers</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900">{creator.er}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Engage</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900">{creator.likes}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg Likes</div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4 h-12 overflow-hidden content-start">
                     {creator.niche.map((n, i) => (
                         <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md">{n}</span>
                     ))}
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center mb-1 border border-gray-100">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Estimated Value</div>
                        <div className="text-xl font-bold text-gray-900">{creator.value}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-2.5 px-4 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            Profile
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(creator.id); }}
                            className={`py-2.5 px-4 rounded-full text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                isFavorite 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                : 'bg-black text-white hover:bg-gray-800 shadow-gray-300'
                            }`}
                        >
                            {isFavorite ? (
                                <>
                                    <Icons.Check className="w-4 h-4" /> Saved
                                </>
                            ) : (
                                'Save to List'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAYWALL & FULL LIST MODALS ---

const UpgradeModal = ({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: () => Promise<void> }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpgradeClick = async () => {
        setIsProcessing(true);
        await onUpgrade();
        setIsProcessing(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors z-10">
                    <Icons.X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="bg-black text-white p-8 flex flex-col justify-between relative overflow-hidden">
                         <div className="relative z-10">
                             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                                 <Icons.Sparkles className="w-6 h-6 text-white" />
                             </div>
                             <h2 className="text-3xl font-bold mb-2">Unlock Strategy</h2>
                             <p className="text-gray-300 text-sm mb-8">Get full access to vetted creators tailored to your specific brand goals.</p>
                             
                             <ul className="space-y-3">
                                 <li className="flex items-center gap-3 text-sm">
                                     <Icons.Check className="w-4 h-4 text-green-400" /> 750+ Vetted Creators
                                 </li>
                                 <li className="flex items-center gap-3 text-sm">
                                     <Icons.Check className="w-4 h-4 text-green-400" /> AI Match Reasoning
                                 </li>
                                 <li className="flex items-center gap-3 text-sm">
                                     <Icons.Check className="w-4 h-4 text-green-400" /> Direct Contact Info
                                 </li>
                             </ul>
                         </div>
                         {/* Decorative blob */}
                         <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600 rounded-full filter blur-[60px] opacity-50"></div>
                    </div>
                    
                    <div className="p-8 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <h3 className="text-gray-500 font-semibold uppercase tracking-widest text-xs mb-2">Pro Plan</h3>
                            <div className="text-5xl font-bold text-gray-900 mb-1">$49</div>
                            <div className="text-gray-500 text-sm">per month</div>
                        </div>

                        <button 
                            onClick={handleUpgradeClick}
                            disabled={isProcessing}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <Icons.Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Icons.CreditCard className="w-5 h-5" />
                                    Upgrade Now
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">Secure payment powered by Stripe</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AllMatchesModal = ({ 
    onClose, 
    creators, 
    favorites, 
    toggleFavorite 
}: { 
    onClose: () => void, 
    creators: Influencer[], 
    favorites: Set<string>, 
    toggleFavorite: (id: string) => void 
}) => {
    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col animate-in">
             <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 safe-top">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                         <Icons.Sparkles className="w-5 h-5 fill-current" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">Strategic Matches</h2>
                        <p className="text-xs text-gray-500">Highly compatible creators for your goal</p>
                     </div>
                 </div>
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                     <Icons.X className="w-6 h-6 text-gray-500" />
                 </button>
             </div>

             <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8 pb-24">
                 <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {creators.map(creator => (
                        <InfluencerCard 
                            key={creator.id}
                            creator={creator}
                            isFavorite={favorites.has(creator.id)}
                            onToggleFavorite={toggleFavorite}
                            showMatchScore={true}
                        />
                    ))}
                 </div>
             </div>
        </div>
    );
};


// --- VIEWS ---

const StrategyView = ({ 
    data, 
    formData, 
    favorites, 
    toggleFavorite,
    onUpdateBrand,
    onRegenerateStrategy,
    isPremium,
    onUpgrade
}: { 
    data: DashboardData, 
    formData: FormData, 
    favorites: Set<string>, 
    toggleFavorite: (id: string) => void,
    onUpdateBrand: (brand: BrandProfile) => void,
    onRegenerateStrategy: RegenerateStrategyHandler,
    isPremium: boolean,
    onUpgrade: () => Promise<void>
}) => {
    const { brand, strategy } = data;
    
    // Brand Edit Mode
    const [isEditingBrand, setIsEditingBrand] = useState(false);
    const [editBrand, setEditBrand] = useState<BrandProfile>(brand);

    // Goal Edit Mode
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoalDesc, setNewGoalDesc] = useState(formData.goalDescription);

    // Blueprint Tab State
    const [blueprintTab, setBlueprintTab] = useState<'strategy' | 'rationale' | 'content' | 'persona'>('strategy');

    // Modals
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showAllMatches, setShowAllMatches] = useState(false);

    useEffect(() => {
        setEditBrand(brand);
    }, [brand]);

    useEffect(() => {
        setNewGoalDesc(formData.goalDescription);
    }, [formData.goalDescription]);

    const handleSaveBrand = () => {
        onUpdateBrand(editBrand);
        setIsEditingBrand(false);
    };

    const handleRegenerate = async () => {
        if (!newGoalDesc.trim()) return;
        await onRegenerateStrategy(newGoalDesc);
        setIsEditingGoal(false);
    };

    // Calculate ALL Matches for this strategy (not just top 3)
    const strategyMatches = useMemo(() => {
        const all = getAllInfluencers();
        // STRICT filtering based on platform
        const platformMatches = all.filter(inf => 
            inf.platform.toLowerCase() === strategy.platformName.toLowerCase()
        );
        const scored = platformMatches.map(inf => {
            const { score, details } = calculateMatchScore(inf, formData, strategy.platformName, formData.goal);
            return { ...inf, matchScore: score, matchDetails: details };
        });
        return scored.sort((a, b) => b.matchScore - a.matchScore);
    }, [strategy.platformName, formData, brand]);

    // Display logic: Show top 3, rest behind paywall/modal
    const displayCreators = strategyMatches.slice(0, 3);

    const handleShowMore = () => {
        if (isPremium) {
            setShowAllMatches(true);
        } else {
            setShowUpgradeModal(true);
        }
    };

    // Safe Helper for Content Ideas (Handling migration from string[] to object[])
    const normalizedContentIdeas: ContentIdea[] = useMemo(() => {
        if (!strategy.contentIdeas) return [];
        return strategy.contentIdeas.map(idea => {
            if (typeof idea === 'string') {
                return { title: idea, description: "Engaging content tailored to your audience." };
            }
            return idea;
        });
    }, [strategy.contentIdeas]);

    return (
        <>
        {/* Responsive Layout: Flex col on mobile (auto height), Grid on desktop (full height) */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-full lg:overflow-hidden pb-4">
            
            {/* LEFT COLUMN: Brand Identity */}
            <div className="order-2 lg:order-1 lg:col-span-4 bg-[#202022] text-gray-200 rounded-[32px] p-6 lg:p-8 border border-white/5 shadow-2xl flex flex-col overflow-y-visible lg:overflow-y-auto custom-scrollbar relative shrink-0">
              <div className="absolute top-6 right-6 z-10">
                 {!isEditingBrand ? (
                    <button 
                        onClick={() => setIsEditingBrand(true)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Edit Brand Profile"
                    >
                        <Icons.SlidersHorizontal className="w-5 h-5" />
                    </button>
                 ) : (
                    <div className="flex gap-2">
                         <button 
                            onClick={() => { setIsEditingBrand(false); setEditBrand(brand); }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Cancel"
                        >
                            <Icons.PanelLeftClose className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleSaveBrand}
                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-full transition-colors"
                            title="Save"
                        >
                            <Icons.Check className="w-5 h-5" />
                        </button>
                    </div>
                 )}
              </div>

              <div className="flex flex-col items-center text-center mb-8 mt-4">
                <div className="mb-6 w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-[24px] flex items-center justify-center text-black text-3xl lg:text-4xl font-bold shadow-xl transform hover:scale-105 transition-transform duration-500">
                  {formData.businessName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter mb-2 text-gray-100">{formData.businessName}.</h1>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{formData.industry}</p>
              </div>

              <div className="space-y-8 flex-grow px-2">
                {/* Story */}
                <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-200 shadow-md border border-white/5">
                      <Icons.MessageSquare className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-200">Brand Story</h2>
                  </div>
                  {isEditingBrand ? (
                    <textarea 
                        value={editBrand.story}
                        onChange={(e) => setEditBrand({...editBrand,story: e.target.value})}
                        className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white outline-none resize-none text-gray-200"
                        rows={4}
                    />
                  ) : (
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-11 border-l-2 border-white/5">
                        "{brand.story}"
                    </p>
                  )}
                </div>

                {/* Mission */}
                <div className="animate-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-200 shadow-md border border-white/5">
                      <Icons.Target className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-200">Mission</h2>
                  </div>
                  {isEditingBrand ? (
                     <textarea 
                        value={editBrand.mission}
                        onChange={(e) => setEditBrand({...editBrand, mission: e.target.value})}
                        className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white outline-none resize-none text-gray-200"
                        rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-400 leading-relaxed font-medium pl-11 border-l-2 border-white/5">
                        {brand.mission}
                    </p>
                  )}
                </div>

                {/* Values */}
                <div className="animate-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-200 shadow-md border border-white/5">
                       <Icons.Check className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-200">Core Values</h2>
                  </div>
                  {isEditingBrand ? (
                    <input 
                        type="text"
                        value={editBrand.values.join(', ')}
                        onChange={(e) => setEditBrand({...editBrand, values: e.target.value.split(',').map(v => v.trim())})}
                        className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white outline-none text-gray-200"
                        placeholder="Value 1, Value 2, Value 3"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 pl-11 border-l-2 border-white/5 py-2">
                        {brand.values.map((val, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/5 rounded-full text-xs font-bold text-gray-300 border border-white/5">
                            {val}
                        </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Tone */}
                <div className="animate-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-200 shadow-md border border-white/5">
                       <Icons.Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-200">Tone of Voice</h2>
                  </div>
                  {isEditingBrand ? (
                      <input 
                        type="text"
                        value={editBrand.tone}
                        onChange={(e) => setEditBrand({...editBrand, tone: e.target.value})}
                        className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-white outline-none text-gray-200"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 leading-relaxed pl-11 border-l-2 border-white/5">
                        {brand.tone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Strategy & Creators */}
            <div className="order-1 lg:order-2 col-span-1 lg:col-span-8 flex flex-col gap-6 lg:h-full overflow-visible lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar pb-12 lg:pb-12">
              
              {/* 1. COMPACT GOAL & INSIGHT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 shrink-0">
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">North Star</div>
                    <div className="text-lg font-bold leading-tight text-gray-900 capitalize">
                      {formData.goal}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                    <GoalIcon goalId={formData.goal as string} className="w-5 h-5" />
                  </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center relative hover:shadow-md transition-shadow group">
                  {!isEditingGoal && (
                      <button 
                          onClick={() => setIsEditingGoal(true)}
                          className="absolute top-4 right-4 p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-black rounded-full transition-colors"
                          title="Change Goal & Regenerate Strategy"
                      >
                          <Icons.SlidersHorizontal className="w-4 h-4" />
                      </button>
                  )}

                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Icons.Zap className="w-3 h-3" /> 
                    {isEditingGoal ? 'Redefine Strategy' : 'Strategic Insight'}
                  </div>

                  {isEditingGoal ? (
                      <div className="animate-in">
                          <textarea 
                              value={newGoalDesc}
                              onChange={(e) => setNewGoalDesc(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-black outline-none resize-none mb-3"
                              rows={2}
                              placeholder="Describe your new goal..."
                              autoFocus
                          />
                          <div className="flex gap-3">
                              <button 
                                  onClick={() => { setIsEditingGoal(false); setNewGoalDesc(formData.goalDescription); }}
                                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={handleRegenerate}
                                  className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
                              >
                                  <Icons.Sparkles className="w-3 h-3" />
                                  Regenerate Strategy
                              </button>
                          </div>
                      </div>
                  ) : (
                      <>
                        {strategy.northStar && (
                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                            "{strategy.northStar}"
                            </h3>
                        )}
                      </>
                  )}
                </div>
              </div>

              {/* 2. STRATEGIC BLUEPRINT - SINGLE CARD WITH TABS */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm shrink-0 flex flex-col min-h-[320px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                              <Icons.Sparkles className="w-5 h-5" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900">Strategic Blueprint</h2>
                      </div>
                      
                      {/* TABS */}
                      <div className="flex bg-gray-50 p-1 rounded-xl overflow-x-auto">
                          {(['strategy', 'rationale', 'content', 'persona'] as const).map(tab => (
                              <button
                                  key={tab}
                                  onClick={() => setBlueprintTab(tab)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                      blueprintTab === tab 
                                      ? 'bg-white text-black shadow-sm' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                              >
                                  {tab}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* TAB CONTENT AREA */}
                  <div className="flex-grow flex flex-col justify-center">
                      {blueprintTab === 'strategy' && (
                          <div className="animate-in flex flex-col gap-8">
                              <div className="flex flex-col gap-6"> 
                                  {/* Platform */}
                                  <div className="flex items-center gap-4 lg:gap-6">
                                      <div className="shrink-0">
                                          <PlatformIcon name={strategy.platformName} className="w-14 h-14 lg:w-16 lg:h-16" />
                                      </div>
                                      <div>
                                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Platform</div>
                                          <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{strategy.platformName}</div>
                                          <div className="text-sm text-gray-500 font-medium">Recommended for {formData.industry}</div>
                                      </div>
                                  </div>

                                  {/* Creator Scope - Own Row */}
                                  <div>
                                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Creator Scope</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                                              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Target Range</div>
                                              <div className="text-base font-bold text-gray-900">{strategy.targetRange}</div>
                                          </div>
                                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                                              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Frequency</div>
                                              <div className="text-base font-bold text-gray-900">{strategy.frequency}</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {blueprintTab === 'rationale' && (
                          <div className="animate-in flex flex-col gap-4 py-2">
                              {/* Strategy Rationale (Why Platform) */}
                              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                  <div className="flex items-center gap-2 mb-2">
                                      <Icons.Zap className="w-3 h-3 text-blue-600" />
                                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Why {strategy.platformName}?</span>
                                  </div>
                                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                      {strategy.reasoning}
                                  </p>
                              </div>

                              {/* Goal Rationale (Why Goal) - moved from top box */}
                              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                   <div className="flex items-center gap-2 mb-2">
                                      <Icons.Target className="w-3 h-3 text-gray-400" />
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strategic Objective</span>
                                  </div>
                                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                      {strategy.goalReasoning}
                                  </p>
                              </div>
                          </div>
                      )}

                      {blueprintTab === 'content' && (
                          <div className="animate-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                  {normalizedContentIdeas.map((idea, idx) => (
                                      <div key={idx} className="relative pl-5 border-l-2 border-gray-100 hover:border-black transition-colors group py-1">
                                          <div className="text-[10px] font-bold text-gray-400 mb-1 group-hover:text-black transition-colors">CONCEPT 0{idx + 1}</div>
                                          <h3 className="text-sm font-bold text-gray-900 mb-2">{idea.title}</h3>
                                          <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{idea.description}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {blueprintTab === 'persona' && (
                          <div className="animate-in flex flex-col items-center justify-center py-6 text-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-500">
                                  <Icons.Users className="w-5 h-5" />
                              </div>
                              <div className="max-w-lg">
                                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ideal Creator Profile</div>
                                  <p className="text-base font-medium text-gray-800 leading-relaxed italic">
                                      "{strategy.creatorPersona || "Look for authentic storytellers who prioritize community engagement over vanity metrics."}"
                                  </p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* 3. INFLUENCER CARDS */}
              <div className="shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Recommended Matches</h2>
                  
                  <button 
                      onClick={handleShowMore}
                      className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wide hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-100"
                  >
                      {isPremium ? 'View Full List' : 'Show More Matches'}
                      {isPremium ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.Lock className="w-3 h-3" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayCreators.map((creator) => (
                    <InfluencerCard 
                        key={creator.id} 
                        creator={creator} 
                        isFavorite={favorites.has(creator.id)}
                        onToggleFavorite={toggleFavorite}
                        showMatchScore={true}
                    />
                  ))}
                </div>
              </div>
            </div>
        </div>

        {/* MODALS */}
        {showUpgradeModal && (
            <UpgradeModal 
                onClose={() => setShowUpgradeModal(false)} 
                onUpgrade={onUpgrade} 
            />
        )}

        {showAllMatches && (
            <AllMatchesModal 
                onClose={() => setShowAllMatches(false)}
                creators={strategyMatches}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
            />
        )}
        </>
    );
};

const ExploreView = ({ 
    favorites, 
    toggleFavorite, 
    data,
    formData 
}: { 
    favorites: Set<string>, 
    toggleFavorite: (id: string) => void,
    data: DashboardData,
    formData: FormData
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('All');
    const [filterTier, setFilterTier] = useState('All'); // Nano, Micro, Macro, Mega
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterNiche, setFilterNiche] = useState('');
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    // Memoize the base list calculation to avoid re-randomizing on re-renders
    const scoredInfluencers = useMemo(() => {
        const rawList = getAllInfluencers();
        return rawList.map(inf => {
             const { score, details } = calculateMatchScore(inf, formData, data.strategy.platformName, formData.goal);
             return { ...inf, matchScore: score, matchDetails: details };
        });
    }, [formData, data.strategy]);

    const allInfluencers = scoredInfluencers.sort((a, b) => b.matchScore - a.matchScore);
    
    const uniqueLocations = Array.from(new Set(allInfluencers.map(i => {
        const parts = i.location.split(',');
        return parts[parts.length - 1].trim();
    }))).sort();

    const allNiches = Array.from(new Set(allInfluencers.flatMap(i => i.niche))).sort();
    const suggestedNiches = INDUSTRY_NICHES[formData.industry] || INDUSTRY_NICHES['Other'];

    const filtered = allInfluencers.filter(inf => {
        const matchesSearch = inf.name.toLowerCase().includes(searchTerm.toLowerCase()) || inf.handle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = filterPlatform === 'All' || inf.platform === filterPlatform;
        const matchesTier = filterTier === 'All' || getInfluencerTier(inf.followers) === filterTier;
        const matchesLocation = filterLocation === 'All' || inf.location.includes(filterLocation);
        const matchesNiche = !filterNiche || inf.niche.some(n => n.toLowerCase().includes(filterNiche.toLowerCase()));
        
        return matchesSearch && matchesPlatform && matchesTier && matchesLocation && matchesNiche;
    });

    // Filter Component (Reusable for Sidebar and Mobile Modal)
    const FilterContent = () => (
        <div className="space-y-5">
             {/* Search */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Search</label>
                <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Name or handle..." 
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Platform */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Platform</label>
                <select 
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none appearance-none"
                >
                    <option value="All">All Platforms</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                </select>
            </div>

            {/* Niche Category - NEW */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Niche Category</label>
                <select 
                    value={filterNiche}
                    onChange={(e) => setFilterNiche(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none appearance-none"
                >
                    <option value="">All Niches</option>
                    {allNiches.map(niche => (
                        <option key={niche} value={niche}>{niche}</option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Location</label>
                <select 
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none appearance-none"
                >
                    <option value="All">Anywhere</option>
                    {uniqueLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>

             {/* Tier */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Influencer Tier</label>
                <select 
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none appearance-none"
                >
                    <option value="All">All Tiers</option>
                    <option value="Nano">Nano (1k - 10k)</option>
                    <option value="Micro">Micro (10k - 100k)</option>
                    <option value="Macro">Macro (100k - 1M)</option>
                    <option value="Mega">Mega (1M+)</option>
                </select>
            </div>
        </div>
    );

    return (
        <div className="h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar pb-12">
            
            {/* Strategy Summary Header - Updated to White/Clean Aesthetic */}
            <div className="bg-white rounded-[24px] p-6 lg:p-8 mb-8 border border-gray-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                            <Icons.Sparkles className="w-3 h-3 animate-pulse fill-blue-600" />
                            Active Strategy
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-900">
                             Target {data.strategy.platformName} creators for {formData.goal}
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
                            Based on your goal to <span className="text-gray-900 font-medium">{data.strategy.northStar}</span>, we recommend creators with <span className="text-gray-900 font-medium">{data.strategy.targetRange}</span> followers.
                        </p>
                    </div>
                    <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 shrink-0">
                        <div className="text-center">
                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Platform</div>
                             <div className="font-bold text-lg flex items-center gap-2 justify-center text-gray-900">
                                <PlatformIcon name={data.strategy.platformName} className="w-5 h-5 text-gray-900 fill-current" />
                                {data.strategy.platformName}
                             </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                         <div className="text-center">
                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Focus</div>
                             <div className="font-bold text-lg text-gray-900">{formData.industry}</div>
                        </div>
                    </div>
                </div>
                
                {/* Subtle blue gradient blob in background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full filter blur-[80px] opacity-50 translate-x-1/2 -translate-y-1/2 group-hover:opacity-70 transition-opacity duration-700"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Desktop Sidebar Filters */}
                <div className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-0 z-10">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Filter className="w-4 h-4" /> Filters
                        </h3>
                        <FilterContent />
                    </div>

                    {/* Suggested Niches Box */}
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                            <Icons.TrendingUp className="w-4 h-4" /> Smart Suggestions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {suggestedNiches.map(niche => (
                                <button
                                    key={niche}
                                    onClick={() => setFilterNiche(filterNiche === niche ? '' : niche)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                                        filterNiche === niche
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                                    }`}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                        {filterNiche && (
                            <button 
                                onClick={() => setFilterNiche('')}
                                className="mt-3 text-xs text-blue-600 hover:underline font-medium"
                            >
                                Clear niche filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Filter Button */}
                <button 
                    onClick={() => setShowFiltersMobile(true)}
                    className="lg:hidden w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 shadow-sm"
                >
                    <Icons.Filter className="w-4 h-4" /> 
                    Filters ({[filterPlatform, filterTier, filterLocation, filterNiche].filter(f => f && f !== 'All').length + (searchTerm ? 1 : 0)})
                </button>

                {/* Results Grid */}
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-gray-900">
                            {filtered.length} Creators Found
                        </h3>
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                            Sort by: <span className="font-bold text-gray-900 cursor-pointer">Relevance</span>
                        </div>
                    </div>
                    
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filtered.map((creator) => (
                                <InfluencerCard 
                                    key={creator.id} 
                                    creator={creator} 
                                    isFavorite={favorites.has(creator.id)}
                                    onToggleFavorite={toggleFavorite}
                                    showMatchScore={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No creators found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your filters to see more results.</p>
                            <button 
                                onClick={() => {
                                    setFilterPlatform('All');
                                    setFilterLocation('All');
                                    setFilterTier('All');
                                    setSearchTerm('');
                                    setFilterNiche('');
                                }}
                                className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {showFiltersMobile && (
                <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm lg:hidden animate-in">
                    <div className="fixed inset-x-0 bottom-0 top-10 bg-white rounded-t-[32px] shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                            <button onClick={() => setShowFiltersMobile(false)} className="p-2 bg-gray-50 rounded-full">
                                <Icons.X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                             <FilterContent />
                             <div className="mt-8 pt-6 border-t border-gray-100">
                                 <div className="text-xs font-semibold text-gray-500 mb-3">Smart Suggestions</div>
                                 <div className="flex flex-wrap gap-2">
                                    {suggestedNiches.map(niche => (
                                        <button
                                            key={niche}
                                            onClick={() => setFilterNiche(filterNiche === niche ? '' : niche)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                                                filterNiche === niche
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                                            }`}
                                        >
                                            {niche}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button 
                                onClick={() => setShowFiltersMobile(false)}
                                className="w-full py-3.5 bg-black text-white rounded-2xl font-bold shadow-lg"
                            >
                                Show {filtered.length} Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CommunityView = () => {
    const posts = [
        {
            id: 1,
            author: "Sarah Jenkins",
            handle: "@sarah.daily",
            avatar: "https://picsum.photos/seed/sarah/200/200",
            content: "Just wrapped up an amazing campaign with TechDeckGo! The ROI on this UGC strategy was insane. 🚀 #Marketing #InfluencerLife",
            image: "https://picsum.photos/seed/techdeck/800/600",
            likes: 1240,
            comments: 45,
            time: "2h ago"
        },
        {
            id: 2,
            author: "Alex Rivera",
            handle: "@alex.tech",
            avatar: "https://picsum.photos/seed/alex/200/200",
            content: "Top 3 tips for brands reaching out to tech creators:\n1. Be specific about deliverables\n2. Understand our audience\n3. Creative freedom is key! 🔑",
            image: null,
            likes: 856,
            comments: 120,
            time: "5h ago"
        },
        {
            id: 3,
            author: "Lumina Team",
            handle: "@lumina.official",
            avatar: "https://ui-avatars.com/api/?name=Lumina&background=000&color=fff",
            content: "Spotlight on: Vertical Video Trends 2025. We're seeing a massive shift towards 'lo-fi' authentic content over highly produced ads. What are you seeing?",
            image: "https://picsum.photos/seed/trends/800/400",
            likes: 2300,
            comments: 89,
            time: "1d ago"
        }
    ];

    return (
        <div className="h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar pb-12 max-w-3xl mx-auto">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
                    <Icons.TrendingUp className="w-3 h-3" /> Community Pulse
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Creator Highlights</h1>
            </div>

            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                <div>
                                    <div className="font-bold text-gray-900">{post.author}</div>
                                    <div className="text-xs text-gray-500">{post.handle} • {post.time}</div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <Icons.LogOut className="w-4 h-4 rotate-90" />
                            </button>
                        </div>
                        
                        <p className="text-gray-800 mb-4 whitespace-pre-line leading-relaxed">{post.content}</p>
                        
                        {post.image && (
                            <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100">
                                <img src={post.image} alt="Post content" className="w-full h-auto" />
                            </div>
                        )}

                        <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group">
                                <Icons.Heart className="w-5 h-5 group-hover:fill-current" />
                                <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                                <Icons.MessageSquare className="w-5 h-5" />
                                <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors ml-auto">
                                <Icons.Bookmark className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FavoritesView = ({ favorites, toggleFavorite }: { favorites: Set<string>, toggleFavorite: (id: string) => void }) => {
    const allInfluencers = getAllInfluencers();
    const favList = allInfluencers.filter(inf => favorites.has(inf.id));

    if (favList.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Icons.Heart className="w-10 h-10 text-gray-300 fill-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    Save creators to your shortlist to easily access them later for your campaigns.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Shortlist</h1>
                <p className="text-gray-500">{favList.length} saved creators ready for outreach.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favList.map((creator) => (
                    <InfluencerCard 
                        key={creator.id} 
                        creator={creator} 
                        isFavorite={true}
                        onToggleFavorite={toggleFavorite}
                        showMatchScore={false}
                    />
                ))}
            </div>
        </div>
    );
};

const SettingsView = ({ 
    formData, 
    isPremium, 
    onUpgrade 
}: { 
    formData: FormData, 
    isPremium: boolean, 
    onUpgrade: () => Promise<void> 
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpgrade = async () => {
        setIsProcessing(true);
        await onUpgrade();
        setIsProcessing(false);
    };

    return (
        <div className="max-w-2xl mx-auto pb-12 animate-in">
             <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
             
             {/* PROFILE GROUP */}
             <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden mb-6">
                 <div className="p-6 border-b border-gray-100 flex items-center gap-6">
                     <div className="relative group cursor-pointer">
                         <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md group-hover:opacity-90 transition-opacity">
                             {formData.businessName.charAt(0).toUpperCase()}
                         </div>
                         <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Icons.Camera className="w-6 h-6 text-white" />
                         </div>
                     </div>
                     <div>
                         <div className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">Change Company Logo</div>
                         <div className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</div>
                     </div>
                 </div>
                 
                 <div className="p-6 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                         <label className="text-sm font-semibold text-gray-700">Company Name</label>
                         <div className="md:col-span-2">
                             <input 
                                type="text" 
                                defaultValue={formData.businessName}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                             />
                         </div>
                     </div>
                     <div className="w-full h-px bg-gray-50"></div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                         <label className="text-sm font-semibold text-gray-700">Email Address</label>
                         <div className="md:col-span-2">
                             <input 
                                type="email" 
                                defaultValue="demo@lumina.ai" 
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                             />
                         </div>
                     </div>
                 </div>
             </div>

             {/* SUBSCRIPTION GROUP */}
             <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden mb-6">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="text-lg font-bold text-gray-900">Subscription</h3>
                     <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPremium ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                         {isPremium ? 'Pro Plan' : 'Free Plan'}
                     </div>
                 </div>
                 <div className="p-6">
                     {isPremium ? (
                         <div className="flex items-center justify-between">
                             <div>
                                 <div className="text-sm font-medium text-gray-900">Your plan renews on Oct 24, 2025</div>
                                 <div className="text-xs text-gray-500 mt-1">Visa ending in 4242</div>
                             </div>
                             <button className="text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                 Manage Billing
                             </button>
                         </div>
                     ) : (
                         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                             <div className="text-sm text-gray-600 max-w-xs">
                                 Unlock unlimited AI strategies, 750+ influencer database access, and advanced analytics.
                             </div>
                             <button 
                                onClick={handleUpgrade}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                             >
                                 {isProcessing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Pro'}
                             </button>
                         </div>
                     )}
                 </div>
             </div>

             {/* PREFERENCES GROUP */}
             <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
                 <div className="p-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between border-b border-gray-100">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                             <Icons.Bell className="w-4 h-4" />
                         </div>
                         <span className="text-sm font-semibold text-gray-900">Notifications</span>
                     </div>
                     <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
                 </div>
                 <div className="p-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                             <Icons.Moon className="w-4 h-4" />
                         </div>
                         <span className="text-sm font-semibold text-gray-900">Appearance</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400">Light</span>
                         <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const Dashboard: React.FC<Props> = ({ 
    data, 
    formData, 
    onLogout, 
    onUpdateBrand, 
    onRegenerateStrategy,
    isPremium,
    onUpgrade
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('strategy');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
        const saved = localStorage.getItem('lumina_favorites');
        if (saved) {
            setFavorites(new Set(JSON.parse(saved)));
        }
    } catch (e) {
        console.error("Failed to load favorites", e);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('lumina_favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {
        console.error("Failed to save favorites", e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
            activeTab === id 
            ? 'bg-black text-white shadow-lg' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
        <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            {label}
        </span>
        {isSidebarCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {label}
            </div>
        )}
    </button>
  );

  const MobileNavBtn = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === id ? 'text-black' : 'text-gray-400'}`}
      >
          <div className={`p-1 rounded-lg transition-all ${activeTab === id ? 'bg-gray-100' : ''}`}>
            <Icon className={`w-6 h-6 ${activeTab === id ? 'fill-current' : 'fill-none'}`} />
          </div>
          <span className="text-[10px] font-medium">{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">
        
        {/* DESKTOP SIDEBAR (Hidden on mobile) */}
        <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-20 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span className={`font-bold text-lg tracking-tight transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                        Lumina
                    </span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 transition-opacity ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    Menu
                </div>
                <SidebarItem id="strategy" icon={Icons.LayoutGrid} label="Strategy" />
                <SidebarItem id="explore" icon={Icons.Compass} label="Explore Creators" />
                <SidebarItem id="community" icon={Icons.Users} label="Community" />
                <SidebarItem id="favorites" icon={Icons.Heart} label="Shortlist" />
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
                {/* User Status Badge & Settings Entry */}
                <div className="flex items-center gap-2">
                    <div className={`flex-grow p-2 rounded-xl flex items-center gap-3 bg-gray-50 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPremium ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'}`}>
                            {isPremium ? <Icons.Star className="w-4 h-4 fill-current" /> : <Icons.Users className="w-4 h-4" />}
                         </div>
                         {!isSidebarCollapsed && (
                             <div className="flex flex-col overflow-hidden">
                                 <span className="text-xs font-bold text-gray-900 whitespace-nowrap truncate">{isPremium ? 'Pro Plan' : 'Free Plan'}</span>
                                 {!isPremium && <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={onUpgrade}>Upgrade</span>}
                             </div>
                         )}
                    </div>
                    {/* Settings Button */}
                    {!isSidebarCollapsed && (
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-500 hover:text-gray-900 ${activeTab === 'settings' ? 'bg-black text-white border-black hover:bg-gray-800 hover:text-white' : ''}`}
                            title="Settings"
                        >
                            <Icons.Settings className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="w-full flex items-center gap-3 p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors group"
                >
                    {isSidebarCollapsed ? <Icons.PanelLeftOpen className="w-5 h-5" /> : <Icons.PanelLeftClose className="w-5 h-5" />}
                    <span className={`font-medium whitespace-nowrap transition-opacity ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        Collapse
                    </span>
                </button>
                
                 <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
                >
                    <Icons.LogOut className="w-5 h-5" />
                    <span className={`font-medium whitespace-nowrap transition-opacity ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        Sign Out
                    </span>
                </button>
            </div>
        </div>

        {/* MOBILE BOTTOM NAV (Hidden on desktop) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-3 pb-safe flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
             <MobileNavBtn id="strategy" icon={Icons.LayoutGrid} label="Strategy" />
             <MobileNavBtn id="explore" icon={Icons.Compass} label="Explore" />
             <MobileNavBtn id="community" icon={Icons.Users} label="Community" />
             <MobileNavBtn id="favorites" icon={Icons.Heart} label="Shortlist" />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#f5f5f7]">
            
            {/* Header (Mobile only) */}
            <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30 lg:hidden">
                <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">
                        {activeTab === 'strategy' && 'Brand Strategy'}
                        {activeTab === 'explore' && 'Discover'}
                        {activeTab === 'community' && 'Community'}
                        {activeTab === 'favorites' && 'Shortlist'}
                        {activeTab === 'settings' && 'Settings'}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onLogout} className="text-gray-500 hover:text-red-500">
                        <Icons.LogOut className="w-5 h-5" />
                    </button>
                    {/* Profile/Settings Link on Mobile */}
                     <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${isPremium ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`} 
                        onClick={() => setActiveTab('settings')}
                     >
                        {isPremium ? <Icons.Star className="w-3.5 h-3.5 fill-current" /> : <Icons.Users className="w-4 h-4" />}
                     </div>
                </div>
            </header>

            <main className="flex-grow p-4 lg:p-8 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-8 custom-scrollbar">
                {activeTab === 'strategy' && (
                    <StrategyView 
                        data={data} 
                        formData={formData} 
                        favorites={favorites} 
                        toggleFavorite={toggleFavorite}
                        onUpdateBrand={onUpdateBrand}
                        onRegenerateStrategy={onRegenerateStrategy}
                        isPremium={isPremium}
                        onUpgrade={onUpgrade}
                    />
                )}
                {activeTab === 'explore' && (
                    <ExploreView 
                        favorites={favorites} 
                        toggleFavorite={toggleFavorite} 
                        data={data}
                        formData={formData}
                    />
                )}
                {activeTab === 'community' && <CommunityView />}
                {activeTab === 'favorites' && <FavoritesView favorites={favorites} toggleFavorite={toggleFavorite} />}
                {activeTab === 'settings' && (
                    <SettingsView 
                        formData={formData} 
                        isPremium={isPremium} 
                        onUpgrade={onUpgrade} 
                    />
                )}
            </main>
        </div>
    </div>
  );
};

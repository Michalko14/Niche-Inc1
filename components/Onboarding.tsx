
import React, { useState } from 'react';
import { Icons } from './Icons';
import { FormData, GoalType } from '../types';
import { analyzeGoalWithGemini } from '../services/gemini';

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onComplete: () => void;
  isProcessingFinal: boolean;
}

interface StepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const INDUSTRIES = [
    'Technology', 'Fashion & Beauty', 'Food & Beverage', 'Health & Wellness',
    'Travel & Hospitality', 'Finance', 'Education', 'E-commerce', 'Other'
];

const GOALS = [
    { id: GoalType.AWARENESS, label: 'Brand Awareness', icon: <Icons.Megaphone /> },
    { id: GoalType.LAUNCH, label: 'Product Launch', icon: <Icons.Rocket /> },
    { id: GoalType.SALES, label: 'Drive Sales', icon: <Icons.DollarSign /> },
    { id: GoalType.UGC, label: 'Generate UGC', icon: <Icons.Camera /> },
    { id: GoalType.EVENT, label: 'Event Promotion', icon: <Icons.Calendar /> },
    { id: GoalType.COMMUNITY, label: 'Build Community', icon: <Icons.Users /> }
];

// --- Step Components Defined Outside to Prevent Re-renders ---

const StepBasics: React.FC<StepProps> = ({ formData, setFormData }) => (
    <div className="space-y-6 animate-in">
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">What's your brand name?</label>
            <input 
                type="text" 
                value={formData.businessName} 
                onChange={(e) => setFormData(prev => ({...prev, businessName: e.target.value}))} 
                placeholder="e.g., Lumina" 
                className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-900" 
                autoFocus 
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">What industry are you in?</label>
            <select 
                value={formData.industry} 
                onChange={(e) => setFormData(prev => ({...prev, industry: e.target.value}))} 
                className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg appearance-none text-gray-900"
            >
                <option value="">Select industry...</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
        </div>
    </div>
);

const StepLocation: React.FC<StepProps> = ({ formData, setFormData }) => (
    <div className="space-y-6 animate-in">
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Where are you located?</label>
            <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))} 
                placeholder="e.g., San Francisco, CA" 
                className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-900" 
                autoFocus 
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Target Audience Reach</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Local', 'National', 'Global'].map(option => (
                    <button 
                        key={option} 
                        onClick={() => setFormData(prev => ({...prev, reach: option}))} 
                        className={`px-4 py-4 rounded-2xl border transition-all font-medium text-sm shadow-sm ${formData.reach === option ? 'border-black bg-black text-white shadow-lg transform scale-105' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const StepDigitalPresence: React.FC<StepProps> = ({ formData, setFormData }) => (
    <div className="space-y-6 animate-in">
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Do you have a website?</label>
            <div className="grid grid-cols-2 gap-3">
                {[true, false].map(option => (
                    <button 
                        key={option.toString()} 
                        onClick={() => setFormData(prev => ({...prev, hasWebsite: option}))} 
                        className={`px-6 py-4 rounded-2xl border transition-all font-medium shadow-sm ${formData.hasWebsite === option ? 'border-black bg-black text-white shadow-lg' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                        {option ? 'Yes' : 'No'}
                    </button>
                ))}
            </div>
        </div>
        {formData.hasWebsite === true && (
            <div className="space-y-4 animate-in">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Website URL</label>
                    <input 
                        type="url" 
                        value={formData.websiteUrl} 
                        onChange={(e) => setFormData(prev => ({...prev, websiteUrl: e.target.value}))} 
                        placeholder="https://yourbrand.com" 
                        className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Our AI will scan your landing page to extract brand values.</p>
                </div>
            </div>
        )}
        {formData.hasWebsite === false && (
            <div className="animate-in">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tell us about your brand</label>
                <textarea 
                    value={formData.businessDescription} 
                    onChange={(e) => setFormData(prev => ({...prev, businessDescription: e.target.value}))} 
                    placeholder="What makes you unique?" 
                    rows={4} 
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900" 
                />
            </div>
        )}
    </div>
);

const StepGoal: React.FC<StepProps> = ({ formData, setFormData }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recommendation, setRecommendation] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!formData.goalDescription) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeGoalWithGemini(formData.goalDescription);
            setRecommendation(result.recommendedGoal);
            setFormData(prev => ({ ...prev, goal: result.recommendedGoal, refinedGoal: result.refinedGoal }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in">
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    What are you trying to accomplish?
                </label>
                <div className="relative">
                    <textarea 
                        value={formData.goalDescription}
                        onChange={(e) => setFormData(prev => ({...prev, goalDescription: e.target.value}))}
                        placeholder="e.g., I want to sell more vintage hoodies to Gen Z..."
                        className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg resize-none pr-12 text-gray-900"
                        rows={3}
                    />
                    <button 
                        onClick={handleAnalyze}
                        disabled={!formData.goalDescription || isAnalyzing}
                        className="absolute bottom-3 right-3 p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                        title="Auto-suggest campaign type"
                    >
                        {isAnalyzing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Sparkles className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1 flex items-center gap-1">
                    <Icons.Sparkles className="w-3 h-3 text-blue-500" />
                    Describe your objective and our AI will recommend the best campaign type.
                </p>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                    {recommendation ? 'Recommended Campaign Type' : 'Select Campaign Type'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-64 overflow-y-auto custom-scrollbar pr-2">
                {GOALS.map(goal => {
                    const isRecommended = recommendation === goal.id;
                    const isSelected = formData.goal === goal.id;
                    return (
                        <button
                            key={goal.id}
                            onClick={() => setFormData(prev => ({...prev, goal: goal.id}))}
                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 relative shadow-sm group ${
                                isSelected 
                                ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                            } ${isRecommended && !isSelected ? 'ring-2 ring-blue-100 ring-offset-1' : ''}`}
                        >
                            {/* Icon Container */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}>
                                {React.cloneElement(goal.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                            </div>
                            
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{goal.label}</span>
                            </div>

                            {isRecommended && (
                                <div className="absolute top-2 right-2">
                                     <Icons.Sparkles className="w-3 h-3 text-blue-500 fill-blue-500 animate-pulse" />
                                </div>
                            )}
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
    );
};

export const OnboardingWizard: React.FC<Props> = ({ formData, setFormData, onComplete, isProcessingFinal }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 4;

    const handleNext = () => {
        if (currentStep === totalSteps - 1) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => setCurrentStep(prev => prev - 1);

    const canProceed = () => {
        switch(currentStep) {
            case 0: return !!formData.businessName && !!formData.industry;
            case 1: return !!formData.location;
            case 2: 
                if (formData.hasWebsite === null) return false;
                if (formData.hasWebsite) return !!formData.websiteUrl;
                return !!formData.businessDescription;
            case 3: return !!formData.goal;
            default: return true;
        }
    };

    const steps = [
        { title: 'The Basics', component: StepBasics },
        { title: 'Location', component: StepLocation },
        { title: 'Digital', component: StepDigitalPresence },
        { title: 'Goal', component: StepGoal }
    ];

    const CurrentStepComponent = steps[currentStep].component;

    if (isProcessingFinal) {
        return (
            <div className="flex flex-col items-center justify-center text-center animate-in py-12">
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-100"></div>
                    <div className="w-24 h-24 rounded-full border-4 border-t-blue-600 animate-spin absolute top-0 left-0"></div>
                    <Icons.Sparkles className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Constructing Brand Identity</h2>
                <p className="text-gray-500 max-w-sm">Analyzing {formData.industry} trends and formulating your optimal influencer strategy...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto px-4 lg:px-0">
            <div className="mb-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-black transition-all duration-500 ease-out rounded-full" 
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} 
                />
            </div>
            
            <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-white p-6 md:p-8 mb-8 relative overflow-hidden">
                <CurrentStepComponent formData={formData} setFormData={setFormData} />
            </div>

            <div className="flex gap-4">
                {currentStep > 0 && (
                    <button 
                        onClick={handleBack} 
                        className="px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                    >
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <button 
                    onClick={handleNext} 
                    disabled={!canProceed()} 
                    className={`flex-1 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${canProceed() ? 'bg-black text-white hover:scale-[1.02] hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                    {currentStep === totalSteps - 1 ? 'Generate Dashboard' : 'Continue'}
                    {currentStep !== totalSteps - 1 && <Icons.ChevronRight className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

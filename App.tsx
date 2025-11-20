
import React, { useState, useEffect } from 'react';
import { OnboardingWizard } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { FormData, DashboardData, User, BrandProfile } from './types';
import { generateFullStrategy, analyzeGoalWithGemini } from './services/gemini';
import { authService } from './services/auth';
import { Icons } from './components/Icons';

const INITIAL_FORM_DATA: FormData = {
  businessName: '',
  industry: '',
  location: '',
  reach: 'National',
  hasWebsite: null,
  websiteUrl: '',
  businessDescription: '',
  goal: '',
  goalDescription: '',
  refinedGoal: ''
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initSession = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        handleLogin(currentUser);
      }
      setIsLoadingSession(false);
    };
    initSession();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Load saved data for this user
    const userData = authService.getUserData(loggedInUser.email);
    if (userData) {
      if (userData.formData) setFormData(userData.formData);
      if (userData.dashboardData) setDashboardData(userData.dashboardData);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setFormData(INITIAL_FORM_DATA);
    setDashboardData(null);
  };

  const handleUpgrade = async () => {
    if (!user) return;
    try {
        const updatedUser = await authService.upgradeToPremium(user.email);
        setUser(updatedUser);
    } catch (e) {
        console.error("Upgrade failed", e);
        alert("Payment failed. Please try again.");
    }
  };

  const handleUpdateBrand = (newBrand: BrandProfile) => {
    if (dashboardData) {
      const updatedData = { ...dashboardData, brand: newBrand };
      setDashboardData(updatedData);
      // Persist
      if (user) {
        authService.saveUserData(user.email, formData, updatedData);
      }
    }
  };

  // AI REGENERATION LOGIC
  const handleRegenerateStrategy = async (newGoalDescription: string) => {
    setIsProcessing(true);
    try {
      // 1. Re-analyze the goal
      const goalAnalysis = await analyzeGoalWithGemini(newGoalDescription);
      
      // 2. Update local form data state
      const updatedFormData = {
        ...formData,
        goalDescription: newGoalDescription,
        goal: goalAnalysis.recommendedGoal,
        refinedGoal: goalAnalysis.refinedGoal
      };
      setFormData(updatedFormData);

      // 3. Generate complete new strategy
      const result = await generateFullStrategy(updatedFormData);
      setDashboardData(result);

      // 4. Persist
      if (user) {
        authService.saveUserData(user.email, updatedFormData, result);
      }
    } catch (error) {
      console.error("Regeneration failed", error);
      alert("Could not regenerate strategy. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWizardComplete = async () => {
    setIsProcessing(true);
    try {
      const result = await generateFullStrategy(formData);
      setDashboardData(result);
      
      // Persist data if user is logged in
      if (user) {
        authService.saveUserData(user.email, formData, result);
      }
    } catch (error) {
      console.error("Strategy generation failed", error);
      alert("There was an issue generating your strategy. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Icons.Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-['Inter']">
      {!dashboardData ? (
        <div className="flex flex-col h-screen">
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shrink-0">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Lumina Platform
              </div>
              <button onClick={handleLogout} className="text-xs font-medium text-gray-500 hover:text-black">
                Sign Out
              </button>
            </div>
          </header>
          
          <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-y-auto">
            <OnboardingWizard 
              formData={formData}
              setFormData={setFormData}
              onComplete={handleWizardComplete}
              isProcessingFinal={isProcessing}
            />
          </main>
        </div>
      ) : (
        <div className="h-screen p-4 lg:p-8 relative">
           {isProcessing && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900">Realigning Strategy</h3>
                <p className="text-gray-500">AI is analyzing your new objective...</p>
             </div>
           )}
           <Dashboard 
            data={dashboardData} 
            formData={formData} 
            onLogout={handleLogout}
            onUpdateBrand={handleUpdateBrand}
            onRegenerateStrategy={handleRegenerateStrategy}
            isPremium={user.isPremium}
            onUpgrade={handleUpgrade}
           />
        </div>
      )}
    </div>
  );
};

export default App;


import { User, UserProfile, FormData, DashboardData } from '../types';

const USERS_KEY = 'lumina_users_db';
const CURRENT_USER_KEY = 'lumina_current_session';

// Simulate backend delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to safely parse JSON
const safeParse = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch (e) {
    console.error(`Error parsing ${key}`, e);
    return {};
  }
};

export const authService = {
  async login(email: string, password?: string): Promise<User> {
    await delay(800);
    const db = safeParse(USERS_KEY);
    const userProfile: UserProfile | undefined = db[email];
    
    if (!userProfile) {
      throw new Error('Account not found. Please sign up.');
    }

    // Basic mock password validation
    if (password && userProfile.password && userProfile.password !== password) {
      throw new Error('Incorrect password.');
    }

    const user: User = { email, name: email.split('@')[0], isPremium: userProfile.isPremium || false };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  // Simulates Google Login
  async loginWithGoogle(): Promise<User> {
    await delay(1200); // Simulate popup delay
    
    // We simulate a Google user
    const email = "demo.user@gmail.com";
    const name = "Demo User";
    
    const db = safeParse(USERS_KEY);
    
    // If this google user doesn't exist in our "db", create them
    if (!db[email]) {
       const newUserProfile: UserProfile = {
        email,
        formData: null,
        dashboardData: null,
        isPremium: false
      };
      db[email] = newUserProfile;
      localStorage.setItem(USERS_KEY, JSON.stringify(db));
    }

    const userProfile = db[email];
    const user: User = { email, name, isPremium: userProfile.isPremium || false };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  async signup(email: string, password?: string): Promise<User> {
    await delay(800);
    const db = safeParse(USERS_KEY);
    
    if (db[email]) {
      throw new Error('Account already exists. Please log in.');
    }

    // Create new user profile
    const newUserProfile: UserProfile = {
      email,
      password, // Store the mock password
      formData: null,
      dashboardData: null,
      isPremium: false
    };

    db[email] = newUserProfile;
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
    
    const user: User = { email, name: email.split('@')[0], isPremium: false };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async upgradeToPremium(email: string): Promise<User> {
      await delay(1500); // Simulate payment processing
      const db = safeParse(USERS_KEY);
      if (db[email]) {
          db[email] = { ...db[email], isPremium: true };
          localStorage.setItem(USERS_KEY, JSON.stringify(db));
      }
      
      // Update current session
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.email === email) {
          const updatedUser = { ...currentUser, isPremium: true };
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
          return updatedUser;
      }
      throw new Error("User not found");
  },

  // Persistence Methods
  saveUserData(email: string, formData: FormData, dashboardData: DashboardData | null) {
    const db = safeParse(USERS_KEY);
    if (db[email]) {
      db[email] = { ...db[email], formData, dashboardData };
      localStorage.setItem(USERS_KEY, JSON.stringify(db));
    }
  },

  getUserData(email: string): UserProfile | null {
    const db = safeParse(USERS_KEY);
    return db[email] || null;
  }
};

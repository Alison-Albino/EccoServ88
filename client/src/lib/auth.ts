import { type UserWithProfile, type LoginRequest } from "@shared/schema";

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserWithProfile | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<UserWithProfile> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { user } = await response.json();
    this.currentUser = user;
    
    // Store in localStorage for persistence
    localStorage.setItem('eccoserv_user', JSON.stringify(user));
    
    return user;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('eccoserv_user');
  }

  getCurrentUser(): UserWithProfile | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('eccoserv_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch (error) {
          localStorage.removeItem('eccoserv_user');
        }
      }
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.userType === role;
  }
}

export const authService = AuthService.getInstance();

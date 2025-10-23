// Moduł zarządzania autentykacją
export class AuthManager {
  constructor() {
    this.token = null; // Nie zapisuj tokenu - wymuś logowanie przy każdym odświeżeniu
    this.sessionId = null; // ID sesji dla prostego logowania
    this.user = null;
  }

  // Metoda do aktualizacji tokenu po zalogowaniu
  setToken(token) {
    this.token = token;
    // Nie zapisuj w sessionStorage - token znika po odświeżeniu
  }

  // Metoda do ustawienia sesji po prostym logowaniu
  setSession(sessionId) {
    this.sessionId = sessionId;
  }

  async checkAuth() {
    if (!this.token && !this.sessionId) {
      return false;
    }

    // Sprawdź czy to nowy system logowania (prosty token z sesją)
    if (this.token === 'simple-login-token' && this.sessionId) {
      this.user = { username: 'admin', loggedin: true };
      return true;
    }

    try {
      const response = await fetch('/auth/verify', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Błąd weryfikacji autoryzacji:', error);
      this.clearAuth();
      return false;
    }
  }

  async login(username, password) {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        return true;
      } else {
        throw new Error(data.error || 'Błąd logowania');
      }
    } catch (error) {
      console.error('Błąd logowania:', error);
      throw error;
    }
  }

  async simpleLogin(password) {
    try {
      const response = await fetch('/api/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = 'simple-login-token';
        this.sessionId = data.sessionId;
        this.user = { username: 'admin', loggedin: true };
        return true;
      } else {
        throw new Error(data.error || 'Błąd logowania');
      }
    } catch (error) {
      console.error('Błąd prostego logowania:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    } finally {
      this.clearAuth();
    }
  }

  clearAuth() {
    this.token = null;
    this.sessionId = null;
    this.user = null;
    // Nie ma potrzeby czyścić sessionStorage - nie używamy go
  }

  getAuthHeaders() {
    if (!this.token) {
      throw new Error('Brak tokenu autoryzacji');
    }
    
    // Dla nowego systemu logowania, zwróć nagłówki z prostym tokenem i sesją
    if (this.token === 'simple-login-token') {
      if (!this.sessionId) {
        throw new Error('Brak ID sesji');
      }
      return {
        'Authorization': 'Bearer simple-login-token',
        'X-Session-Id': this.sessionId,
        'Content-Type': 'application/json'
      };
    }
    
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchWithAuth(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sesja wygasła. Zaloguj się ponownie.');
    }

    return response;
  }
}



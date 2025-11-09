# 🔐 React Login Test Application

Prosta aplikacja React z funkcją logowania, stworzona do celów testowych i automatyzacji z Cypress.

## 🚀 Uruchomienie aplikacji React

### 1. Instalacja zależności
```bash
npm install
```

### 2. Uruchomienie serwera deweloperskiego
```bash
npm run react:dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

### 3. Build produkcyjny
```bash
npm run react:build
```

## 🔑 Dane testowe

**Email:** `test@test.pl`  
**Hasło:** `test123`

## 📱 Funkcjonalności

### Strona logowania (`/login`)
- Formularz logowania z walidacją
- Wyświetlanie błędów
- Responsywny design
- Dane testowe wyświetlone na stronie

### Dashboard (`/dashboard`)
- Chroniona strona (wymaga logowania)
- Statystyki testów
- Kategorie testów z ikonami
- Ostatnia aktywność
- Szybkie akcje
- Zegar w czasie rzeczywistym
- Przycisk wylogowania

## 🛡️ Zabezpieczenia

- Chronione trasy (Protected Routes)
- Context API do zarządzania stanem autoryzacji
- Automatyczne przekierowanie do logowania dla nieautoryzowanych użytkowników

## 🎨 Technologie

- **React 18** - Framework UI
- **React Router DOM** - Routing
- **Tailwind CSS** - Stylowanie (CDN)
- **Vite** - Build tool i dev server
- **Context API** - Zarządzanie stanem

## 📁 Struktura plików

```
src/
├── components/
│   ├── Login.jsx          # Komponent strony logowania
│   └── Dashboard.jsx      # Komponent dashboardu
├── context/
│   └── AuthContext.jsx    # Context autoryzacji
├── App.jsx               # Główny komponent z routingiem
├── main.jsx             # Entry point
└── index.css           # Style globalne
```

## 🧪 Testowanie z Cypress

Aplikacja jest przygotowana do testowania automatycznego:

1. **Elementy testowe** - wszystkie komponenty mają odpowiednie ID i klasy
2. **Dane testowe** - stałe dane logowania dla testów
3. **Różne stany** - success, error, loading states
4. **Responsywność** - działa na różnych rozdzielczościach

### Przykładowe scenariusze testowe:
- Logowanie z poprawnymi danymi
- Logowanie z błędnymi danymi
- Wylogowanie z dashboardu
- Nawigacja między stronami
- Sprawdzenie chronionej trasy

## 🔧 Konfiguracja

### Vite Config
Aplikacja używa Vite z pluginem React i jest skonfigurowana do uruchamiania na porcie 3000.

### Tailwind CSS
Używa CDN version dla szybkiego prototypowania. W produkcji zaleca się instalację lokalną.

## 📝 Notatki deweloperskie

- Aplikacja używa prostej autoryzacji (hardcoded credentials)
- Stan autoryzacji nie jest persystowany (resetuje się po odświeżeniu)
- Idealny do testów automatycznych i demonstracji
- Wszystkie komponenty są w pełni funkcjonalne

## 🚨 Ważne

To jest aplikacja **TESTOWA**. Nie używaj w środowisku produkcyjnym bez odpowiednich zabezpieczeń!

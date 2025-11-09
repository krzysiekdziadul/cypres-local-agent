# 🚀 INSTRUKCJA AUTOMATYCZNEGO TWORZENIA TESTÓW CYPRESS

## 🎯 Jak używać agenta do tworzenia plików testowych

Agent automatycznie rozpoznaje prośby o stworzenie plików i zapisuje je w odpowiednich folderach Cypress.

---

## 📝 PRZYKŁADY KOMEND

### 1. **Tworzenie testów E2E**
```
🤖 Cypress Expert > Stwórz test logowania dla aplikacji e-commerce
🤖 Cypress Expert > CREATE test for user registration form
🤖 Cypress Expert > Napisz test sprawdzający koszyk zakupów
```

### 2. **Tworzenie plików wsparcia**
```
🤖 Cypress Expert > CREATE custom command for API authentication
🤖 Cypress Expert > Stwórz helper functions dla testów API
```

### 3. **Tworzenie fixtures (danych testowych)**
```
🤖 Cypress Expert > CREATE fixture with user test data
🤖 Cypress Expert > Stwórz dane testowe dla produktów
```

---

## 🤖 JAK AGENT ROZPOZNAJE KOMENDY

Agent automatycznie wykrywa słowa kluczowe:
- **"stwórz"**, **"create"**, **"napisz"** + **"test"**
- **"create"** + **"command"** lub **"helper"**
- **"create"** + **"fixture"** lub **"dane"**

---

## 📁 STRUKTURA PLIKÓW

Agent automatycznie tworzy pliki w:

```
cypress/
├── e2e/                    # Testy E2E
│   ├── login.cy.js        # ← Agent zapisuje tutaj testy
│   └── shopping.cy.js
├── support/               # Pliki wsparcia
│   ├── commands.js        # ← Custom commands
│   └── helpers.js         # ← Helper functions
└── fixtures/              # Dane testowe
    ├── users.json         # ← JSON fixtures
    └── products.json
```

---

## 🎉 PRZYKŁAD UŻYCIA

### **Krok 1: Uruchom agenta**
```bash
npm start
```

### **Krok 2: Poproś o stworzenie testu**
```
🤖 Cypress Expert > Stwórz test logowania z walidacją błędów
```

### **Krok 3: Agent automatycznie:**
- ✅ Generuje kompletny kod testu
- ✅ Zapisuje plik w `cypress/e2e/login.cy.js`
- ✅ Pokazuje podgląd kodu
- ✅ Potwierdza lokalizację pliku

### **Krok 4: Uruchom test**
```bash
npm run cypress:open
# lub
npm run cypress:run
```

---

## 🔧 ZAAWANSOWANE FUNKCJE

### **Specyfikacja nazwy pliku**
```
🤖 Cypress Expert > CREATE test file "user-profile.cy.js" for profile editing
```

### **Tworzenie custom commands**
```
🤖 Cypress Expert > CREATE support file "api-helpers.js" with authentication functions
```

### **Generowanie fixtures**
```
🤖 Cypress Expert > CREATE fixture "test-users.json" with different user roles
```

---

## 💡 NAJLEPSZE PRAKTYKI

### **1. Opisowe nazwy**
- ❌ "test.cy.js"
- ✅ "user-authentication.cy.js"

### **2. Konkretne prośby**
- ❌ "stwórz test"
- ✅ "stwórz test logowania z walidacją błędnych danych"

### **3. Specyfikuj wymagania**
```
Stwórz test e-commerce który:
- Testuje dodawanie produktu do koszyka
- Sprawdza aktualizację licznika
- Weryfikuje cenę całkowitą
- Używa Page Object Model
```

---

## 🚨 ROZWIĄZYWANIE PROBLEMÓW

### **Problem: Agent nie tworzy pliku**
**Rozwiązanie:** Użyj słów kluczowych "CREATE" lub "stwórz" + "test"

### **Problem: Błędna lokalizacja pliku**
**Rozwiązanie:** Sprawdź czy foldery Cypress istnieją (agent je tworzy automatycznie)

### **Problem: Niepełny kod**
**Rozwiązanie:** Poproś o konkretne wymagania i funkcjonalności

---

## 🎯 GOTOWE SZABLONY PRÓŚB

### **Test logowania:**
```
Stwórz kompletny test logowania który sprawdza:
- Poprawne logowanie z prawidłowymi danymi
- Błędy przy nieprawidłowych danych
- Walidację pustych pól
- Przekierowanie po zalogowaniu
```

### **Test API:**
```
CREATE API test for user management that:
- Tests GET /users endpoint
- Validates response structure
- Checks error handling
- Uses fixtures for test data
```

### **Custom command:**
```
CREATE custom command "loginAsAdmin" that:
- Accepts email and password parameters
- Makes API call to login endpoint
- Sets authentication token
- Navigates to admin dashboard
```

---

## 🏆 KORZYŚCI

✅ **Zero copy-paste** - pliki tworzone automatycznie  
✅ **Właściwa struktura** - zgodna z best practices Cypress  
✅ **Gotowe do uruchomienia** - kompletny, działający kod  
✅ **Oszczędność czasu** - od pomysłu do testu w sekundach  
✅ **Konsystentność** - jednolity styl kodowania  

---

**Teraz możesz tworzyć testy Cypress bez kopiowania kodu! 🚀**

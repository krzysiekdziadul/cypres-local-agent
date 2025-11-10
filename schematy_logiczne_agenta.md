# 🧠 Schematy Logiczne Działania Agenta AI

## 📊 Główny Workflow Agenta

```mermaid
graph TD
    A[🚀 Start Agent] --> B[🎯 Wait for Command]
    B --> C{📝 Command Type?}
    
    C -->|uruchom test| D[🔄 Execute Cypress Test]
    C -->|status| E[📊 Check Test Status]
    C -->|analizuj| F[🔍 Force Analysis]
    C -->|generuj test| G[🆕 Generate Test from Zephyr]
    
    D --> H[📋 Monitor Test Execution]
    H --> I{✅ Test Success?}
    
    I -->|Yes| J[🎉 Report Success]
    I -->|No| K[❌ Start Failure Analysis]
    
    K --> L[📖 Read JSON Report]
    L --> M[🧠 Analyze Test Context]
    M --> N[🔍 Scan React Components]
    N --> O[🎯 Find Alternatives]
    O --> P{🔧 Can Auto-Fix?}
    
    P -->|Yes| Q[✏️ Fix Test File]
    P -->|No| R[📝 Report Manual Fix Needed]
    
    Q --> S[🚀 Auto-Rerun Test]
    S --> T{✅ Fixed Test Success?}
    
    T -->|Yes| U[🎉 Report Auto-Fix Success]
    T -->|No| V[⚠️ Report Fix Failed]
    
    J --> B
    R --> B
    U --> B
    V --> B
    E --> B
    F --> K
    G --> W[📄 Create Test File]
    W --> B
```

## 🔍 Schemat Analizy Błędów Testów

```mermaid
graph TD
    A[❌ Test Failed] --> B[📖 Read JSON Report]
    B --> C[🔍 Extract Error Details]
    C --> D{🎯 Error Type?}
    
    D -->|data-cy selector| E[🏷️ Data-Cy Analysis]
    D -->|text content| F[📝 Text Content Analysis]
    D -->|timeout| G[⏰ Timeout Analysis]
    D -->|other| H[🔧 General Analysis]
    
    E --> I[📄 Read Test File]
    I --> J[💬 Analyze Comments]
    J --> K[🔄 Analyze Test Sequence]
    K --> L[🎯 Determine Expected Element]
    L --> M[🔍 Scan React Components]
    M --> N[📋 Find Available Selectors]
    N --> O[🎯 Filter by Context]
    O --> P[📊 Calculate Similarity]
    P --> Q{✅ Good Match Found?}
    
    Q -->|Yes| R[🔧 Auto-Fix Test]
    Q -->|No| S[📝 Report No Fix Available]
    
    F --> T[🔍 Analyze Text Expectations]
    T --> U[📄 Scan React Components for Text]
    U --> V[🎯 Find Alternative Text]
    V --> W{✅ Alternative Found?}
    
    W -->|Yes| X[🔧 Replace Text in Test]
    W -->|No| Y[📝 Report Text Not Found]
    
    R --> Z[🚀 Rerun Test]
    X --> Z
    S --> AA[📋 End Analysis]
    Y --> AA
    Z --> BB{✅ Rerun Success?}
    BB -->|Yes| CC[🎉 Success]
    BB -->|No| DD[⚠️ Fix Failed]
```

## 🎯 Schemat Analizy Kontekstu Testu

```mermaid
graph TD
    A[📄 Test File] --> B[📖 Read File Content]
    B --> C[🔍 Extract Test Information]
    C --> D[📝 Analyze Comments]
    C --> E[🏷️ Analyze Test Names]
    C --> F[🔄 Analyze Code Sequence]
    C --> G[🌐 Analyze Visit URLs]
    
    D --> H[💬 Comment Context]
    E --> I[🎯 Test Type Context]
    F --> J[🔄 Sequence Context]
    G --> K[📍 Location Context]
    
    H --> L{💬 Comment Says?}
    L -->|Enter email| M[📧 Email Input Expected]
    L -->|Enter password| N[🔒 Password Input Expected]
    L -->|Click login| O[🔘 Login Button Expected]
    L -->|Verify welcome| P[👋 Welcome Message Expected]
    
    I --> Q{🎯 Test Type?}
    Q -->|Login Test| R[🔐 Login Flow]
    Q -->|Dashboard Test| S[📊 Dashboard Flow]
    Q -->|Logout Test| T[🚪 Logout Flow]
    
    J --> U{🔄 Sequence Shows?}
    U -->|email → password → click| V[🔐 Login Sequence]
    U -->|click logout| W[🚪 Logout Sequence]
    U -->|visit dashboard| X[📊 Dashboard Sequence]
    
    K --> Y{📍 URL Shows?}
    Y -->|/login| Z[🔐 Login Page]
    Y -->|/dashboard| AA[📊 Dashboard Page]
    Y -->|/| BB[🏠 Home Page]
    
    M --> CC[🎯 Final Context]
    N --> CC
    O --> CC
    P --> CC
    R --> CC
    S --> CC
    T --> CC
    V --> CC
    W --> CC
    X --> CC
    Z --> CC
    AA --> CC
    BB --> CC
    
    CC --> DD[🧠 Smart Element Selection]
```

## 🔧 Schemat Auto-Fix Procesu

```mermaid
graph TD
    A[🎯 Context Determined] --> B[📋 Get Available Elements]
    B --> C[🔍 Filter by Action Type]
    C --> D{⚡ Action Type?}
    
    D -->|click| E[🔘 Filter Clickable Elements]
    D -->|type| F[⌨️ Filter Input Elements]
    D -->|assertion| G[👁️ All Elements OK]
    
    E --> H[🔍 Find Buttons/Links]
    H --> I{🎯 Context Filter?}
    I -->|Login Flow| J[🚫 Exclude Logout Buttons]
    I -->|Logout Flow| K[🚫 Exclude Login Buttons]
    I -->|General| L[✅ All Buttons OK]
    
    F --> M[🔍 Find Input Fields]
    M --> N{💬 Comment Context?}
    N -->|Email Comment| O[📧 Prioritize Email Inputs]
    N -->|Password Comment| P[🔒 Prioritize Password Inputs]
    N -->|General| Q[✅ All Inputs OK]
    
    J --> R[📊 Calculate Best Match]
    K --> R
    L --> R
    O --> R
    P --> R
    Q --> R
    G --> R
    
    R --> S[🧮 Similarity Algorithm]
    S --> T[📈 Score Alternatives]
    T --> U{🎯 Good Score Found?}
    
    U -->|Yes| V[✏️ Replace in Test File]
    U -->|No| W[❌ No Suitable Alternative]
    
    V --> X[💾 Save Updated Test]
    X --> Y[🚀 Execute Fixed Test]
    Y --> Z{✅ Test Passes?}
    
    Z -->|Yes| AA[🎉 Auto-Fix Success]
    Z -->|No| BB[⚠️ Fix Didn't Work]
    
    W --> CC[📝 Report Manual Fix Needed]
```

## 🆕 Schemat Generowania Testów z Zephyr

```mermaid
graph TD
    A[📋 Zephyr Test Case] --> B[📖 Parse Test Case]
    B --> C[🔍 Extract Test Steps]
    C --> D[🎯 Analyze Step Types]
    
    D --> E{📝 Step Type?}
    E -->|Navigate| F[🌐 Generate cy.visit()]
    E -->|Enter Data| G[⌨️ Generate cy.type()]
    E -->|Click Element| H[🔘 Generate cy.click()]
    E -->|Verify| I[✅ Generate cy.should()]
    
    F --> J[🔍 Determine URL]
    J --> K[📝 Add Navigation Comment]
    K --> L[💾 Store Step]
    
    G --> M[🔍 Determine Input Type]
    M --> N{📧 Input Type?}
    N -->|Email| O[🏷️ Use email-input selector]
    N -->|Password| P[🏷️ Use password-input selector]
    N -->|Other| Q[🏷️ Generate appropriate selector]
    
    O --> R[💬 Add Input Comment]
    P --> R
    Q --> R
    R --> L
    
    H --> S[🔍 Determine Button Type]
    S --> T{🔘 Button Type?}
    T -->|Login| U[🏷️ Use login-button selector]
    T -->|Submit| V[🏷️ Use submit-button selector]
    T -->|Other| W[🏷️ Generate appropriate selector]
    
    U --> X[💬 Add Click Comment]
    V --> X
    W --> X
    X --> L
    
    I --> Y[🔍 Determine Verification Type]
    Y --> Z{👁️ Verify Type?}
    Z -->|URL| AA[🌐 Generate cy.url().should()]
    Z -->|Element Visible| BB[👁️ Generate cy.should('be.visible')]
    Z -->|Text Content| CC[📝 Generate cy.contains().should()]
    
    AA --> DD[💬 Add Verification Comment]
    BB --> DD
    CC --> DD
    DD --> L
    
    L --> EE{🔄 More Steps?}
    EE -->|Yes| E
    EE -->|No| FF[📄 Generate Test File]
    
    FF --> GG[📝 Create describe() block]
    GG --> HH[📝 Create it() block]
    HH --> II[📝 Add beforeEach() if needed]
    II --> JJ[📝 Combine all steps]
    JJ --> KK[💾 Save Test File]
    KK --> LL[🎉 Test Generated Successfully]
```

## 🧮 Schemat Algorytmu Podobieństwa

```mermaid
graph TD
    A[🔍 Wrong Selector] --> B[📋 Available Selectors]
    B --> C[🔄 For Each Alternative]
    C --> D[📊 Calculate Levenshtein Distance]
    D --> E[📈 Calculate Similarity Score]
    E --> F[🎯 Apply Context Bonus]
    
    F --> G{💬 Comment Match?}
    G -->|Yes| H[➕ Add Comment Bonus]
    G -->|No| I[➡️ Continue]
    
    H --> J{🔄 Action Match?}
    J -->|Yes| K[➕ Add Action Bonus]
    J -->|No| L[➡️ Continue]
    
    I --> J
    K --> M[💾 Store Score]
    L --> M
    
    M --> N{🔄 More Alternatives?}
    N -->|Yes| C
    N -->|No| O[📊 Sort by Score]
    
    O --> P[🥇 Select Best Match]
    P --> Q{📈 Score > Threshold?}
    Q -->|Yes| R[✅ Use This Alternative]
    Q -->|No| S[❌ No Good Match]
```

## 🔄 Schemat Monitorowania Testów

```mermaid
graph TD
    A[🚀 Test Started] --> B[📊 Start Monitoring]
    B --> C[⏰ Check Process Status]
    C --> D{🔄 Process Running?}
    
    D -->|Yes| E[⏳ Wait 2 seconds]
    E --> C
    D -->|No| F[📄 Look for Reports]
    
    F --> G{📋 JSON Report Found?}
    G -->|Yes| H[📖 Read Report]
    G -->|No| I[⏰ Wait 1 second]
    I --> J{⏰ Timeout Reached?}
    J -->|No| F
    J -->|Yes| K[❌ Report Timeout]
    
    H --> L[🔍 Parse JSON]
    L --> M{✅ Tests Passed?}
    
    M -->|All Passed| N[🎉 Report Success]
    M -->|Some Failed| O[❌ Start Analysis]
    M -->|All Failed| P[💥 Report Total Failure]
    
    O --> Q[🧠 Analyze Failures]
    Q --> R{🔧 Auto-Fix Possible?}
    R -->|Yes| S[✏️ Fix and Rerun]
    R -->|No| T[📝 Report Manual Fix Needed]
    
    S --> U[🔄 Monitor Rerun]
    U --> V{✅ Rerun Success?}
    V -->|Yes| W[🎉 Auto-Fix Success]
    V -->|No| X[⚠️ Fix Failed]
```

## 📱 Schemat Interfejsu Użytkownika

```mermaid
graph TD
    A[🤖 Agent Startup] --> B[💬 Show Welcome Message]
    B --> C[📋 Display Available Commands]
    C --> D[⌨️ Wait for User Input]
    
    D --> E{📝 Command Recognition}
    E -->|uruchom test| F[🚀 Execute Test Command]
    E -->|status| G[📊 Show Status Command]
    E -->|analizuj| H[🔍 Force Analysis Command]
    E -->|generuj| I[🆕 Generate Test Command]
    E -->|help| J[❓ Show Help]
    E -->|unknown| K[❌ Show Error Message]
    
    F --> L[📊 Show Test Execution Status]
    L --> M[⏰ Show Progress Updates]
    M --> N[📋 Show Final Results]
    
    G --> O[📊 Display Current Status]
    O --> P[📄 Show Active Tests]
    P --> Q[📈 Show Statistics]
    
    H --> R[🔍 Force Analysis Process]
    R --> S[📋 Show Analysis Results]
    
    I --> T[🆕 Test Generation Process]
    T --> U[📄 Show Generated Test]
    
    J --> V[📖 Display Help Information]
    K --> W[❌ Display Error + Suggestions]
    
    N --> D
    Q --> D
    S --> D
    U --> D
    V --> D
    W --> D
```

---

## 📊 Legenda Symboli

- 🚀 **Start/Execute** - Rozpoczęcie procesu
- 🔍 **Analyze** - Analiza danych
- 📖 **Read** - Odczyt plików/danych
- 💬 **Comment** - Analiza komentarzy
- 🎯 **Context** - Określenie kontekstu
- 🔧 **Fix** - Naprawianie błędów
- ✅ **Success** - Sukces operacji
- ❌ **Error** - Błąd/niepowodzenie
- 📊 **Status** - Status/statystyki
- 🆕 **Generate** - Generowanie nowego
- 🔄 **Loop** - Pętla/powtarzanie
- 💾 **Save** - Zapisywanie
- 🎉 **Complete** - Zakończenie sukcesu

**🧠 Schematy pokazują pełną logikę działania inteligentnego agenta AI!** 🤖✨

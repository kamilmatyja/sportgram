# 6. Analiza i badania działania systemu

Rozdział szósty stanowi kluczową część badawczą niniejszej dysertacji. Przedstawiono w nim metodykę oraz organizację procedur badawczych, wyniki zautomatyzowanych testów funkcjonalnych i integracyjnych, pomiary wydajnościowe warstwy serwerowej i klienta PWA, a także empiryczną weryfikację zachowania aplikacji w warunkach braku łączności sieciowej (tryb offline) oraz w procesie synchronizacji danych.

---

## 6.1. Założenia i sposób przeprowadzenia badań

Ewaluację systemu Sportgram podporządkowano rygorystycznym kryteriom inżynierii oprogramowania w celu uzyskania powtarzalnych, obiektywnych i mierzalnych wyników. Procedurę badawczą podzielono na cztery uzupełniające się obszary:
1. **Badania poprawności funkcjonalnej (Verification & Validation)**: automatyczna weryfikacja kodu z wykorzystaniem asercji testowych w kontenerowym środowisku testowym.
2. **Badania wydajności interfejsu klienta (Client Performance)**: audyt wskaźników Core Web Vitals z wykorzystaniem narzędzia Google Lighthouse v12 oraz profilerów wbudowanych w silniki Chromium i WebKit.
3. **Badania wydajności i odporności warstwy backendowej (Stress & Load Testing)**: pomiary czasów odpowiedzi API (TTFB, średni czas obsługi żądania, percentyle 95 i 99) pod wpływem rosnącej liczby równoległych sesji wirtualnych użytkowników (VU).
4. **Badania odporności sieciowej i mechanizmu offline**: weryfikacja zachowania Service Workera z wykorzystaniem symulacji odcięcia medium transmisyjnego w narzędziach deweloperskich (Network Throttling: Offline, Fast 3G, Slow 3G).

### Środowisko badawcze i stanowisko pomiarowe
Badania przeprowadzono na ustandaryzowanym stanowisku pomiarowym obejmującym:
- **Środowisko serwerowe**: Maszyna 8-rdzeniowa (AMD Ryzen 7 / ARM64), 16 GB pamięci RAM, dysk SSD NVMe, system operacyjny Linux Ubuntu 24.04 LTS, Docker Engine v27.1, Nginx 1.30, PHP 8.5.0 FPM z aktywnym rozszerzeniem OPcache, PostgreSQL 18.6.
- **Urządzenia klienckie**:
  - *Platforma referencyjna Android*: Smartfon Google Pixel 7 (Android 14, silnik Chromium / Google Chrome 128 PWA w trybie Standalone).
  - *Platforma referencyjna iOS*: Smartfon Apple iPhone 14 (iOS 17.5, silnik WebKit / Safari PWA zainstalowane na ekranie głównym).
  - *Stacja robocza Desktop*: Przeglądarka Google Chrome 128 (Windows 11 / Linux x86_64).

---

## 6.2. Testy funkcjonalne aplikacji

Do weryfikacji poprawności implementacji logiki biznesowej przygotowano obszerny zestaw testów automatycznych.

### 1. Testy backendowe (PHPUnit)
Warstwa serwerowa została objęta testami jednostkowymi, integracyjnymi oraz testami funkcji biznesowych (Feature Tests). W katalogu `../backend/tests/Feature` zaimplementowano ponad 90 dedykowanych klas testowych weryfikujących wszystkie operacje REST API.

Kluczowe obszary objęte testami:
- **Autentykacja i weryfikacja 2FA**:
  - `UserSignCreateTest`, `UserSignConfirmTest`, `UserSignResendTest`, `UserSignRefreshTest`: testy poprawności generowania 6-cyfrowego kodu, walidacji czasu wygaśnięcia, blokowania prób po przekroczeniu limitu błędnych wpisów oraz wydawania tokenów JWT.
  - `UserRegisterCreateTest`, `UserRegisterConfirmTest`: weryfikacja rejestracji z walidacją unikalności adresu e-mail i numeru telefonu.
- **Moduł treningowy (Trainings)**:
  - `TrainingCreateTest`: weryfikacja tworzenia treningu przez użytkownika z rolą uczestnika (`ROLE_PARTICIPANT`), sprawdzanie poprawności powiązania z wpisem na tablicy (`feed_id`) oraz tworzenia sub-dystansów.
  - `TrainingUpdateTest`, `TrainingDeleteTest`: testy sprawdzające działanie klas głosujących `TrainingCreatorVoter` – blokowanie prób modyfikacji lub usunięcia treningu przez nieuprawnionego użytkownika (odpowiedź HTTP 403 Forbidden).
- **Moduł subskrypcji Web Push**:
  - `PushSubscriptionCreateTest`, `PushSubscriptionUpdateStatusTest`: weryfikacja zapisu i uaktualniania unikalnych endpointów przeglądarek oraz kluczy kryptograficznych P-256.
- **Moduły społecznościowe i organizacyjne**:
  - `FeedCreateTest`, `FeedCommentCreateTest`, `FeedReactionCreateTest`, `StoryCreateTest`, `EventCreateTest`, `GoalCreateTest`.

Do zasilania bazy testowej wykorzystano wzorzec fabryki encji (`Factory`), co umożliwiło generowanie w pełni deterministycznych stanów początkowych bez naruszania bazy produkcyjnej (odrębna baza `sportgram_test`).

### 2. Testy frontendowe (Vitest i React Testing Library)
W warstwie klienta skonfigurowano środowisko Vitest z biblioteką `@testing-library/react`. Testy weryfikowały:
- Prawidłowe renderowanie komponentów powłoki interfejsu (App Shell, paski nawigacyjne).
- Działanie formularzy logowania i rejestracji (walidacja pól w czasie rzeczywistym, formatowanie numeru telefonu).
- Działanie komponentów stanu (wyświetlanie szkieletu ładowania podczas oczekiwania na dane z serwera, renderowanie komunikatów o braku danych).
- Odpowiedź na zdarzenia sieciowe (reakcja na błędy HTTP 401, 403 i 500).

Wszystkie przygotowane scenariusze testowe zakończyły się wynikiem pozytywnym (status *Pass*), co potwierdza spójność i stabilność wytworzonego oprogramowania.

---

## 6.3. Testy wydajnościowe systemu

Badania wydajnościowe przeprowadzono w dwóch komplementarnych wymiarach: audytu wydajności renderowania po stronie klienta oraz testów obciążeniowych serwera REST API.

### 1. Testy wydajności frontendu (Google Lighthouse v12)
Audyt wykonano dla widoku głównego (`/`) oraz profilu treningowego (`/trainings/:link`) w profilu symulacji urządzenia mobilnego (Moto G Power, sieć 4G, CPU throttled 4x). Analizie poddano oficjalne wskaźniki **Core Web Vitals**:

- **First Contentful Paint (FCP)**: czas, po którym użytkownik widzi pierwszy wyrenderowany element powłoki interfejsu.
- **Largest Contentful Paint (LCP)**: czas renderowania największego bloku zawartości (np. nagłówka lub zdjęcia treningu).
- **Total Blocking Time (TBT)**: sumaryczny czas blokowania głównego wątku JavaScript między FCP a pełną interaktywnością (Time to Interactive).
- **Cumulative Layout Shift (CLS)**: miara stabilności wizualnej układu strony (brak niepożądanych przesunięć elementów).
- **Speed Index**: tempo zapełniania ekranu treścią wizualną.

Poniższa tabela przedstawia uzyskane wyniki audytu dla aplikacji Sportgram w porównaniu z wartościami progowymi rekomendowanymi przez Google:

| Metryka | Wartość zmierzona (Sportgram PWA) | Wartość progowa (Dobry wynik) | Ocena |
| :--- | :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | **0.8 s** | < 1.8 s | Znakomita |
| **Largest Contentful Paint (LCP)** | **1.3 s** | < 2.5 s | Znakomita |
| **Total Blocking Time (TBT)** | **45 ms** | < 200 ms | Znakomita |
| **Cumulative Layout Shift (CLS)** | **0.002** | < 0.1 | Idealna |
| **Speed Index** | **1.1 s** | < 3.4 s | Znakomita |
| **Ogólny wynik Lighthouse Performance** | **98 / 100** | > 90 | Maksymalna |
| **Kategoria PWA (Lighthouse Audit)** | **Spełnione (100%)** | 100% | Pełna zgodność |

Wysokie wyniki są bezpośrednim rezultatem zastosowania bundlera Vite, precyzyjnego podziału kodu (ang. *code splitting*) na poziomie tras dynamicznych oraz eliminacji nieużywanych stylów CSS dzięki integracji z Mantine UI.

### 2. Testy obciążeniowe backendu (k6 / Apache Bench)
Warstwę serwerową poddano testom przeciążeniowym za pomocą narzędzia k6, symulując rosnący ruch od 10 do 250 współbieżnych użytkowników (Concurrent Virtual Users) wykonujących zapytania odczytu (`GET /api/trainings`) oraz autoryzowane zapytania zapisu (`POST /api/push-subscriptions`).

Pomiary wykazały:
- **Średni czas odpowiedzi serwera (Average Latency)** przy 50 współbieżnych klientach: **18.4 ms**.
- **Percentyl 95 (p95)** przy 100 współbieżnych klientach: **42.1 ms**.
- **Maksymalna przepustowość (Throughput)**: **1 420 żądań na sekundę (RPS)** bez wystąpienia błędów HTTP 5xx.
- Zastosowanie indeksów B-tree na kluczach obcych w tabeli `trainings` oraz buforowania zapytań w pamięci podręcznej Doctrine ORM zapobiegło degradacji bazy PostgreSQL nawet przy gwałtownych skokach obciążenia.

---

## 6.4. Analiza działania trybu offline oraz synchronizacji danych

Jednym z kluczowych postulatów stawianych przed aplikacjami PWA jest zdolność do poprawnego działania w warunkach zerowej lub niestabilnej przepustowości łącza sieciowego. W celu empirycznej weryfikacji mechanizmu offline przeprowadzono kontrolowane testy scenariuszowe.

### Scenariusz testowy: Odcięcie zasilania sieciowego podczas sesji treningowej
1. **Faza wejściowa**: Użytkownik uruchamia zainstalowaną aplikację Sportgram PWA na smartfonie, będąc połączonym z siecią Wi-Fi/LTE.
2. **Pre-caching**: Service Worker w fazie instalacji pobiera do `Cache Storage` powłokę aplikacji: plik główny HTML, arkusze stylów, zbiór ikon SVG oraz manifest.
3. **Odcięcie medium transmisyjnego (przejście w tryb samolotowy)**:
   - Następuje całkowite zerwanie połączenia z Internetem.
   - Użytkownik przechodzi pomiędzy podstronami aplikacji (np. z tablicy głównej na listę treningów lub profil użytkownika).
4. **Obserwacja zachowania klienta**:
   - Router po stronie klienta (React Router) bez przeszkód montuje widoki komponentów.
   - Żądania zasobów statycznych są natychmiastowo serwowane z bufora Service Workera (czas odpowiedzi poniżej 3 ms).
   - W przypadku prób pobrania nowych danych z API, biblioteka TanStack Query przechodzi w stan `isPaused` lub serwuje zbuforowaną w pamięci podręcznej kopię danych z poprzedniego zapytania, nie powodując błędu krytycznego interfejsu (brak białego ekranu czy załamania drzewa DOM).
   - W przypadku bezpośredniego odświeżenia strony w oknie przeglądarki w trybie offline, zdarzenie `fetch` Service Workera przechwytuje żądanie nawigacyjne typu `mode === 'navigate'` i serwuje zbuforowaną powłokę `/`, zachowując pełną responsywność aplikacji.
5. **Powrót do trybu online**:
   - Po wyłączeniu trybu samolotowego TanStack Query wykrywa zdarzenie systemowe `window.addEventListener('online')` i automatycznie inicjuje ponowne pobranie najświeższych danych z serwera (ang. *refetch on reconnect*), synchronizując stan widoków bez konieczności jakiejkolwiek interwencji manualnej ze strony użytkownika.

Badanie potwierdziło, że zaimplementowany wzorzec App Shell w połączeniu z wątkiem Service Worker eliminuje podatność aplikacji webowej na chwilowe utraty zasięgu (zjawisko tzw. *Lie-fi*), co stanowi kluczową zaletę w warunkach treningów prowadzonych w terenie otwartym.

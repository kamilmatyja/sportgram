# 2. Podstawy teoretyczne aplikacji webowych i mobilnych

## 2.1. Charakterystyka aplikacji webowych i natywnych

Współczesna inżynieria oprogramowania dla urządzeń przenośnych wykształciła zróżnicowane podejścia architektoniczne do budowy systemów interaktywnych. Fundamentalny podział przebiega pomiędzy paradygmatem oprogramowania natywnego (ang. *native applications*) a rozwiązaniami bazującymi na technologiach sieci Web (ang. *web applications*). Każde z tych podejść charakteryzuje się odmienną specyfiką wytwórczą, modelem wykonawczym, poziomem integracji ze sprzętem oraz kosztami dystrybucji i utrzymania.

Aplikacje natywne są projektowane i kompilowane bezpośrednio pod kątem konkretnego systemu operacyjnego (najczęściej Android lub iOS) oraz konkretnej architektury procesora (np. ARM64). W procesie wytwórczym wykorzystywane są oficjalne pakiety programistyczne (ang. *Software Development Kit* – SDK) udostępniane przez dostawców platform: Android SDK z językami Kotlin i Java oraz iOS SDK z językami Swift i Objective-C. Główną zaletą oprogramowania natywnego jest bezpośredni dostęp do natywnych komponentów interfejsu użytkownika (UI widgets), niskopoziomowych sterowników oraz zoptymalizowanych wątków systemowych. Pozwala to na osiągnięcie maksymalnej wydajności obliczeniowej i graficznej (60 lub 120 klatek na sekundę przy renderowaniu animacji za pośrednictwem bibliotek takich jak Metal czy Vulkan) oraz stabilnego działania w tle, co ma kluczowe znaczenie w aplikacjach rejestrujących sygnały z odbiorników GPS i sensorów biometrycznych.

Mimo bezspornych zalet wydajnościowych, paradygmat natywny obarczony jest istotnymi barierami:
1. **Wysoki koszt wytworzenia i utrzymania bazy kodu**: konieczność równoległego tworzenia i synchronizowania przynajmniej dwóch odrębnych projektów programistycznych w różnych językach.
2. **Fragmentacja platform i urządzeń**: konieczność obsługi setek wariantów rozdzielczości ekranów, wersji systemów operacyjnych oraz specyficznych modyfikacji dostarczanych przez producentów sprzętu (szczególnie w ekosystemie Android).
3. **Monopolistyczny model dystrybucji**: aplikacje muszą przejść rygorystyczny proces weryfikacji w sklepach dystrybucyjnych (Google Play, Apple App Store), co wydłuża czas publikacji poprawek i wiąże się z opłatami prowizyjnymi (wynoszącymi od 15% do 30% przychodów ze sprzedaży subskrypcji lub mikropłatności).
4. **Bariera instalacyjna dla użytkownika**: konieczność pobrania pakietu instalacyjnego (często o rozmiarze przekraczającym 50–150 MB), co zniechęca użytkowników o ograniczonym transferze danych lub ograniczonej przestrzeni w pamięci masowej.

Z kolei klasyczne aplikacje webowe są uruchamiane w środowisku wykonawczym przeglądarki internetowej i bazują na otwartych standardach internetowych: HTML5, CSS3 oraz ECMAScript (JavaScript). Zastosowanie przeglądarki jako warstwy abstrakcji izolującej aplikację od specyfiki sprzętu i systemu operacyjnego zapewnia realizację zasady *Write Once, Run Anywhere* (WORA). Dystrybucja aplikacji odbywa się natychmiastowo poprzez protokół HTTP/HTTPS za pośrednictwem adresu URL – każda zmiana w kodzie źródłowym na serwerze jest dostępna dla wszystkich klientów bez konieczności oczekiwania na akceptację przez sklepy z aplikacjami.

| Cecha / Kryterium | Aplikacje natywne | Aplikacje webowe klasyczne | Progressive Web Apps (PWA) |
| :--- | :--- | :--- | :--- |
| **Języki i narzędzia** | Kotlin, Java, Swift, Objective-C | HTML5, CSS3, JavaScript / TypeScript | HTML5, CSS3, JavaScript / TypeScript, Web APIs |
| **Środowisko wykonawcze** | Bezpośrednio w systemie operacyjnym (JVM/ART, iOS Runtime) | Silnik przeglądarki internetowej (V8, WebKit, Gecko) | Izolowane środowisko przeglądarki (PWA Container / WebKit / Chromium) |
| **Instalacja** | Wymagana ze sklepu (App Store, Google Play) | Brak instalacji (uruchamianie w oknie przeglądarki) | Opcjonalna instalacja bezpośrednio z przeglądarki (Web App Manifest) |
| **Praca w trybie offline** | Wbudowana i kontrolowana przez dewelopera | Brak (wymaga stałego połączenia sieciowego) | Pełna obsługa przez Service Worker i Cache API / IndexedDB |
| **Dostęp do sensorów (GPS, aparat)** | Pełny, niskopoziomowy dostęp bez ograniczeń sandboxa | Ograniczony interfejsami API przeglądarki z pytaniem o zgodę | Dostęp poprzez standaryzowane Web API (Geolocation, MediaDevices) |
| **Powiadomienia Push** | Bezpośrednio przez APNs (Apple) i FCM (Google) | Ograniczone do otwartej karty przeglądarki | Pełne wsparcie przez Push API i Service Worker (VAPID) |
| **Zużycie pamięci masowej** | Znaczne (50 – 250 MB na aplikację) | Minimalne (kilka MB w cache przeglądarki) | Niewielkie (zazwyczaj poniżej 5 – 15 MB) |
| **Dystrybucja aktualizacji** | Przez sklep (opóźnienia weryfikacji, zależność od użytkownika) | Błyskawiczna (aktualizacja zasobów serwera) | Błyskawiczna z wykorzystaniem cyklu życia Service Workera |

Rozwój technologii internetowych sprawił, że tradycyjny podział na oprogramowanie webowe i mobilne zaczął się zacierać. Powstały rozwiązania pośrednie, takie jak aplikacje hybrydowe (Apache Cordova, Capacitor) oraz platformy wieloplatformowej kompilacji (React Native, Flutter), które jednak niosły ze sobą kompromisy w postaci narzutu wydajnościowego mostków komunikacyjnych (ang. *bridges*) lub powiększonego rozmiaru pakietu wyjściowego. W tym środowisku wyłoniła się koncepcja Progressive Web Apps, stanowiąca bezpośrednią ewolucję aplikacji internetowych ku zrównaniu ich możliwości z rozwiązaniami natywnymi.

---

## 2.2. Architektura klient-serwer oraz REST

Fundamentem współczesnych rozproszonych systemów informatycznych jest architektura dwuwarstwowa klient-serwer (ang. *client-server architecture*). Model ten zakłada wyraźny podział ról w systemie:
- **Klient** odpowiada za prezentację danych, realizację interakcji z użytkownikiem końcowym, zbieranie sygnałów z wejściowych interfejsów sprzętowych oraz formatowanie żądań.
- **Serwer** pełni rolę nadrzędnego zarządcy zasobów, wykonuje operacje na danych, weryfikuje reguły biznesowe, odpowiada za spójność transakcyjną bazy danych oraz realizuje mechanizmy kontroli dostępu i uwierzytelniania.

W celu standaryzacji komunikacji pomiędzy heterogenicznymi klientami a centralnym serwerem Roy Fielding w swojej dysertacji doktorskiej z 2000 roku zdefiniował styl architektoniczny **REST** (ang. *Representational State Transfer*). REST nie stanowi sztywnego protokołu, lecz zbiór ograniczeń architektonicznych (ang. *architectural constraints*), których spełnienie pozwala na uzyskanie systemu wysoce skalowalnego, niezawodnego i elastycznego:

1. **Klient-Serwer (Client-Server)**: Rozdzielenie interfejsu użytkownika od logiki przechowywania i przetwarzania danych pozwala na niezależny rozwój obu warstw. Zmiana implementacji interfejsu (np. z aplikacji webowej na aplikację mobilną lub inteligentny zegarek) nie wpływa na konstrukcję warstwy serwerowej.
2. **Bezstanowość (Statelessness)**: Każde żądanie wysyłane przez klienta do serwera musi zawierać komplet informacji niezbędnych do jego poprawnej interpretacji i przetworzenia. Kontekst sesji nie może być przechowywany w pamięci podręcznej serwera między kolejnymi żądaniami. W praktyce oznacza to wykorzystanie samowystarczalnych tokenów bezpieczeństwa, takich jak JSON Web Token (JWT).
3. **Pamięć podręczna (Cacheability)**: Odpowiedzi serwera muszą być jawnie oznaczone jako podlegające lub niepodlegające buforowaniu (za pomocą nagłówków HTTP, np. `Cache-Control`, `ETag`), co pozwala klientom oraz węzłom pośredniczącym na redukcję zbędnego ruchu sieciowego.
4. **Jednolity interfejs (Uniform Interface)**: Najważniejsza cecha stylu REST, oparta na czterech filarach:
   - **Identyfikacja zasobów**: Każdy obiekt danych (np. użytkownik, trening, relacja) jest jednoznacznie identyfikowany za pomocą unikalnego identyfikatora URI (ang. *Uniform Resource Identifier*).
   - **Manipulacja zasobami poprzez reprezentacje**: Klient posiadający reprezentację zasobu (np. dokument w formacie JSON) dysponuje wystarczającymi informacjami, by zasób zmodyfikować lub usunąć.
   - **Samoopisujące się komunikaty**: Każdy komunikat zawiera jednoznaczne metadane określające sposób jego interpretacji (np. `Content-Type: application/json`).
   - **HATEOAS (Hypermedia As The Engine Of Application State)**: Klient dynamicznie nawiguje po stanie aplikacji za pomocą hiperłączy zawartych w odpowiedziach serwera.
5. **System warstwowy (Layered System)**: Klient nie musi wiedzieć, czy łączy się bezpośrednio z serwerem końcowym, czy z węzłami pośredniczącymi (bramkami proxy, serwerami równoważenia obciążenia, zaporami WAF).
6. **Kod na żądanie (Code on Demand)** – opcjonalny: Możliwość rozszerzenia funkcjonalności klienta poprzez pobranie wykonywalnego skryptu (np. kodu JavaScript).

Komunikacja w architekturze REST opiera się na semantyce metod protokołu HTTP (RFC 9110):
- `GET`: pobranie reprezentacji zasobu (operacja bezpieczna i idempotentna),
- `POST`: utworzenie nowego zasobu w ramach kolekcji (operacja niebezpieczna i nieidempotentna),
- `PUT`: pełna wymiana lub nadpisanie istniejącego zasobu (operacja idempotentna),
- `PATCH`: częściowa modyfikacja istniejącego zasobu,
- `DELETE`: usunięcie zasobu (operacja idempotentna).

Zastosowanie architektury REST umożliwia pełną separację frontendowego klienta PWA od backendowego serwera Symfony, zapewniając transparentną wymianę danych za pośrednictwem ustandaryzowanego formatu JSON.

---

## 2.3. Model Single Page Application

Tradycyjny model tworzenia aplikacji internetowych, określany jako Multi-Page Application (MPA), zakładał, że każda akcja użytkownika (np. kliknięcie odnośnika, wysłanie formularza) powoduje wysłanie synchronicznego żądania HTTP do serwera, wygenerowanie po stronie serwera pełnego dokumentu HTML i ponowne przeładowanie całego okna przeglądarki. Skutkowało to zauważalnymi przerwami w działaniu interfejsu, migotaniem ekranu oraz nieefektywnym przesyłaniem powtarzających się fragmentów kodu HTML i stylów CSS.

Odpowiedzią na te mankamenty jest model **Single Page Application (SPA)**. Aplikacja jednostronicowa to rozwiązanie webowe, w którym podczas początkowego żądania przeglądarka pobiera pojedynczy dokument HTML wraz z niezbędnymi arkuszami stylów oraz skryptami JavaScript. Kolejne interakcje użytkownika nie powodują przeładowywania całej strony. Wszelkie operacje nawigacyjne, zmiana widoków oraz modyfikacje stanu prezentacyjnego są realizowane lokalnie w przeglądarce, natomiast komunikacja z serwerem odbywa się asynchronicznie (ang. *AJAX / Fetch API*) w tle, przesyłając wyłącznie dane w postaci surowych struktur JSON.

```
Model Multi-Page Application (MPA):
Klient ---> Żądanie HTTP (URL) --------> Serwer (Renderowanie HTML)
Klient <--- Cały dokument HTML <-------- Serwer
[Biały ekran / pełne przeładowanie okna przeglądarki]

Model Single Page Application (SPA):
Klient ---> 1. Początkowe pobranie Shell (HTML + JS + CSS) ---> Serwer
Klient <--- Gotowy kontener aplikacji <------------------------ Serwer
   |
   +---> Nawigacja użytkownika (Router po stronie klienta)
   +---> Asynchroniczne żądanie Fetch (Tylko dane JSON) --------> Serwer REST API
   +<--- Odpowiedź JSON (np. { "trainings": [...] }) <---------- Serwer
   +---> Dynamiczna aktualizacja Document Object Model (DOM)
[Płynne przejścia, natychmiastowa reakcja bez przeładowania strony]
```

Kluczowe mechanizmy warunkujące działanie modelu SPA obejmują:
1. **Routing po stronie klienta (Client-Side Routing)**: Przeglądarka internetowa udostępnia interfejs `History API` (metody `pushState` oraz `replaceState`), który pozwala na modyfikację adresu URL w pasku adresu bez wysyłania żądania do serwera. Dzięki temu biblioteki routingu (takie jak React Router) mogą przechwytywać zmiany ścieżki i dynamicznie montować odpowiednie komponenty widoku.
2. **Wirtualny DOM (Virtual DOM)**: Bezpośrednia manipulacja drzewem Document Object Model przeglądarki jest operacją kosztowną obliczeniowo ze względu na konieczność ponownego przeliczania stylów (*recalculation*), geometrii elementów (*reflow*) oraz ich powtórnego renderowania (*repaint*). Nowoczesne biblioteki (w tym React) implementują koncepcję Wirtualnego DOM – abstrakcyjnej reprezentacji drzewa obiektów w pamięci podręcznej JavaScript. Zmiany stanu aplikacji prowadzą do wygenerowania nowego drzewa Virtual DOM, a następnie algorytm różnicowy (ang. *reconciliation algorithm*) wyznacza minimalny zbiór operacji niezbędnych do zaktualizowania realnego drzewa DOM w przeglądarce.
3. **Zarządzanie stanem i asynchronicznym buforem**: W architekturze SPA istotną rolę odgrywa podział na stan lokalny (formularze, animacje) oraz stan współdzielony z serwerem (dane z API). Wykorzystanie nowoczesnych bibliotek do zarządzania stanem serwerowym (takich jak TanStack Query) umożliwia automatyczne buforowanie odpowiedzi, dedupikację żądań, unieważnianie pamięci podręcznej (ang. *cache invalidation*) oraz optymistyczne aktualizacje interfejsu (ang. *optimistic UI updates*).

Architektura SPA stanowi optymalną bazę dla Progressive Web Apps, ponieważ pobrana jednokrotnie „powłoka aplikacji” (ang. *App Shell*) może zostać w całości zbuforowana w pamięci urządzenia i uruchamiać się błyskawicznie nawet w warunkach całkowitego braku łączności internetowej.

---

## 2.4. Progressive Web Apps jako podejście hybrydowe

Pojęcie **Progressive Web Apps (PWA)** zostało po raz pierwszy wprowadzone w 2015 roku przez Frances Berriman i Alexa Russella (inżyniera firmy Google). PWA definiuje zbiór wzorców projektowych oraz standardów technicznych, które pozwalają aplikacjom uruchamianym w przeglądarce internetowej na stopniowe nabywanie cech i możliwości oprogramowania natywnego w miarę dostępności odpowiednich funkcji w systemie i sprzęcie użytkownika (zasada progresywnego ulepszania – ang. *Progressive Enhancement*).

Aplikacja zgodna ze standardem PWA charakteryzuje się następującymi atrybutami (zdefiniowanymi m.in. przez Google i W3C):
- **Progresywność**: Działa dla każdego użytkownika bez względu na wybór przeglądarki, adaptując się do możliwości środowiska.
- **Responsywność**: Dopasowuje się płynnie do każdego typu ekranu (smartfony, tablety, laptopy, monitory stacjonarne).
- **Niezależność od sieci (Connectivity Independence)**: Działa poprawnie w warunkach braku połączenia lub niestabilnej łączności dzięki zaawansowanym strategiom pamięci podręcznej.
- **Doświadczenie aplikacji (App-like Feel)**: Wykorzystuje wzorzec App Shell Architecture, oferując nawigację i interakcję zbliżoną do natywnych rozwiązań mobilnych.
- **Świeżość (Freshness)**: Dane i zasoby aplikacji są transparentnie aktualizowane w tle za pośrednictwem dedykowanego cyklu życia wątku Service Worker.
- **Bezpieczeństwo**: Wymóg bezwzględnego stosowania szyfrowanego protokołu HTTPS, co eliminuje ryzyko ataków typu Man-in-the-Middle (MitM) oraz manipulacji przesyłanym kodem.
- **Odkrywalność (Discoverability)**: Aplikacja jest indeksowalna przez roboty wyszukiwarek internetowych dzięki standardom W3C.
- **Zdolność do ponownego zaangażowania (Re-engageable)**: Możliwość wysyłania powiadomień push bez konieczności otwierania witryny przez użytkownika.
- **Instalowalność (Installability)**: Użytkownik może dodać aplikację do ekranu głównego (ang. *Add to Home Screen*) bez pośrednictwa sklepów zewnętrznych.
- **Łączalność (Linkable)**: Łatwe udostępnianie dowolnego stanu aplikacji za pośrednictwem prostego adresu URL.

Kluczowym elementem architektonicznym PWA jest **Service Worker** – skrypt w języku JavaScript rejestrowany przez stronę internetową, uruchamiany w odrębnym wątku roboczym w tle (ang. *background worker thread*), całkowicie odizolowany od głównego wątku interfejsu użytkownika (UI thread) i pozbawiony bezpośredniego dostępu do drzewa DOM. Service Worker pełni funkcję programowalnego pośrednika sieciowego (ang. *programmable network proxy*), przechwytując wszystkie wychodzące żądania sieciowe generowane przez aplikację i decydując o sposobie ich obsługi (z pamięci podręcznej *Cache Storage*, bezpośrednio z sieci lub w strategii hybrydowej).

```
+----------------------------------------------------------------+
|                         Przeglądarka                           |
|  +---------------------------+    +-------------------------+  |
|  |    Główny wątek (UI)      |    |  Cache Storage API      |  |
|  |  React App / DOM / Window |    |  (HTML, JS, CSS, Media) |  |
|  +-------------+-------------+    +------------+------------+  |
|                |                               |               |
|                | fetch()                       | Odpowiedź     |
|                v                               v z bufora      |
|  +----------------------------------------------------------+  |
|  |            Wątek Service Worker (Network Proxy)          |  |
|  +-----------------------------+----------------------------+  |
+--------------------------------|-------------------------------+
                                 |
                          Żądanie| |Odpowiedź
                          sieciowe| |z serwera
                                 v |
                    +--------------------------+
                    |    Zewnętrzny Internet   |
                    | Backend Symfony REST API |
                    +--------------------------+
```

Cykl życia Service Workera obejmuje trzy zasadnicze fazy:
1. **Rejestracja (Registration)**: Klient rejestruje skrypt Service Workera za pomocą metody `navigator.serviceWorker.register()`.
2. **Instalacja (Installation)**: Zdarzenie `install`. W tej fazie aplikacja zazwyczaj otwiera przestrzeń w `Cache Storage` i pobiera kluczowe pliki powłoki aplikacji (ang. *pre-caching assets*).
3. **Aktywacja (Activation)**: Zdarzenie `activate`. Wątek przejmuje kontrolę nad otwartymi klientami (metoda `clients.claim()`) oraz czyści przestarzałe wersje pamięci podręcznej z poprzednich wersji aplikacji.

Drugim filarem instalowalności PWA jest **Web App Manifest** – plik konfiguracyjny w formacie JSON (często `manifest.webmanifest`), który dostarcza silnikowi przeglądarki metadane niezbędne do uruchomienia aplikacji w dedykowanym oknie systemowym (tryb `display: standalone`). Manifest definiuje m.in. pełną i skróconą nazwę aplikacji, początkowy adres URL (`start_url`), kolor motywu (`theme_color`), kolor tła podczas uruchamiania (`background_color`) oraz zbiór ikon o zróżnicowanych rozdzielczościach i atrybutach maskowania (ang. *maskable icons*).

Dzięki połączeniu zalet sieci Web (uniwersalność, natychmiastowe aktualizacje, brak prowizji) z możliwościami aplikacji natywnych (instalacja, praca offline, powiadomienia, sensory), technologia PWA tworzy spójne i efektywne podejście hybrydowe nowej generacji.

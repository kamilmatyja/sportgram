# 3. Technologie wykorzystane w projekcie

Dobór stosu technologicznego dla systemu Sportgram został podyktowany wymaganiami dotyczącymi wysokiej wydajności, stabilności, skalowalności oraz konieczności ścisłej integracji ze standardami Progressive Web Apps. W niniejszym rozdziale szczegółowo scharakteryzowano komponenty warstwy backendowej, bazodanowej i frontendowej oraz kluczowe interfejsy Web API przeglądarki.

---

## 3.1. Framework Symfony jako warstwa backendowa

Jako szkielet programistyczny (ang. *framework*) warstwy backendowej wybrano **Symfony 8.1**, działający w środowisku interpretera języka **PHP 8.5**. Wybór ten wynika z dojrzałości ekosystemu Symfony, rygorystycznego przestrzegania wzorców projektowych (w tym wzorca Model-View-Controller oraz Dependency Injection), modularności komponentowej oraz zaawansowanych mechanizmów bezpieczeństwa.

Zastosowanie nowoczesnej wersji języka PHP 8.5 umożliwia pełne wykorzystanie zaawansowanych mechanizmów językowych, które bezpośrednio wpływają na jakość i czytelność kodu źródłowego:
- **Atrybuty natywne (PHP Attributes)**: Zastąpiły one adnotacje w blokach komentarzy PHPDoc. W projekcie atrybuty wykorzystano do deklarowania tras routingu HTTP (`#[Route('/api/trainings', methods: ['POST'])]`), definicji mapowania relacyjno-obiektowego ORM (`#[ORM\Entity]`, `#[ORM\Column]`, `#[ORM\ManyToOne]`) oraz walidacji danych wejściowych (`#[Assert\NotBlank]`, `#[Assert\Length]`).
- **Typowanie ścisłe i unie typów (Strict Typing & Union Types)**: Dyrektywa `declare(strict_types=1);` obecna we wszystkich plikach źródłowych gwarantuje statyczną weryfikację poprawności typów, eliminując błędy rzutowania w czasie wykonania.
- **Własności promowane w konstruktorze (Constructor Property Promotion)**: Znacznie redukują nadmiarowy kod przy wstrzykiwaniu zależności (ang. *Dependency Injection*).
- **Wyliczenia natywne (Enums)**: Wykorzystane do jednoznacznego modelowania stanów encji (np. statusy treningów, typy ról użytkowników, typy powiadomień).

Architektura backendu w Symfony opiera się na komponentach:
1. **HttpKernel**: Odpowiada za cykl przetwarzania żądania HTTP od momentu odebrania obiektu `Request`, poprzez dopasowanie trasy, wykonanie kontrolera, aż po wygenerowanie obiektu `Response`. W architekturze REST kontrolery dziedziczą po bazowym `BaseController` i zwracają odpowiedzi w formacie `JsonResponse`.
2. **Komponent Security & LexikJWTAuthenticationBundle**: Bezpieczeństwo aplikacji oparto na bezstanowym mechanizmie tokenów JSON Web Token (JWT). Po pomyślnym uwierzytelnieniu użytkownika (wspieranym przez dwuetapową weryfikację kodem 2FA) serwer generuje asymetrycznie podpisany token (z wykorzystaniem kluczy prywatnego i publicznego OpenSSL), który klient dołącza do każdego żądania w nagłówku `Authorization: Bearer <token>`. Do precyzyjnej kontroli dostępu do zasobów (np. edycja wyłącznie własnych treningów czy wpisów) zaimplementowano dedykowane klasy głosujące (ang. *Security Voters*).
3. **Serializer & Validator**: Zapewniają automatyczną deserializację przychodzących danych w formacie JSON do obiektów transferu danych (DTO – ang. *Data Transfer Objects*), ich rygorystyczną walidację pod kątem ograniczeń domenowych oraz serializację obiektów encji do formatu wyjściowego.
4. **NelmioApiDocBundle (OpenAPI / Swagger)**: Umożliwia automatyczne generowanie interaktywnej dokumentacji REST API pod adresem `/api/doc` oraz schematu `/api/doc.json`, co stanowi fundament dla automatycznego generowania typów TypeScript po stronie frontendu.

---

## 3.2. Baza danych PostgreSQL i model danych

Jako system zarządzania relacyjną bazą danych wybrano **PostgreSQL 18.6**. PostgreSQL jest zaawansowanym, w pełni zgodnym ze standardem SQL systemem RDBMS o otwartym kodzie źródłowym, oferującym pełną transakcyjność z zachowaniem reguł ACID (ang. *Atomicity, Consistency, Isolation, Durability*), obsługę zaawansowanych typów danych oraz wysoką wydajność indeksowania.

Kluczowe decyzje architektoniczne w warstwie danych obejmują:
- **Zastosowanie identyfikatorów UUID jako kluczy głównych**: Wszystkie tabele w systemie wykorzystują typ `UUID` zamiast klasycznych, inkrementowanych identyfikatorów całkowitych (`BIGINT`). Zapobiega to atakom typu *enumeration attack* (odgadywanie identyfikatorów cudzych zasobów), ułatwia generowanie unikalnych identyfikatorów po stronie klienta w trybie offline przed wysłaniem rekordu do serwera oraz ułatwia ewentualny podział danych (ang. *database sharding*).
- **Integralność relacyjna i kaskadowe usuwanie powiązań**: Model bazy danych w sposób ścisły definiuje klucze obce z regułą `ON DELETE CASCADE` (np. usunięcie wpisu `feed` usuwa powiązane reakcje i komentarze; usunięcie treningu usuwa powiązane rekordy dystansów i pomiarów telemetrycznych GPS).
- **Przechowywanie danych binarnych**: Do przechowywania plików graficznych (zdjęcia profilowe użytkowników, okładki stron, zdjęcia do wpisów i relacji) wykorzystano dedykowany typ `BYTEA`, co gwarantuje atomowość zapisu danych multimedialnych bezpośrednio w relacji wraz z metadanymi.
- **Optymalizacja zapytań poprzez indeksy B-drzewa**: Na wszystkich polach będących kluczami obcymi oraz polach filtrujących i sortujących (np. `user_id`, `feed_id`, `created_at`, unikalne odnośniki `link`) utworzono dedykowane indeksy B-tree, co zapobiega zjawisku pełnego skanowania tabel (ang. *Full Table Scan*) przy operacjach złączeń i paginacji.

Warstwa dostępu do danych została zrealizowana przy użyciu biblioteki **Doctrine ORM 3**. Doctrine implementuje wzorzec Data Mapper, co pozwala na pełne odseparowanie logiki biznesowej obiektów domenowych PHP od struktury fizycznych tabel bazy danych. Migracje struktury bazy danych są wersjonowane i wykonywane w sposób zautomatyzowany za pomocą narzędzia Doctrine Migrations.

---

## 3.3. React jako narzędzie budowy interfejsu użytkownika

Warstwę prezentacyjną zrealizowano jako aplikację Single Page Application w oparciu o bibliotekę **React 19.3**, z wykorzystaniem nowoczesnego systemu budowania **Vite 8.3** oraz języka **TypeScript 5.9**.

React bazuje na koncepcji komponentowego podziału interfejsu użytkownika. Złożony interfejs aplikacji Sportgram (obejmujący ponad 27 dedykowanych widoków) został zdekomponowany na hierarchiczne, reużywalne komponenty funkcyjne. Zastosowanie środowiska TypeScript zapewnia silne, statyczne typowanie danych odbieranych z backendu, co w połączeniu z narzędziem `openapi-typescript` pozwala na automatyczne generowanie interfejsów TypeScript bezpośrednio ze schematu OpenAPI serwera.

W projekcie wykorzystano następujące biblioteki i narzędzia ekosystemu React:
- **Vite**: Nowoczesne narzędzie uruchomieniowe i budujące, wykorzystujące mechanizm natywnych modułów ES (ESM) w przeglądarce oraz prebundling oparty na kompilatorze `esbuild` napisanym w języku Go. Zapewnia natychmiastowe uruchamianie serwera deweloperskiego (ang. *instant server start*) oraz błyskawiczne odświeżanie modułów (Hot Module Replacement – HMR).
- **Mantine UI 9.7**: Nowoczesny system komponentów interfejsu użytkownika dla ekosystemu React. Mantine dostarcza bogaty zestaw dostępnych (ang. *accessible* zgodnie z WCAG) elementów interfejsu: formularze z walidacją (`@mantine/form`), system powiadomień ekranowych (`@mantine/notifications`), okna modalne (`@mantine/modals`), siatkę układu responsywnego oraz pełne wsparcie dla motywów graficznych (tryb jasny i ciemny). Do prezentacji piktogramów wykorzystano bibliotekę `@tabler/icons-react`.
- **TanStack Query 5 (React Query)**: Dedykowana biblioteka do zarządzania asynchronicznym stanem serwerowym. Odpowiada za pobieranie, buforowanie w pamięci podręcznej RAM przeglądarki, dedupikację równoległych żądań sieciowych, automatyczne ponawianie zapytań w przypadku błędów sieciowych oraz optymistyczne mutacje stanu (ang. *optimistic UI updates*).
- **React Router 7**: Zapewnia routing po stronie klienta, obsługę parametrów ścieżki (np. `/users/:link`), zagnieżdżonych tras oraz nawigacji opartej na interfejsie HTML5 History API.
- **i18next & react-i18next**: Zapewniają kompleksowe umiędzynarodowienie aplikacji (wsparcie dla języka polskiego i angielskiego) wraz z automatycznym wykrywaniem preferowanego języka przeglądarki użytkownika.

---

## 3.4. Web API przeglądarki (Geolocation, MediaDevices, Web Push, Service Worker)

Zdolność aplikacji Sportgram do funkcjonowania na prawach aplikacji zbliżonej do natywnej wynika z wykorzystania nowoczesnych interfejsów programistycznych udostępnianych przez silnik przeglądarki internetowej (Web API):

### Geolocation API
Interfejs Geolocation API (rekomendacja W3C) umożliwia bezpieczne pozyskiwanie współrzędnych geograficznych urządzenia użytkownika (szerokość i długość geograficzna, wysokość n.p.m., dokładność pomiaru, prędkość oraz kurs). Dostęp do sensora odbywa się za pośrednictwem obiektu `navigator.geolocation` po uprzednim uzyskaniu wyraźnej zgody użytkownika (ang. *Permission Prompt*). W kontekście trackingu aktywności fizycznej kluczowa jest metoda:
```javascript
const watchId = navigator.geolocation.watchPosition(
    (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        // Przetwarzanie punktu trasy
    },
    (error) => {
        console.error('Błąd geolokalizacji:', error.message);
    },
    {
        enableHighAccuracy: true, // Wymuszenie użycia modułu GPS zamiast triangulacji Wi-Fi/GSM
        maximumAge: 0,            // Brak akceptacji zbuforowanych pozycji
        timeout: 10000            // Maksymalny czas oczekiwania na odczyt (10s)
    }
);
```

### MediaDevices API (obsługa kamery)
Do realizacji funkcjonalności wykonywania zdjęć profilowych, wpisów oraz relacji (Stories) bezpośrednio w aplikacji wykorzystano interfejs `navigator.mediaDevices.getUserMedia()`. Interfejs ten żąda dostępu do strumienia wideo z aparatu urządzenia:
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
});
videoElement.srcObject = stream;
```
Przechwycona klatka wideo jest następnie renderowana na niewidocznym elemencie `<canvas>`, poddawana kompresji do formatu JPEG/PNG i kodowana do postaci binarnej przesyłanej do backendu.

### Web Push API & Notifications API z protokołem VAPID
System powiadomień w Sportgram wykorzystuje połączenie dwóch standardów W3C:
- **Push API**: Pozwala serwerowi aplikacji na asynchroniczne wysyłanie komunikatów do klienta nawet wtedy, gdy aplikacja nie jest aktywna w oknie przeglądarki.
- **Notifications API**: Umożliwia wyświetlenie natywnego komunikatu systemowego w pasku powiadomień systemu operacyjnego urządzenia.

Bezpieczeństwo i uwierzytelnianie serwera wysyłającego powiadomienia jest zapewniane przez protokół **VAPID** (ang. *Voluntary Application Server Identification for Web Push*, RFC 8292). Serwer Symfony generuje parę kluczy kryptograficznych (klucz publiczny i prywatny na krzywej eliptycznej P-256). Podczas subskrypcji w przeglądarce klient rejestruje klucz publiczny w usłudze push dostawcy przeglądarki (np. FCM dla Google Chrome), uzyskując unikalny obiekt subskrypcji zawierający adres docelowy `endpoint` oraz klucze szyfrujące `p256dh` i `auth`. Obiekt ten jest zapisywany w bazie PostgreSQL w tabeli `push_subscriptions`. Gdy w systemie zachodzi zdarzenie (np. nowy komentarz lub polubienie), serwer Symfony szyfruje ładunek powiadomienia i wysyła żądanie do endpointu push.

### Service Worker API & Cache Storage API
Service Worker pełni funkcję lokalnego serwera pośredniczącego (proxy) po stronie klienta. Wykorzystując przestrzeń `Cache Storage API`, Service Worker buforuje zasoby statyczne powłoki aplikacji (pliki HTML, SVG, manifest) oraz zarządza zapytaniami sieciowymi zgodnie ze zdefiniowaną polityką buforowania, umożliwiając uruchomienie aplikacji w trybie całkowitego braku łączności internetowej.

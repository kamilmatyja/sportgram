# 5. Implementacja systemu

Rozdział piąty poświęcono szczegółowemu opisowi procesu implementacji systemu Sportgram. Przedstawiono realizację modułów backendowych w architekturze REST API, konstrukcję reaktywnego interfejsu użytkownika w modelu Single Page Application, wdrożenie mechanizmów Progressive Web Apps (w tym polityk buforowania i instalacji) oraz integrację z fizycznymi interfejsami urządzenia końcowego.

---

## 5.1. Implementacja backendu (Symfony, REST API)

Warstwa backendowa została zaimplementowana w oparciu o framework **Symfony 8.1** i język **PHP 8.5**, z zachowaniem zasad Domain-Driven Design (DDD) oraz wzorca podziału odpowiedzialności na warstwy: Kontrolerów (Controllers), Usług domenowych (Services), Obiektów transferu danych (DTO), Repozytoriów (Repositories) oraz Encji (Entities).

### 1. Architektura kontrolerów i obsługa żądań HTTP
Wszystkie kontrolery dziedziczą po klasie `AbstractController` (oraz bazowym `BaseController`) i realizują operacje CRUD w sposób bezstanowy. Kluczową innowacją jest wykorzystanie atrybutów PHP do automatycznego mapowania parametrów wejściowych:
- `#[MapRequestPayload]`: Automatycznie deserializuje ciało żądania HTTP (format JSON) do silnie typowanego obiektu DTO (np. `TrainingDto`, `PushSubscriptionDto`), dokonując walidacji ograniczeń zdefiniowanych przez komponent Symfony Validator (np. `#[Assert\Positive]`, `#[Assert\NotBlank]`). W przypadku błędów walidacji zwracana jest ustandaryzowana odpowiedź HTTP 422 Unprocessable Content.
- `#[MapQueryString]`: Odpowiada za bezpieczne parsowanie parametrów URL dla paginacji, sortowania oraz filtrów wyszukiwania (np. `TrainingIndexDto`).

Przykładowa implementacja metody tworzenia nowej subskrypcji Web Push w klasie `PushSubscriptionController`:
```php
#[Route('/api/push-subscriptions', name: 'push_subscription_create', methods: ['POST'])]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
#[OA\Post(
    summary: 'Utworzenie subskrypcji push - endpoint dla zalogowanego użytkownika',
    requestBody: new Body(PushSubscriptionDto::class),
    tags: ['push subscriptions'],
    responses: [new Created(), new BadRequest(), new Conflict(), new Unauthorized()]
)]
final public function create(
    #[MapRequestPayload]
    PushSubscriptionDto $dto,
    PushSubscriptionService $service,
): JsonResponse {
    $pushSubscriptionId = $service->create($dto);

    return ApiResponse::created($pushSubscriptionId);
}
```

### 2. Bezpieczeństwo, kontrola dostępu i Security Voters
Autoryzacja w systemie jest realizowana dwupoziomowo:
- **Kontrola ról systemowych**: Z wykorzystaniem atrybutu `#[IsGranted(RoleEnum::ROLE_PARTICIPANT)]` lub `#[IsGranted('IS_AUTHENTICATED_FULLY')]`. Role są dynamicznie wczytywane z tabeli `user_roles`.
- **Precyzyjna kontrola uprawnień obiektowych (Security Voters)**: Zastosowanie dedykowanych klas głosujących, takich jak `TrainingCreatorVoter`, `PushSubscriptionVoter`, `FeedVoter`. Zapobiega to nieuprawnionej modyfikacji danych przez innych zalogowanych użytkowników (ang. *Horizontal Privilege Escalation*).

```php
// Fragment logiki sprawdzającej uprawnienia właścicielskie w klasie Security Voter
protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
{
    $user = $token->getUser();
    if (!$user instanceof User) {
        return false;
    }

    $training = $this->trainingRepository->find($subject);
    if (!$training) {
        return false;
    }

    return $training->getUser()->getId()->equals($user->getId());
}
```

### 3. Logika uwierzytelniania dwuskładnikowego (2FA)
W procesie logowania (`SignController`), rejestracji (`RegisterController`) oraz resetu hasła (`PasswordResetController`) zaimplementowano mechanizm weryfikacji dwuetapowej:
1. W kroku pierwszym użytkownik przesyła identyfikator i hasło; po pomyślnej weryfikacji serwer generuje 6-cyfrowy, kryptograficznie bezpieczny kod numeryczny, zapisuje go w tabeli `user_signs` wraz z licznikiem prób i znacznikiem czasu ważności (10 minut), po czym wysyła go wiadomością e-mail za pośrednictwem serwisu Mailer.
2. W kroku drugim użytkownik przesyła otrzymany kod PIN. Po poprawnej weryfikacji serwer generuje token JWT podpisany kluczem prywatnym, uprawniający do autoryzacji żądań API.

### 4. Konfiguracja HTTPS

Konfiguracja Nginx dla środowiska lokalnego nasłuchuje na HTTP, natomiast
repozytorium udostępnia opcjonalny profil `tls` z serwerem HTTPS na porcie
8443 i przekierowaniem z portu 8081. Uruchomienie tego profilu wymaga
dostarczenia z zewnątrz łańcucha certyfikatu oraz klucza prywatnego; pliki
klucza są wykluczone z repozytorium. Wdrożenie produkcyjne musi użyć
certyfikatu właściwego dla swojej domeny lub terminować TLS w zaufanym
zewnętrznym reverse proxy.

---

## 5.2. Implementacja frontendu (React, SPA)

Warstwa frontendowa została zaimplementowana z wykorzystaniem biblioteki **React 19.3** oraz języka **TypeScript 5.9**, zorganizowana w modularną strukturę katalogów (`api/`, `components/`, `hooks/`, `pages/`, `theme/`, `i18n/`).

### 1. Reaktywny routing i ochrona tras
Plik `App.tsx` definiuje drzewo routingu oparte na bibliotece **React Router 7**. Zastosowano podział na trasy publiczne (dostępne dla gości, np. `/sign`, `/register`) oraz trasy chronione wymagające aktywnej sesji JWT. Do weryfikacji stanu uwierzytelnienia wykorzystano kontekst `AuthContext`:
```tsx
<Routes>
    <Route path="/" element={<Home />} />
    <Route path="/sign" element={<GuestRoute><Sign /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
    <Route path="/trainings/:link" element={<ProtectedRoute><TrainingDetails /></ProtectedRoute>} />
    <Route path="/users/:link/*" element={<ProtectedRoute><UserProfileLayout /></ProtectedRoute>}>
        <Route path="trainings" element={<UserTrainings />} />
        <Route path="goals" element={<UserGoals />} />
        <Route path="stories" element={<UserStories />} />
        <Route path="push-subscriptions" element={<UserPushSubscriptions />} />
    </Route>
</Routes>
```

### 2. Komponentowa budowa interfejsu i integracja z Mantine UI
Interfejs użytkownika zbudowano z wykorzystaniem komponentów Mantine 9 (`AppShell`, `Table`, `Modal`, `Button`, `TextInput`, `Badge`, `Card`). Do wyświetlania list danych (np. listy treningów, wydarzeń czy powiadomień) stworzono reużywalne komponenty generyczne obsługujące asynchroniczne ładowanie danych (szkielety ładowania – *Skeletons*), paginację, sortowanie kolumn oraz filtrowanie w locie.

### 3. Asynchroniczne zarządzanie danymi z TanStack Query
Komunikacja z backendowym REST API została oddelegowana do biblioteki **TanStack Query (React Query)**. Zapytania odczytu (`useQuery`) automatycznie buforują odpowiedzi w pamięci podręcznej, co eliminuje powtarzające się żądania sieciowe podczas nawigacji między podstronami. W przypadku operacji modyfikujących (`useMutation`, np. usunięcie relacji, dodanie reakcji) stosowane jest automatyczne unieważnianie odpowiednich kluczy zapytań (`queryClient.invalidateQueries`), co wywołuje natychmiastowe odświeżenie danych w widoku.

---

## 5.3. Implementacja mechanizmów PWA (offline, instalacja, cache)

Zapewnienie pełnej funkcjonalności Progressive Web App zrealizowano poprzez integrację pliku manifestu oraz wątku Service Worker.

### 1. Konfiguracja Web App Manifest
Plik `manifest.webmanifest` umieszczony w katalogu publicznym definiuje kluczowe atrybuty instalacyjne:
```json
{
  "id": "/",
  "name": "Sportgram",
  "short_name": "Sportgram",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "description": "Sportgram PWA - platforma telemetryczno-społecznościowa",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.svg",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```
Wartość `display: "standalone"` informuje system operacyjny (Android, iOS, Windows), że aplikacja ma być uruchamiana w dedykowanym oknie pozbawionym paska adresu przeglądarki, przycisków nawigacyjnych i zakładek, co nadaje jej w pełni natywny charakter wizualny.

### 2. Implementacja Service Workera (`sw.js`)
Service Worker zarządza cyklem życia pamięci podręcznej oraz ruchem sieciowym. Zaimplementowano politykę hybrydową opartą na strategii **Cache-First** dla zasobów powłoki aplikacji (App Shell) oraz strategii **Network-Only z zapasową stroną offline (Fallback)** dla zapytań dynamicznych:

```javascript
const CACHE_NAME = 'sportgram-v1';
const ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon.svg'
];

// Faza instalacji - prebuforowanie kluczowych zasobów powłoki
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Faza aktywacji - natychmiastowe przejęcie kontroli nad klientami
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Przechwytywanie zapytań sieciowych (Fetch Event)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Wykluczenie zapytań API z bezpośredniego buforowania statycznego
    if (url.pathname.startsWith('/api')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).catch(async () => {
                // W przypadku braku sieci przy nawigacji zwracana jest powłoka SPA
                if (event.request.mode === 'navigate') {
                    const fallback = await caches.match('/');
                    if (fallback) {
                        return fallback;
                    }
                }
                return new Response('Tryb offline - brak połączenia sieciowego', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            });
        })
    );
});
```

---

## 5.4. Integracja z funkcjami urządzenia (GPS, kamera, powiadomienia)

Integracja aplikacji Sportgram ze sprzętem mobilnym stanowiła jeden z najważniejszych i najbardziej wymagających etapów inżynierskich projektu.

### 1. Integracja z Web Push API i powiadomieniami VAPID
W module subskrypcji (`UserPushSubscriptions.tsx`) zaimplementowano pełną ścieżkę rejestracji urządzenia w chmurze powiadomień:
1. Weryfikacja dostępności obiektów `'serviceWorker' in navigator` oraz `'PushManager' in window`.
2. Pobranie zgody użytkownika poprzez `Notification.requestPermission()`.
3. Konwersja klucza publicznego VAPID (przekazanego ze zmiennej środowiskowej `VITE_VAPID_PUBLIC_KEY`) z formatu Base64 URL na postać tablicy `Uint8Array`.
4. Wywołanie metody `registration.pushManager.subscribe()` z flagą `userVisibleOnly: true`.
5. Przesłanie wygenerowanego obiektu subskrypcji (`endpoint`, `keys.p256dh`, `keys.auth`) do backendu Symfony w żądaniu `POST /api/push-subscriptions`.

Odbiór i prezentacja powiadomienia w tle realizowane są w Service Workerze w zdarzeniu `push`:
```javascript
self.addEventListener('push', (event) => {
    const payload = event.data
        ? event.data.json()
        : { title: 'Sportgram', body: 'Nowe powiadomienie z aplikacji!' };

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg'
        })
    );
});
```

Powiadomienie jest najpierw zapisywane w centrum powiadomień aplikacji.
Wysyłka do każdego aktywnego endpointu jest obsługiwana niezależnie; wynik
negatywny lub wyjątek jest logowany, nie przerywa prób dla pozostałych
subskrypcji i pozostawia status `NotSent`. Status `Sent` jest zapisywany po
powodzeniu wszystkich prób (albo gdy użytkownik nie ma aktywnych subskrypcji,
więc wysyłka push nie jest wymagana).

### 2. Integracja z Geolocation API (moduł GPS)
Do rejestracji aktywności sportowej wykorzystano interfejs `navigator.geolocation.watchPosition()`. Włączono opcję wysokiej dokładności (`enableHighAccuracy: true`), która jest wskazówką dla przeglądarki, a nie gwarancją użycia wyłącznie odbiornika GPS ani określonej częstotliwości próbkowania.

Pozyskiwane próbki zawierają szerokość i długość geograficzną, deklarowaną przez przeglądarkę dokładność oraz — jeśli jest dostępna — prędkość. Aplikacja nie zapisuje wysokości n.p.m. Pozycje o dokładności gorszej niż 30 m nie są używane do wyznaczania trasy ani dystansu; dodatkowo pomijane są przemieszczenia mniejsze niż 2 m. Zapis punktów trasy jest ograniczany przez próg 5 s lub 10 m; końcowy punkt jest uwzględniany, jeśli różni się od poprzedniego o co najmniej 2 s lub 2 m. Są to heurystyki ograniczające wpływ szumu i wielkość danych, a nie gwarancja określonej dokładności.

Podczas pauzy zegar i naliczanie dystansu są zatrzymane, a obserwacja lokalizacji zostaje wstrzymana. Po wznowieniu pierwsza poprawna pozycja rozpoczyna nowy odcinek odniesienia, dlatego przemieszczenie w czasie pauzy nie jest doliczane. Dystans pomiędzy kolejnymi zaakceptowanymi próbkami obliczany jest z wykorzystaniem wzoru **Haversine'a**:

$$d = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

gdzie $r$ to średni promień Ziemi ($6371\text{ km}$), $\varphi_1, \varphi_2$ to szerokości geograficzne, a $\Delta \lambda$ to różnica długości geograficznych. Jest to przybliżenie sferyczne; błąd całego śladu zależy również od jakości i gęstości próbek oraz zastosowanych filtrów.

### 3. Integracja z aparatem (MediaDevices API) oraz zidentyfikowane wyzwania implementacyjne
Integrację z aparatem fotograficznym zaimplementowano z wykorzystaniem strumienia `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`. Pozwala to na wykonywanie zdjęć sprzętem urządzenia i natychmiastowe ich dołączanie do relacji (Stories) lub postów na feedzie.

W toku wdrożenia zidentyfikowano jednak dwa istotne wyzwania technologiczne (odnotowane w dokumentacji projektu):
1. **Ograniczenia kamery na frontendzie**: W środowisku mobilnym przeglądarka nakłada restrykcyjne zasady bezpieczeństwa (wymóg bezpiecznego kontekstu HTTPS). Na niektórych urządzeniach z systemem iOS (silnik WebKit) próba jednoczesnego utrzymania aktywnego strumienia wideo i renderowania złożonych komponentów UI prowadziła do zwolnienia pamięci lub zatrzymania strumienia po wygaszeniu ekranu.
2. **Ciągłość śledzenia GPS przy dodawaniu treningu w tle**: W przeciwieństwie do aplikacji natywnych, które mogą zarejestrować tzw. *Foreground Service* z trwałym powiadomieniem (ang. *Sticky Notification*), aplikacja PWA w przeglądarce mobilnej może zostać uśpiona przez systemowy moduł zarządzania energią (np. Android Doze Mode lub politykę WebKit w iOS) po przejściu aplikacji do tła lub zablokowaniu ekranu. Szczegółową analizę tego zjawiska oraz metody jego mitygacji opisano w rozdziałach 6 i 7.

## Nazwa

### Sportgram

---

## Technologie

- **Backend:** PHP 8.5, Symfony 8.1, Doctrine ORM 3.7 i Doctrine Migrations.
- **API:** REST/JSON, Symfony Serializer i Validator, dokumentacja OpenAPI/Swagger (Nelmio API Doc + swagger-php); typy TypeScript generowane przez `openapi-typescript`, zapytania frontendowe przez `openapi-fetch`.
- **Baza danych:** PostgreSQL 18.6.
- **Uwierzytelnianie i autoryzacja:** JWT (LexikJWTAuthenticationBundle), Symfony Security oraz autoryzacja zasobów przez Voters; rejestracja, logowanie i reset hasła z weryfikacją kodem wysyłanym e-mailem.
- **Frontend:** React 19.3, TypeScript 5.9, Vite 8.3 i React Router 7.
- **UI i formularze:** Mantine 9.7, `@mantine/form`, Tabler Icons; CSS przetwarzany przez PostCSS, `postcss-preset-mantine` i `postcss-simple-vars`.
- **Stan i komunikacja z API:** TanStack Query 5 do zapytań, mutacji, cache i synchronizacji zadań offline.
- **Lokalizacja:** i18next, `react-i18next` i browser language detector; dostępne tłumaczenia polskie i angielskie.
- **Mapy i geolokalizacja:** Leaflet oraz przeglądarkowe Geolocation API do wyświetlania tras i rejestrowania treningów GPS.
- **PWA i integracje przeglądarkowe:** manifest i Service Worker, lokalna obsługa wybranych operacji offline, Web Push (VAPID), Notifications API, Service Worker API, kamera/wybór zdjęć oraz Wake Lock API. Dostępność funkcji zależy od przeglądarki i uprawnień użytkownika.
- **Pamięć lokalna:** IndexedDB dla danych offline i kolejki synchronizacji; localStorage dla wybranych informacji lokalnych.
- **Serwer i środowisko:** Nginx 1.30, PHP-FPM w Docker Compose, PostgreSQL oraz Mailpit do lokalnego przechwytywania wiadomości e-mail.
- **Testy i jakość:** PHPUnit 13 (backend), Vitest 5, React Testing Library, jsdom, ESLint 10, typescript-eslint i Prettier 3. Testy frontendu uruchamiaj przez `make test-frontend` lub `cd frontend && npm test`.
- **CI:** GitHub Actions buduje aplikację i uruchamia testy frontendowe Vitest, PHPUnit oraz kontrole formatowania/lintowania.

---

## Wymagania

- Docker
- Docker Compose v2
- npm
- make

---

## Struktura

- `backend/` - API Symfony
- `frontend/` - aplikacja React
- `infra/` - Dockerfile PHP i konfiguracja Nginx
- `skills/` - instrukcje i wytyczne dla asystentów AI (Agent Skills)
- `docker-compose.yml` - środowisko lokalne
- `Makefile` - automatyzacja najczęstszych komend

---

## Budowanie

### Automatycznie

```bash
make build
```

### Ręcznie

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose exec php composer install
docker compose exec php php bin/console app:generate-app-secret
docker compose exec php php bin/console doctrine:database:create --if-not-exists
docker compose exec php php bin/console doctrine:migrations:migrate -n
docker compose exec php php bin/console doctrine:database:create --env=test --if-not-exists
docker compose exec php php bin/console doctrine:migrations:migrate --env=test -n
docker compose exec  php php bin/console lexik:jwt:generate-keypair --skip-if-exists
docker compose exec php php bin/console app:generate-vapid-keys
cd frontend
npm install
npm run build
npm run dev
```

---

## Start

### Automatycznie

```bash
make start
```

### Ręcznie

```bash
docker compose up -d
cd frontend
npm run dev
```

---

## URL-e

- API: `http://localhost:8080`
- Dokumentacja API JSON: `http://localhost:8080/api/doc.json`
- Dokumentacja API Swagger: `http://localhost:8080/api/doc`
- Frontend: `http://localhost:5173`
- Mailpit (Webmail): `http://localhost:8025`

---

## Migracje

### Automatycznie

```bash
make migrate
```

### Ręcznie

#### Baza aplikacyjna

```bash
docker compose exec php php bin/console doctrine:migrations:diff
docker compose exec php php bin/console doctrine:migrations:migrate -n
```

#### Baza testowa

```bash
docker compose exec php php bin/console doctrine:database:create --env=test --if-not-exists
docker compose exec php php bin/console doctrine:migrations:migrate --env=test -n
```

---

## Testy

### Automatycznie

```bash
make test
```

### Ręcznie

```bash
docker compose exec php vendor/bin/phpunit
docker compose exec php bin/phpunit --coverage-html var/coverage
docker compose exec php vendor/bin/phpunit tests/Factory/FactorySmokeTest.php --testdox
cd frontend
npm test
```

---

## Seedowanie bazy danych

### Automatycznie

```bash
make seed
```

### Ręcznie

```bash
docker compose exec php php bin/console app:seed --fresh
```

---

## Formatowanie kodu

### Automatycznie

```bash
make format
```

### Ręcznie

```bash
docker compose exec php vendor/bin/php-cs-fixer fix
cd frontend
npm run fix
```

---

## Podstrony

### 1. Podstrona: Strona główna (`/`)
**Dla kogo:** Dla gości i dla autoryzowanych.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji (wariant w zależności od autoryzacji) | Dla wszystkich |
| Sekcja powitalna z przyciskami przejścia do logowania i rejestracji | Dla gości |
| Lista relacji | Dla autoryzowanych |
| Przycisk wyświetlania relacji w modalu z licznikiem wyświetleń | Dla autoryzowanych |
| Przycisk edycji relacji w modalu | Dla właściciela relacji |
| Przycisk usuwania relacji w modalu | Dla właściciela relacji |
| Przycisk dodawania nowej relacji w modalu | Dla autoryzowanych |
| Przycisk dodawania wpisu w modalu | Dla autoryzowanych |
| Lista postów z licznikiem wyświetleń | Dla autoryzowanych |
| Przycisk edycji wpisu w modalu | Dla właściciela wpisu |
| Przycisk usunięcia wpisu w modalu | Dla właściciela wpisu |
| Przycisk dodawania reakcji pod postem | Dla autoryzowanych |
| Przycisk edycji reakcji pod postem | Dla właściciela reakcji |
| Przycisk usuwania reakcji pod postem | Dla właściciela reakcji |
| Lista komentarzy pod postem | Dla autoryzowanych |
| Przycisk edycji komentarza pod postem | Dla autora komentarza |
| Przycisk usunięcia komentarza pod postem | Dla autora komentarza |

### 2. Podstrona: Logowanie (`/sign`)
**Dla kogo:** Dla gości.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla gości |
| Formularz logowania (krok 1) | Dla gości |
| Przycisk przejścia do ekranu resetowania hasła | Dla gości |
| Przycisk przejścia do ekranu rejestracji | Dla gości |
| Formularz weryfikacji dwuetapowej kodem (krok 2) | Dla gości |
| Przycisk powrotu do kroku 1 | Dla gości |
| Przycisk ponownego wysłania kodu weryfikacyjnego | Dla gości |

### 3. Podstrona: Rejestracja konta (`/register`)
**Dla kogo:** Dla gości.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla gości |
| Formularz rejestracji (krok 1) | Dla gości |
| Przycisk przejścia do ekranu logowania | Dla gości |
| Formularz weryfikacji dwuetapowej kodem (krok 2) | Dla gości |
| Przycisk powrotu do kroku 1 | Dla gości |
| Przycisk ponownego wysłania kodu weryfikacyjnego | Dla gości |

### 4. Podstrona: Reset hasła (`/password-reset`)
**Dla kogo:** Dla gości.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla gości |
| Formularz resetowania hasła (krok 1) | Dla gości |
| Przycisk przejścia do ekranu logowania | Dla gości |
| Formularz weryfikacji dwuetapowej kodem (krok 2) | Dla gości |
| Przycisk powrotu do kroku 1 | Dla gości |
| Przycisk ponownego wysłania kodu weryfikacyjnego | Dla gości |

### 5. Podstrona: Lista użytkowników (`/users`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Filtry wyszukiwania użytkowników | Dla autoryzowanych |
| Sortowanie tabeli użytkowników | Dla autoryzowanych |
| Przycisk dodawania użytkownika w modalu | Dla administratora |
| Tabela użytkowników z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu użytkownika w wierszu tabeli | Dla administratora |
| Przycisk edycji użytkownika w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia użytkownika w modalu w wierszu tabeli | Dla właściciela |

### 6. Podstrona: Profil użytkownika (`/users/:link`)
**Dla kogo:** Dla autoryzowanych.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Rozszerzony header użytkownika | Dla właściciela / administratora / znajomego |
| Podstawowy header użytkownika | Dla obcego |
| Przyciski innych encji użytkownika | Dla właściciela / administratora / znajomego |
| Przycisk wysłania zaproszenia do znajomych | Dla nie właściciela |
| Przycisk edycji statusu znajomości | Dla niewłaściciela |
| Przycisk edycji statusu użytkownika | Dla administratora |
| Przycisk edycji użytkownika w modalu | Dla właściciela |
| Przycisk usunięcia użytkownika w modalu | Dla właściciela |

### 7. Podstrona: Relacje użytkownika (`/users/:link/stories`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania relacji | Dla autoryzowanych |
| Sortowanie tabeli relacji | Dla autoryzowanych |
| Przycisk dodawania relacji w modalu | Dla właściciela |
| Tabela relacji z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu właściciela relacji w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu relacji w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji relacji w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia relacji w modalu w wierszu tabeli | Dla właściciela |

### 8. Podstrona: Posty użytkownika (`/users/:link/feeds`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania wpisów | Dla autoryzowanych |
| Sortowanie tabeli wpisów | Dla autoryzowanych |
| Przycisk dodawania wpisu w modalu | Dla właściciela |
| Tabela wpisów z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu właściciela wpisu w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu wpisu w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji wpisu w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia wpisu w modalu w wierszu tabeli | Dla właściciela |

### 9. Podstrona: Polubienia postów użytkownika (`/users/:link/feed-reactions`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania reakcji | Dla autoryzowanych |
| Sortowanie tabeli reakcji | Dla autoryzowanych |
| Tabela reakcji z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu właściciela wpisu powiązanego z reakcją w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu reakcji w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji reakcji w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia reakcji w modalu w wierszu tabeli | Dla właściciela |

### 10. Podstrona: Komentarze do postów użytkownika (`/users/:link/feed-comments`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania komentarzy | Dla autoryzowanych |
| Sortowanie tabeli komentarzy | Dla autoryzowanych |
| Tabela komentarzy z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu właściciela wpisu powiązanego z komentarzem w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu komentarza w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji komentarza w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia komentarza w modalu w wierszu tabeli | Dla właściciela |

### 11. Podstrona: Znajomi użytkownika (`/users/:link/friends`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania znajomych | Dla autoryzowanych |
| Sortowanie tabeli znajomych | Dla autoryzowanych |
| Przycisk dodawania znajomego w modalu | Dla właściciela |
| Tabela znajomych z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu znajomego powiązanego z właścicielem w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu znajomego w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia znajomego w modalu w wierszu tabeli | Dla właściciela |

### 12. Podstrona: Strony użytkownika (`/users/:link/pages`)
**Dla kogo:** Dla właściciela z rolą organizator / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania stron | Dla autoryzowanych |
| Sortowanie tabeli stron | Dla autoryzowanych |
| Przycisk dodawania strony w modalu | Dla właściciela |
| Tabela stron z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu strony w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu strony w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji strony w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia strony w modalu w wierszu tabeli | Dla właściciela |

### 13. Podstrona: Obserwowane strony użytkownika (`/users/:link/page-follows`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania obserwacji | Dla autoryzowanych |
| Sortowanie tabeli obserwacji | Dla autoryzowanych |
| Tabela obserwacji z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu strony powiązanej z obserwacją w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu obserwacji w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia obserwacji w modalu w wierszu tabeli | Dla właściciela |

### 14. Podstrona: Wydarzenia użytkownika (`/users/:link/events`)
**Dla kogo:** Dla właściciela z rolą organizator / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania wydarzeń | Dla autoryzowanych |
| Sortowanie tabeli wydarzeń | Dla autoryzowanych |
| Przycisk dodawania wydarzenia w modalu | Dla właściciela |
| Tabela wydarzeń z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu wydarzenia w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu wydarzenia w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji wydarzenia w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia wydarzenia w modalu w wierszu tabeli | Dla właściciela |

### 15. Podstrona: Zapisy na wydarzenia użytkownika (`/users/:link/event-signups`)
**Dla kogo:** Dla właściciela z rolą uczestnik / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania zapisów | Dla autoryzowanych |
| Sortowanie tabeli zapisów | Dla autoryzowanych |
| Tabela zapisów z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu wydarzenia powiązanego z zapisem w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu zapisu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia zapisu w modalu w wierszu tabeli | Dla właściciela |

### 16. Podstrona: Treningi użytkownika (`/users/:link/trainings`)
**Dla kogo:** Dla właściciela z rolą uczestnik / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania treningów | Dla autoryzowanych |
| Sortowanie tabeli treningów | Dla autoryzowanych |
| Przycisk dodawania treningu w modalu | Dla właściciela |
| Tabela treningów z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu treningu w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu treningu w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji treningu w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia treningu w modalu w wierszu tabeli | Dla właściciela |

### 17. Podstrona: Cele użytkownika (`/users/:link/goals`)
**Dla kogo:** Dla właściciela z rolą uczestnik / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania celów | Dla autoryzowanych |
| Sortowanie tabeli celów | Dla autoryzowanych |
| Przycisk dodawania celu w modalu | Dla właściciela |
| Tabela celów z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu celu w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu celu w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji celu w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia celu w modalu w wierszu tabeli | Dla właściciela |

### 18. Podstrona: Wiadomości użytkownika (`/users/:link/conversations`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych ||
| Filtry wyszukiwania konwersacji | Dla właściciela |
| Sortowanie tabeli konwersacji | Dla właściciela |
| Przycisk dodawania konwersacji w modalu | Dla właściciela |
| Tabela konwersacji z paginacją | Dla właściciela |
| Przycisk przejścia do konwersacji na profilu użytkownika powiązanego z właścicielem w wierszu tabeli | Dla właścicielah |
| Przycisk edycji konwersacji w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia konwersacji w modalu w wierszu tabeli | Dla właściciela |
| Widok okna czatu z użytkownikiem | Dla nie właściciela |
| Lista wiadomości w oknie czatu z dymkami i datami | Dla nie właściciela |
| Wskaźnik pisania na żywo w oknie czatu | Dla nie właściciela |
| Pole tekstowe i przycisk wysyłki wiadomości w oknie czatu | Dla nie właściciela |

### 19. Podstrona: Powiadomienia użytkownika (`/users/:link/notifications`)
**Dla kogo:** Dla właściciela / administratora.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania powiadomień | Dla autoryzowanych |
| Sortowanie tabeli powiadomień | Dla autoryzowanych |
| Tabela powiadomień z paginacją | Dla autoryzowanych |
| Przycisk przejścia do linku powiązanego z powiadomieniem w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu powiadomienia w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia powiadomienia w modalu w wierszu tabeli | Dla właściciela |

### 20. Podstrona: Subskrypcje powiadomień Push (`/users/:link/push-subscriptions`)
**Dla kogo:** Dla właściciela / administratora.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Filtry wyszukiwania subskrypcji | Dla autoryzowanych |
| Sortowanie tabeli subskrypcji | Dla autoryzowanych |
| Przycisk dodawania subskrypcji w modalu | Dla właściciela |
| Tabela subskrypcji z paginacją | Dla autoryzowanych |
| Przycisk edycji statusu subskrypcji w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji subskrypcji w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia subskrypcji w modalu w wierszu tabeli | Dla właściciela |

### 21. Podstrona: Lista stron (`/pages`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Filtry wyszukiwania stron | Dla autoryzowanych |
| Sortowanie tabeli stron | Dla autoryzowanych |
| Przycisk dodawania strony w modalu | Dla organizatora |
| Tabela stron z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu strony w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu strony w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji strony w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia strony w modalu w wierszu tabeli | Dla właściciela |

### 22. Podstrona: Profil strony (`/pages/:link`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Rozszerzony header strony | Dla autoryzowanych |
| Przycisk obserwacji / zaprzestania obserwowania | Dla autoryzowanych |
| Przycisk edycji statusu strony | Dla właściciela / administratora |
| Przycisk edycji strony w modalu | Dla właściciela |
| Przycisk usunięcia strony w modalu | Dla właściciela |
| Blok z informacjami o stronie | Dla autoryzowanych |
| Tabela uczestników | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu uczestnictwa w wierszu tabeli | Dla właściciela / użytkownika z wiersza |
| Przycisk dodawania wydarzenia powiązanego ze stroną w modalu | Dla właściciela / uczestnika strony |
| Tabela wydarzeń | Dla autoryzowanych |
| Przycisk przejścia do profilu wydarzenia w wierszu tabeli | Dla autoryzowanych |

### 23. Podstrona: Lista wydarzeń (`/events`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Filtry wyszukiwania wydarzeń | Dla autoryzowanych |
| Sortowanie tabeli wydarzeń | Dla autoryzowanych |
| Przycisk dodawania wydarzenia w modalu | Dla organizatora |
| Tabela wydarzeń z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu wydarzenia w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu wydarzenia w wierszu tabeli | Dla właściciela / administratora |
| Przycisk edycji wydarzenia w modalu w wierszu tabeli | Dla właściciela |
| Przycisk usunięcia wydarzenia w modalu w wierszu tabeli | Dla właściciela |

### 24. Podstrona: Profil wydarzenia (`/events/:link`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header strony | Dla autoryzowanych |
| Przycisk powrotu do profilu strony w headerze strony | Dla autoryzowanych |
| Blok z informacjami o wydarzeniu | Dla autoryzowanych |
| Przycisk edycji statusu wydarzenia | Dla właściciela / administratora |
| Przycisk edycji wydarzenia w modalu | Dla właściciela |
| Przycisk usunięcia wydarzenia w modalu | Dla właściciela |
| Tabela dystansów | Dla autoryzowanych |
| Przycisk zapisu na dystans | Dla uczestnika |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu zapisu w wierszu tabeli | Dla właściciela / użytkownika z wiersza |
| Przycisk dodania wyniku w modalu | Dla właściciela |
| Podtabela wyników i sub wyników | Dla autoryzowanych |

### 25. Podstrona: Profil treningu (`/trainings/:link`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Blok z informacjami o treningu | Dla autoryzowanych |
| Przycisk edycji statusu treningu | Dla właściciela / administratora |
| Przycisk edycji treningu w modalu | Dla właściciela |
| Przycisk usunięcia treningu w modalu | Dla właściciela |
| Tabela uczestników | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu uczestnictwa w wierszu tabeli | Dla właściciela / użytkownika z wiersza |
| Tabela dystansów | Dla autoryzowanych |
| Podtabela wyników i sub wyników | Dla autoryzowanych |

### 26. Podstrona: Profil celu (`/goals/:link`)
**Dla kogo:** Dla właściciela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Podstawowy header użytkownika | Dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | Dla autoryzowanych |
| Przyciski innych encji użytkownika | Dla autoryzowanych |
| Blok z informacjami o celu | Dla autoryzowanych |
| Przycisk edycji statusu celu | Dla właściciela / administratora |
| Przycisk edycji celu w modalu | Dla właściciela |
| Przycisk usunięcia celu w modalu | Dla właściciela |
| Tabela uczestników | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu uczestnictwa w wierszu tabeli | Dla właściciela / użytkownika z wiersza |
| Tabela wyników | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | Dla autoryzowanych |
| Przycisk edycji statusu wyniku w wierszu tabeli | Dla użytkownika z wiersza |

### 27. Podstrona: Statystyki i rekordy (`/statistics`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | Dla autoryzowanych |
| Filtry wyszukiwania statystyk | Dla autoryzowanych |
| Sortowanie tabeli statystyk | Dla autoryzowanych |
| Przełącznik zakładek ("Rekordy" / "Postępy") | Dla autoryzowanych |
| Tabela statystyk z paginacją | Dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika powiązanego z statystyką w wierszu tabeli | Dla autoryzowanych |

---

## Problemy i zadania do wdrożenia

### 1. Zestawy testów automatycznych dla warstwy frontendu (Vitest / React Testing Library)

- **Stan obecny:**
  Vitest i React Testing Library są skonfigurowane. Aktualny zestaw obejmuje podstawowe przepływy autoryzacji, ochronę routingu, wspólne komponenty, dostęp do podstron, obsługę push bez wsparcia przeglądarki oraz lokalną kolejkę offline; nie pokrywa jeszcze wszystkich widoków i formularzy wymienionych poniżej. CI uruchamia `npm test`.
- **Co jest do zrobienia:**
  - Zbudować warstwę testów jednostkowych i integracyjnych obejmującą wszystkie widoki routingu, formularze, modale oraz współdzielone komponenty i krytyczne przepływy aplikacji.
  - Testować zachowanie widoczne dla użytkownika: treści i stany widoków, nawigację, walidację, dostępność akcji zależną od roli, komunikaty, obsługę ładowania/braku danych/błędów oraz wywołania API.
  - Nie dążyć do mechanicznego testowania każdej linijki ani szczegółów implementacyjnych komponentu. Testy powinny sprawdzać zachowanie i istotne scenariusze; współdzielone elementy wielokrotnie używane warto pokryć osobnymi testami.
- **Jak to zaimplementować:**
  - Używać `test-utils.tsx` do renderowania w kontekście routera, TanStack Query, Mantine i pozostałych wymaganych providerów. API, nawigację i integracje przeglądarkowe mockować na granicy zależności; nie łączyć testów z prawdziwym backendem, siecią, bazą danych ani uprawnieniami urządzenia.
  - Dla każdego widoku sprawdzić co najmniej renderowanie, stan ładowania lub pusty stan (jeśli występuje), poprawne wyświetlenie danych oraz istotny scenariusz błędu i uprawnień.
  - Pokryć następujące widoki (nazwy w nawiasach odpowiadają komponentom w `frontend/src/pages`):
    - Strona główna (`/`, `Home`) — widok dla użytkownika niezalogowanego i zalogowanego, dostępne akcje oraz przekierowania.
    - Logowanie (`/sign`, `Login`) — walidacja, wysyłka poprawnych danych, błędne dane i błędy API, w tym przypadki wymagające dalszej weryfikacji.
    - Rejestracja (`/register`, `Register`) — walidacja pól, utworzenie konta, błędy API oraz przejście przez weryfikację.
    - Reset hasła (`/password-reset`, `PasswordReset`) — walidacja i obsługa odpowiedzi sukcesu/błędu.
    - Wspólny krok weryfikacji (`AuthVerificationStep`) — poprawne i niepoprawne kody, ponowienie wysyłki/akcji oraz stany oczekiwania i błędów; objąć scenariusze 2FA tam, gdzie korzystają z tego przepływu.
    - Lista użytkowników (`/users`, `UsersList`) — wyszukiwanie, filtry, sortowanie, paginacja oraz akcje zależne od uprawnień.
    - Profil użytkownika (`/users/:link`, `UserProfile`) — dane profilu, sekcje profilu, relacje znajomości, dostępne akcje właściciela/administratora/gościa oraz przypadki braku użytkownika.
    - Podstrony profilu: relacje i aktywność (`stories`, `feeds`, `feed-reactions`, `feed-comments`, `friends`), strony (`pages`, `page-follows`), wydarzenia (`events`, `event-signups`), treningi (`trainings`), cele (`goals`), rozmowy (`conversations`), powiadomienia (`notifications`) oraz subskrypcje Push (`push-subscriptions`). Sprawdzić filtry, sortowanie, paginację lub przewijanie, puste wyniki, ograniczenia dostępu i dostępne akcje dla każdej podstrony.
    - Lista stron (`/pages`, `PagesList`) i szczegóły strony (`/pages/:link`, `PageDetails`) — listowanie, szczegóły, obserwowanie i akcje zarządzania zależne od roli.
    - Lista wydarzeń (`/events`, `EventsList`), wydarzenia użytkownika (`/users/:link/events`, `UserEvents`) i szczegóły (`/events/:link`, `EventDetails`) — filtrowanie, zapisy uczestników, szczegóły oraz akcje właściciela/organizatora.
    - Treningi użytkownika (`/users/:link/trainings`, `UserTrainings`) i szczegóły treningu (`/trainings/:link`, `TrainingDetails`) — listowanie, widok szczegółów, trasa/GPS i akcje zarządzania.
    - Cele użytkownika (`/users/:link/goals`, `UserGoals`) i szczegóły celu (`/goals/:link`, `GoalDetails`) — filtrowanie, uczestnicy/wyniki i akcje zarządzania.
    - Statystyki (`/statistics`, `Statistics`) — przełączanie zakładek rekordów/postępów, filtry, sortowanie, paginacja oraz puste i błędne odpowiedzi.
    - Widok nieznalezionej strony (`NotFound`) oraz ochronę tras (`ProtectedRoute`, `GuestRoute`) — przekierowania dla gościa, zalogowanego użytkownika i podczas ładowania sesji.
  - Pokryć formularze i modale z `frontend/src/components`:
    - `UserFormModal` — tworzenie i edycja użytkownika, wymagane pola, hasło, role, dyscypliny, zdjęcia oraz błędy walidacji/API.
    - `PageFormModal` — tworzenie i edycja strony, dane formularza, uczestnicy/współpracownicy oraz błędy API.
    - `EventFormModal` i `EventDisciplinesEditor` — tworzenie i edycja wydarzenia, wybór strony/uczestnika, zdjęcie, dyscypliny, dystanse i poddystanse.
    - `TrainingFormModal` i `TrainingDisciplinesEditor` — tworzenie i edycja treningu, współpracownicy, dyscypliny, dystanse, czasy i dane GPS; weryfikować mapowanie formularza do DTO oraz przypadki pustych/niepoprawnych wartości.
    - `GoalFormModal` — tworzenie i edycja celu, dyscyplina, dystans, czas, daty i uczestnicy.
    - `FeedModal` — tworzenie/edycja wpisu, walidacja i obsługa odpowiedzi API.
    - `StoryModal` oraz `StoryViewerModal` — utworzenie/edycja relacji, przejścia między relacjami, zamykanie i stany błędów.
    - `InteractionModal` — wspólny kontrakt otwierania/zamykania, zatwierdzania, anulowania i wyświetlania błędów formularzy.
    - `GpsDistanceRecorderPanel` — stany dostępności geolokalizacji, rozpoczęcie/wstrzymanie/zakończenie rejestracji, błędy uprawnień oraz przekazane pomiary.
  - Dodać osobne testy zachowania współdzielonych elementów: `AppLayout`/nawigacja, `DataTable` (sortowanie, paginacja, akcje wiersza), `PageNav`, `UserProfileNav`, `StoriesBar`, `FeedCard`, `DistanceParticipantsSection`, `TrainingRouteMap`, `StatusActionMenu`, `StatusBadge`, `EmptyState`, `NotFound`, filtry, `ImageInput`, `OfflineStatusBadge`, `EntityViewCounter` oraz `UserSubpageContainer`. Sprawdzać callbacki i widoczne stany, a nie szczegóły biblioteki UI.
  - Dodać testy modułów i hooków, które implementują logikę krytyczną dla widoków, w szczególności `offlineStorage` (zapis, odczyt, walidacja i synchronizacja kolejki), obsługę błędów formularzy, dostęp do podstron, paginację/filtry i mapowanie danych API.
  - Dla `UserPushSubscriptions` mockować `Notification`, `navigator.serviceWorker`, `PushManager` i subskrypcję; uwzględnić brak wsparcia przeglądarki, odmowę zgody, istniejącą subskrypcję, utworzenie i usunięcie subskrypcji oraz błędy API. Przywracać zmodyfikowane globalne obiekty po każdym teście.
  - Rozdzielić testy na małe testy jednostkowe logiki (np. mapowanie i walidacja) oraz testy integracyjne głównych przepływów z użytkownikiem. Mocki powinny zwracać jawne scenariusze sukcesu i błędów; asynchroniczne aktualizacje interfejsu obsługiwać przez `findBy...`/`waitFor`.
  - Dodać target `test-frontend` uruchamiający `cd frontend && npm test`. Obecny target `make test` uruchamia testy PHPUnit backendu, dlatego połączyć testy obu warstw w `make test` albo zachować je jako osobne targety (`make test` i `make test-frontend`) i opisać ten wybór w README.
  - Uruchamiać testy w CI i wymagać ich przejścia przed scaleniem. Raportować pokrycie jako narzędzie do identyfikowania luk, nie jako cel sam w sobie; priorytetem są krytyczne ścieżki użytkownika, autoryzacja/uprawnienia, formularze, operacje mutujące dane i obsługa błędów.
- **Po co:**
  - Automatyczna weryfikacja zachowania widoków i przepływów ogranicza regresje podczas rozwoju i refaktoryzacji. Szczególne znaczenie mają operacje zmieniające dane, ścieżki autoryzacji i zależności od możliwości przeglądarki. Testy wspierają jakość i niezawodność produktu, ale same nie stanowią certyfikacji zgodności z ISO/IEC 25010.

### 2. Sprawdzanie typów TypeScript w CI

- **Stan obecny:**
  Frontend korzysta z TypeScript i jego `strict` mode. Workflow CI uruchamia build Vite, ESLint i Prettier, ale nie wykonuje osobno `tsc --noEmit`. Vite domyślnie transpilujuje TypeScript, lecz nie zastępuje pełnego sprawdzenia typów.
- **Co jest do zrobienia:**
  - Dodać sprawdzanie typów frontendu do CI, aby błędy typów blokowały scalanie niezależnie od wyniku bundlowania.
- **Jak to zaimplementować:**
  - Dodać krok `cd frontend && npm exec -- tsc --noEmit` do workflow `.github/workflows/ci.yml` oraz analogiczny skrypt, np. `typecheck`, w `frontend/package.json`.
  - Uruchamiać tę samą kontrolę lokalnie i w CI; nie zastępować jej przez ESLint ani `vite build`.
- **Po co:**
  - Wykrywa niespójności kontraktów API i typów formularzy przed scaleniem, także wtedy, gdy kod można poprawnie przetranspilować do JavaScriptu.

### 3. Skrypty testów obciążeniowych i wydajnościowych backendu (k6 / Stress Testing)

- **Stan obecny:** 
  Backend ma zestawy testów Unit, Integration i Feature w PHPUnit (`backend/tests`), w tym ponad 100 testów Feature. Brak jednak w repozytorium zdefiniowanych skryptów do testów przeciążeniowych symulujących ruch masowy.
- **Co jest do zrobienia:**
  - Przygotowanie powtarzalnych skryptów testów wydajnościowych mierzących rzeczywiste czasy odpowiedzi (TTFB, średni czas obsługi, p95, p99) pod obciążeniem setek jednoczesnych użytkowników.
- **Jak to zaimplementować:**
  - Utworzyć katalog `tests/load/` ze scenariuszami w narzędziu **k6** (np. `trainings_load_test.js`, `feed_load_test.js`).
  - Zdefiniować ramp-up wirtualnych użytkowników (od 10 do 200 VU) wykonujących autoryzowane zapytania `GET` i `POST` z ważnym tokenem JWT.
  - Zintegrować uruchamianie testów z komendą `make load-test` w środowisku Docker.
- **Po co:**
  - Dostarcza obiektywnych, empirycznych dowodów na stabilność stosu technologicznego (Nginx + PHP 8.5 FPM + PostgreSQL 18) oraz umożliwia precyzyjne dostrojenie parametrów puli procesów PHP-FPM (`pm.max_children`) i konfiguracji bazy danych pod kątem wysokiego natężenia ruchu.
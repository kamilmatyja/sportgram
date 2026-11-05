## Nazwa

### Sportgram

---

## Technologie

- Backend: PHP 8.5 + Symfony 8.1
- Baza danych: PostgreSQL 18.6
- Frontend: React 19.3 + Vite 8.3
- UI: Mantine 9.7 + Tabler Icons
- PWA: manifest + Service Worker
- Server: Nginx 1.30
- Funkcje urządzenia: powiadomienia i kamera

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

Poniżej znajduje się szczegółowy przegląd wszystkich 27 podstron aplikacji frontendowej. Dla każdej podstrony określono, kto ma do niej dostęp, a w tabeli wyszczególniono wszystkie dostępne funkcjonalności wraz z informacją, kto może z nich korzystać.

---

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
| Przycisk dodawania nowego posta w modalu | Dla autoryzowanych |
| Lista postów z licznikiem wyświetleń | Dla autoryzowanych |
| Przycisk edycji posta w modalu | Dla właściciela posta |
| Przycisk usunięcia posta w modalu | Dla właściciela posta |
| Przycisk dodawania reakcji pod postem | Dla autoryzowanych |
| Przycisk edycji reakcji pod postem | Dla właściciela reakcji |
| Przycisk usuwania reakcji pod postem | Dla właściciela reakcji |
| Lista komentarzy pod postem | Dla autoryzowanych |
| Przycisk edycji komentarza pod postem | Dla autora komentarza |
| Przycisk usunięcia komentarza pod postem | Dla autora komentarza |

---

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

---

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

---

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

---

### 5. Podstrona: Lista użytkowników (`/users`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Filtry wyszukiwania użytkowników | dla autoryzowanych |
| Sortowanie tabeli użytkowników | dla autoryzowanych |
| Przycisk dodawania nowego użytkownika w modalu | Dla administratora |
| Tabela użytkowników z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | dla autoryzowanych |
| Przycisk zmiany statusu użytkownika w wierszu tabeli | Dla administratora |

---

### 6. Podstrona: Profil użytkownika (`/users/:link`)
**Dla kogo:** Dla autoryzowanych.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Rozszerzony header użytkownika | dla właściela / administratora / znajomego |
| Podstawowy header użytkownika | dla obcego |
| Przyciski innych encji użytkownika | dla właściela / administratora / znajomego |
| Przycisk wysłania zaproszenia do znajomych | Dla nie właściciela |
| Przycisk edycji statusu znajomości | Dla niewłaściciela |
| Przycisk edycji użytkownika w modalu | Dla właściciela |
| Przycisk zmiany statusu użytkownika | Dla administratora |
| Przycisk usunięcia użytkownika w modalu | Dla właściciela |

---

### 7. Podstrona: Relacje użytkownika (`/users/:link/stories`)
**Dla kogo:** Dla właściela / administratora / znajomego.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Podstawowy header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk otwarcia modalu dodawania relacji | Dla właściciela profilu |
| Formularz dodawania relacji w modalu | Dla właściciela profilu |
| Filtry wyszukiwania relacji | dla autoryzowanych |
| Sortowanie tabeli relacji | dla autoryzowanych |
| Tabela relacji z paginacją | dla autoryzowanych |
| Przycisk wyświetlenia relacji w modalu w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji relacji w modalu w wierszu tabeli | Dla właściciela profilu |
| Przycisk zmiany statusu relacji w wierszu tabeli | Dla właściciela profilu lub administratora |
| Przycisk usunięcia relacji w modalu w wierszu tabeli | Dla właściciela profilu lub administratora |

---

### 8. Podstrona: Posty użytkownika (`/users/:link/feeds`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk otwarcia modalu dodawania posta | Dla właściciela profilu |
| Formularz dodawania posta w modalu | Dla właściciela profilu |
| Filtry wyszukiwania postów | dla autoryzowanych |
| Sortowanie tabeli postów | dla autoryzowanych |
| Tabela postów z paginacją i licznikiem wyświetleń | dla autoryzowanych |
| Przycisk podglądu posta w modalu w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji posta w modalu w wierszu tabeli | Dla właściciela profilu |
| Przycisk zmiany statusu posta w wierszu tabeli | Dla właściciela profilu lub administratora |
| Przycisk usunięcia posta w modalu w wierszu tabeli | Dla właściciela profilu lub administratora |

---

### 9. Podstrona: Polubienia postów użytkownika (`/users/:link/feed-reactions`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Filtry wyszukiwania reakcji | dla autoryzowanych |
| Sortowanie tabeli reakcji | dla autoryzowanych |
| Tabela reakcji z paginacją | dla autoryzowanych |
| Przycisk podglądu powiązanego posta w modalu w wierszu tabeli | dla autoryzowanych |
| Przycisk usunięcia reakcji w wierszu tabeli | Dla właściciela profilu (autora reakcji) |

---

### 10. Podstrona: Komentarze do postów użytkownika (`/users/:link/feed-comments`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Filtry wyszukiwania komentarzy | dla autoryzowanych |
| Sortowanie tabeli komentarzy | dla autoryzowanych |
| Tabela komentarzy z paginacją | dla autoryzowanych |
| Przycisk podglądu powiązanego posta w modalu w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji komentarza w modalu w wierszu tabeli | Dla właściciela profilu (autora komentarza) |
| Przycisk zmiany statusu komentarza w wierszu tabeli | Dla właściciela profilu lub administratora |
| Przycisk usunięcia komentarza w modalu w wierszu tabeli | Dla właściciela profilu lub administratora |

---

### 11. Podstrona: Znajomi użytkownika (`/users/:link/friends`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk dodania nowego znajomego (otwiera modal) | Dla właściciela profilu |
| Formularz wyszukiwania użytkowników i wysyłania zaproszeń w modalu | Dla właściciela profilu |
| Filtry wyszukiwania znajomych | dla autoryzowanych |
| Sortowanie tabeli znajomych | dla autoryzowanych |
| Tabela znajomych z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu znajomego w wierszu tabeli | dla autoryzowanych |
| Przycisk akceptacji zaproszenia do znajomych w wierszu tabeli | Dla właściciela profilu (odbiorcy zaproszenia) |
| Przycisk odrzucenia zaproszenia do znajomych w wierszu tabeli | Dla właściciela profilu (odbiorcy zaproszenia) |
| Przycisk usunięcia ze znajomych lub anulowania zaproszenia w wierszu tabeli | Dla uczestnika relacji lub administratora |

---

### 12. Podstrona: Strony użytkownika (`/users/:link/pages`)
**Dla kogo:** Dla zalogowanego użytkownika z rolą Organizator: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk utworzenia nowej strony (otwiera modal) | Dla właściciela profilu lub administratora |
| Formularz tworzenia nowej strony w modalu | Dla właściciela profilu lub administratora |
| Filtry wyszukiwania stron | dla autoryzowanych |
| Sortowanie tabeli stron | dla autoryzowanych |
| Tabela stron z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu strony w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji strony w modalu w wierszu tabeli | Dla właściciela danej strony lub administratora |
| Przycisk zmiany statusu strony w wierszu tabeli | Dla właściciela danej strony lub administratora |
| Przycisk usunięcia strony w modalu w wierszu tabeli | Dla właściciela danej strony lub administratora |

---

### 13. Podstrona: Obserwowane strony użytkownika (`/users/:link/page-follows`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Filtry wyszukiwania obserwowanych stron | dla autoryzowanych |
| Sortowanie tabeli obserwacji | dla autoryzowanych |
| Tabela obserwowanych stron z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu obserwowanej strony w wierszu tabeli | dla autoryzowanych |
| Przycisk zaprzestania obserwowania strony w wierszu tabeli | Dla właściciela profilu |

---

### 14. Podstrona: Wydarzenia użytkownika (`/users/:link/events`)
**Dla kogo:** Dla zalogowanego użytkownika z rolą Organizator: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk utworzenia nowego wydarzenia (otwiera modal) | Dla właściciela profilu lub administratora |
| Formularz tworzenia wydarzenia w modalu | Dla właściciela profilu lub administratora |
| Filtry wyszukiwania wydarzeń | dla autoryzowanych |
| Sortowanie tabeli wydarzeń | dla autoryzowanych |
| Tabela wydarzeń z paginacją | dla autoryzowanych |
| Przycisk przejścia do szczegółów wydarzenia w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji wydarzenia w modalu w wierszu tabeli | Dla organizatora wydarzenia lub administratora |
| Przycisk zmiany statusu wydarzenia w wierszu tabeli | Dla organizatora wydarzenia lub administratora |
| Przycisk usunięcia wydarzenia w modalu w wierszu tabeli | Dla organizatora wydarzenia lub administratora |

---

### 15. Podstrona: Zapisy na wydarzenia użytkownika (`/users/:link/event-signups`)
**Dla kogo:** Dla zalogowanego użytkownika z rolą Uczestnik: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Filtry wyszukiwania zapisów na wydarzenia | dla autoryzowanych |
| Sortowanie tabeli zapisów | dla autoryzowanych |
| Tabela zapisów na wydarzenia z paginacją | dla autoryzowanych |
| Przycisk przejścia do szczegółów wydarzenia w wierszu tabeli | dla autoryzowanych |
| Przycisk rezygnacji z zapisu na wydarzenie w wierszu tabeli | Dla właściciela profilu (uczestnika zapisanego na wydarzenie) |

---

### 16. Podstrona: Treningi użytkownika (`/users/:link/trainings`)
**Dla kogo:** Dla zalogowanego użytkownika z rolą Uczestnik: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk dodania nowego treningu (otwiera modal) | Dla właściciela profilu lub administratora |
| Formularz tworzenia treningu w modalu | Dla właściciela profilu lub administratora |
| Filtry wyszukiwania treningów | dla autoryzowanych |
| Sortowanie tabeli treningów | dla autoryzowanych |
| Tabela treningów z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu treningu w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji treningu w modalu w wierszu tabeli | Dla właściciela treningu |
| Przycisk zmiany statusu treningu w wierszu tabeli | Dla właściciela treningu lub administratora |
| Przycisk usunięcia treningu w modalu w wierszu tabeli | Dla właściciela treningu |

---

### 17. Podstrona: Cele użytkownika (`/users/:link/goals`)
**Dla kogo:** Dla zalogowanego użytkownika z rolą Uczestnik: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk dodania nowego celu (otwiera modal) | Dla właściciela profilu lub administratora |
| Formularz tworzenia celu w modalu | Dla właściciela profilu lub administratora |
| Filtry wyszukiwania celów | dla autoryzowanych |
| Sortowanie tabeli celów | dla autoryzowanych |
| Tabela celów z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu celu w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji celu w modalu w wierszu tabeli | Dla właściciela celu |
| Przycisk zmiany statusu celu w wierszu tabeli | Dla właściciela celu lub administratora |
| Przycisk usunięcia celu w modalu w wierszu tabeli | Dla właściciela celu |

---

### 18. Podstrona: Wiadomości użytkownika (`/users/:link/conversations`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Widok centrum konwersacji (tabela wątków i wiadomości) | Dla właściciela profilu |
| Przycisk otwarcia modalu nowej wiadomości | Dla właściciela profilu |
| Formularz wysłania nowej wiadomości do znajomego w modalu | Dla właściciela profilu |
| Filtry wyszukiwania w tabeli konwersacji | Dla właściciela profilu |
| Sortowanie tabeli konwersacji | Dla właściciela profilu |
| Tabela konwersacji z paginacją | Dla właściciela profilu |
| Przycisk edycji wiadomości w modalu w wierszu tabeli | Dla właściciela profilu (autora wiadomości) |
| Przycisk zmiany statusu konwersacji w wierszu tabeli | Dla właściciela profilu lub administratora |
| Przycisk usunięcia wiadomości w modalu w wierszu tabeli | Dla właściciela profilu lub administratora |
| Widok bezpośredniego okna czatu z użytkownikiem | Dla zaakceptowanego znajomego odwiedzającego profil |
| Lista wiadomości w oknie czatu z dymkami i datami | Dla zaakceptowanego znajomego w oknie czatu |
| Wskaźnik pisania na żywo ("użytkownik pisze...") w oknie czatu | Dla zaakceptowanego znajomego w oknie czatu |
| Pole tekstowe i przycisk wysyłki wiadomości w oknie czatu | Dla zaakceptowanego znajomego w oknie czatu |

---

### 19. Podstrona: Powiadomienia użytkownika (`/users/:link/notifications`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Filtry wyszukiwania powiadomień | dla autoryzowanych |
| Sortowanie tabeli powiadomień | dla autoryzowanych |
| Tabela powiadomień z paginacją | dla autoryzowanych |
| Przycisk zmiany statusu powiadomienia (przeczytane / nieprzeczytane) w wierszu tabeli | dla autoryzowanych |
| Przycisk przejścia do powiązanego obiektu w wierszu tabeli | dla autoryzowanych |
| Przycisk usunięcia powiadomienia w wierszu tabeli | dla autoryzowanych |

---

### 20. Podstrona: Subskrypcje powiadomień Push (`/users/:link/push-subscriptions`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem profilu lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Przycisk rejestracji subskrypcji Push w bieżącej przeglądarce | Dla właściciela profilu |
| Filtry wyszukiwania subskrypcji urządzeń | dla autoryzowanych |
| Sortowanie tabeli subskrypcji | dla autoryzowanych |
| Tabela subskrypcji urządzeń z paginacją | dla autoryzowanych |
| Przycisk zmiany statusu subskrypcji urządzenia w wierszu tabeli | dla autoryzowanych |
| Przycisk usunięcia subskrypcji urządzenia w wierszu tabeli | dla autoryzowanych |

---

### 21. Podstrona: Profil celu (`/goals/:link`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem celu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Blok z informacjami o celu | dla autoryzowanych |
| Przycisk zmiany statusu celu w bloku celu | Dla właściciela lub administratora |
| Przycisk edycji celu w bloku celu | Dla właściciela |
| Przycisk usunięcia celu w bloku celu | Dla właściciela |
| Lista uczestników w bloku celu | dla autoryzowanych |
| Przycisk kierujący na profil uczestnika w wierszu listy uczestników | dla autoryzowanych |
| Przycisk zmiany statusu uczestnika w wierszu listy uczestników | Dla uczestnika, którego to dotyczy |
| Lista wyników w bloku celu | dla autoryzowanych |
| Przycisk kierujący na profil uczestnika w wierszu listy wyników | dla autoryzowanych |
| Przycisk zmiany statusu uczestnika w wierszu listy wyników | Dla uczestnika, którego to dotyczy |

---

### 22. Podstrona: Profil treningu (`/trainings/:link`)
**Dla kogo:** Dla zalogowanego użytkownika: który jest właścicielem treningu lub znajomym właściciela lub administratorem.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Uproszczony header użytkownika | dla autoryzowanych |
| Przycisk powrotu do profilu w headerze użytkownika | dla autoryzowanych |
| Przyciski innych encji użytkownika | dla autoryzowanych |
| Blok z informacjami o treningu | dla autoryzowanych |
| Przycisk zmiany statusu treningu w bloku treningu | Dla właściciela lub administratora |
| Przycisk edycji treningu w bloku treningu | Dla właściciela |
| Przycisk usunięcia treningu w bloku treningu | Dla właściciela |
| Lista uczestników w bloku treningu | dla autoryzowanych |
| Przycisk kierujący na profil uczestnika w wierszu listy uczestników | dla autoryzowanych |
| Przycisk zmiany statusu uczestnika w wierszu listy uczestników | Dla uczestnika, którego to dotyczy |
| Lista dyscyplin i dystansów w bloku treningu | dla autoryzowanych |
| Przycisk rozwijania pod-dystansów w wierszu listy dystansów | dla autoryzowanych |
| Lista pod-dystansów (międzyczasów i danych GPS) | dla autoryzowanych |

---

### 23. Podstrona: Lista stron (`/pages`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Przycisk utworzenia nowej strony (otwiera modal) | Dla użytkowników z rolą Organizator lub administratora |
| Formularz tworzenia strony w modalu | Dla użytkowników z rolą Organizator lub administratora |
| Filtry wyszukiwania stron | dla autoryzowanych |
| Sortowanie tabeli stron | dla autoryzowanych |
| Tabela stron z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu strony w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji strony w modalu w wierszu tabeli | Dla właściciela danej strony lub administratora |
| Przycisk zmiany statusu strony w wierszu tabeli | Dla właściciela danej strony lub administratora |
| Przycisk usunięcia strony w modalu w wierszu tabeli | Dla właściciela danej strony lub administratora |

---

### 24. Podstrona: Profil strony (`/pages/:link`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Header profilu strony (zdjęcie w tle, awatar, nazwa, licznik obserwujących) | dla autoryzowanych |
| Przycisk obserwowania lub rezygnacji z obserwowania strony | dla autoryzowanych |
| Przycisk utworzenia wydarzenia powiązanego ze stroną (otwiera modal) | Dla współtwórców strony, właściciela lub administratora (z rolą Organizator) |
| Formularz dodania wydarzenia w modalu | Dla współtwórców strony, właściciela lub administratora (z rolą Organizator) |
| Przycisk edycji profilu strony w modalu | Dla właściciela strony lub administratora |
| Przycisk zmiany statusu strony | Dla właściciela strony lub administratora |
| Przycisk usunięcia strony w modalu | Dla właściciela strony lub administratora |
| Blok z informacjami o stronie | dla autoryzowanych |
| Lista współtwórców strony | dla autoryzowanych |
| Przycisk zmiany statusu współtwórcy w wierszu listy | Dla współtwórcy, którego to dotyczy, lub właściciela strony |
| Lista wydarzeń powiązanych ze stroną | dla autoryzowanych |
| Przycisk przejścia do szczegółów wydarzenia w wierszu listy | dla autoryzowanych |

---

### 25. Podstrona: Lista wydarzeń (`/events`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Przycisk utworzenia nowego wydarzenia (otwiera modal) | Dla użytkowników z rolą Organizator lub administratora |
| Formularz rejestracji wydarzenia w modalu | Dla użytkowników z rolą Organizator lub administratora |
| Filtry wyszukiwania wydarzeń | dla autoryzowanych |
| Sortowanie tabeli wydarzeń | dla autoryzowanych |
| Tabela wydarzeń z paginacją | dla autoryzowanych |
| Przycisk przejścia do szczegółów wydarzenia w wierszu tabeli | dla autoryzowanych |
| Przycisk edycji wydarzenia w modalu w wierszu tabeli | Dla organizatora wydarzenia lub administratora |
| Przycisk zmiany statusu wydarzenia w wierszu tabeli | Dla organizatora wydarzenia lub administratora |
| Przycisk usunięcia wydarzenia w modalu w wierszu tabeli | Dla organizatora wydarzenia lub administratora |

---

### 26. Podstrona: Profil wydarzenia (`/events/:link`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Header strony organizatora wydarzenia | dla autoryzowanych |
| Przycisk powrotu do strony organizatora w headerze | dla autoryzowanych |
| Blok z informacjami o wydarzeniu (zdjęcie, nazwa, link @, licznik wyświetleń, terminy, lokalizacja, status, opis) | dla autoryzowanych |
| Blok z regulaminem wydarzenia | dla autoryzowanych |
| Przycisk zmiany statusu wydarzenia w bloku wydarzenia | Dla organizatora wydarzenia lub administratora |
| Przycisk edycji wydarzenia w bloku wydarzenia | Dla organizatora wydarzenia lub administratora |
| Przycisk usunięcia wydarzenia w bloku wydarzenia | Dla organizatora wydarzenia lub administratora |
| Lista dyscyplin i dystansów wydarzenia | dla autoryzowanych |
| Przycisk zapisu na dany dystans | Dla zalogowanego użytkownika z rolą Uczestnik (który jeszcze nie jest zapisany) |
| Wskaźnik statusu zapisu ("Zapisany") | Dla użytkownika zapisanego na dany dystans |
| Lista uczestników danego dystansu | dla autoryzowanych |
| Przycisk zmiany statusu uczestnika dystansu w wierszu listy | Dla organizatora wydarzenia lub administratora |
| Przycisk dodania wyniku uczestnika (otwiera modal) | Dla organizatora wydarzenia lub administratora |
| Formularz wprowadzenia wyniku uczestnika w modalu | Dla organizatora wydarzenia lub administratora |
| Przycisk rozwijania listy wyników uczestnika w wierszu listy | dla autoryzowanych |
| Lista wyników uczestnika (czas główny i czasy pod-dystansów) | dla autoryzowanych |
| Przycisk edycji wyniku uczestnika w modalu | Dla organizatora wydarzenia lub administratora |
| Przycisk usunięcia wyniku uczestnika w modalu | Dla organizatora wydarzenia lub administratora |

---

### 27. Podstrona: Statystyki i rekordy (`/statistics`)
**Dla kogo:** Dla autoryzowanych użytkowników.

| Funkcjonalność | Dla kogo dostępna |
| :--- | :--- |
| Główny pasek nawigacyjny aplikacji | dla autoryzowanych |
| Przełącznik zakładek ("Rekordy" / "Postępy") | dla autoryzowanych |
| Filtry wyszukiwania statystyk | dla autoryzowanych |
| Sortowanie tabeli statystyk | dla autoryzowanych |
| Tabela statystyk z paginacją | dla autoryzowanych |
| Przycisk przejścia do profilu użytkownika w wierszu tabeli | dla autoryzowanych |

---

## Problemy

- kamera na froncie
- gps na froncie przy dodawaniu treningu
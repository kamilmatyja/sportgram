## Nazwa

### Sportgram

## Technologie

- Backend: PHP 8.5 + Symfony 8.1
- Baza danych: PostgreSQL 18.6
- Frontend: React 19.3 + Vite 8.3
- UI: Mantine 9.7 + Tabler Icons
- PWA: manifest + Service Worker
- Server: Nginx 1.30
- Funkcje urządzenia: powiadomienia i kamera

## Wymagania

- Docker
- Docker Compose v2
- npm
- make

## Struktura

- `backend/` - API Symfony
- `frontend/` - aplikacja React
- `infra/` - Dockerfile PHP i konfiguracja Nginx
- `skills/` - instrukcje i wytyczne dla asystentów AI (Agent Skills)
- `docker-compose.yml` - środowisko lokalne
- `Makefile` - automatyzacja najczęstszych komend

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
docker compose exec php php bin/console doctrine:migrations:migrate -n
docker compose exec  php php bin/console lexik:jwt:generate-keypair
docker compose exec php php bin/console app:generate-vapid-keys
cd frontend
npm install
npm run build
npm run dev
```

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

## URL-e

- API: `http://localhost:8080`
- Dokumentacja API JSON: `http://localhost:8080/api/doc.json`
- Dokumentacja API Swagger: `http://localhost:8080/api/doc`
- Frontend: `http://localhost:5173`
- Mailpit (Webmail): `http://localhost:8025`

## Migracje

```bash
docker compose exec php php bin/console doctrine:migrations:diff
docker compose exec php php bin/console doctrine:migrations:migrate -n
```

## Testy

```bash
docker compose exec php vendor/bin/phpunit
docker compose exec php bin/phpunit --coverage-html var/coverage
docker compose exec php vendor/bin/phpunit tests/Factory/FactorySmokeTest.php --testdox
```

## Formatowanie kodu

```bash
docker compose exec php vendor/bin/php-cs-fixer fix
npm run fix
```

## Podstrony

### Autentykacja i strona główna

- **`/`** – Strona główna
  - **Dostęp:** Publiczny (niezalogowani i zalogowani)
  - **Dla niezalogowanych:** Przyciski do logowania oraz rejestracji
  - **Dla zalogowanych:**
    - Pasek stories znajomych z możliwością dodania własnego story
    - Lista feedów znajomych z możliwością dodania własnego feeda
    - Interakcje z feedami: reakcje / polubienia, komentarze oraz edycja i usuwanie własnych komentarzy/reakcji

- **`/register`** – Formularz rejestracji (2-krokowy)
  - **Dostęp:** Tylko dla niezalogowanych
  - **Krok 1:** Dane rejestracji
  - **Krok 2:** Kod weryfikacyjny z e-maila

- **`/sign`** – Formularz logowania (2-krokowy)
  - **Dostęp:** Tylko dla niezalogowanych
  - **Krok 1:** Dane logowania
  - **Krok 2:** Kod weryfikacyjny z e-maila

- **`/password-reset`** – Formularz resetowania hasła (2-krokowy)
  - **Dostęp:** Tylko dla niezalogowanych
  - **Krok 1:** Adres e-mail
  - **Krok 2:** Kod z e-maila + nowe hasło

### Użytkownicy i profil

- **`/users`** – Lista użytkowników
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Tabela z wynikami, sortowanie, filtrowanie, paginacja
  - **Akcje:**
    - *Administrator:* Przycisk otwierający modal dodawania użytkownika
    - *Administrator (wiersz tabeli):* Przycisk zmiany statusu użytkownika

- **`/users/{user-link}`** – Profil użytkownika
  - **Dostęp:** Tylko dla zalogowanych
  - **Header:**
    - *Właściciel, Administrator, Zaakceptowany znajomy:* Rozszerzony header ze szczegółowymi informacjami o użytkowniku
    - *Pozostali użytkownicy:* Podstawowy header
  - **Akcje w nagłówku:**
    - *Właściciel:* Przycisk edycji konta oraz przycisk usunięcia konta
    - *Pozostali:* Przycisk relacji znajomości
    - *Administrator:* Przycisk zmiany statusu użytkownika
  - **Nawigacja:** Przyciski przejścia do pozostałych podstron użytkownika
  - **Zawartość profilu:**
    - Lista stories użytkownika (*Właściciel:* możliwość dodania oraz usunięcia story)
    - Lista feedów użytkownika (*Właściciel:* możliwość dodania, edycji oraz usunięcia feeda)

- **`/users/{user-link}/feeds`** – Lista feedów użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania feeda
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji feeda
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia feeda
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu feeda

- **`/users/{user-link}/stories`** – Lista stories użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania story
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji story
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia story
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu story

- **`/users/{user-link}/friends`** – Lista znajomych użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania znajomego
    - *Właściciel | Uczestnik znajomości (wiersz tabeli):* Przycisk edycji statusu relacji znajomego (akceptuj / odrzuć)
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia znajomego

- **`/users/{user-link}/goals`** – Lista celów użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Wymóg roli:** Podstrona profilu dostępna tylko dla roli **Uczestnik**
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania celu
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji celu
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia celu
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu celu

- **`/users/{user-link}/pages`** – Lista stron użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Wymóg roli:** Podstrona profilu dostępna tylko dla roli **Organizator**
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania strony
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji strony
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia strony
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu strony

- **`/users/{user-link}/events`** – Lista wydarzeń użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Wymóg roli:** Podstrona profilu dostępna tylko dla roli **Organizator**
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania wydarzenia
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji wydarzenia
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia wydarzenia
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu wydarzenia

- **`/users/{user-link}/trainings`** – Lista treningów użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Wymóg roli:** Podstrona profilu dostępna tylko dla roli **Uczestnik**
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania treningu
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji treningu
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia treningu
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu treningu

- **`/users/{user-link}/notifications`** – Lista powiadomień użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel (wiersz tabeli):* Przycisk edycji statusu powiadomienia (odczytane/nieodczytane)
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia powiadomienia

- **`/users/{user-link}/push-subscriptions`** – Lista przeglądarek do wysyłania powiadomień
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika, sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Właściciel:* Przycisk otwierający modal dodawania przeglądarki
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji przeglądarki
    - *Właściciel (wiersz tabeli):* Przycisk edycji statusu przeglądarki
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia przeglądarki

- **`/users/{user-link}/conversations`** – Konwersacje użytkownika
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok:** Podstawowy header, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika
  - **Dla Właściciela:** Sortowanie, filtrowanie, tabela z wynikami, paginacja, usuwanie konwersacji
  - **Dla Pozostałych (Zaakceptowany znajomy | Administrator):** Chat z wiadomościami do i od właściciela

### Cele, treningi, strony i wydarzenia

- **`/goals/{goal-link}`** – Profil celu
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok i nawigacja:** Podstawowy header ze szczegółowymi informacjami o celu, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika
  - **Akcje w nagłówku:**
    - *Właściciel:* Przycisk edycji celu oraz przycisk usunięcia celu
    - *Właściciel | Administrator:* Przycisk zmiany statusu celu
  - **Uczestnicy i wyniki:**
    - Tabela z listą uczestników + przycisk zmiany statusu uczestnika (*dla uczestnika*)
      - Podtabela przy każdym uczestniku z listą wyników (wyniki dodawane automatycznie przez backend na podstawie powiązanych treningów i wydarzeń) + przycisk zmiany statusu wyniku (*dla właściciela wyniku*)

- **`/trainings/{training-link}`** – Profil treningu
  - **Dostęp:** Tylko dla zalogowanych (Właściciel | Zaakceptowany znajomy | Administrator)
  - **Widok i nawigacja:** Podstawowy header ze szczegółowymi informacjami o treningu, przycisk powrotu do profilu, przyciski do pozostałych podstron użytkownika
  - **Akcje w nagłówku:**
    - *Właściciel:* Przycisk edycji treningu oraz przycisk usunięcia treningu
    - *Właściciel | Administrator:* Przycisk zmiany statusu treningu
  - **Zawartość i powiązania (struktura tabel):**
    - Tabela z listą uczestników + przycisk zmiany statusu uczestnika (*dla uczestnika*)
    - Tabela z listą dyscyplin
      - Podtabela z listą dystansów
        - Podtabela z listą subdystansów
          - Podtabela z listą wyników

- **`/pages`** – Lista stron
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Organizator:* Przycisk otwierający modal dodawania strony
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji strony
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia strony
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu strony

- **`/pages/{page-link}`** – Profil strony
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Podstawowy header ze szczegółowymi informacjami o stronie
  - **Akcje w nagłówku:**
    - *Wszyscy:* Przycisk obserwacji / odobserwowania strony
    - *Właściciel:* Przycisk edycji strony oraz przycisk usunięcia strony
    - *Właściciel | Administrator:* Przycisk zmiany statusu strony
  - **Zawartość:**
    - Tabela z listą uczestników + przycisk zmiany statusu uczestnika (*dla uczestnika*)
    - Tabela z listą wydarzeń powiązanych ze stroną + przycisk otwierający modal dodawania nowego wydarzenia powiązanego ze stroną (*dla wuczestnika*)

- **`/events`** – Lista wydarzeń
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Akcje:**
    - *Organizator:* Przycisk otwierający modal dodawania wydarzenia
    - *Właściciel (wiersz tabeli):* Przycisk otwierający modal edycji wydarzenia
    - *Właściciel (wiersz tabeli):* Przycisk usunięcia wydarzenia
    - *Właściciel i Administrator (wiersz tabeli):* Przycisk zmiany statusu wydarzenia

- **`/events/{event-link}`** – Profil wydarzenia
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Podstawowy header ze szczegółowymi informacjami o stronie (element nadrzędny do wydarzenia)
  - **Akcje w nagłówku:**
    - *Wszyscy:* Przycisk powrotu do strony
    - *Właściciel:* Przycisk edycji wydarzenia oraz przycisk usunięcia wydarzenia
    - *Właściciel | Administrator:* Przycisk zmiany statusu wydarzenia
  - **Zawartość i powiązania (struktura tabel):**
    - Tabela z listą dyscyplin
      - Podtabela z listą dystansów: Możliwość zapisania się na dystans (*dla roli Uczestnik, gdy nie jest jeszcze zapisany*)
        - Podtabela z listą uczestników: Przycisk zmiany statusu uczestnika (*dla uczestnika*), Możliwość dodania wyniku uczestnika (*dla właściciela wydarzenia*)
          - Podtabela z listą subdystansów (listą wyników dla danego użytkownika): Przycisk zmiany danych wyniku (*dla właściciela wydarzenia*)

- **`/statistics`** – Statystyki
  - **Dostęp:** Tylko dla zalogowanych
  - **Widok:** Sortowanie, filtrowanie, tabela z wynikami, paginacja
  - **Funkcjonalność:** Przełączanie między rekordami a progresem

## Problemy

- kamera na froncie
- gps na froncie przy dodawaniu treningu
- tryb ciemny do poprawy style
- zapisywanie wyświetleń encji po wejściu na jakiś profil
- informacje o typie feeda do wyświetlenia
- informacje o wyświetleniach przy encjach
- informacje o ilości follow na profilach
- informacje o ilości znajomych na profilach

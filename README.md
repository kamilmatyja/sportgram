## Nazwa

### Sportgram

## Technologie

- Backend: PHP 8.5 + Symfony 8.0
- Baza danych: PostgreSQL 18.3
- Frontend: React 19.2 + Vite
- UI: Bootstrap 5.3
- PWA: manifest + Service Worker
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
- `docker-compose.yml` - środowisko lokalne
- `Makefile` - automatyzacja najczęstszych komend

## Budowanie

### Automatycznie

```bash
make build
```

### Ręcznie

```bash
docker compose up -d --build
cp backend/.env.example backend/.env
docker compose exec php composer install
docker compose exec php php bin/console doctrine:migrations:migrate -n
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
```

## Podstrony

- `/` - strona główna, dla niezalogowanych pokazuje przyciski do logowania / rejestracji, a dla zalogowanych listy stories / feeds
- `/register` - formularz rejestracji 2 krokowy, tylko dla niezalogowanych
- `/sign` - formularz logowania 2 krokowy, tylko dla niezalogowanych
- `/password-reset` - formularz resetowania hasła 2 krokowy, tylko dla niezalogowanych
- `/users` - lista użytkowników, tylko dla zalogowanych
- `/users/{user-link}` - profil użytkownika, z przyciskiem znajomości dla innych użytkowników
- `/users/{user-link}/feeds` - lista feedów użytkownika i formularz dodawania feeda
- `/users/{user-link}/stories` - lista stories użytkownika i formularz dodawania story
- `/users/{user-link}/friends` - lista znajomych użytkownika
- `/users/{user-link}/goals` - lista celów użytkownika, tylko dla roli Uczestnik
- `/users/{user-link}/pages` - lista stron użytkownika, tylko dla roli Organizator
- `/users/{user-link}/events` - lista wydarzeń użytkownika, tylko dla roli Organizator
- `/users/{user-link}/trainings` - lista treningów użytkownika, tylko dla roli Uczestnik
- `/users/{user-link}/notifications` - lista powiadomień użytkownika
- `/users/{user-link}/push-subscriptions` - lista przeglądarek do wysyłania powiadomień
- `/users/{user-link}/conversations` - wiadomości między użytkownikami albo aktywności własne
- `/goals/{goal-link}` - profil celu, tylko dla zalogowanych
- `/trainings/{training-link}` - profil treningu, tylko dla zalogowanych
- `/pages` - lista stron z przyciskiem obserwacji, tylko dla zalogowanych
- `/pages/{page-link}` - profil strony, tylko dla zalogowanych
- `/events` - lista wydarzeń, tylko dla zalogowanych
- `/events/{event-link}` - profil wydarzenia, tylko dla zalogowanych
- `/statistics` - statystyki, tylko dla zalogowanych

## Problemy

- wysyłka email nie działa
- wysyłka push wiadomości nie działa
- kamera na froncie
- gps na froncie przy dodawaniu treningu
- działająca zmiana języka / motywu
- zapisywanie wyświetleń encji po wejściu na jakiś profil
- informacje o typie feeda do wyświetlenia
- informacje o wyświetleniach przy encjach
- informacje o ilości follow na profilach
- informacje o ilości znajomych na profilach
- raw style w komponentach

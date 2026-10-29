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

## Standardy i Wytyczne Rozwoju (Skills)

Szczegółowe reguły architektoniczne i implementacyjne znajdują się w folderze `skills/`:
- [Standardy kodu frontendu](skills/frontend-standards/SKILL.md) (`skills/frontend-standards/SKILL.md`):
  - Maksymalna abstrakcja, unikanie duplikacji (DRY) oraz maksymalne wykorzystanie istniejących paczek (`@mantine/core`, `@tanstack/react-query`, itp.).
  - Pełna spójność implementacyjna i behawioralna podstron.
  - Wszystkie style w dedykowanych plikach CSS (absolutny zakaz inline styli i atrybutu `style`).
  - 100% tekstów w `useTranslation()` (zakaz surowych stringów).
  - Formularze bez wartości domyślnych, bez placeholderów, bez ukrytych pól i z zabezpieczeniem double-submit (`loading`, `disabled`).
  - Toasty dla każdej akcji API zmieniającej stan (POST, PUT, PATCH, DELETE): osobny toast w prawym górnym rogu z sukcesem/błędem, brak statycznych alertów w formularzach, błędy walidacji przypisywane bezpośrednio pod konkretne pola formularza (i nietrafiające do toasta).
  - Konwencje nazewnictwa plików, zakaz debugów (`console.log`) oraz Definition of Done (`npm run check` i `npm run build`).
- [UI Design System i Spójność Wizualna](skills/ui-design-system/SKILL.md) (`skills/ui-design-system/SKILL.md`):
  - Ujednolicone wymiary, paddingi, marginesy, cienie, typografia, ikony i animacje.
  - Pełne wsparcie dla motywu jasnego oraz ciemnego (Light / Dark mode).
  - Stuprocentowa responsywność (Mobile-first, tablety, desktop).
- [Standardy architektury backendu](skills/backend-standards/SKILL.md) (`skills/backend-standards/SKILL.md`):
  - Nowoczesny PHP 8.5 (Property Hooks, strict_types=1) i Symfony 8.1.
  - Brak tablic (`array`) na rzecz DTO, Value Objects i kolekcji.
  - Silne i ścisłe typowanie wszystkich właściwości, argumentów i wartości zwracanych.
  - Wszystkie typy i statusy jako enumy liczbowe (`BackedEnum: int`).
  - Wszystkie ID encji jako UUID.
  - Podział odpowiedzialności MVC: Kontroler, Validator, Serwis, Repozytorium, Entity, Resource/DTO, Voter, Event/Subscriber.
  - Standardy REST API i szczegółowa dokumentacja Swagger / OpenAPI (`/api/doc`).
  - Pełne obtestowanie w PHPUnit oraz Definition of Done (`php-cs-fixer` i `phpunit`).

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

- kamera na froncie
- gps na froncie przy dodawaniu treningu
- tryb ciemny do poprawy style
- zapisywanie wyświetleń encji po wejściu na jakiś profil
- informacje o typie feeda do wyświetlenia
- informacje o wyświetleniach przy encjach
- informacje o ilości follow na profilach
- informacje o ilości znajomych na profilach

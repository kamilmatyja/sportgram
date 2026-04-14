# Sportgram starter

Czysty szkielet projektu:
- Backend: PHP 8.5 + Symfony 8.0 (REST API JSON)
- DB: PostgreSQL 18.3
- Frontend: React 19.2 (Vite)
- PWA: instalacja z przeglądarki (`manifest.webmanifest`) + Service Worker
- Funkcje urządzenia: powiadomienia (`Notification API`) + kamera (`MediaDevices.getUserMedia`)

## Struktura

- `backend/` - API Symfony
- `frontend/` - aplikacja React generująca HTML po stronie klienta
- `infra/` - Dockerfile PHP + konfiguracja Nginx
- `docker-compose.yml` - środowisko lokalne (php, nginx, postgres)

## Start (lokalnie)

1. Uruchom kontenery:

```bash
docker compose up -d --build
```

2. Zainstaluj zależności backendu:

```bash
docker compose exec php composer install
docker compose exec php composer require symfony/routing symfony/validator
```

3. Uruchom frontend:

```bash
cd frontend
npm install
npm run dev
```

4. Otwórz:
- API: `http://localhost:8080/api/health`
- Frontend: `http://localhost:5173`

## Uwaga o ikonach PWA

Starter zawiera gotowe ikony SVG:
- `frontend/public/icon-192.svg`
- `frontend/public/icon-512.svg`

## Kolejne kroki

- Dodać encje i migracje (`php bin/console make:entity`, `make:migration`, `doctrine:migrations:migrate`)
- Dodać autoryzację JWT do API
- Podpiąć Web Push (VAPID) po stronie backendu

5. Uruchomienie testów
-  docker compose exec php vendor/bin/phpunit tests/Factory/FactorySmokeTest.php --testdox

6. Tworzenie migracji
- docker compose exec php php bin/console doctrine:migrations:diff
- docker compose exec php php bin/console doctrine:migrations:migrate -n

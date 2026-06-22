# Sportgram

Czysty szkielet projektu:
- Backend: PHP 8.5 + Symfony 8.0 (REST API JSON)
- DB: PostgreSQL 18.3
- Frontend: React 19.2 (Vite)
- Wygląd: Bootstrap 5.3
- PWA: instalacja z przeglądarki (`manifest.webmanifest`) + Service Worker
- Funkcje urządzenia: powiadomienia (`Notification API`) + kamera (`MediaDevices.getUserMedia`)

## Struktura

- `backend/` - API Symfony
- `frontend/` - aplikacja React generująca HTML po stronie klienta
- `infra/` - Dockerfile PHP + konfiguracja Nginx
- `docker-compose.yml` - środowisko lokalne (php, nginx, postgres)

## Start

1. Uruchom kontenery:

```bash
docker compose up -d --build
```

2. Zainstaluj zależności backendu:

```bash
docker compose exec php composer install
```

3. Przejdź do katalogu frontend:

```bash
cd frontend
```

4. Zainstaluj zależności frontendu:

```bash
npm install
```

5. Zbuduj frontend:

```bash
npm run build
```

6. Uruchom frontend:

```bash
npm run dev
```

7. Otwórz:

- API: `http://localhost:8080`
- Dokumentacja API json `http://localhost:8080/api/doc.json`
- Dokumentacja API swagger `http://localhost:8080/api/doc`
- Frontend: `http://localhost:5173`

8. Migracje:

```bash
docker compose exec php php bin/console doctrine:migrations:diff
docker compose exec php php bin/console doctrine:migrations:migrate -n
```

9. Testy:

```bash
docker compose exec php vendor/bin/phpunit
docker compose exec php bin/phpunit --coverage-html var/coverage
docker compose exec php vendor/bin/phpunit tests/Factory/FactorySmokeTest.php --testdox
```

10. Formatowanie kodu:

```bash
docker compose exec php vendor/bin/php-cs-fixer fix
```

11. Ponowne uruchomienie:

```bash
docker compose up -d
cd frontend
npm run dev
```

12. Podstrony:

- / (strona główna, dla niezalogowanych pokazuje przyciski do logowania / rejestracji, a dla zalogowanych pokazuje
  listy: stories / feeds)
- /register (formularz rejestracji 2 krokowy - tylko dla niezalogowanych)
- /sign (formularz logowania 2 krokowy - tylko dla niezalogowanych)
- /password-reset (formularz resetowania hasła 2 krokowy - tylko dla niezalogowanych)
- /users (lista użytkowników - tylko dla zalogowanych)
- /users/{user-link} (profil użytkownika, jeżeli user inny niż ja to pokazuje przycisk
  znajomości - tylko dla zalogowanych)
- /users/{user-link}/feeds (lista feeds użytkownika, pokazuje formularz dodawania feed - tylko dla zalogowanych)
- /users/{user-link}/stories (lista stories użytkownika, pokazuje formularz dodawania story - tylko dla zalogowanych)
- /users/{user-link}/friends (lista znajomych użytkownika, pokazuje liste friends - tylko dla zalogowanych)
- /users/{user-link}/goals (lista celów użytkownika, pokazuje formularz dodawania celu - tylko dla roli Uczestnik)
- /users/{user-link}/pages (lista stron użytkownika, pokazuje formularz dodawania strony - tylko dla roli Organizator)
- /users/{user-link}/events (lista wydarzeń użytkownika, pokazuje formularz dodawania wydarzenia - tylko dla roli
  Organizator)
- /users/{user-link}/trainings (lista treningów użytkownika, pokazuje formularz dodawania treningu - tylko dla roli
  Uczestnik)
- /users/{user-link}/notifications (lista powiadomień użytkownika - tylko dla zalogowanych)
- /users/{user-link}/push-subscriptions (lista przeglądarek do wysyłania powiadomień użytkownika - tylko dla
  zalogowanych)
- /users/{user-link}/conversations (lista wiadomości międdzy mną, a tym użytkownikiem jeżeli user inny niż ja, w
  przeciwnym wypadku pokazuje liste aktywności - tylko dla zalogowanych)
- /goals/{goal-link} (profil celu - tylko dla zalogowanych)
- /trainings/{training-link} (profil treningu - tylko dla zalogowanych)
- /pages ( lista stron, pokazuje przycisk obserwacji - tylko dla zalogowanych)
- /pages/{page-link} (profil strony - tylko dla zalogowanych)
- /events (lista wydarzeń - tylko dla zalogowanych)
- /events/{event-link} (profil wydarzenia - tylko dla zalogowanych)
- /statistics (statystyki - tylko dla zalogowanych)

13. Brakuje:
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
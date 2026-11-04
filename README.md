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

### 1. Autentykacja i strona główna

#### `/` – Strona główna
- **Dostęp:** Wszyscy (niezalogowani i zalogowani).
- **Widok dla niezalogowanych:**
  - Komunikat powitalny oraz kafelki/przyciski zachęcające do logowania (`/sign`) i rejestracji (`/register`).
- **Widok dla zalogowanych:**
  - **Pasek relacji (Stories bar):**
    - Kafelek `Dodaj relację` z przyciskiem `+` (otwiera modal dodawania story z wyborem pliku zdjęcia lub wideo).
    - Lista aktywnych kółek relacji dodanych przez znajomych:
      - Wskaźnik statusu przeczytania/obejrzenia relacji.
      - Kliknięcie w kafelek otwiera pełnoekranowy modal odtwarzacza relacji (`StoryViewerModal`).
      - W odtwarzaczu: avatar i nazwa autora, czas publikacji, pasek postępu czasu wyświetlania relacji, przyciski przejścia do poprzedniej/następnej relacji, przycisk zamknięcia oraz przycisk `Usuń relację` (dostępny tylko dla autora danej relacji lub Administratora).
  - **Blok publikacji wpisu (Feed creator):**
    - Przycisk / pole tekstowe otwierające modal tworzenia wpisu (`Dodaj wpis`):
      - Pole tekstowe treści wpisu (`description`).
      - Pole wyboru pliku multimedialnego (`photo` – zdjęcie lub wideo).
      - Przycisk `Opublikuj` oraz `Anuluj`.
  - **Strumień wpisów (Feeds stream):**
    - Nieskończone przewijanie (infinite scroll) wpisów własnych oraz znajomych.
    - W każdej karcie wpisu:
      - Nagłówek: Avatar autora, imię i nazwisko (link do profilu `/users/:link`), data publikacji, licznik wyświetleń (`EntityViewCounter`).
      - Menu opcji wpisu (ikona trzech kropek):
        - `Edytuj wpis` – otwiera modal edycji treści i zdjęcia wpisu (widoczne tylko dla autora wpisu lub Administratora).
        - `Usuń wpis` – modal potwierdzenia usunięcia wpisu (widoczne tylko dla autora wpisu lub Administratora).
      - Treść tekstowa wpisu oraz załączone zdjęcie / wideo.
      - Pasek interakcji:
        - Przycisk dodawania/zmiany reakcji (polubienia) z licznikiem reakcji; kliknięcie własnej reakcji cofa polubienie.
        - Przycisk komentarzy z licznikiem komentarzy (rozwija / zwija sekcję komentarzy).
      - Sekcja komentarzy (pod wpisem):
        - Lista komentarzy: avatar i autor (link do profilu), treść komentarza, data utworzenia.
        - Akcje na komentarzu: `Edytuj` (inline edycja treści z przyciskami Zapisz / Anuluj) oraz `Usuń` (dostępne wyłącznie dla autora danego komentarza lub Administratora).
        - Formularz dodawania nowego komentarza: pole tekstowe oraz przycisk dodania komentarza.

#### `/sign` – Logowanie
- **Dostęp:** Tylko dla niezalogowanych (użytkownik zalogowany jest automatycznie przekierowywany na stronę główną `/`).
- **Krok 1 (Formularz logowania):**
  - Pole tekstowe `Login` (adres e-mail lub `@link` użytkownika).
  - Pole hasła `Hasło`.
  - Przycisk `Zaloguj się`.
  - Linki pomocnicze: `Nie masz konta? Zarejestruj się` (`/register`) oraz `Zapomniałeś hasła?` (`/password-reset`).
- **Krok 2 (Weryfikacja dwuetapowa PIN):**
  - Wyświetlany po poprawnym wprowadzeniu hasła, gdy wymagane jest potwierdzenie e-mail.
  - Pole wprowadzenia 6-cyfrowego kodu `PIN` przesłanego na adres e-mail.
  - Przycisk `Zweryfikuj PIN`.
  - Przycisk `Wyślij kod ponownie` (z licznikiem czasu oczekiwania).
  - Przycisk `Wróć do logowania` (powrót do kroku 1).

#### `/register` – Rejestracja
- **Dostęp:** Tylko dla niezalogowanych (zalogowani przekierowywani na `/`).
- **Krok 1 (Dane konta):**
  - Pola tekstowe: `Imię`, `Nazwisko`, `Adres e-mail`, `Hasło`, `Unikalny link` (`link` profilu).
  - Wybór ról w systemie (MultiSelect): `Uczestnik`, `Organizator` (przynajmniej jedna rola wymagana).
  - Wybór płci (Select): `Mężczyzna`, `Kobieta`.
  - Wybór koloru przewodniego profilu (`color`).
  - Pola wyboru plików: `Zdjęcie profilowe`, `Zdjęcie w tle` (banner).
  - Przycisk `Dalej` (walidacja i wysłanie kodu PIN na e-mail).
  - Link `Masz już konto? Zaloguj się` (`/sign`).
- **Krok 2 (Weryfikacja adresu e-mail):**
  - Pole `Kod PIN` z wiadomości e-mail.
  - Przycisk `Potwierdź rejestrację`.
  - Przycisk `Wyślij kod ponownie`.
  - Przycisk `Wróć` (powrót do edycji danych w kroku 1).

#### `/password-reset` – Resetowanie hasła
- **Dostęp:** Tylko dla niezalogowanych.
- **Krok 1 (Wysłanie kodu):**
  - Pole tekstowe `Adres e-mail`.
  - Przycisk `Wyślij kod resetujący`.
  - Link powrotu do logowania (`/sign`).
- **Krok 2 (Ustawienie nowego hasła):**
  - Pole `Kod PIN` z wiadomości e-mail.
  - Pole `Nowe hasło`.
  - Pole `Powtórz nowe hasło`.
  - Przycisk `Zmień hasło`.
  - Przycisk `Wyślij kod ponownie`.
  - Przycisk `Wróć` (powrót do kroku 1).

---

### 2. Użytkownicy i profil

#### `/users` – Lista użytkowników
- **Dostęp:** Wszyscy zalogowani użytkownicy.
- **Pasek filtrów:**
  - Wyszukiwarka tekstowa po `Imieniu i nazwisku`.
  - Wyszukiwarka tekstowa po `Adresie e-mail`.
  - Wyszukiwarka tekstowa po `Linku` profilu.
  - Filtr wyboru `Roli` (Uczestnik, Organizator, Administrator).
  - Filtr wyboru `Płci` (Mężczyzna, Kobieta).
  - Filtr wyboru `Statusu konta` (np. Aktywny, Oczekujący, Zablokowany).
  - Przycisk `Resetuj filtry` (wyświetla liczbę aktywnych filtrów).
- **Sortowanie i paginacja:**
  - Opcje sortowania: Data utworzenia, Imię i nazwisko, Adres e-mail, Status konta (rosnąco/malejąco).
  - Wybór limitu wierszy na stronę (10, 20, 50, 100) oraz paginacja stron.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj użytkownika` – widoczny **wyłącznie dla Administratora**.
    - Modal dodawania użytkownika: imię, nazwisko, email, hasło, unikalny link, role, płeć, kolor profilu, zdjęcie profilowe, banner.
- **Kolumny tabeli:**
  - `Użytkownik`: Avatar, imię i nazwisko, identyfikator `@link`.
  - `E-mail`: Adres e-mail użytkownika.
  - `Role`: Odznaki (Badges) przypisanych ról użytkownika.
  - `Płeć`: Płeć użytkownika.
  - `Status`: Kolorowa odznaka statusu konta.
- **Akcje w wierszu tabeli:**
  - Przycisk `Szczegóły` (ikona oka) – przejście do profilu `/users/:link` (dostępny dla każdego zalogowanego).
  - Menu `Zmień status` (ikona suwaków) – widoczne **wyłącznie dla Administratora** (zmiana statusu konta na: Aktywny, Oczekujący, Zablokowany itp.).
  - Przycisk `Edytuj użytkownika` (ikona ołówka) – widoczny tylko dla **Właściciela danego konta** lub **Administratora** (modal edycji danych profilu).
  - Przycisk `Usuń użytkownika` (ikona kosza) – widoczny tylko dla **Właściciela danego konta** lub **Administratora** (modal potwierdzenia usunięcia konta).

#### `/users/:link` – Profil użytkownika
- **Dostęp:** Zalogowani użytkownicy.
- **Nagłówek profilu:**
  - Zdjęcie w tle (banner), avatar użytkownika, imię i nazwisko, `@link`, płeć, odznaki ról, licznik wyświetleń profilu (`EntityViewCounter`).
  - **Akcje relacji i zarządzania w nagłówku:**
    - **Dla Właściciela profilu:**
      - Przycisk `Edytuj profil` (otwiera modal: imię, nazwisko, link, płeć, kolor motywu, zmiana zdjęć profilowych i bannera).
      - Przycisk `Usuń konto` (modal potwierdzenia usunięcia konta).
    - **Dla Administratora:**
      - Dodatkowo menu wyboru i zmiany statusu konta użytkownika.
    - **Dla innego zalogowanego użytkownika:**
      - Gdy brak relacji znajomości: Przycisk `Dodaj do znajomych` (wysyła zaproszenie).
      - Gdy wysłano zaproszenie (status oczekujący): Przycisk `Anuluj zaproszenie`.
      - Gdy otrzymano zaproszenie od tego użytkownika: Przyciski `Zaakceptuj` oraz `Odrzuć`.
      - Gdy relacja jest zaakceptowana: Przycisk `Usuń ze znajomych` (modal potwierdzenia usunięcia z listy znajomych).
- **Pasek nawigacji profilu (`UserProfileNav`):** Przejścia do odpowiednich podstron powiązanych z użytkownikiem (widoczność przycisków zależna od ról profilowanego użytkownika oraz uprawnień odwiedzającego).
- **Główna zawartość profilu:**
  - *Dla Właściciela, Administratora lub Zaakceptowanego znajomego:*
    - **Sekcja Relacji (Stories):** Karuzela miniatur relacji dodanych przez tego użytkownika.
      - Dla Właściciela: Przycisk dodania nowego story (`+`).
      - Kliknięcie w relację: Otwiera odtwarzacz `StoryViewerModal` z możliwością usunięcia relacji przez Właściciela lub Administratora.
    - **Sekcja Wpisów (Feeds):** Strumień wszystkich wpisów użytkownika z pełną obsługą polubień, komentarzy, a także edycji i usuwania własnych wpisów przez Właściciela lub Administratora.
  - *Dla pozostałych użytkowników (brak zaakceptowanej znajomości):*
    - Wyświetla się komunikat informujący o prywatnym profilu dostępnym wyłącznie dla znajomych.

#### `/users/:link/feeds` – Wpisy użytkownika (Tabela)
- **Dostęp:** Właściciel profilu, Administrator lub Zaakceptowany znajomy (dla pozostałych: brak dostępu / 404).
- **Pasek filtrów i sortowanie:**
  - Filtr wyszukiwania tekstowego po `Treści wpisu`.
  - Filtr wyboru `Statusu wpisu`.
  - Sortowanie: Data utworzenia, Status.
  - Przycisk resetowania filtrów, paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj wpis` – widoczny dla **Właściciela profilu** lub **Administratora** (modal: treść, załącznik pliku zdjęcia/wideo).
- **Kolumny tabeli:**
  - `Treść`: Miniatura załącznika multimedialnego, fragment treści tekstowej wpisu.
  - `Data publikacji`: Data i godzina dodania.
  - `Status`: Kolorowa odznaka statusu.
- **Akcje w wierszu tabeli:**
  - Przycisk `Podgląd wpisu` (ikona oka) – otwiera modal pełnego podglądu wpisu ze zdjęciem i komentarzami.
  - Menu `Zmień status` – widoczne dla **Właściciela** lub **Administratora** (zmiana statusu wpisu).
  - Przycisk `Edytuj wpis` – widoczny dla **Właściciela** lub **Administratora** (modal edycji).
  - Przycisk `Usuń wpis` – widoczny dla **Właściciela** lub **Administratora** (modal potwierdzenia).

#### `/users/:link/stories` – Relacje użytkownika (Tabela)
- **Dostęp:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Pasek filtrów i sortowanie:**
  - Filtr wyboru `Statusu relacji`.
  - Sortowanie: Data utworzenia, Data wygaśnięcia, Status.
  - Przycisk resetowania filtrów, paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj relację` – widoczny wyłącznie dla **Właściciela profilu** (modal wyboru pliku zdjęcia/wideo).
- **Kolumny tabeli:**
  - `Podgląd`: Miniatura zdjęcia/filmu relacji.
  - `Data utworzenia`: Czas dodania relacji.
  - `Status`: Odznaka statusu relacji.
- **Akcje w wierszu tabeli:**
  - Przycisk `Odtwórz relację` (ikona oka) – otwiera pełnoekranowy modal odtwarzacza relacji.
  - Menu `Zmień status` – widoczne dla **Właściciela** lub **Administratora**.
  - Przycisk `Usuń relację` – widoczne dla **Właściciela** lub **Administratora**.

#### `/users/:link/friends` – Znajomi użytkownika
- **Dostęp:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Pasek filtrów i sortowanie:**
  - Wyszukiwarka użytkownika po imieniu, nazwisku lub identyfikatorze `@link`.
  - Filtr `Statusu relacji` (Oczekujące, Zaakceptowane, Odrzucone, Zablokowane).
  - Sortowanie po dacie aktualizacji/utworzenia relacji oraz statusie. Paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj znajomego` – widoczny dla **Właściciela profilu** (otwiera modal wyszukiwarki innych użytkowników w systemie i wysłania zaproszenia).
- **Kolumny tabeli:**
  - `Użytkownik`: Avatar, imię i nazwisko, `@link` (odnośnik do profilu).
  - `Status relacji`: Kolorowa odznaka statusu znajomości.
- **Akcje w wierszu tabeli:**
  - Przycisk `Profil` (ikona oka) – przejście do profilu danego znajomego.
  - Menu `Zmień status relacji`:
    - Dla odbiorcy zaproszenia: Akceptuj, Odrzuć, Zablokuj.
    - Dla nadawcy zaproszenia: Anuluj zaproszenie.
  - Przycisk `Usuń znajomego` – widoczny dla **Właściciela profilu** (modal potwierdzenia usunięcia relacji).

#### `/users/:link/conversations` – Wiadomości i konwersacje
- **Dostęp:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Dwa odrębne tryby widoku:**
  - **Tryb 1: Widok Właściciela profilu (Lista wszystkich konwersacji):**
    - Przycisk `Nowa wiadomość` – otwiera modal rozpoczęcia czatu (wybór rozmówcy z listy zaakceptowanych znajomych, pole treści wiadomości i przycisk Wyślij).
    - Tabela prowadzonych konwersacji:
      - Kolumny: Rozmówca (avatar, imię i nazwisko, `@link`), Ostatnia wiadomość, Czas ostatniej aktywności, Status.
      - Akcje w wierszu: Przejście do widoku bezpośredniego czatu z danym użytkownikiem.
  - **Tryb 2: Widok Zaakceptowanego Znajomego lub Administratora (Bezpośredni czat):**
    - Okno aktywnej rozmowy 1-na-1 z właścicielem profilu:
      - Nagłówek czatu z danymi rozmówcy i statusem.
      - Pasek historii wiadomości: automatyczne przewijanie, doładowywanie starszych wiadomości przy przewijaniu w górę.
      - Wskaźnik pisania na żywo (`Użytkownik pisze...`).
      - Dymki wiadomości z podziałem na wysłane (po prawej) i odebrane (po lewej), ze znacznikami czasu oraz statusem dostarczenia/odczytania.
      - Akcje na własnych wiadomościach: Przycisk edycji wiadomości (inline edycja treści) oraz Przycisk usunięcia wiadomości.
      - Pasek formularza na dole: Pole wprowadzania nowej wiadomości (obsługa klawisza Enter do wysłania) oraz przycisk `Wyślij`.

#### `/users/:link/notifications` – Powiadomienia użytkownika
- **Dostęp:** Dostępne **wyłącznie dla Właściciela konta lub Administratora** (pozostali użytkownicy: brak dostępu / 404).
- **Pasek filtrów i sortowanie:**
  - Filtr wyboru statusu: `Wszystkie`, `Nieprzeczytane`, `Przeczytane`.
  - Sortowanie: Data utworzenia (najnowsze/najstarsze), Status. Paginacja.
- **Kolumny tabeli:**
  - `Tytuł i treść`: Nagłówek powiadomienia oraz pełna treść powiadomienia.
  - `Data`: Data i godzina doręczenia.
  - `Status`: Odznaka (Przeczytane / Nieprzeczytane).
- **Akcje w wierszu tabeli:**
  - Przycisk `Oznacz jako przeczytane / nieprzeczytane` (przełączanie statusu).
  - Przycisk przejścia do zasobu powiązanego z powiadomieniem (jeśli dotyczy np. feeda, komentarza, treningu itp.).
  - Przycisk `Usuń powiadomienie` – widoczny dla Właściciela (modal potwierdzenia).

#### `/users/:link/push-subscriptions` – Subskrypcje powiadomień Web Push
- **Dostęp:** Dostępne **wyłącznie dla Właściciela konta lub Administratora** (pozostali użytkownicy: brak dostępu / 404).
- **Główny pasek narzędziowy:**
  - Przycisk `Zasubskrybuj to urządzenie` – uruchamia rejestrację Service Workera w przeglądarce i generuje klucze Push przez mechanizm VAPID.
  - Przycisk `Dodaj subskrypcję ręcznie` – modal wprowadzania parametrów: endpoint, klucz p256dh, klucz auth.
- **Kolumny tabeli urządzeń:**
  - `Endpoint`: Skrócony adres serwera powiadomień przeglądarki.
  - `Klucze`: Wartości kluczy kryptograficznych subskrypcji.
  - `Data rejestracji`: Data utworzenia subskrypcji.
  - `Status`: Odznaka statusu subskrypcji (np. Aktywna).
- **Akcje w wierszu tabeli:**
  - Menu `Zmień status` – zmiana statusu subskrypcji.
  - Przycisk `Usuń subskrypcję` – usunięcie zarejestrowanego urządzenia.

---

### 3. Cele sportowe

#### `/users/:link/goals` – Cele użytkownika (Tabela)
- **Wymóg roli użytkownika:** Profilowany użytkownik **musi posiadać rolę `Uczestnik`**.
- **Dostęp do podstrony:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Pasek filtrów i sortowanie:**
  - Filtr tekstowy po `Tytule celu`.
  - Filtr tekstowy po `Linku` celu.
  - Filtr wyboru `Statusu celu`.
  - Sortowanie: Data rozpoczęcia, Data zakończenia, Tytuł, Data utworzenia, Status. Paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj cel` – widoczny dla **Właściciela profilu** (z rolą Uczestnik) lub **Administratora**.
    - Modal tworzenia celu:
      - Pola tekstowe: `Tytuł` (automatycznie generujący unikalny `Link`), `Link`, `Lokalizacja`.
      - Pola dat: `Data rozpoczęcia`, `Data zakończenia`.
      - Pole wielowierszowe: `Opis celu`.
      - Wybór `Dyscypliny` sportowej (Select z listy dyscyplin).
      - Pole liczbowe: `Dystans docelowy` (w metrach).
      - MultiSelect `Współuczestnicy / Współpracownicy` – wybór użytkowników z listy zaakceptowanych znajomych.
- **Kolumny tabeli:**
  - `Tytuł`: Tytuł celu, lokalizacja.
  - `Dyscyplina i dystans`: Odznaka dyscypliny sportowej, dystans w metrach.
  - `Okres realizacji`: Data rozpoczęcia i data zakończenia.
  - `Status`: Odznaka statusu celu.
- **Akcje w wierszu tabeli:**
  - Przycisk `Szczegóły` (ikona oka) – przejście do strony celu `/goals/:link`.
  - Menu `Zmień status` – widoczne dla **Właściciela celu** lub **Administratora**.
  - Przycisk `Edytuj cel` – widoczny dla **Właściciela celu** (modal edycji z analogicznymi polami formularza).
  - Przycisk `Usuń cel` – widoczny dla **Właściciela celu** (modal potwierdzenia).

#### `/goals/:link` – Szczegóły celu sportowego
- **Dostęp:** Zalogowani użytkownicy (z dostępem do profilu właściciela). Motyw kolorystyczny dziedziczony z profilu właściciela celu.
- **Pasek nawigacyjny `UserProfileNav`:** Skrócone informacje o twórcy celu oraz przycisk powrotu do profilu.
- **Karta główna celu:**
  - Tytuł celu, `@link`, licznik wyświetleń celu (`EntityViewCounter`), lokalizacja, przedział czasowy, odznaka statusu, pełny opis.
  - **Akcje w nagłówku karty celu:**
    - Menu `Zmień status celu` – widoczne dla **Właściciela** lub **Administratora**.
    - Przycisk `Edytuj cel` – widoczny dla **Właściciela**.
    - Przycisk `Usuń cel` – widoczny dla **Właściciela** (po usunięciu przekierowuje do listy celów).
- **Sekcja "Uczestnicy celu" (Współpracownicy):**
  - Tabela uczestników celu:
    - Kolumny: Użytkownik (avatar, imię i nazwisko, `@link` z odnośnikiem do profilu), Status uczestnictwa.
    - Akcje w wierszu: Menu `Zmień status uczestnictwa` (dostępne dla danego uczestnika – akceptacja/odrzucenie, oraz dla Właściciela celu).
- **Sekcja "Dyscyplina i wyniki":**
  - Informacja o dyscyplinie oraz docelowym dystansie w metrach.
  - Przycisk `Dodaj wynik` – widoczny dla danego aktywnego uczestnika lub Właściciela celu:
    - Modal dodawania wyniku: pole liczbowe `Dystans` (w metrach), pole liczbowe `Czas` (w sekundach).
  - Tabela wyników per uczestnik:
    - Kolumny: Użytkownik, Dystans, Czas, Data dodania, Status wyniku.
    - Akcje na wyniku:
      - Menu `Zmień status wyniku` (dostępne dla Właściciela celu lub Administratora).
      - Przycisk `Edytuj wynik` (modal edycji czasu i dystansu) – dostępny dla autora wyniku lub Właściciela celu.
      - Przycisk `Usuń wynik` (modal potwierdzenia) – dostępny dla autora wyniku lub Właściciela celu.

---

### 4. Strony organizacji i klubów

#### `/pages` – Lista wszystkich stron
- **Dostęp:** Wszyscy zalogowani użytkownicy.
- **Pasek filtrów i sortowanie:**
  - Filtr tekstowy po `Tytule strony`.
  - Filtr tekstowy po `Linku` strony.
  - Filtr wyboru `Statusu strony`.
  - Sortowanie: Tytuł, Data utworzenia, Status. Paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj stronę` – widoczny dla użytkowników posiadających rolę **`Organizator`** lub **`Administrator`**.
    - Modal tworzenia strony:
      - Pole `Tytuł` (automatycznie generujący unikalny `Link`), `Link`.
      - Pole wielowierszowe `Opis strony`.
      - Wybór `Koloru motywu strony` (`ColorEnum`).
      - Wybór pliku `Logo / Zdjęcie strony` (`photo`).
      - MultiSelect `Współpracownicy / Członkowie strony` (wybór spośród znajomych).
- **Kolumny tabeli:**
  - `Strona`: Logo strony, nazwa strony, identyfikator `@link`.
  - `Status`: Odznaka statusu strony.
- **Akcje w wierszu tabeli:**
  - Przycisk `Szczegóły` (ikona oka) – przejście do profilu strony `/pages/:link`.
  - Menu `Zmień status` – widoczne dla **Właściciela/współtwórcy strony** lub **Administratora**.
  - Przycisk `Edytuj stronę` – widoczny dla **Właściciela strony**.
  - Przycisk `Usuń stronę` – widoczny dla **Właściciela strony** (modal potwierdzenia).

#### `/users/:link/pages` – Strony danego organizatora
- **Wymóg roli użytkownika:** Profilowany użytkownik **musi posiadać rolę `Organizator`**.
- **Dostęp do podstrony:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Widok:**
  - Pasek nawigacyjny `UserProfileNav`.
  - Tabela stron zarządzanych przez profilowanego organizatora.
  - Przycisk `Dodaj stronę` – widoczny wyłącznie dla **Właściciela profilu** (jeśli posiada rolę Organizator).
  - Identyczne kolumny, filtry, sortowanie i akcje wiersza jak na ogólnej liście stron.

#### `/pages/:link` – Profil strony
- **Dostęp:** Wszyscy zalogowani użytkownicy.
- **Dynamiczny motyw strony:** Interfejs przyjmuje kolor wybrany w ustawieniach strony (`page.color`).
- **Nagłówek profilu strony (`PageNav`):**
  - Logo strony, nazwa, `@link`, licznik wyświetleń strony (`EntityViewCounter`), odznaka statusu, pełny opis strony.
  - **Akcje w nagłówku:**
    - Przycisk `Obserwuj / Przestań obserwować stronę` – dostępny dla wszystkich zalogowanych użytkowników (zapisuje/wypisuje z obserwacji strony).
    - Menu `Zmień status strony` – widoczne dla **Właściciela** lub **Administratora**.
    - Przycisk `Edytuj stronę` – widoczny dla **Właściciela** (modal edycji danych, opisu, logo, koloru i współpracowników).
    - Przycisk `Usuń stronę` – widoczny dla **Właściciela** (modal potwierdzenia usunięcia).
- **Sekcja "Członkowie strony" (Uczestnicy organizacji):**
  - Tabela współpracowników/członków strony:
    - Kolumny: Avatar, imię i nazwisko, `@link` (odnośnik do profilu), Status członkostwa.
    - Akcje w wierszu: Menu `Zmień status członkostwa` (dostępne dla danego członka oraz dla Właściciela strony).
- **Sekcja "Wydarzenia strony":**
  - Przycisk `Dodaj wydarzenie` – widoczny dla **Właściciela/członka strony** lub **Administratora** (otwiera zaawansowany konfigurator nowego wydarzenia powiązanego z tą stroną).
  - Tabela wydarzeń powiązanych z tą stroną:
    - Kolumny: Zdjęcie wydarzenia, Tytuł, Lokalizacja, Data rozpoczęcia, Data zakończenia, Status.
    - Akcje w wierszu: Przejście do szczegółów `/events/:link`, Zmiana statusu, Edycja wydarzenia, Usunięcie wydarzenia.

---

### 5. Wydarzenia sportowe

#### `/events` – Lista wszystkich wydarzeń
- **Dostęp:** Wszyscy zalogowani użytkownicy.
- **Pasek filtrów i sortowanie:**
  - Filtr tekstowy po `Tytule wydarzenia`.
  - Filtr tekstowy po `Linku` wydarzenia.
  - Filtr wyboru `Statusu wydarzenia`.
  - Sortowanie: Data rozpoczęcia, Data zakończenia, Tytuł, Lokalizacja, Status, Data utworzenia. Paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj wydarzenie` – widoczny dla użytkowników z rolą **`Organizator`** lub **`Administrator`**.
    - Zaawansowany modal tworzenia wydarzenia:
      - Wybór `Strony organizującej` (Select ze stron, do których należy użytkownik).
      - Pola tekstowe: `Tytuł` (automatycznie generujący unikalny `Link`), `Link`, `Lokalizacja`.
      - Pola dat: `Data rozpoczęcia`, `Data zakończenia`.
      - Pola wielowierszowe: `Opis wydarzenia`, `Regulamin wydarzenia` (`rules`).
      - Pole wyboru pliku: `Zdjęcie wydarzenia` (`photo`).
      - **Hierarchiczny konfigurator dyscyplin, dystansów i subdystansów:**
        - Przycisk `Dodaj dyscyplinę` (wybór z listy `DisciplineEnum`).
        - Dla każdej dyscypliny: Przycisk `Dodaj dystans` (wartość w metrach).
        - Dla każdego dystansu: Przycisk `Dodaj subdystans` (wartość w metrach) z możliwością usuwania poszczególnych elementów.
- **Kolumny tabeli:**
  - `Tytuł`: Miniatura zdjęcia, tytuł wydarzenia, lokalizacja.
  - `Data rozpoczęcia`: Czas startu wydarzenia.
  - `Data zakończenia`: Czas zakończenia wydarzenia.
  - `Status`: Odznaka statusu wydarzenia.
- **Akcje w wierszu tabeli:**
  - Przycisk `Szczegóły` (ikona oka) – przejście do `/events/:link`.
  - Menu `Zmień status` – widoczne dla **Właściciela wydarzenia** lub **Administratora**.
  - Przycisk `Edytuj wydarzenie` – widoczne dla **Właściciela wydarzenia**.
  - Przycisk `Usuń wydarzenie` – widoczne dla **Właściciela wydarzenia** (modal potwierdzenia).

#### `/users/:link/events` – Wydarzenia danego organizatora
- **Wymóg roli użytkownika:** Profilowany użytkownik **musi posiadać rolę `Organizator`**.
- **Dostęp do podstrony:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Widok:**
  - Pasek nawigacyjny `UserProfileNav`.
  - Tabela wydarzeń powiązanych z profilowanym organizatorem.
  - Przycisk `Dodaj wydarzenie` – widoczny dla **Właściciela profilu** (jeśli posiada rolę Organizator).
  - Identyczne kolumny, filtry, sortowanie i akcje wiersza jak na ogólnej liście wydarzeń.

#### `/events/:link` – Szczegóły wydarzenia sportowego
- **Dostęp:** Wszyscy zalogowani użytkownicy. Motyw kolorystyczny dziedziczony ze strony organizatora (`page.color`).
- **Pasek nadrzędny strony (`PageNav`):** Podstawowe informacje o stronie organizującej oraz przycisk powrotu do strony.
- **Karta główna wydarzenia:**
  - Zdjęcie główne wydarzenia, tytuł, `@link`, licznik wyświetleń (`EntityViewCounter`), lokalizacja, przedział czasowy, odznaka statusu.
  - Pełny opis wydarzenia.
  - Osobny blok `Regulamin wydarzenia` (z formatowaniem tekstu).
  - **Akcje w nagłówku karty:**
    - Menu `Zmień status wydarzenia` – widoczne dla **Właściciela** lub **Administratora**.
    - Przycisk `Edytuj wydarzenie` – widoczny dla **Właściciela** (modal pełnej edycji danych, regulaminu, zdjęcia oraz struktury dyscyplin/dystansów).
    - Przycisk `Usuń wydarzenie` – widoczny dla **Właściciela** (modal potwierdzenia, po usunięciu powrót do `/events`).
- **Sekcja "Dyscypliny, dystanse i lista startowa":**
  - Podział na bloki poszczególnych dyscyplin (odznaki).
  - Dla każdego dystansu w ramach dyscypliny:
    - Nagłówek z wartością dystansu w metrach.
    - Przycisk `Zapisz się` (`saveUp`) – widoczny dla zalogowanego użytkownika posiadającego rolę **`Uczestnik`**, o ile nie jest jeszcze zapisany na ten dystans.
    - **Tabela zapisanych uczestników na dany dystans:**
      - Kolumny: Użytkownik (avatar, imię i nazwisko, `@link` z odnośnikiem do profilu), Status uczestnictwa (Aktywny, Odrzucony itp.), Akcje.
      - Akcje wiersza uczestnika:
        - Menu `Zmień status uczestnika` – dostępne dla samego uczestnika oraz dla Właściciela wydarzenia.
        - Przycisk `Dodaj wynik` – widoczny dla **Właściciela wydarzenia**, gdy uczestnik ma aktywny status i nie posiada jeszcze wprowadzonego wyniku na tym dystansie (modal: całkowity czas w sekundach oraz opcjonalne czasy dla poszczególnych subdystansów).
    - **Lista wprowadzonych wyników dla dystansu:**
      - Prezentacja czasu całkowitego (w sekundach).
      - Przycisk rozwijania wiersza (strzałka akordeonu) – po rozwinięciu wyświetla tabelę cząstkowych czasów dla poszczególnych subdystansów.
      - Akcje na wyniku (dostępne dla **Właściciela wydarzenia**):
        - Przycisk `Edytuj wynik` – otwiera modal edycji czasu całkowitego oraz czasów cząstkowych.
        - Przycisk `Usuń wynik` – modal potwierdzenia usunięcia wyniku.

---

### 6. Treningi

#### `/users/:link/trainings` – Treningi użytkownika (Tabela)
- **Wymóg roli użytkownika:** Profilowany użytkownik **musi posiadać rolę `Uczestnik`**.
- **Dostęp do podstrony:** Właściciel profilu, Administrator lub Zaakceptowany znajomy.
- **Pasek filtrów i sortowanie:**
  - Filtr tekstowy po `Tytule treningu`.
  - Filtr tekstowy po `Linku` treningu.
  - Filtr wyboru `Statusu treningu`.
  - Sortowanie: Data rozpoczęcia, Data zakończenia, Tytuł, Lokalizacja, Status, Data utworzenia. Paginacja.
- **Przycisk główny tabeli:**
  - Przycisk `Dodaj trening` – widoczny dla **Właściciela profilu** (z rolą Uczestnik) lub **Administratora**.
    - Modal tworzenia treningu:
      - Pola tekstowe: `Tytuł` (generujący unikalny `Link`), `Link`, `Lokalizacja`.
      - Pola dat: `Data rozpoczęcia`, `Data zakończenia`.
      - Pole wielowierszowe: `Opis treningu`.
      - MultiSelect `Współuczestnicy treningu` (wybór spośród zaakceptowanych znajomych).
      - **Konfigurator dyscyplin, dystansów i danych telemetrycznych/GPS:**
        - Przycisk `Dodaj dyscyplinę` (wybór z listy `DisciplineEnum`).
        - Dla każdej dyscypliny: Dystans (metry) oraz Czas trwania (sekundy).
        - Opcjonalne dodawanie subdystansów: Subdystans (metry), Czas (sekundy), Szerokość geograficzna (`lat`), Długość geograficzna (`lng`), Dokładność (`accuracy`), Prędkość (`speed`).
- **Kolumny tabeli:**
  - `Tytuł`: Tytuł treningu, lokalizacja.
  - `Data rozpoczęcia`: Czas startu treningu.
  - `Data zakończenia`: Czas zakończenia treningu.
  - `Status`: Odznaka statusu treningu.
- **Akcje w wierszu tabeli:**
  - Przycisk `Szczegóły` (ikona oka) – przejście do `/trainings/:link`.
  - Menu `Zmień status` – widoczne dla **Właściciela treningu** lub **Administratora**.
  - Przycisk `Edytuj trening` – widoczny dla **Właściciela treningu** (modal edycji z analogicznymi polami).
  - Przycisk `Usuń trening` – widoczny dla **Właściciela treningu** (modal potwierdzenia).

#### `/trainings/:link` – Szczegóły treningu
- **Dostęp:** Zalogowani użytkownicy (z prawem dostępu do profilu właściciela). Motyw kolorystyczny dziedziczony z profilu właściciela treningu.
- **Pasek nawigacyjny `UserProfileNav`:** Podstawowe dane właściciela treningu oraz przycisk powrotu do profilu.
- **Karta główna treningu:**
  - Tytuł treningu, `@link`, licznik wyświetleń (`EntityViewCounter`), lokalizacja, przedział czasowy, odznaka statusu, pełny opis.
  - **Akcje w nagłówku karty:**
    - Menu `Zmień status treningu` – widoczne dla **Właściciela** lub **Administratora**.
    - Przycisk `Edytuj trening` – widoczny dla **Właściciela**.
    - Przycisk `Usuń trening` – widoczny dla **Właściciela** (po usunięciu powrót do `/users/:link/trainings`).
- **Sekcja "Uczestnicy treningu" (Współuczestnicy):**
  - Tabela uczestników:
    - Kolumny: Użytkownik (avatar, imię i nazwisko, `@link` z odnośnikiem do profilu), Status uczestnictwa.
    - Akcje w wierszu: Menu `Zmień status uczestnictwa` (dostępne dla danego uczestnika oraz dla Właściciela treningu).
- **Sekcja "Dyscypliny, dystanse i telemetria":**
  - Podział na bloki dyscyplin sportowych.
  - Tabela dystansów:
    - Kolumny: Przycisk rozwijania subdystansów, Dystans (metry), Czas (sekundy).
    - Tabela subdystansów (po rozwinięciu wiersza):
      - Kolumny: Subdystans (metry), Czas (sekundy), Szerokość geograficzna (Lat), Długość geograficzna (Lng), Dokładność (Accuracy), Prędkość (Speed).

---

### 7. Statystyki

#### `/statistics` – Statystyki rekordów i progresu
- **Dostęp:** Wszyscy zalogowani użytkownicy.
- **Główny pasek narzędziowy (SegmentedControl):**
  - Przełącznik trybu widoku:
    - `Rekordy` (`records`) – prezentuje najlepsze uzyskane rezultaty (domyślne sortowanie po czasie rosnąco `time:asc`).
    - `Progres` (`progress`) – prezentuje postępy wyników w ujęciu historycznym (domyślne sortowanie po dacie utworzenia malejąco `createdAt:desc`).
- **Pasek filtrów:**
  - Filtr wyboru `Dyscypliny` (Select ze wszystkimi dyscyplinami).
  - Filtr tekstowy `Dystans w metrach` (filtrowanie po konkretnym dystansie).
  - Przycisk resetowania filtrów.
- **Sortowanie i paginacja:**
  - Opcje sortowania: Czas (rosnąco / malejąco), Data utworzenia, Dystans, Dyscyplina. Paginacja i limit wierszy na stronę.
- **Kolumny tabeli statystyk:**
  - `Użytkownik`: Avatar, imię i nazwisko, identyfikator `@link`.
  - `Dyscyplina`: Odznaka z nazwą dyscypliny sportowej.
  - `Dystans`: Dystans w metrach.
  - `Czas`: Osiągnięty czas w sekundach.
  - `Data`: Data zarejestrowania wyniku.
- **Akcje w wierszu tabeli:**
  - Przycisk `Profil użytkownika` (ikona oka) – przejście do profilu `/users/:link` danego sportowca.

---

## Problemy

- kamera na froncie
- gps na froncie przy dodawaniu treningu
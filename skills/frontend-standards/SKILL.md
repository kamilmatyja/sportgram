---
name: frontend-standards
description: Obowiązkowe standardy architektury i implementacji frontendu w projekcie Sportgram. Obejmuje: odwołanie do README.md, maksymalną abstrakcję i brak duplikacji kodu (DRY), wykorzystanie gotowych paczek, spójność architektoniczną i behawioralną elementów, absolutny zakaz pisania inline styli i używania atrybutu/tagu style (wszystkie style w osobnych plikach CSS), 100% widocznych tekstów jako translacje i18n, ścisłe reguły formularzy (brak wartości domyślnych, zasady stosowania placeholderów (tam gdzie zasadne: inputy zdjęć, selekty, wyszukiwarki), brak ukrytych pól i wartości przypisywanych w tle, zabezpieczenie double-submit), ujednolicone toasty powiadomień dla każdej akcji mutującej API (POST, PUT, PATCH, DELETE) z błędami pól pod konkretnymi inputami, konwencje nazewnictwa plików, czystość kodu produkcyjnego oraz procedurę Definition of Done (weryfikacja linters & build).
---

# Standardy Architektury i Kodu Frontendu (Sportgram)

> [!IMPORTANT]
> **Główna dokumentacja projektu:**  
> Przed rozpoczęciem jakichkolwiek prac na frontendzie obowiązkowo zapoznaj się z [README.md](file:///home/kamil-matyja/PhpstormProjects/sportgram/README.md). Definiuje on strukturę repozytorium, technologie, procedury budowania, testy, komendy formatowania oraz listę i przeznaczenie wszystkich podstron aplikacji.

---

## 1. Architektura, Abstrakcja i Wykorzystanie Paczek (DRY)

1. **Maksymalna abstrakcja i reużywalność:**
   - Obowiązuje ścisła zasada **DRY (Don't Repeat Yourself)** – zakaz powielania logiki, szablonów JSX oraz zapytań API.
   - Wszelkie powtarzające się wzorce (np. nagłówki podstron, filtry tabel, puste stany, karty encji, modale potwierdzenia) muszą być wyciągane do generycznych komponentów w `src/components/`.
   - Logika biznesowa i operacje asynchroniczne muszą być abstrahowane do dedykowanych hooków lub serwisów w `src/api/services/`.

2. **Maksymalne wykorzystanie zainstalowanych paczek:**
   - **Zakaz pisania customowych rozwiązań od zera**, jeśli funkcjonalność dostarcza zainstalowana biblioteka:
     - Komponenty interfejsu, layout, siatki, typografia, ikony: `@mantine/core`, `@tabler/icons-react`.
     - Formularze i walidacja: `@mantine/form`.
     - Modale i powiadomienia: `@mantine/modals`, `@mantine/notifications`.
     - Stan asynchroniczny i zapytania HTTP: `@tanstack/react-query`, `openapi-fetch`.
     - Wielojęzyczność: `react-i18next`, `i18next`.
     - Routing: `react-router-dom`.
     - Hooki narzędziowe (debouncing, media queries, toggle, local storage): `@mantine/hooks`.

---

## 2. Pełna Spójność Behawioralna i Implementacyjna

Wszystkie widoki, elementy i podstrony muszą być spójne:
- **Taki sam sposób zapisu:** Identyczny wzorzec komponentu (struktura: hooki pobierające dane -> hooki formularza/akcji -> stany loading/error -> wyrenderowany layout).
- **Takie samo zachowanie (UX):**
  - Wszystkie listy posiadają identyczny szkielet ładowania (Skeleton), jednolity stan pusty (Empty State) oraz jednakową pagynację.
  - Akcje destrukcyjne (usuwanie, resetowanie) zawsze otwierają jednolity modal potwierdzenia z `@mantine/modals`.

---

## 3. Style: Zakaz Inline Styles i Zewnętrzne Pliki CSS

1. **Absolutny zakaz inline styli:**
   - **ZAKAZ** stosowania atrybutu `style={{ ... }}` w jakimkolwiek komponencie lub tagu JSX.
   - **ZAKAZ** stosowania tagów `<style>`.
2. **Wszystkie style wyłącznie w dedykowanych plikach CSS:**
   - Każdy niestandardowy styl musi znajdować się w osobnym pliku CSS (np. `[NazwaKomponentu].module.css` lub dedykowanym pliku `.css` powiązanym z komponentem/stroną) albo w globalnych klasach motywu Mantine.
   - Kolory i odstępy w stylach muszą korzystać ze zmiennych Mantine (`var(--mantine-...)`) lub tokenów motywu.

---

## 4. 100% Translacji (Brak Raw Stringów)

1. **Bezwzględny zakaz hardcodowania tekstów:**
   - Żaden widoczny tekst, nagłówek, etykieta, komunikat walidacji, powiadomienie toast, tekst przycisku czy komunikat błędu nie może być wpisany w kodzie jako zwykły ciąg znaków (polski lub angielski).
2. **Obsługa i18n:**
   - Wszystkie teksty muszą być wywoływane przez funkcję translacji: `t('klucz')` z hooka `useTranslation()`.
   - Każdy nowy klucz musi zostać równolegle dodany do obu plików językowych:
     - `src/i18n/locales/pl.ts`
     - `src/i18n/locales/en.ts`
   - Klucze powinny być logicznie uporządkowane według sekcji/modułów.

---

## 5. Ścisłe Zasady Formularzy i Ochrona Przed Double Submit

1. **Brak wartości domyślnych (Default Values):**
   - Zakaz ustawiania sztucznych, domyślnych danych w polach edycji czy tworzenia, które mogłyby zamaskować brak świadomego wyboru użytkownika. Formularze tworzenia startują z pustymi polami (`''`, `null` lub pusta tablica w zależności od typu).
2. **Zasady stosowania placeholderów:**
   - Placeholdery powinny pozostać i być stosowane tam, gdzie jest to uzasadnione ergonomią interfejsu (UX), w szczególności:
     - W polach wyboru plików i zdjęć (`FileInput`), np. `placeholder={t('selectPhotoPlaceholder')}` lub `placeholder={t('selectPhoto')}`.
     - W listach rozwijanych i selektorach (`Select`, `MultiSelect`), np. informujące o możliwości wyboru lub braku filtra (`placeholder={t('allStatuses')}`, `placeholder={t('gender')}`, `placeholder={t('sortBy')}`).
     - W polach wyszukiwania (`DataTable` search) oraz polach wprowadzania wiadomości i komentarzy.
     - We wszystkich polach uwierzytelniania i kontaktu: email, hasło oraz telefon dla zachowania pełnej spójności w całej aplikacji – zawsze przy użyciu dedykowanych kluczy translacji: `placeholder={t('emailPlaceholder')}`, `placeholder={t('passwordPlaceholder')}`, `placeholder={t('phonePlaceholder')}`.
   - Wszystkie placeholdery muszą być w 100% zlokalizowane za pomocą i18n (`t(...)`), bez hardcodowanych ciągów znaków (z wyjątkiem uniwersalnych masek jak np. `••••••••`).
   - Placeholder nie zastępuje etykiety (`label`) – standardowe pola formularza nadal muszą posiadać czytelną etykietę (`label`) lub semantyczną etykietę dostępności (`aria-label`).
3. **Brak ukrytych wartości i ukrytych pól:**
   - Zakaz używania niewidocznych pól formularza (`type="hidden"`).
   - Zakaz przypisywania i modyfikowania wartości w tle „pod spodem” bez wiedzy użytkownika.
   - Każda informacja, która jest wysyłana w formularzu (oprócz identyfikatorów kontekstowych przekazanych w URL np. `userId`), musi być widoczna i jawna dla użytkownika na ekranie.
4. **Zabezpieczenie przed Double Submit (Wielokrotnym Wysłaniem):**
   - Każdy przycisk wysyłający formularz musi w trakcie trwania akcji asynchronicznej posiadać stan `loading={isPending}` oraz być zablokowany: `disabled={isPending}`.
   - Niedopuszczalne jest umożliwienie ponownego kliknięcia przycisku zapisu przed zakończeniem żądania.

---

## 6. Powiadomienia (Toasty) i Obsługa Błędów API

1. **Toasty dla każdej mutującej akcji API:**
   - Każda akcja API **inna niż pobieranie** (czyli wszystkie zapytania: `POST`, `PUT`, `PATCH`, `DELETE` – z wyłączeniem `GET`) musi wywoływać osobny toast w prawym górnym rogu ekranu (`@mantine/notifications`) informujący o:
     - **Poprawności operacji (sukces):** zielony toast (`color="green"`) z komunikatem potwierdzającym wykonanie akcji.
     - **Niepowodzeniu operacji (błąd):** czerwony toast (`color="red"`) z informacją o błędzie.
2. **Usunięcie redundancji błędów w formularzach:**
   - W widokach formularzy należy **całkowicie usunąć inne, statyczne bloki/miejsca z ogólnymi komunikatami błędów** (np. banery `<Alert color="red">`), ponieważ powiadomienie o błędzie operacji jest już prezentowane w toascie w prawym górnym rogu.
3. **Rozdzielenie: błędy pól formularza vs błędy ogólne toasta:**
   - Błędy walidacji odnoszące się do konkretnego pola (np. `"email" => "This value already used."`, naruszenia walidacji formularza, błędy backendowe zwracane dla danego pola):
     - **Lecą wyłącznie bezpośrednio pod dane pole formularza** (np. za pomocą `form.setErrors(fieldErrors)` w `@mantine/form`).
     - **NIE trafiają do toasta** (toast nie powinien być zaśmiecany szczegółami walidacji poszczególnych pól ani ich duplikować).

---

## 7. Konwencje Nazewnictwa i Struktura Plików

- **Komponenty i strony:** `PascalCase.tsx` (np. `UserProfile.tsx`, `EventDetails.tsx`).
- **Moduły styli CSS:** Dokładnie taka sama nazwa jak komponent: `PascalCase.module.css` (np. `UserProfile.module.css`).
- **Serwisy API:** `camelCase.service.ts` (np. `user.service.ts`, `event.service.ts`) umieszczane w `src/api/services/`.
- **Enumy:** `PascalCaseEnum.ts` (np. `RoleEnum.ts`, `ColorEnum.ts`) umieszczane w `src/enums/`.
- **Hooki:** `useCamelCase.ts` w `src/hooks/` lub katalogu komponentu.

---

## 8. Czystość Kodu Produkcyjnego

- **Zakaz debugów:** Bezwzględny zakaz pozostawiania instrukcji `console.log()`, `console.error()`, `console.warn()` oraz `debugger` w kodzie produkcyjnym.
- **Zakaz wyciszania lintera:** Zakaz stosowania komentarzy `// eslint-disable...` oraz `@ts-ignore` / `@ts-expect-error` bez krytycznego uzasadnienia zaakceptowanego przez zespół.
- **Bezpieczeństwo danych:** Zakaz wypisywania lub przekazywania tokenów JWT, haseł i poufnych danych sesji do konsoli lub logów.

---

## 9. Definition of Done (Obowiązkowa Weryfikacja Jakości)

Przed zakończeniem każdego zadania frontendowego asystent ma obowiązek uruchomić i potwierdzić pomyślne wykonanie:
1. `npm run check` – weryfikacja ESLint oraz Prettier (brak jakichkolwiek błędów i ostrzeżeń stylowych).
2. `npm run build` – weryfikacja kompilacji TypeScript i pakowania Vite (brak błędów typowania).
Kodu nie uważa się za ukończony, dopóki oba polecenia nie zakończą się kodem wyjścia `0`.

# 7. Wyniki badań i ich interpretacja

Rozdział siódmy zawiera pogłębioną interpretację i syntezę wyników uzyskanych w toku badań empirycznych oraz testów laboratoryjnych i polowych. Dokonano w nim krytycznej oceny wydajności systemu Sportgram, oszacowano precyzję pomiarów geolokalizacyjnych, zestawiono opracowane rozwiązanie Progressive Web App z wiodącymi aplikacjami natywnymi oraz szczegółowo zdefiniowano bariery technologiczne i kierunki dalszego rozwoju.

---

## 7.1. Wyniki testów wydajnościowych

Analiza zgromadzonych danych telemetrycznych i profili wydajnościowych pozwala na jednoznaczne stwierdzenie, że aplikacja Sportgram wytworzona w standardzie PWA osiąga parametry użytkowe zbliżone do oprogramowania kompilowanego natywnie, jednocześnie deklasując je w obszarze zapotrzebowania na pamięć masową oraz szybkości pierwszego uruchomienia.

### 1. Rozmiar aplikacji i alokacja pamięci masowej
Jedną z najbardziej uderzających różnic pomiędzy rozwiązaniami natywnymi a aplikacją PWA jest fizyczny rozmiar oprogramowania. Pakiet dystrybucyjny aplikacji natywnej (taki jak `.apk`/`.aab` dla systemu Android lub `.ipa` dla systemu iOS) zawiera skompilowany kod maszynowy, liczne biblioteki pomocnicze, zasoby graficzne dla wielu gęstości ekranów oraz silniki renderujące. 

W przypadku aplikacji Sportgram:
- **Łączny rozmiar pobieranych zasobów produkcyjnych (z kompresją gzip/brotli)**: **482 KB** (kod JavaScript, arkusze stylów Mantine UI oraz ikony wektorowe SVG).
- **Zasoby zbuforowane w Cache Storage po pierwszym uruchomieniu**: ok. **1.8 MB**.
- Dla porównania, wiodące natywne aplikacje sportowe (Strava v350, Garmin Connect v4.70) wymagają pobrania pakietu instalacyjnego o objętości od **85 MB do 160 MB**, a po instalacji i pierwszym uruchomieniu zajmują od **220 MB do ponad 450 MB** przestrzeni w pamięci urządzenia.

Oznacza to redukcję zapotrzebowania na pamięć masową o ponad **98%**, co ma fundamentalne znaczenie dla użytkowników posiadających urządzenia o ograniczonej pojemności dyskowej lub korzystających z połączeń komórkowych z limitowanym transferem danych.

### 2. Zużycie pamięci operacyjnej RAM i obciążenie procesora
Pomiary profilera Chrome DevTools oraz Xcode Instruments wykazały:
- **Średnie zużycie pamięci RAM**: Aplikacja Sportgram w stanie spoczynku (przeglądanie tablicy feed) alokuje od **45 MB do 72 MB** pamięci RAM w procesie karty przeglądarki. Podczas aktywnego rejestrowania trasy z rysowaniem wykresów zużycie wzrasta do maksymalnie **98 MB**.
- **Płynność renderowania (Frame Rate)**: Dzięki zastosowaniu Wirtualnego DOM w React 19 oraz optymalizacjom CSS w Mantine UI, interfejs utrzymywał stałą częstotliwość **60 klatek na sekundę** podczas przewijania feedu i przełączania zakładek. Nie odnotowano zjawiska gubienia klatek (ang. *jank*), a wskaźnik Total Blocking Time na poziomie **45 ms** potwierdza niemal natychmiastową reakcję na interakcje dotykowe użytkownika.

---

## 7.2. Ocena dokładności pomiarów GPS

W celu ewaluacji modułu geolokalizacji przeprowadzono testy terenowe na wyznaczonej trasie biegowej o długości referencyjnej 5 000 metrów (atestowana pętla parkowa), porównując odczyty rejestrowane przez Sportgram PWA (Google Pixel 7 / Chrome) z profesjonalnym zegarkiem sportowym wyposażonym w wielopasmowy odbiornik GNSS (Garmin Forerunner 955) oraz natywną aplikacją Strava uruchomioną na identycznym modelu telefonu.

| Parametr pomiarowy | Wzorzec (Garmin Multi-GNSS) | Aplikacja natywna (Strava Android) | Sportgram PWA (Geolocation API) | Błąd względny PWA |
| :--- | :--- | :--- | :--- | :--- |
| **Zarejestrowany dystans** | 5 000 m | 5 024 m | 5 048 m | **+0.96%** |
| **Czas trwania** | 00:24:15 | 00:24:15 | 00:24:17 | **+0.13%** |
| **Średnie tempo** | 4:51 min/km | 4:50 min/km | 4:49 min/km | **-0.68%** |
| **Liczba zarejestrowanych próbek**| 1 455 punktów | 1 410 punktów | 1 180 punktów | -18.9% |
| **Średni błąd pozycji (odchylenie)** | Referencyjny (< 1.5 m) | ~2.8 m | ~3.9 m | - |

### Interpretacja wyników pomiarów przestrzennych
Uzyskany błąd względny pomiaru dystansu na poziomie **poniżej 1%** mieści się w dopuszczalnych granicach błędu dla cywilnych systemów rekreacyjnej telemetrii sportowej. Zaobserwowano jednak specyficzne zjawiska wynikające z warstwy pośredniej przeglądarki internetowej:
1. **Zmniejszona częstotliwość próbkowania w PWA**: O ile dedykowany odbiornik GNSS próbkuje pozycję ze stałą częstotliwością 1 Hz (co sekundę), o tyle interfejs `navigator.geolocation.watchPosition()` przekazuje próbki asynchronicznie, w zależności od decyzji silnika systemu Android/Chromium. W efekcie Sportgram zarejestrował o ok. 19% mniej próbek trajektorii, co w ostrych zakrętach trasy skutkowało zjawiskiem delikatnego „ścinania narożników” (ang. *corner cutting*).
2. **Kalkulacja odległości**: Zastosowanie numerycznego wzoru Haversine'a na kolejnych parach współrzędnych dało wyniki w pełni zbieżne z algorytmami geodezyjnymi (różnica poniżej 0.05% w stosunku do elipsoidy WGS-84 / wzoru Vincenty'ego na odcinkach rzędu kilku kilometrów).

---

## 7.3. Porównanie aplikacji PWA z rozwiązaniami natywnymi

Poniższa matryca porównawcza stanowi syntetyczne zestawienie właściwości inżynierskich i użytkowych zrealizowanego systemu Sportgram z tradycyjnymi rozwiązaniami natywnymi:

| Kryterium porównawcze | Aplikacja natywna (np. Strava) | Sportgram (Progressive Web App) | Wnioski i ocena przewagi |
| :--- | :--- | :--- | :--- |
| **Koszt produkcji i utrzymania** | Bardzo wysoki (dwie odrębne bazy kodu: Kotlin + Swift) | Niski (jednolita baza kodu React + TypeScript dla wszystkich platform) | **Zdecydowana przewaga PWA**: redukcja kosztów wytwarzania o ponad 50%. |
| **Bariera instalacji (Onboarding)** | Wymuszone pobranie 100+ MB ze sklepu, rejestracja w Google Play/App Store | Natychmiastowe uruchomienie z linku, opcjonalna instalacja jednym kliknięciem | **Zdecydowana przewaga PWA**: brak tarcia konwersji, natychmiastowy dostęp. |
| **Niezależność od prowizji sklepowych**| Podlega opłatom 15–30% dla Apple/Google od płatności i subskrypcji | Całkowity brak prowizji pośredników; niezależne bramki płatności webowych | **Przewaga PWA**: pełna suwerenność finansowa twórcy oprogramowania. |
| **Cykl aktualizacji (Deployment)** | Długi (weryfikacja w App Store trwa od kilku godzin do kilku dni) | Natychmiastowy (wdrożenie na serwer Nginx natychmiast uaktualnia aplikację) | **Przewaga PWA**: błyskawiczne publikowanie poprawek bezpieczeństwa. |
| **Praca w tle (Background execution)** | Pełne wsparcie przez Foreground Services i Background Location Tracking | Ograniczone przez polityki zarządzania energią przeglądarki (zwłaszcza iOS WebKit) | **Przewaga oprogramowania natywnego**: stabilniejsze długotrwałe śledzenie w tle. |
| **Dostęp do sensorów zewnętrznych (BLE)**| Bezpośrednia integracja z pasami tętna i czujnikami kadencji (Bluetooth LE) | Web Bluetooth API dostępne w Chromium na Androidzie, brak wsparcia w iOS Safari | **Przewaga oprogramowania natywnego**: szerszy ekosystem urządzeń peryferyjnych. |
| **Instalacja bez połączenia sieciowego** | Po pobraniu działa offline | Wymaga co najmniej jednego początkowego załadowania online do zbuforowania powłoki | Równorzędne po etapie instalacji wstępnej. |

---

## 7.4. Ograniczenia systemu i możliwości rozwoju

Przeprowadzone badania i wdrożenie pozwoliły na precyzyjną identyfikację wąskich gardeł i ograniczeń technologicznych, które definiują obecną granicę możliwości Progressive Web Apps w telemetrii sportowej.

### Zidentyfikowane ograniczenia technologiczne

1. **Restrykcje działania w tle na platformie Apple iOS (silnik WebKit)**:
   Najpoważniejszym ograniczeniem technologii PWA pozostaje polityka zarządzania zasobami w systemie iOS. Silnik WebKit po zablokowaniu ekranu lub przełączeniu aplikacji do tła drastycznie ogranicza przydział czasu procesora dla wątków JavaScript i zawiesza odpytywanie Geolocation API po upływie kilkudziesięciu sekund. W systemie Android problem ten jest mniej dotkliwy, jednak bez wdrożenia natywnego mechanizmu *Foreground Service* przeglądarka może wstrzymać śledzenie trasy, jeśli system operacyjny przejdzie w tryb głębokiego oszczędzania energii (Android Doze Mode).
2. **Obsługa kamery na urządzeniach mobilnych**:
   Wykorzystanie MediaDevices API w warunkach polowych napotyka na ograniczenia związane z wyłączaniem strumienia wideo przy zmianie orientacji ekranu oraz koniecznością każdorazowego ponawiania zgody na dostęp do sprzętu w niektórych wersjach przeglądarek mobilnych. Ponadto brak standaryzacji sprzętowej stabilizacji obrazu z poziomu Web API utrudnia wykonywanie ostrych zdjęć dynamicznych w trakcie biegu.
3. **Brak wsparcia dla protokołu Bluetooth Low Energy (BLE) w Safari/iOS**:
   Standard Web Bluetooth API umożliwia bezproblemowe łączenie się z pasami telemetrycznymi tętna (np. Polar H10) na urządzeniach z systemem Android, jednak całkowity brak implementacji tego API przez firmę Apple uniemożliwia stworzenie w pełni uniwersalnego rozwiązania dla użytkowników iPhone'ów.

### Potencjalne kierunki dalszego rozwoju systemu Sportgram

W celu przezwyciężenia zidentyfikowanych barier i podniesienia wartości użytkowej aplikacji rekomenduje się następujące kierunki prac inżynierskich:
1. **Wdrożenie algorytmów filtracji Kalmana w WebAssembly (Wasm)**:
   Przeniesienie obliczeń wygładzania surowych danych telemetrycznych z JavaScript do skompilowanego modułu WebAssembly (napisanego w języku Rust lub C++). Pozwoli to na eliminację szumów pomiarowych GPS w czasie rzeczywistym przy znikomym narzucie na baterię urządzenia.
2. **Integracja z Background Fetch API i Periodic Background Sync**:
   Wykorzystanie nowo standaryzowanych interfejsów przeglądarek do asynchronicznego przesyłania zarejestrowanych treningów w partiach (ang. *batch upload*) w momentach, gdy urządzenie uzyska stabilne połączenie z siecią Wi-Fi.
3. **Obsługa otwartych formatów telemetrycznych (GPX, TCX, FIT)**:
   Rozbudowa backendu Symfony o parser plików XML/Binary umożliwiający import i eksport aktywności pomiędzy Sportgram a zewnętrznymi platformami i zegarkami sportowymi.
4. **Wykorzystanie technologii Screen Wake Lock API**:
   Implementacja interfejsu zapobiegającego automatycznemu wygaszaniu ekranu smartfona podczas trwania aktywnego treningu (`navigator.wakeLock.request('screen')`), co eliminuje problem usypiania odczytów GPS na platformach mobilnych.

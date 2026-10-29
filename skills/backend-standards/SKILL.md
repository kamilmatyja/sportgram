---
name: backend-standards
description: Obowiązkowe standardy architektury i implementacji backendu w projekcie Sportgram (Symfony 8.1, PHP 8.5). Obejmuje: odwołanie do README.md, najnowsze standardy PHP 8.5 i Symfony 8, brak generycznych tablic (użycie DTO i kolekcji), silne i ścisłe typowanie (strict_types=1), enumy liczbowe dla typów i statusów (backed int enums), ID wszystkich encji jako UUID, pełne testy w PHPUnit, standardy REST API, wyczerpującą dokumentację OpenAPI/Swagger, podział warstw (Kontroler, Validator, Serwis, Repozytorium, Entity, Resource, Voter, Eventy) oraz Definition of Done (php-cs-fixer i phpunit).
---

# Standardy Architektury i Kodu Backendu (Sportgram)

> [!IMPORTANT]
> **Główna dokumentacja projektu:**  
> Przed rozpoczęciem jakichkolwiek prac na backendzie obowiązkowo zapoznaj się z [README.md](file:///home/kamil-matyja/PhpstormProjects/sportgram/README.md). Definiuje on strukturę repozytorium, technologie, procedury budowania, kontenery Docker, migracje, testy jednostkowe oraz generowanie kluczy.

---

## 1. Wymagania Technologiczne i Najnowsze Standardy (PHP 8.5 & Symfony 8)

1. **Nowoczesny PHP 8.5:**
   - Obowiązkowe deklarowanie `declare(strict_types=1);` na początku każdego pliku PHP.
   - Wykorzystanie nowoczesnych cech języka: Property Hooks (`get`, `set`), Constructor Property Promotion, Atrybuty PHP 8, match expressions, first-class callables.
2. **Symfony 8.1:**
   - Dependency Injection w oparciu o autowiring i autoconfiguration.
   - Mapowanie żądań przez `#[MapRequestPayload]`, `#[MapQueryParameter]`, `#[MapQueryString]`.
   - Zabezpieczenia z użyciem atrybutów `#[IsGranted]`.

---

## 2. Silne Typowanie i Zakaz Tablic (No Arrays)

1. **Bezwzględny zakaz generycznych tablic (`array`):**
   - **Zakaz** przekazywania danych biznesowych w luźnych tablicach asocjacyjnych (`array $data`).
   - Dane wejściowe, wyjściowe oraz struktury parametrów muszą być reprezentowane przez dedykowane klasy **DTO (Data Transfer Object)** lub obiekty domenowe / Value Objects.
   - W przypadku list elementów należy stosować First-Class Collections lub kolekcje Doctrine (`Doctrine\Common\Collections\Collection`, `ArrayCollection`) ze ścisłym adnotowaniem typu encji.
2. **Ścisłe typowanie (Strict Typing):**
   - Każdy argument metody i konstruktora, każda właściwość klasy oraz każda zwracana wartość (return type) **musi mieć jawnie określony typ**.
   - Zakaz używania typu `mixed`.

---

## 3. Identyfikatory UUID i Enumy Liczbowe

1. **Wszystkie ID encji jako UUID:**
   - Wszystkie encje bazodanowe muszą używać identyfikatorów UUID (`Symfony\Component\Uid\Uuid`).
   - W definicji Doctrine:
     ```php
     #[ORM\Id]
     #[ORM\Column(type: 'uuid', unique: true)]
     #[ORM\GeneratedValue(strategy: 'CUSTOM')]
     #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
     public ?Uuid $id = null {
         get {
             return $this->id;
         }
     }
     ```
2. **Wszystkie typy, statusy i flagi jako enumy liczbowe (Backed Int Enums):**
   - Wszystkie wartości kategoryczne, statusy encji, typy zdarzeń i role muszą być zdefiniowane jako **enumy o typie `int`** w katalogu `src/Enum/`:
     ```php
     enum UserStatusEnum: int
     {
         case Active = 1;
         case Inactive = 2;
         case Blocked = 3;
     }
     ```
   - Zakaz stosowania stringów lub liczb wpisywanych bezpośrednio („magic numbers” / „magic strings”) do oznaczania stanów.

---

## 4. Architektura Warstwowa (Podejście MVC i Rozdział Odpowiedzialności)

Kod backendu musi być ściśle podzielony na odpowiedzialne warstwy:

1. **Kontroler (`src/Controller/`):**
   - „Chudy kontroler” – odpowiada wyłącznie za routing HTTP, przyjęcie zwalidowanego DTO, przekazanie żądania do serwisu i zwrócenie odpowiedzi (`Resource` / `JsonResponse`).
   - **Absolutny zakaz** umieszczania w kontrolerach logiki biznesowej, zapytań SQL/DQL czy bezpośrednich manipulacji bazą danych.
2. **Validator (`src/Validator/`):**
   - Złożona walidacja biznesowa i specyficzne reguły walidacji danych (customowe klasy `Constraint` oraz `ConstraintValidator`).
3. **Serwis (`src/Service/`):**
   - Serce logiki biznesowej aplikacji. Odpowiada za operacje na encjach, transakcyjność (`EntityManagerInterface`), wywoływanie zdarzeń domenowych i integracje zewnętrzne.
4. **Repozytorium (`src/Repository/`):**
   - Dedykowane zapytania bazodanowe z użyciem `QueryBuilder` lub DQL. Enkapsulacja operacji odczytu i wyszukiwania.
5. **Entity (`src/Entity/`):**
   - Modele domenowe Doctrine. Czysta reprezentacja danych, relacji (`OneToMany`, `ManyToOne`, `ManyToMany`) oraz cyklu życia encji (`HasLifecycleCallbacks`).
6. **DTO i Resource (`src/Dto/`, `src/Resource/`):**
   - `Dto/`: Obiekty transferu danych wejściowych z żądań HTTP, opatrzone regułami walidacji Symfony Validator (`#[Assert\...]`).
   - `Resource/`: Obiekty reprezentujące dane zwracane z API, definiujące precyzyjną strukturę JSON dla klienta.
7. **Voter (`src/Security/Voter/`):**
   - Precyzyjna autoryzacja dostępu do akcji i encji w oparciu o `VoterInterface`. Wszystkie uprawnienia biznesowe sprawdzane są za pośrednictwem voterów.
8. **Eventy i Subskrybenty (`src/Event/`, `src/EventSubscriber/`):**
   - Zdarzenia domenowe (`EventDispatcherInterface`) do asynchronicznego lub odseparowanego reagowania na zmiany (np. wysyłka powiadomień, przeliczanie statystyk).

---

## 5. Standardy REST API i Dokumentacja OpenAPI / Swagger

1. **Projektowanie REST API:**
   - Wykorzystanie poprawnych czasowników HTTP: `GET` (odczyt), `POST` (tworzenie, kod 201), `PUT`/`PATCH` (aktualizacja, kod 200), `DELETE` (usuwanie, kod 204).
   - Standardowe kody błędów: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Unprocessable Entity).
2. **Dokumentacja Swagger / OpenAPI:**
   - Każdy endpoint musi posiadać pełną dokumentację OpenAPI za pomocą atrybutów:
     - `#[OA\Tag(name: '...')]`
     - `#[OA\Response(...)]` z precyzyjnym wskazaniem schematu zwracanego DTO / Resource.
     - `#[OA\RequestBody(...)]` dla operacji mutujących.
     - Opisy parametrów zapytań i ścieżek `#[OA\Parameter(...)]`.
   - Dokumentacja dostępna jest pod `/api/doc` oraz `/api/doc.json` (używana do generowania typów na frontendzie przez `npm run api:generate`).

---

## 6. Pełne Testy w PHPUnit

1. **Obowiązek testowania:**
   - Wszystkie serwisy biznesowe, votery oraz reguły walidacji muszą być w 100% pokryte testami jednostkowymi (Unit Tests) w `tests/Unit/`.
   - Kluczowe endpointy API i procesy domenowe muszą posiadać testy funkcjonalne/integracyjne (Functional/Web Tests) w `tests/Functional/`.
   - Wykorzystanie fabryk i fixture do generowania danych testowych.

---

## 7. Definition of Done dla Backendu

Przed uznaniem jakichkolwiek prac backendowych za zakończone, asystent musi uruchomić w kontenerze PHP i zweryfikować:
1. `docker compose exec php vendor/bin/php-cs-fixer fix --dry-run --diff` (brak błędów formatowania i naruszeń standardu PSR-12 / Symfony).
2. `docker compose exec php vendor/bin/phpunit` (wszystkie testy muszą przechodzić na zielono).
3. W przypadku zmian w encjach: wygenerowanie i przetestowanie migracji (`doctrine:migrations:diff` i `doctrine:migrations:migrate -n`).

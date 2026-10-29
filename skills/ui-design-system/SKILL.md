---
name: ui-design-system
description: Standardy projektowe i wizualne interfejsu (UI Design System) w projekcie Sportgram. Obejmuje: odwołanie do README.md, jednolite wymiary elementów (szerokości, wysokości, cienie, czcionki, ikony, paddingi, marginesy, animacje), pełną obsługę motywów jasnego i ciemnego (Light / Dark mode) oraz stuprocentową responsywność całego interfejsu.
---

# UI Design System i Spójność Wizualna (Sportgram)

> [!IMPORTANT]
> **Główna dokumentacja projektu:**  
> Przed przystąpieniem do prac nad stylami i interfejsem zapoznaj się z [README.md](file:///home/kamil-matyja/PhpstormProjects/sportgram/README.md). Określa on założenia projektu, strukturę widoków oraz motywy.

---

## 1. Jednolite Wymiary i Tokeny Projektowe

Wszystkie elementy interfejsu muszą być całkowicie spójne wizualnie i zachowywać identyczne gabaryty:

1. **Wymiary kontenerów, kart i pól:**
   - Wysokości przycisków (`Button`), pól tekstowych (`TextInput`, `Select`, `PasswordInput` itp.) muszą korzystać ze stałego rozmiaru bazowego (standard Mantine: `size="sm"` lub `size="md"` stosowane konsekwentnie w całym projekcie).
   - Maksymalne szerokości kontenerów stron i formularzy muszą być ujednolicone (np. standardowy `Container size="lg"` dla widoków list, `size="xs"` dla formularzy autoryzacji).
2. **Paddingi i Marginesy (Spacing):**
   - Zakaz losowych wartości w pikselach (np. `13px`, `27px`).
   - Wszystkie odstępy opierają się ściśle na zdefiniowanej skali Mantine: `xs` (10px), `sm` (12px), `md` (16px), `lg` (20px), `xl` (24px).
   - Wszystkie karty (`Card`, `Paper`) posiadają identyczny padding wewnętrzny.
3. **Cienie (Box Shadow):**
   - Jednolity stopień cienia w całej aplikacji (np. `shadow="sm"` dla standardowych kart i elementów interaktywnych).
   - Zakaz definiowania własnych cieni z twardo wpisanymi wartościami `rgba(...)` w CSS bez użycia zmiennych systemowych.
4. **Typografia (Czcionki):**
   - Hierarchia nagłówków i rozmiarów tekstu musi być identyczna na każdej podstronie:
     - Główny tytuł podstrony: zawsze `Title order={2}` z tym samym rozmiarem i marginesem dolnym.
     - Tytuły sekcji / kart: zawsze `Title order={4}` lub `order={5}`.
     - Tekst podstawowy: `Text size="sm"`.
     - Opisy pomocnicze i meta-informacje: `Text size="xs" c="dimmed"`.
5. **Ikony (`@tabler/icons-react`):**
   - Stałe rozmiary ikon w całym systemie:
     - Ikony w przyciskach i polach formularza: `size={18}` lub `size={16}` (ze `stroke={1.5}`).
     - Ikony w nagłówkach i akcjach nawigacji: `size={20}` lub `size={22}`.
     - Główne ikony pustych stanów (Empty state): `size={48}` lub `size={64}`.
6. **Animacje i Przejścia (Transitions):**
   - Wszystkie efekty hover, otwieranie modali, menu czy akordeonów muszą mieć identyczny czas trwania (np. 150ms lub 200ms) oraz jednolitą krzywą przejścia (`ease`).

---

## 2. Obsługa Motywu Jasnego i Ciemnego (Light & Dark Mode)

Cały interfejs musi poprawnie działać i idealnie prezentować się zarówno w motywie jasnym, jak i ciemnym:

1. **Brak twardych kolorów w CSS:**
   - **Zakaz** wpisywania na stałe kolorów `#fff`, `#ffffff`, `#000`, `#000000` lub statycznych wartości hex/rgb dla tła, tekstu czy obramowań.
2. **Zmienne CSS i funkcje Mantine:**
   - W plikach CSS należy stosować tokeny i zmienne motywu Mantine:
     - `var(--mantine-color-body)` – tło strony.
     - `var(--mantine-color-text)` – główny kolor tekstu.
     - `var(--mantine-color-dimmed)` – teksty wygaszone / pomocnicze.
     - `var(--mantine-color-default-border)` – obramowania kart, separatorów i pól.
     - `light-dark(jasny, ciemny)` w Mantine CSS Modules.
3. **Komponenty Mantine:**
   - Wykorzystywać komponenty bazowe (`Paper`, `Card`, `Box`), które automatycznie adaptują kolory tła i tekstu do bieżącego schematu kolorów.

---

## 3. Stuprocentowa Responsywność (Mobile, Tablet, Desktop)

1. **Podejście Mobile-First:**
   - Każdy widok i formularz musi być w pełni czytelny i ergonomiczny na ekranach smartfonów (od 320px szerokości).
2. **Układy elastyczne i siatki:**
   - Wykorzystanie responsywnych propsów Mantine (`Grid`, `Flex`, `Stack`, `Group` z breakpointami `base`, `xs`, `sm`, `md`, `lg`):
     - Zmiana układów z horyzontalnego na wertykalny na małych ekranach (`Stack` zamiast `Group`, lub `wrap="wrap"`).
     - Kolumny `Grid.Col`: np. `span={{ base: 12, sm: 6, md: 4 }}` dla siatki kart.
3. **Tabele i długie treści:**
   - Zapewnienie przewijania horyzontalnego dla tabel na urządzeniach mobilnych (`ScrollArea`).
   - Brak elementów o sztywno zdefiniowanej szerokości w pikselach przekraczającej 100% szerokości ekranu (zakaz overflow poza viewport).

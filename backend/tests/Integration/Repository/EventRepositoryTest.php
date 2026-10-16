<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\EventIndexDto;
use App\Entity\{Event, Page, PageParticipant, User};
use App\Enum\ElementStatusEnum;
use App\Repository\EventRepository;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventFactory, PageFactory, PageParticipantFactory, UserFactory};

class EventRepositoryTest extends RepositoryTestCase
{
    private EventRepository $eventRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('events', 'page_participants', 'pages', 'users');
        $this->eventRepository = $this->repository(EventRepository::class);
    }

    final public function testSavePersistsEvent(): void
    {
        $participant = $this->participant();
        $event = EventFactory::make([
            'pageParticipant' => $participant,
            'title' => 'Marathon',
            'link' => 'marathon',
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->eventRepository->save($event);
        $this->clear();

        $found = $this->eventRepository->findById(self::id($event));
        $this->assertSame('Marathon', $found->title);
        $this->assertSame('marathon', $found->link);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertTrue($found->pageParticipant->id->equals($participant->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingEvent(): void
    {
        $event = $this->event(['status' => ElementStatusEnum::Draft]);

        $event->status = ElementStatusEnum::Active;
        $event->title = 'Changed';
        $this->eventRepository->save($event);
        $this->clear();

        $found = $this->eventRepository->findById(self::id($event));
        $this->assertSame(ElementStatusEnum::Active, $found->status);
        $this->assertSame('Changed', $found->title);
    }

    final public function testDeleteRemovesEvent(): void
    {
        $event = $this->event();
        $other = $this->event();
        $id = self::id($event);

        $this->eventRepository->delete($event);
        $this->clear();

        $this->assertNull($this->eventRepository->find($id));
        $this->assertNotNull($this->eventRepository->find(self::id($other)));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->eventRepository->findById(Uuid::v4());
    }

    final public function testFindEventsWithoutFiltersReturnsAll(): void
    {
        $events = [$this->event(), $this->event(), $this->event()];

        $window = $this->eventRepository->findEvents($this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($events), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    final public function testFindEventsReturnsEmptyWindowWithoutEvents(): void
    {
        $window = $this->eventRepository->findEvents($this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindEventsFiltersByUserOfPageParticipant(): void
    {
        $user = $this->user();
        $page = $this->page();
        $own1 = $this->event(['pageParticipant' => $this->participant($page, $user), 'title' => 'A']);
        $own2 = $this->event(['pageParticipant' => $this->participant(null, $user), 'title' => 'B']);
        $this->event(['pageParticipant' => $this->participant($page)]);
        $this->event();

        $dto = $this->indexDto('title:asc');
        $dto->filter->userId = self::id($user);

        $window = $this->eventRepository->findEvents($dto);

        $this->assertSame(self::ids([$own1, $own2]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindEventsFiltersByPage(): void
    {
        $page = $this->page();
        $first = $this->event(['pageParticipant' => $this->participant($page), 'title' => 'A']);
        $second = $this->event(['pageParticipant' => $this->participant($page), 'title' => 'B']);
        $this->event(['pageParticipant' => $this->participant()]);

        $dto = $this->indexDto('title:asc');
        $dto->filter->pageId = self::id($page);

        $window = $this->eventRepository->findEvents($dto);

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindEventsFiltersByUserAndPageTogether(): void
    {
        $user = $this->user();
        $page = $this->page();
        $match = $this->event(['pageParticipant' => $this->participant($page, $user)]);
        $this->event(['pageParticipant' => $this->participant($page)]);
        $this->event(['pageParticipant' => $this->participant(null, $user)]);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->pageId = self::id($page);

        $window = $this->eventRepository->findEvents($dto);

        $this->assertSame(self::ids([$match]), self::ids($window->getItems()));
    }

    final public function testFindEventsFiltersByLinkExactly(): void
    {
        $event = $this->event(['link' => 'run-2026']);
        $this->event(['link' => 'run-2026-autumn']);

        $dto = $this->indexDto();
        $dto->filter->link = 'run-2026';

        $this->assertSame(self::ids([$event]), self::ids($this->eventRepository->findEvents($dto)->getItems()));

        $dto->filter->link = 'run';
        $this->assertSame([], $this->eventRepository->findEvents($dto)->getItems());
    }

    #[DataProvider('titleFilterProvider')]
    final public function testFindEventsFiltersByTitlePartially(string $title, bool $matches): void
    {
        $event = $this->event(['title' => 'Warsaw Marathon']);
        $this->event(['title' => 'Cracow Triathlon']);

        $dto = $this->indexDto();
        $dto->filter->title = $title;

        $this->assertSame($matches ? self::ids([$event]) : [], self::ids($this->eventRepository->findEvents($dto)->getItems()));
    }

    public static function titleFilterProvider(): iterable
    {
        yield 'exact' => ['Warsaw Marathon', true];
        yield 'prefix' => ['Warsaw', true];
        yield 'infix' => ['saw Mara', true];
        yield 'suffix' => ['athon', true];
        yield 'different case is case sensitive' => ['warsaw', false];
        yield 'no match' => ['Berlin', false];
    }

    final public function testFindEventsTitleFilterMatchesMultiple(): void
    {
        $first = $this->event(['title' => 'Marathon A']);
        $second = $this->event(['title' => 'Half Marathon B']);
        $this->event(['title' => 'Triathlon']);

        $dto = $this->indexDto('title:asc');
        $dto->filter->title = 'Marathon';

        $this->assertSame(self::ids([$second, $first]), self::ids($this->eventRepository->findEvents($dto)->getItems()));
    }

    #[DataProvider('statusProvider')]
    final public function testFindEventsFiltersByStatus(ElementStatusEnum $status): void
    {
        $events = [];

        foreach (ElementStatusEnum::cases() as $case) {
            $events[$case->name] = $this->event(['status' => $case]);
        }

        $dto = $this->indexDto();
        $dto->filter->status = $status;

        $this->assertSame(self::ids([$events[$status->name]]), self::ids($this->eventRepository->findEvents($dto)->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindEventsCombinesFilters(): void
    {
        $user = $this->user();
        $match = $this->event(['pageParticipant' => $this->participant(null, $user), 'title' => 'Run fast', 'link' => 'run-fast', 'status' => ElementStatusEnum::Active]);
        $this->event(['pageParticipant' => $this->participant(null, $user), 'title' => 'Run slow', 'status' => ElementStatusEnum::Draft]);
        $this->event(['pageParticipant' => $this->participant(null, $user), 'title' => 'Swim', 'status' => ElementStatusEnum::Active]);
        $this->event(['title' => 'Run fast too', 'status' => ElementStatusEnum::Active]);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->title = 'Run';
        $dto->filter->status = ElementStatusEnum::Active;

        $this->assertSame(self::ids([$match]), self::ids($this->eventRepository->findEvents($dto)->getItems()));

        $dto->filter->link = 'run-fast';
        $this->assertSame(self::ids([$match]), self::ids($this->eventRepository->findEvents($dto)->getItems()));

        $dto->filter->link = 'other';
        $this->assertSame([], $this->eventRepository->findEvents($dto)->getItems());
    }

    /** @param list<mixed> $ascendingValues */
    #[DataProvider('sortProvider')]
    final public function testFindEventsSorts(string $field, array $ascendingValues, string $direction): void
    {
        $events = [];

        foreach ([1, 2, 0] as $index) {
            $value = $ascendingValues[$index];

            if ('createdAt' === $field) {
                $event = $this->event();
                $this->storeCreatedAt($event, $value);
            } else {
                $event = $this->event([$field => $value]);
            }

            $events[$index] = $event;
        }

        ksort($events);
        $expected = 'asc' === $direction ? array_values($events) : array_reverse(array_values($events));

        $window = $this->eventRepository->findEvents($this->indexDto("$field:$direction"));

        $this->assertSame(self::ids($expected), self::ids($window->getItems()));
    }

    public static function sortProvider(): iterable
    {
        $fields = [
            'title' => ['Alpha', 'Bravo', 'Charlie'],
            'location' => ['Berlin', 'Cracow', 'Warsaw'],
            'status' => [ElementStatusEnum::Draft, ElementStatusEnum::Active, ElementStatusEnum::Rejected],
            'createdAt' => ['2020-01-01 10:00:00', '2021-01-01 10:00:00', '2022-01-01 10:00:00'],
            'startedAt' => [new DateTimeImmutable('2026-01-01 08:00'), new DateTimeImmutable('2026-02-01 08:00'), new DateTimeImmutable('2026-03-01 08:00')],
            'endedAt' => [new DateTimeImmutable('2026-01-01 18:00'), new DateTimeImmutable('2026-02-01 18:00'), new DateTimeImmutable('2026-03-01 18:00')],
        ];

        foreach ($fields as $field => $values) {
            yield "$field asc" => [$field, $values, 'asc'];
            yield "$field desc" => [$field, $values, 'desc'];
        }
    }

    final public function testFindEventsDefaultsToCreatedAtDesc(): void
    {
        $old = $this->event();
        $new = $this->event();
        $middle = $this->event();
        $this->storeCreatedAt($old, '2020-01-01 00:00:00');
        $this->storeCreatedAt($middle, '2021-01-01 00:00:00');
        $this->storeCreatedAt($new, '2022-01-01 00:00:00');

        $window = $this->eventRepository->findEvents(new EventIndexDto());

        $this->assertSame(self::ids([$new, $middle, $old]), self::ids($window->getItems()));
    }

    #[DataProvider('paginationProvider')]
    final public function testFindEventsPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $events = [];

        foreach (['E', 'C', 'A', 'D', 'B'] as $title) {
            $events[$title] = $this->event(['title' => $title]);
        }

        ksort($events);
        $sorted = array_values($events);

        $dto = $this->indexDto('title:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->eventRepository->findEvents($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Event => $sorted[$i], $expectedIndexes)),
            self::ids($window->getItems()),
        );
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame($page, $window->getPageNumber());
        $this->assertSame($hasNextPage, $window->hasNextPage());
    }

    public static function paginationProvider(): iterable
    {
        yield 'first page' => [1, 2, [0, 1], true];
        yield 'middle page' => [2, 2, [2, 3], true];
        yield 'last partial page' => [3, 2, [4], false];
        yield 'beyond last page' => [4, 2, [], false];
        yield 'exact fit' => [1, 5, [0, 1, 2, 3, 4], false];
    }

    final public function testFindEventsPaginatesWithPageFilter(): void
    {
        $page = $this->page();
        $events = [];

        foreach (['A', 'B', 'C'] as $title) {
            $events[] = $this->event(['pageParticipant' => $this->participant($page), 'title' => $title]);
            $this->event(['title' => $title]);
        }

        $dto = $this->indexDto('title:asc');
        $dto->filter->pageId = self::id($page);
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->eventRepository->findEvents($dto);

        $this->assertSame(self::ids([$events[2]]), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function page(): Page
    {
        return PageFactory::make(em: $this->em);
    }

    private function participant(?Page $page = null, ?User $user = null): PageParticipant
    {
        return PageParticipantFactory::make(array_filter(['page' => $page, 'user' => $user]), $this->em);
    }

    private function event(array $overrides = []): Event
    {
        return EventFactory::make($overrides, $this->em);
    }

    private function indexDto(string $sort = 'createdAt:desc'): EventIndexDto
    {
        $dto = new EventIndexDto();
        $dto->sort = $sort;

        return $dto;
    }
}

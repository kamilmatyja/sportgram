<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\EventListIndexDto;
use App\Entity\{EventDisciplineDistance, EventDisciplineList, User};
use App\Enum\SaveStatusEnum;
use App\Repository\EventDisciplineListRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineListFactory, UserFactory};

class EventDisciplineListRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineListRepository $eventDisciplineListRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_lists', 'event_discipline_distances', 'event_disciplines', 'events', 'pages', 'users');
        $this->eventDisciplineListRepository = $this->repository(EventDisciplineListRepository::class);
    }

    final public function testSavePersistsEventDisciplineList(): void
    {
        $distance = $this->distance();
        $user = $this->user();
        $list = EventDisciplineListFactory::make([
            'eventDisciplineDistance' => $distance,
            'user' => $user,
            'status' => SaveStatusEnum::Pending,
        ]);

        $this->eventDisciplineListRepository->save($list);
        $this->clear();

        $found = $this->eventDisciplineListRepository->findById(self::id($list));
        $this->assertTrue($found->eventDisciplineDistance->id->equals($distance->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertTrue($found->feed->id->equals($list->feed->id));
        $this->assertSame(SaveStatusEnum::Pending, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEventDisciplineList(): void
    {
        $list = $this->list($this->distance(), status: SaveStatusEnum::Pending);

        $list->status = SaveStatusEnum::Rejected;
        $this->eventDisciplineListRepository->save($list);
        $this->clear();

        $this->assertSame(
            SaveStatusEnum::Rejected,
            $this->eventDisciplineListRepository->findById(self::id($list))->status,
        );
    }

    final public function testDeleteRemovesEventDisciplineList(): void
    {
        $list = $this->list($this->distance());
        $id = self::id($list);

        $this->eventDisciplineListRepository->delete($list);
        $this->clear();

        $this->assertNull($this->eventDisciplineListRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->eventDisciplineListRepository->findById(Uuid::v4());
    }

    final public function testFindListsReturnsOnlyListsOfDistance(): void
    {
        $distance = $this->distance();
        $lists = [$this->list($distance), $this->list($distance)];
        $this->list($this->distance());

        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($lists), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindListsReturnsEmptyWindow(): void
    {
        $this->list($this->distance());

        $window = $this->eventDisciplineListRepository->findLists(self::id($this->distance()), $this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
    }

    final public function testFindListsFiltersByUser(): void
    {
        $distance = $this->distance();
        $user = $this->user();
        $matching = $this->list($distance, $user);
        $this->list($distance);
        $this->list($this->distance(), $user);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);

        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    final public function testFindListsFiltersByStatus(): void
    {
        $distance = $this->distance();
        $matching = $this->list($distance, status: SaveStatusEnum::Accepted);
        $this->list($distance, status: SaveStatusEnum::Pending);
        $this->list($distance, status: SaveStatusEnum::Rejected);
        $this->list($this->distance(), status: SaveStatusEnum::Accepted);

        $dto = $this->indexDto();
        $dto->filter->status = SaveStatusEnum::Accepted;

        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    final public function testFindListsCombinesFilters(): void
    {
        $distance = $this->distance();
        $user = $this->user();
        $matching = $this->list($distance, $user, SaveStatusEnum::Accepted);
        $this->list($distance, $user, SaveStatusEnum::Pending);
        $this->list($distance, $this->user(), SaveStatusEnum::Accepted);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->status = SaveStatusEnum::Accepted;

        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    #[DataProvider('sortProvider')]
    final public function testFindListsSorts(string $sort, array $expectedOrder): void
    {
        $distance = $this->distance();
        $lists = [
            'a' => $this->list($distance, status: SaveStatusEnum::Rejected),
            'b' => $this->list($distance, status: SaveStatusEnum::Pending),
            'c' => $this->list($distance, status: SaveStatusEnum::Accepted),
        ];
        $this->storeCreatedAt($lists['a'], '2026-01-02 00:00:00');
        $this->storeCreatedAt($lists['b'], '2026-01-03 00:00:00');
        $this->storeCreatedAt($lists['c'], '2026-01-01 00:00:00');

        $dto = $this->indexDto();
        $dto->sort = $sort;

        $this->assertSame(
            self::ids(array_map(static fn (string $key): EventDisciplineList => $lists[$key], $expectedOrder)),
            self::ids($this->eventDisciplineListRepository->findLists(self::id($distance), $dto)->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'status asc' => ['status:asc', ['b', 'c', 'a']];
        yield 'status desc' => ['status:desc', ['a', 'c', 'b']];
        yield 'createdAt asc' => ['createdAt:asc', ['c', 'a', 'b']];
        yield 'createdAt desc' => ['createdAt:desc', ['b', 'a', 'c']];
    }

    final public function testFindListsPaginates(): void
    {
        $distance = $this->distance();
        $lists = [];

        for ($i = 0; $i < 5; ++$i) {
            $lists[] = $list = $this->list($distance);
            $this->storeCreatedAt($list, sprintf('2026-01-0%d 00:00:00', $i + 1));
        }

        $dto = $this->indexDto();
        $dto->sort = 'createdAt:asc';
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $dto);

        $this->assertSame(self::ids([$lists[2], $lists[3]]), self::ids($window->getItems()));
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame(2, $window->getPageNumber());
        $this->assertTrue($window->hasNextPage());

        $dto->page = 3;
        $window = $this->eventDisciplineListRepository->findLists(self::id($distance), $dto);

        $this->assertSame(self::ids([$lists[4]]), self::ids($window->getItems()));
        $this->assertFalse($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function distance(): EventDisciplineDistance
    {
        return EventDisciplineDistanceFactory::make(em: $this->em);
    }

    private function list(EventDisciplineDistance $distance, ?User $user = null, ?SaveStatusEnum $status = null): EventDisciplineList
    {
        return EventDisciplineListFactory::make(array_filter([
            'eventDisciplineDistance' => $distance,
            'user' => $user ?? $this->user(),
            'status' => $status,
        ]), $this->em);
    }

    private function indexDto(): EventListIndexDto
    {
        return new EventListIndexDto();
    }
}

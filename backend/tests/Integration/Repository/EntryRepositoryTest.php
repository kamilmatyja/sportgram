<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\{EntryCountDto, EntryCountIndexDto, EntryIndexDto};
use App\Entity\{Entry, User};
use App\Enum\EntryTypeEnum;
use App\Repository\EntryRepository;
use Doctrine\ORM\Tools\Pagination\WindowPage;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EntryFactory, UserFactory};

class EntryRepositoryTest extends RepositoryTestCase
{
    private EntryRepository $entryRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('entries', 'users');
        $this->entryRepository = $this->repository(EntryRepository::class);
    }

    final public function testSavePersistsEntry(): void
    {
        $user = $this->user();
        $entityId = Uuid::v7();
        $entry = EntryFactory::make(['user' => $user, 'entityId' => $entityId, 'type' => EntryTypeEnum::Feed]);

        $this->entryRepository->save($entry);
        $this->clear();

        $found = $this->entryRepository->findById(self::id($entry));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertTrue($found->entityId->equals($entityId));
        $this->assertSame(EntryTypeEnum::Feed, $found->type);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEntry(): void
    {
        $entry = $this->entry(type: EntryTypeEnum::Feed);
        $entityId = Uuid::v7();

        $entry->type = EntryTypeEnum::Goal;
        $entry->entityId = $entityId;
        $this->entryRepository->save($entry);
        $this->clear();

        $found = $this->entryRepository->findById(self::id($entry));
        $this->assertSame(EntryTypeEnum::Goal, $found->type);
        $this->assertTrue($found->entityId->equals($entityId));
        $this->assertSame(1, $this->entryRepository->count());
    }

    final public function testDeleteRemovesEntry(): void
    {
        $entry = $this->entry();
        $other = $this->entry();
        $id = self::id($entry);

        $this->entryRepository->delete($entry);
        $this->clear();

        $this->assertNull($this->entryRepository->find($id));
        $this->assertNotNull($this->entryRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsEntry(): void
    {
        $entry = $this->entry();
        $this->entry();
        $this->clear();

        $this->assertSame((string) $entry->id, (string) $this->entryRepository->findById(self::id($entry))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->entry();

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->entryRepository->findById(Uuid::v7());
    }

    final public function testFindEntriesWithoutFiltersReturnsAll(): void
    {
        $first = $this->entry(createdAt: '2026-01-01 10:00:00');
        $second = $this->entry(createdAt: '2026-01-02 10:00:00');
        $third = $this->entry(createdAt: '2026-01-03 10:00:00');

        $page = $this->entryRepository->findEntries($this->indexDto());

        $this->assertSame(self::ids([$third, $second, $first]), self::ids($page->getItems()));
        $this->assertSame(3, $page->getTotalCount());
    }

    final public function testFindEntriesFiltersByUser(): void
    {
        $user = $this->user();
        $first = $this->entry($user, createdAt: '2026-01-01 10:00:00');
        $second = $this->entry($user, createdAt: '2026-01-02 10:00:00');
        $this->entry();

        $page = $this->entryRepository->findEntries($this->indexDto(userId: self::id($user), sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindEntriesFiltersByEntityIds(): void
    {
        $entityId1 = Uuid::v7();
        $entityId2 = Uuid::v7();
        $first = $this->entry(entityId: $entityId1, createdAt: '2026-01-01 10:00:00');
        $second = $this->entry(entityId: $entityId2, createdAt: '2026-01-02 10:00:00');
        $third = $this->entry(entityId: $entityId1, createdAt: '2026-01-03 10:00:00');
        $this->entry(entityId: Uuid::v7());

        $page = $this->entryRepository->findEntries($this->indexDto(entityIds: [$entityId1, $entityId2], sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second, $third]), self::ids($page->getItems()));
    }

    final public function testFindEntriesFiltersBySingleEntityId(): void
    {
        $entityId = Uuid::v7();
        $entry = $this->entry(entityId: $entityId);
        $this->entry();

        $page = $this->entryRepository->findEntries($this->indexDto(entityIds: [$entityId]));

        $this->assertSame(self::ids([$entry]), self::ids($page->getItems()));
    }

    final public function testFindEntriesFiltersByType(): void
    {
        $first = $this->entry(type: EntryTypeEnum::Feed, createdAt: '2026-01-01 10:00:00');
        $second = $this->entry(type: EntryTypeEnum::Feed, createdAt: '2026-01-02 10:00:00');
        $this->entry(type: EntryTypeEnum::Goal);
        $this->entry(type: EntryTypeEnum::User);

        $page = $this->entryRepository->findEntries($this->indexDto(type: EntryTypeEnum::Feed, sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($page->getItems()));
    }

    final public function testFindEntriesCombinesAllFilters(): void
    {
        $user = $this->user();
        $entityId = Uuid::v7();
        $match = $this->entry($user, $entityId, EntryTypeEnum::Feed);
        $this->entry($user, $entityId, EntryTypeEnum::Goal);
        $this->entry($user, Uuid::v7(), EntryTypeEnum::Feed);
        $this->entry($this->user(), $entityId, EntryTypeEnum::Feed);

        $page = $this->entryRepository->findEntries(
            $this->indexDto(userId: self::id($user), entityIds: [$entityId], type: EntryTypeEnum::Feed),
        );

        $this->assertSame(self::ids([$match]), self::ids($page->getItems()));
        $this->assertSame(1, $page->getTotalCount());
    }

    final public function testFindEntriesReturnsEmptyPageWhenNothingMatches(): void
    {
        $this->entry(type: EntryTypeEnum::Feed);

        $page = $this->entryRepository->findEntries($this->indexDto(userId: Uuid::v7()));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    #[DataProvider('entrySortProvider')]
    final public function testFindEntriesSorts(string $sort, array $expectedOrder): void
    {
        $entries = [
            $this->entry(type: EntryTypeEnum::Goal, createdAt: '2026-01-02 10:00:00'),
            $this->entry(type: EntryTypeEnum::User, createdAt: '2026-01-03 10:00:00'),
            $this->entry(type: EntryTypeEnum::Training, createdAt: '2026-01-01 10:00:00'),
        ];

        $page = $this->entryRepository->findEntries($this->indexDto(sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Entry => $entries[$i], $expectedOrder)),
            self::ids($page->getItems()),
        );
    }

    public static function entrySortProvider(): iterable
    {
        yield 'type asc' => ['type:asc', [1, 0, 2]];
        yield 'type desc' => ['type:desc', [2, 0, 1]];
        yield 'createdAt asc' => ['createdAt:asc', [2, 0, 1]];
        yield 'createdAt desc' => ['createdAt:desc', [1, 0, 2]];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindEntriesPaginates(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $entries = [];

        for ($i = 0; $i < 5; ++$i) {
            $entries[] = $this->entry(createdAt: sprintf('2026-01-0%d 10:00:00', $i + 1));
        }

        $dto = $this->indexDto(sort: 'createdAt:asc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->entryRepository->findEntries($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Entry => $entries[$i], $expectedIndexes)),
            self::ids($page->getItems()),
        );
        $this->assertSame(5, $page->getTotalCount());
        $this->assertSame($pageNumber, $page->getPageNumber());
        $this->assertSame($hasNextPage, $page->hasNextPage());
    }

    public static function paginationProvider(): iterable
    {
        yield 'first page' => [1, 2, [0, 1], true];
        yield 'middle page' => [2, 2, [2, 3], true];
        yield 'last partial page' => [3, 2, [4], false];
        yield 'exact fit' => [1, 5, [0, 1, 2, 3, 4], false];
        yield 'beyond last page' => [4, 2, [], false];
    }

    final public function testFindCountEntriesGroupsByTypeAndEntity(): void
    {
        $entityId1 = Uuid::v7();
        $entityId2 = Uuid::v7();
        $this->entries(3, $entityId1, EntryTypeEnum::Feed);
        $this->entries(1, $entityId1, EntryTypeEnum::Goal);
        $this->entries(2, $entityId2, EntryTypeEnum::Feed);

        $page = $this->entryRepository->findCountEntries($this->countDto());

        $this->assertSame([
            self::countKey(EntryTypeEnum::Feed, $entityId1, 3),
            self::countKey(EntryTypeEnum::Feed, $entityId2, 2),
            self::countKey(EntryTypeEnum::Goal, $entityId1, 1),
        ], self::countKeys($page));
        $this->assertSame(3, $page->getTotalCount());
        $this->assertContainsOnlyInstancesOf(EntryCountDto::class, $page->getItems());
    }

    final public function testFindCountEntriesCountsEntriesOfAllUsers(): void
    {
        $entityId = Uuid::v7();
        $this->entry($this->user(), $entityId, EntryTypeEnum::Page);
        $this->entry($this->user(), $entityId, EntryTypeEnum::Page);

        $page = $this->entryRepository->findCountEntries($this->countDto());

        $this->assertSame([self::countKey(EntryTypeEnum::Page, $entityId, 2)], self::countKeys($page));
    }

    final public function testFindCountEntriesFiltersByEntityIds(): void
    {
        $entityId1 = Uuid::v7();
        $entityId2 = Uuid::v7();
        $this->entries(2, $entityId1, EntryTypeEnum::Feed);
        $this->entries(1, $entityId2, EntryTypeEnum::Feed);
        $this->entries(4, Uuid::v7(), EntryTypeEnum::Feed);

        $page = $this->entryRepository->findCountEntries($this->countDto(entityIds: [$entityId1, $entityId2]));

        $this->assertSame([
            self::countKey(EntryTypeEnum::Feed, $entityId1, 2),
            self::countKey(EntryTypeEnum::Feed, $entityId2, 1),
        ], self::countKeys($page));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindCountEntriesFiltersByType(): void
    {
        $entityId = Uuid::v7();
        $this->entries(2, $entityId, EntryTypeEnum::Feed);
        $this->entries(3, $entityId, EntryTypeEnum::Goal);

        $page = $this->entryRepository->findCountEntries($this->countDto(type: EntryTypeEnum::Feed));

        $this->assertSame([self::countKey(EntryTypeEnum::Feed, $entityId, 2)], self::countKeys($page));
        $this->assertSame(1, $page->getTotalCount());
    }

    final public function testFindCountEntriesCombinesFilters(): void
    {
        $entityId = Uuid::v7();
        $this->entries(2, $entityId, EntryTypeEnum::Feed);
        $this->entries(3, $entityId, EntryTypeEnum::Goal);
        $this->entries(4, Uuid::v7(), EntryTypeEnum::Feed);

        $page = $this->entryRepository->findCountEntries($this->countDto(entityIds: [$entityId], type: EntryTypeEnum::Feed));

        $this->assertSame([self::countKey(EntryTypeEnum::Feed, $entityId, 2)], self::countKeys($page));
        $this->assertSame(1, $page->getTotalCount());
    }

    final public function testFindCountEntriesReturnsEmptyPageWhenNothingMatches(): void
    {
        $this->entries(2, Uuid::v7(), EntryTypeEnum::Feed);

        $page = $this->entryRepository->findCountEntries($this->countDto(type: EntryTypeEnum::Goal));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    #[DataProvider('countSortProvider')]
    final public function testFindCountEntriesSorts(string $sort, array $expectedOrder): void
    {
        $groups = [
            [EntryTypeEnum::Goal, Uuid::v7(), 1],
            [EntryTypeEnum::User, Uuid::v7(), 3],
            [EntryTypeEnum::Training, Uuid::v7(), 2],
        ];

        foreach ($groups as [$type, $entityId, $count]) {
            $this->entries($count, $entityId, $type);
        }

        $page = $this->entryRepository->findCountEntries($this->countDto(sort: $sort));

        $this->assertSame(
            array_map(static fn (int $i): string => self::countKey(...$groups[$i]), $expectedOrder),
            self::countKeys($page),
        );
    }

    public static function countSortProvider(): iterable
    {
        yield 'type asc' => ['type:asc', [1, 0, 2]];
        yield 'type desc' => ['type:desc', [2, 0, 1]];
        yield 'count asc' => ['count:asc', [0, 2, 1]];
        yield 'count desc' => ['count:desc', [1, 2, 0]];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindCountEntriesPaginatesGroups(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $groups = [];

        for ($i = 0; $i < 5; ++$i) {
            $groups[] = [EntryTypeEnum::Feed, Uuid::v7(), 5 - $i];
            $this->entries(5 - $i, $groups[$i][1], EntryTypeEnum::Feed);
        }

        $dto = $this->countDto(sort: 'count:desc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->entryRepository->findCountEntries($dto);

        $this->assertSame(
            array_map(static fn (int $i): string => self::countKey(...$groups[$i]), $expectedIndexes),
            self::countKeys($page),
        );
        $this->assertSame(5, $page->getTotalCount());
        $this->assertSame($pageNumber, $page->getPageNumber());
        $this->assertSame($hasNextPage, $page->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function entry(
        ?User $user = null,
        ?Uuid $entityId = null,
        ?EntryTypeEnum $type = null,
        ?string $createdAt = null,
    ): Entry {
        $entry = EntryFactory::make(array_filter([
            'user' => $user ?? $this->user(),
            'entityId' => $entityId,
            'type' => $type,
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE entries SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $entry->id],
            );
        }

        return $entry;
    }

    private function entries(int $count, Uuid $entityId, EntryTypeEnum $type): void
    {
        for ($i = 0; $i < $count; ++$i) {
            $this->entry(entityId: $entityId, type: $type);
        }
    }

    /** @param Uuid[] $entityIds */
    private function indexDto(
        ?Uuid $userId = null,
        array $entityIds = [],
        ?EntryTypeEnum $type = null,
        string $sort = 'createdAt:desc',
    ): EntryIndexDto {
        $dto = new EntryIndexDto();
        $dto->filter->userId = $userId;
        $dto->filter->entityIds = $entityIds;
        $dto->filter->type = $type;
        $dto->sort = $sort;

        return $dto;
    }

    /** @param Uuid[] $entityIds */
    private function countDto(array $entityIds = [], ?EntryTypeEnum $type = null, string $sort = 'count:desc'): EntryCountIndexDto
    {
        $dto = new EntryCountIndexDto();
        $dto->filter->entityIds = $entityIds;
        $dto->filter->type = $type;
        $dto->sort = $sort;

        return $dto;
    }

    private static function countKey(EntryTypeEnum $type, Uuid $entityId, int $count): string
    {
        return sprintf('%s:%s:%d', $type->name, $entityId, $count);
    }

    /** @return string[] */
    private static function countKeys(WindowPage $page): array
    {
        return array_map(
            static fn (EntryCountDto $dto): string => self::countKey($dto->type, $dto->entityId, $dto->count),
            $page->getItems(),
        );
    }
}

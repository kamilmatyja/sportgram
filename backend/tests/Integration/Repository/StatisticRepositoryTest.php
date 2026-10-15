<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\{StatisticIndexDto, StatisticResultDto};
use App\Entity\User;
use App\Enum\{DisciplineEnum, ElementStatusEnum, SaveStatusEnum};
use App\Repository\StatisticRepository;
use Doctrine\ORM\Tools\Pagination\WindowPage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{
    EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingFactory,
    UserFactory
};

class StatisticRepositoryTest extends RepositoryTestCase
{
    private StatisticRepository $statisticRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate(
            'training_discipline_distances',
            'training_disciplines',
            'trainings',
            'event_discipline_results',
            'event_discipline_lists',
            'event_discipline_distances',
            'event_disciplines',
            'events',
            'feeds',
            'users',
        );
        $this->statisticRepository = $this->repository(StatisticRepository::class);
    }

    final public function testFindProgressCombinesTrainingAndEventResultsOfUser(): void
    {
        $user = $this->user();
        $other = $this->user();
        $this->training($user, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');
        $this->eventResult($user, DisciplineEnum::Running, 5000, 1400, '2026-01-02 09:30:15');
        $this->training($user, DisciplineEnum::Cycling, 20000, 2400, '2026-01-03 07:00:00');
        $this->training($other, DisciplineEnum::Running, 5000, 1000, '2026-01-01 08:00:00');
        $this->eventResult($other, DisciplineEnum::Running, 5000, 900, '2026-01-02 08:00:00');

        $page = $this->statisticRepository->findProgress($this->indexDto([$user], sort: 'createdAt:asc'));

        $this->assertSame([
            self::row($user, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00'),
            self::row($user, DisciplineEnum::Running, 5000, 1400, '2026-01-02 09:30:15'),
            self::row($user, DisciplineEnum::Cycling, 20000, 2400, '2026-01-03 07:00:00'),
        ], self::rows($page));
        $this->assertSame(3, $page->getTotalCount());
        $this->assertContainsOnlyInstancesOf(StatisticResultDto::class, $page->getItems());
    }

    final public function testFindProgressWithoutUserFilterReturnsAllUsers(): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $this->training($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');
        $this->eventResult($user2, DisciplineEnum::Swimming, 1000, 1200, '2026-01-02 08:00:00');

        $page = $this->statisticRepository->findProgress($this->indexDto([], sort: 'createdAt:asc'));

        $this->assertSame([
            self::row($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00'),
            self::row($user2, DisciplineEnum::Swimming, 1000, 1200, '2026-01-02 08:00:00'),
        ], self::rows($page));
    }

    final public function testFindProgressFiltersByMultipleUsers(): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $user3 = $this->user();
        $this->training($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');
        $this->eventResult($user2, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00');
        $this->training($user3, DisciplineEnum::Running, 5000, 1300, '2026-01-03 08:00:00');
        $this->eventResult($user3, DisciplineEnum::Running, 5000, 1200, '2026-01-04 08:00:00');

        $page = $this->statisticRepository->findProgress($this->indexDto([$user1, $user2], sort: 'createdAt:asc'));

        $this->assertSame([
            self::row($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00'),
            self::row($user2, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00'),
        ], self::rows($page));
        $this->assertSame(2, $page->getTotalCount());
    }

    #[DataProvider('filterProvider')]
    final public function testFindProgressFilters(?DisciplineEnum $discipline, ?int $distance, array $expectedKeys): void
    {
        $user = $this->user();
        $rows = [
            'run5k' => $this->training($user, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00'),
            'run5kEvent' => $this->eventResult($user, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00'),
            'run5001' => $this->training($user, DisciplineEnum::Running, 5001, 1500, '2026-01-03 08:00:00'),
            'run10k' => $this->eventResult($user, DisciplineEnum::Running, 10000, 3000, '2026-01-04 08:00:00'),
            'bike5k' => $this->training($user, DisciplineEnum::Cycling, 5000, 500, '2026-01-05 08:00:00'),
            'swim5kEvent' => $this->eventResult($user, DisciplineEnum::Swimming, 5000, 4000, '2026-01-06 08:00:00'),
        ];

        $page = $this->statisticRepository->findProgress($this->indexDto([$user], $discipline, $distance, 'createdAt:asc'));

        $this->assertSame(array_map(static fn (string $key): array => $rows[$key], $expectedKeys), self::rows($page));
        $this->assertSame(count($expectedKeys), $page->getTotalCount());
    }

    public static function filterProvider(): iterable
    {
        yield 'no filter' => [null, null, ['run5k', 'run5kEvent', 'run5001', 'run10k', 'bike5k', 'swim5kEvent']];
        yield 'discipline' => [DisciplineEnum::Running, null, ['run5k', 'run5kEvent', 'run5001', 'run10k']];
        yield 'distance' => [null, 5000, ['run5k', 'run5kEvent', 'bike5k', 'swim5kEvent']];
        yield 'discipline and distance' => [DisciplineEnum::Running, 5000, ['run5k', 'run5kEvent']];
        yield 'no match' => [DisciplineEnum::Rowing, null, []];
        yield 'distance no match' => [DisciplineEnum::Cycling, 10000, []];
    }

    final public function testFindProgressIgnoresTrainingAndEventListStatus(): void
    {
        $user = $this->user();
        $this->training($user, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00', ElementStatusEnum::Draft);
        $this->training($user, DisciplineEnum::Running, 5000, 1450, '2026-01-02 08:00:00', ElementStatusEnum::Rejected);
        $this->eventResult($user, DisciplineEnum::Running, 5000, 1400, '2026-01-03 08:00:00', SaveStatusEnum::Rejected);

        $page = $this->statisticRepository->findProgress($this->indexDto([$user]));

        $this->assertSame(3, $page->getTotalCount());
    }

    #[DataProvider('sortProvider')]
    final public function testFindProgressSorts(string $sort, array $expectedKeys): void
    {
        $user = $this->user();
        $rows = [
            'a' => $this->training($user, DisciplineEnum::Running, 5000, 300, '2026-01-02 08:00:00'),
            'b' => $this->eventResult($user, DisciplineEnum::Swimming, 1000, 900, '2026-01-03 08:00:00'),
            'c' => $this->training($user, DisciplineEnum::Cycling, 20000, 100, '2026-01-01 08:00:00'),
        ];

        $page = $this->statisticRepository->findProgress($this->indexDto([$user], sort: $sort));

        $this->assertSame(array_map(static fn (string $key): array => $rows[$key], $expectedKeys), self::rows($page));
    }

    public static function sortProvider(): iterable
    {
        yield 'discipline asc' => ['discipline:asc', ['a', 'c', 'b']];
        yield 'discipline desc' => ['discipline:desc', ['b', 'c', 'a']];
        yield 'distance asc' => ['distance:asc', ['b', 'a', 'c']];
        yield 'distance desc' => ['distance:desc', ['c', 'a', 'b']];
        yield 'time asc' => ['time:asc', ['c', 'a', 'b']];
        yield 'time desc' => ['time:desc', ['b', 'a', 'c']];
        yield 'createdAt asc' => ['createdAt:asc', ['c', 'a', 'b']];
        yield 'createdAt desc' => ['createdAt:desc', ['b', 'a', 'c']];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindProgressPaginates(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $rows = [];

        for ($i = 0; $i < 5; ++$i) {
            $createdAt = sprintf('2026-01-01 10:00:%02d', $i);
            $rows[] = $i % 2
                ? $this->eventResult($user, DisciplineEnum::Running, 5000, 1000 + $i, $createdAt)
                : $this->training($user, DisciplineEnum::Running, 5000, 1000 + $i, $createdAt);
        }

        $dto = $this->indexDto([$user], sort: 'createdAt:asc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->statisticRepository->findProgress($dto);

        $this->assertSame(array_map(static fn (int $i): array => $rows[$i], $expectedIndexes), self::rows($page));
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

    final public function testFindProgressReturnsEmptyPage(): void
    {
        $user = $this->user();
        $this->training($this->user(), DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');

        $page = $this->statisticRepository->findProgress($this->indexDto([$user]));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    final public function testFindRecordsKeepsBestTimePerUserDisciplineAndDistance(): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $this->training($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');
        $this->eventResult($user1, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00');
        $this->training($user1, DisciplineEnum::Running, 5000, 1450, '2026-01-03 08:00:00');
        $this->training($user1, DisciplineEnum::Running, 10000, 3000, '2026-01-04 08:00:00');
        $this->training($user1, DisciplineEnum::Cycling, 5000, 600, '2026-01-05 08:00:00');
        $this->eventResult($user2, DisciplineEnum::Running, 5000, 1300, '2026-01-07 08:00:00');
        $this->training($user2, DisciplineEnum::Running, 5000, 1350, '2026-01-06 08:00:00');

        $page = $this->statisticRepository->findRecords($this->indexDto([], sort: 'createdAt:asc'));

        $this->assertSame([
            self::row($user1, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00'),
            self::row($user1, DisciplineEnum::Running, 10000, 3000, '2026-01-04 08:00:00'),
            self::row($user1, DisciplineEnum::Cycling, 5000, 600, '2026-01-05 08:00:00'),
            self::row($user2, DisciplineEnum::Running, 5000, 1300, '2026-01-07 08:00:00'),
        ], self::rows($page));
        $this->assertSame(4, $page->getTotalCount());
    }

    final public function testFindRecordsPicksEarliestResultOnEqualTime(): void
    {
        $user = $this->user();
        $this->training($user, DisciplineEnum::Running, 5000, 1400, '2026-01-03 08:00:00');
        $earliest = $this->eventResult($user, DisciplineEnum::Running, 5000, 1400, '2026-01-01 08:00:00');
        $this->training($user, DisciplineEnum::Running, 5000, 1400, '2026-01-02 08:00:00');

        $page = $this->statisticRepository->findRecords($this->indexDto([$user]));

        $this->assertSame([$earliest], self::rows($page));
        $this->assertSame(1, $page->getTotalCount());
    }

    #[DataProvider('recordFilterProvider')]
    final public function testFindRecordsFilters(bool $onlyUser1, ?DisciplineEnum $discipline, ?int $distance, array $expectedKeys): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $this->training($user1, DisciplineEnum::Running, 5000, 1500, '2026-01-01 08:00:00');
        $this->training($user1, DisciplineEnum::Cycling, 5000, 700, '2026-01-02 08:00:00');
        $this->eventResult($user2, DisciplineEnum::Running, 5000, 1400, '2026-01-03 08:00:00');
        $records = [
            'u1run5k' => $this->eventResult($user1, DisciplineEnum::Running, 5000, 1450, '2026-01-04 08:00:00'),
            'u1bike5k' => $this->training($user1, DisciplineEnum::Cycling, 5000, 650, '2026-01-05 08:00:00'),
            'u1run10k' => $this->training($user1, DisciplineEnum::Running, 10000, 3100, '2026-01-06 08:00:00'),
            'u2run5k' => $this->training($user2, DisciplineEnum::Running, 5000, 1350, '2026-01-07 08:00:00'),
        ];

        $page = $this->statisticRepository->findRecords(
            $this->indexDto($onlyUser1 ? [$user1] : [], $discipline, $distance, 'createdAt:asc'),
        );

        $this->assertSame(array_map(static fn (string $key): array => $records[$key], $expectedKeys), self::rows($page));
        $this->assertSame(count($expectedKeys), $page->getTotalCount());
    }

    public static function recordFilterProvider(): iterable
    {
        yield 'no filter' => [false, null, null, ['u1run5k', 'u1bike5k', 'u1run10k', 'u2run5k']];
        yield 'user' => [true, null, null, ['u1run5k', 'u1bike5k', 'u1run10k']];
        yield 'discipline' => [false, DisciplineEnum::Running, null, ['u1run5k', 'u1run10k', 'u2run5k']];
        yield 'distance' => [false, null, 5000, ['u1run5k', 'u1bike5k', 'u2run5k']];
        yield 'user, discipline and distance' => [true, DisciplineEnum::Running, 5000, ['u1run5k']];
        yield 'no match' => [true, DisciplineEnum::Swimming, null, []];
    }

    #[DataProvider('sortProvider')]
    final public function testFindRecordsSorts(string $sort, array $expectedKeys): void
    {
        $user = $this->user();
        $records = [
            'a' => $this->training($user, DisciplineEnum::Running, 5000, 300, '2026-01-02 08:00:00'),
            'b' => $this->eventResult($user, DisciplineEnum::Swimming, 1000, 900, '2026-01-03 08:00:00'),
            'c' => $this->training($user, DisciplineEnum::Cycling, 20000, 100, '2026-01-01 08:00:00'),
        ];
        $this->training($user, DisciplineEnum::Running, 5000, 301, '2026-01-04 08:00:00');
        $this->eventResult($user, DisciplineEnum::Swimming, 1000, 901, '2025-12-31 08:00:00');

        $page = $this->statisticRepository->findRecords($this->indexDto([$user], sort: $sort));

        $this->assertSame(array_map(static fn (string $key): array => $records[$key], $expectedKeys), self::rows($page));
    }

    final public function testFindRecordsPaginatesOverRecordsNotRawResults(): void
    {
        $user = $this->user();
        $records = [];

        for ($i = 0; $i < 3; ++$i) {
            $records[] = $this->training($user, DisciplineEnum::Running, 1000 * ($i + 1), 100, sprintf('2026-01-01 10:00:%02d', $i));
            $this->eventResult($user, DisciplineEnum::Running, 1000 * ($i + 1), 200, sprintf('2026-01-02 10:00:%02d', $i));
        }

        $dto = $this->indexDto([$user], sort: 'createdAt:asc');
        $dto->page = 2;
        $dto->limit = 2;

        $page = $this->statisticRepository->findRecords($dto);

        $this->assertSame([$records[2]], self::rows($page));
        $this->assertSame(3, $page->getTotalCount());
        $this->assertSame(2, $page->getPageNumber());
        $this->assertFalse($page->hasNextPage());
    }

    final public function testFindRecordsReturnsEmptyPage(): void
    {
        $page = $this->statisticRepository->findRecords($this->indexDto([$this->user()]));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function training(
        User $user,
        DisciplineEnum $discipline,
        int $distance,
        int $time,
        string $createdAt,
        ElementStatusEnum $status = ElementStatusEnum::Active,
    ): array {
        $training = TrainingFactory::make(['user' => $user, 'status' => $status], $this->em);
        $trainingDiscipline = TrainingDisciplineFactory::make(['training' => $training, 'discipline' => $discipline], $this->em);
        $trainingDistance = TrainingDisciplineDistanceFactory::make([
            'trainingDiscipline' => $trainingDiscipline,
            'distance' => $distance,
            'time' => $time,
        ], $this->em);
        $this->setCreatedAt('training_discipline_distances', (string) $trainingDistance->id, $createdAt);

        return self::row($user, $discipline, $distance, $time, $createdAt);
    }

    private function eventResult(
        User $user,
        DisciplineEnum $discipline,
        int $distance,
        int $time,
        string $createdAt,
        SaveStatusEnum $listStatus = SaveStatusEnum::Accepted,
    ): array {
        $eventDiscipline = EventDisciplineFactory::make(['discipline' => $discipline], $this->em);
        $eventDistance = EventDisciplineDistanceFactory::make([
            'eventDiscipline' => $eventDiscipline,
            'distance' => $distance,
        ], $this->em);
        $list = EventDisciplineListFactory::make([
            'eventDisciplineDistance' => $eventDistance,
            'user' => $user,
            'status' => $listStatus,
        ], $this->em);
        $result = EventDisciplineResultFactory::make([
            'eventDisciplineList' => $list,
            'user' => $user,
            'time' => $time,
        ], $this->em);
        $this->setCreatedAt('event_discipline_results', (string) $result->id, $createdAt);

        return self::row($user, $discipline, $distance, $time, $createdAt);
    }

    private function setCreatedAt(string $table, string $id, string $createdAt): void
    {
        $this->em->getConnection()->executeStatement(
            sprintf('UPDATE %s SET created_at = :createdAt WHERE id = :id', $table),
            ['createdAt' => $createdAt, 'id' => $id],
        );
    }

    private static function row(User $user, DisciplineEnum $discipline, int $distance, int $time, string $createdAt): array
    {
        return [(string) $user->id, $discipline->value, $distance, $time, $createdAt];
    }

    private static function rows(WindowPage $page): array
    {
        return array_map(
            static fn (StatisticResultDto $dto): array => [
                (string) $dto->userId,
                $dto->discipline,
                $dto->distance,
                $dto->time,
                $dto->createdAt->format('Y-m-d H:i:s'),
            ],
            $page->getItems(),
        );
    }

    /** @param User[] $users */
    private function indexDto(
        array $users,
        ?DisciplineEnum $discipline = null,
        ?int $distance = null,
        string $sort = 'createdAt:desc',
    ): StatisticIndexDto {
        $dto = new StatisticIndexDto();
        $dto->filter->userIds = array_map(self::id(...), $users);
        $dto->filter->discipline = $discipline;
        $dto->filter->distance = $distance;
        $dto->sort = $sort;

        return $dto;
    }
}

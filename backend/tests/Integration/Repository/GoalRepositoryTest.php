<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\GoalIndexDto;
use App\Entity\{Goal, User};
use App\Enum\{DisciplineEnum, GoalStatusEnum, SaveStatusEnum};
use App\Repository\GoalRepository;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalFactory, GoalParticipantFactory, UserFactory};

class GoalRepositoryTest extends RepositoryTestCase
{
    private const string START = '2026-05-01 10:00:00';

    private const string END = '2026-05-31 20:00:00';

    private GoalRepository $goalRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participants', 'goals', 'feeds', 'users');
        $this->goalRepository = $this->repository(GoalRepository::class);
    }

    final public function testSavePersistsGoal(): void
    {
        $user = $this->user();
        $goal = GoalFactory::make([
            'user' => $user,
            'startedAt' => new DateTimeImmutable(self::START),
            'endedAt' => new DateTimeImmutable(self::END),
            'text' => 'run a marathon',
            'link' => 'goal-link',
            'discipline' => DisciplineEnum::Running,
            'distance' => 42195,
            'time' => 3600,
            'status' => GoalStatusEnum::Draft,
        ]);

        $this->goalRepository->save($goal);
        $this->clear();

        $found = $this->goalRepository->findById(self::id($goal));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertTrue($found->feed->id->equals($goal->feed->id));
        $this->assertEquals(new DateTimeImmutable(self::START), $found->startedAt);
        $this->assertEquals(new DateTimeImmutable(self::END), $found->endedAt);
        $this->assertSame('run a marathon', $found->text);
        $this->assertSame('goal-link', $found->link);
        $this->assertSame(DisciplineEnum::Running, $found->discipline);
        $this->assertSame(42195, $found->distance);
        $this->assertSame(3600, $found->time);
        $this->assertSame(GoalStatusEnum::Draft, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingGoal(): void
    {
        $goal = $this->goal(['status' => GoalStatusEnum::Draft, 'distance' => 10]);

        $goal->status = GoalStatusEnum::Completed;
        $goal->distance = 20;
        $this->goalRepository->save($goal);
        $this->clear();

        $found = $this->goalRepository->findById(self::id($goal));
        $this->assertSame(GoalStatusEnum::Completed, $found->status);
        $this->assertSame(20, $found->distance);
    }

    final public function testDeleteRemovesGoal(): void
    {
        $goal = $this->goal();
        $id = self::id($goal);

        $this->goalRepository->delete($goal);
        $this->clear();

        $this->assertNull($this->goalRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->goalRepository->findById(Uuid::v4());
    }

    #[DataProvider('activeDateProvider')]
    final public function testFindActiveByDisciplineRespectsDateRangeInclusively(string $date, bool $expected): void
    {
        $user = $this->user();
        $goal = $this->activeGoal($user);

        $window = $this->goalRepository->findActiveByDiscipline(
            self::id($user),
            DisciplineEnum::Running,
            new DateTimeImmutable($date),
        );

        $this->assertSame($expected ? self::ids([$goal]) : [], self::ids($window->getItems()));
    }

    public static function activeDateProvider(): iterable
    {
        yield 'exactly at startedAt' => [self::START, true];
        yield 'exactly at endedAt' => [self::END, true];
        yield 'in the middle' => ['2026-05-15 12:00:00', true];
        yield 'one second before startedAt' => ['2026-05-01 09:59:59', false];
        yield 'one second after endedAt' => ['2026-05-31 20:00:01', false];
    }

    #[DataProvider('inactiveStatusProvider')]
    final public function testFindActiveByDisciplineExcludesNotActiveGoals(GoalStatusEnum $status): void
    {
        $user = $this->user();
        $this->activeGoal($user, status: $status);

        $window = $this->goalRepository->findActiveByDiscipline(
            self::id($user),
            DisciplineEnum::Running,
            new DateTimeImmutable('2026-05-15 12:00:00'),
        );

        $this->assertSame([], self::ids($window->getItems()));
    }

    public static function inactiveStatusProvider(): iterable
    {
        foreach (GoalStatusEnum::cases() as $status) {
            if ($status !== GoalStatusEnum::Active) {
                yield $status->name => [$status];
            }
        }
    }

    final public function testFindActiveByDisciplineFiltersByDisciplineAndParticipant(): void
    {
        $user = $this->user();
        $matching = $this->activeGoal($user);
        $this->activeGoal($user, DisciplineEnum::Cycling);
        $this->activeGoal($this->user());
        $this->goal([
            'user' => $user,
            'startedAt' => new DateTimeImmutable(self::START),
            'endedAt' => new DateTimeImmutable(self::END),
            'discipline' => DisciplineEnum::Running,
            'status' => GoalStatusEnum::Active,
        ]);

        $window = $this->goalRepository->findActiveByDiscipline(
            self::id($user),
            DisciplineEnum::Running,
            new DateTimeImmutable('2026-05-15 12:00:00'),
        );

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    final public function testFindActiveByDisciplineReturnsGoalOnceWithManyParticipants(): void
    {
        $user = $this->user();
        $goal = $this->activeGoal($user);
        $this->participant($goal, $this->user());
        $other = $this->activeGoal($user);

        $window = $this->goalRepository->findActiveByDiscipline(
            self::id($user),
            DisciplineEnum::Running,
            new DateTimeImmutable('2026-05-15 12:00:00'),
        );

        $this->assertEqualsCanonicalizing(self::ids([$goal, $other]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindActiveByDisciplineIgnoresGoalsWithoutDates(): void
    {
        $user = $this->user();
        $goal = $this->goal([
            'startedAt' => null,
            'endedAt' => null,
            'discipline' => DisciplineEnum::Running,
            'status' => GoalStatusEnum::Active,
        ]);
        $this->participant($goal, $user);

        $window = $this->goalRepository->findActiveByDiscipline(
            self::id($user),
            DisciplineEnum::Running,
            new DateTimeImmutable('2026-05-15 12:00:00'),
        );

        $this->assertSame([], self::ids($window->getItems()));
    }

    final public function testFindGoalsWithoutFiltersReturnsAll(): void
    {
        $goals = [$this->goal(), $this->goal(), $this->goal()];

        $window = $this->goalRepository->findGoals($this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($goals), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    final public function testFindGoalsReturnsEmptyWindow(): void
    {
        $window = $this->goalRepository->findGoals($this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindGoalsFiltersByParticipantUser(): void
    {
        $user = $this->user();
        $joined = $this->goal();
        $this->participant($joined, $user);
        $this->participant($joined, $this->user());
        $this->participant($this->goal(), $this->user());
        $this->goal(['user' => $user]);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);

        $window = $this->goalRepository->findGoals($dto);

        $this->assertSame(self::ids([$joined]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    final public function testFindGoalsFiltersByLink(): void
    {
        $goal = $this->goal(['link' => 'my-goal']);
        $this->goal(['link' => 'my-goal-2']);

        $dto = $this->indexDto();
        $dto->filter->link = 'my-goal';

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsFiltersByTextFragment(): void
    {
        $goal = $this->goal(['text' => 'Run the big marathon']);
        $this->goal(['text' => 'Swim a lot']);

        $dto = $this->indexDto();
        $dto->filter->text = 'big mara';

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsFiltersByDiscipline(): void
    {
        $goal = $this->goal(['discipline' => DisciplineEnum::Swimming]);
        $this->goal(['discipline' => DisciplineEnum::Running]);

        $dto = $this->indexDto();
        $dto->filter->discipline = DisciplineEnum::Swimming;

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsFiltersByDistance(): void
    {
        $goal = $this->goal(['distance' => 5000]);
        $this->goal(['distance' => 5001]);

        $dto = $this->indexDto();
        $dto->filter->distance = 5000;

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsFiltersByTime(): void
    {
        $goal = $this->goal(['time' => 600]);
        $this->goal(['time' => 601]);

        $dto = $this->indexDto();
        $dto->filter->time = 600;

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsFiltersByStatus(): void
    {
        $goal = $this->goal(['status' => GoalStatusEnum::Completed]);
        $this->goal(['status' => GoalStatusEnum::Active]);

        $dto = $this->indexDto();
        $dto->filter->status = GoalStatusEnum::Completed;

        $this->assertSame(self::ids([$goal]), self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    final public function testFindGoalsCombinesAllFilters(): void
    {
        $user = $this->user();
        $attributes = [
            'text' => 'weekly ride',
            'discipline' => DisciplineEnum::Cycling,
            'distance' => 100,
            'time' => 200,
            'status' => GoalStatusEnum::Active,
        ];
        $matching = $this->goal(['link' => 'combined'] + $attributes);
        $this->participant($matching, $user);

        foreach ([
            ['text' => 'weekly run'],
            ['discipline' => DisciplineEnum::Running],
            ['distance' => 101],
            ['time' => 201],
            ['status' => GoalStatusEnum::Draft],
        ] as $override) {
            $this->participant($this->goal(array_replace($attributes, $override)), $user);
        }

        $this->participant($this->goal($attributes), $this->user());

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($user);
        $dto->filter->text = 'ride';
        $dto->filter->discipline = DisciplineEnum::Cycling;
        $dto->filter->distance = 100;
        $dto->filter->time = 200;
        $dto->filter->status = GoalStatusEnum::Active;

        $this->assertSame(self::ids([$matching]), self::ids($this->goalRepository->findGoals($dto)->getItems()));

        $dto->filter->link = 'combined';
        $this->assertSame(self::ids([$matching]), self::ids($this->goalRepository->findGoals($dto)->getItems()));

        $dto->filter->link = 'other';
        $this->assertSame([], self::ids($this->goalRepository->findGoals($dto)->getItems()));
    }

    #[DataProvider('sortProvider')]
    final public function testFindGoalsSorts(string $sort, array $expectedOrder): void
    {
        $goals = [
            'a' => $this->goal([
                'text' => 'b-text',
                'discipline' => DisciplineEnum::Cycling,
                'distance' => 300,
                'time' => 100,
                'status' => GoalStatusEnum::Completed,
                'startedAt' => new DateTimeImmutable('2026-01-02 00:00:00'),
                'endedAt' => new DateTimeImmutable('2026-02-03 00:00:00'),
            ]),
            'b' => $this->goal([
                'text' => 'c-text',
                'discipline' => DisciplineEnum::Running,
                'distance' => 100,
                'time' => 200,
                'status' => GoalStatusEnum::Rejected,
                'startedAt' => new DateTimeImmutable('2026-01-03 00:00:00'),
                'endedAt' => new DateTimeImmutable('2026-02-01 00:00:00'),
            ]),
            'c' => $this->goal([
                'text' => 'a-text',
                'discipline' => DisciplineEnum::Swimming,
                'distance' => 200,
                'time' => 300,
                'status' => GoalStatusEnum::Draft,
                'startedAt' => new DateTimeImmutable('2026-01-01 00:00:00'),
                'endedAt' => new DateTimeImmutable('2026-02-02 00:00:00'),
            ]),
        ];
        $this->storeCreatedAt($goals['a'], '2026-03-02 00:00:00');
        $this->storeCreatedAt($goals['b'], '2026-03-03 00:00:00');
        $this->storeCreatedAt($goals['c'], '2026-03-01 00:00:00');

        $dto = $this->indexDto();
        $dto->sort = $sort;

        $this->assertSame(
            self::ids(array_map(static fn (string $key): Goal => $goals[$key], $expectedOrder)),
            self::ids($this->goalRepository->findGoals($dto)->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        $orders = [
            'text' => ['c', 'a', 'b'],
            'discipline' => ['b', 'a', 'c'],
            'distance' => ['b', 'c', 'a'],
            'time' => ['a', 'b', 'c'],
            'status' => ['c', 'a', 'b'],
            'createdAt' => ['c', 'a', 'b'],
            'startedAt' => ['c', 'a', 'b'],
            'endedAt' => ['b', 'c', 'a'],
        ];

        foreach ($orders as $field => $order) {
            yield "$field asc" => ["$field:asc", $order];
            yield "$field desc" => ["$field:desc", array_reverse($order)];
        }
    }

    final public function testFindGoalsPaginates(): void
    {
        $goals = [];

        for ($i = 0; $i < 5; ++$i) {
            $goals[] = $goal = $this->goal();
            $this->storeCreatedAt($goal, sprintf('2026-01-0%d 00:00:00', $i + 1));
        }

        $dto = $this->indexDto();
        $dto->sort = 'createdAt:asc';
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->goalRepository->findGoals($dto);

        $this->assertSame(self::ids([$goals[2], $goals[3]]), self::ids($window->getItems()));
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame(2, $window->getPageNumber());
        $this->assertTrue($window->hasNextPage());

        $dto->page = 3;
        $window = $this->goalRepository->findGoals($dto);

        $this->assertSame(self::ids([$goals[4]]), self::ids($window->getItems()));
        $this->assertFalse($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function goal(array $overrides = []): Goal
    {
        return GoalFactory::make($overrides, $this->em);
    }

    private function activeGoal(
        User $participant,
        DisciplineEnum $discipline = DisciplineEnum::Running,
        GoalStatusEnum $status = GoalStatusEnum::Active,
    ): Goal {
        $goal = $this->goal([
            'startedAt' => new DateTimeImmutable(self::START),
            'endedAt' => new DateTimeImmutable(self::END),
            'discipline' => $discipline,
            'status' => $status,
        ]);
        $this->participant($goal, $participant);

        return $goal;
    }

    private function participant(Goal $goal, User $user): void
    {
        GoalParticipantFactory::make(['goal' => $goal, 'user' => $user, 'status' => SaveStatusEnum::Accepted], $this->em);
    }

    private function indexDto(): GoalIndexDto
    {
        $dto = new GoalIndexDto();
        $dto->sort = 'createdAt:desc';

        return $dto;
    }
}

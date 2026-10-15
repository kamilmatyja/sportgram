<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\TrainingIndexDto;
use App\Entity\{Training, User};
use App\Enum\{ElementStatusEnum, SaveStatusEnum};
use App\Repository\TrainingRepository;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory, UserFactory};

class TrainingRepositoryTest extends RepositoryTestCase
{
    private TrainingRepository $trainingRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_participants', 'training_disciplines', 'trainings', 'feeds', 'users');
        $this->trainingRepository = $this->repository(TrainingRepository::class);
    }

    final public function testSavePersistsTraining(): void
    {
        $user = $this->user();
        $training = TrainingFactory::make([
            'user' => $user,
            'startedAt' => new DateTimeImmutable('2026-03-01 08:00:00'),
            'endedAt' => new DateTimeImmutable('2026-03-01 10:00:00'),
            'title' => 'Morning run',
            'description' => 'Easy pace',
            'link' => 'morning-run',
            'location' => 'Park',
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->trainingRepository->save($training);
        $this->clear();

        $found = $this->trainingRepository->findById(self::id($training));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertTrue($found->feed->id->equals($training->feed->id));
        $this->assertEquals(new DateTimeImmutable('2026-03-01 08:00:00'), $found->startedAt);
        $this->assertEquals(new DateTimeImmutable('2026-03-01 10:00:00'), $found->endedAt);
        $this->assertSame('Morning run', $found->title);
        $this->assertSame('Easy pace', $found->description);
        $this->assertSame('morning-run', $found->link);
        $this->assertSame('Park', $found->location);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingTraining(): void
    {
        $training = $this->training(status: ElementStatusEnum::Draft);

        $training->title = 'Updated';
        $training->status = ElementStatusEnum::Active;
        $this->trainingRepository->save($training);
        $this->clear();

        $found = $this->trainingRepository->findById(self::id($training));
        $this->assertSame('Updated', $found->title);
        $this->assertSame(ElementStatusEnum::Active, $found->status);
        $this->assertSame(1, $this->trainingRepository->count());
    }

    final public function testDeleteRemovesTraining(): void
    {
        $training = $this->training();
        $other = $this->training();
        $id = self::id($training);

        $this->trainingRepository->delete($training);
        $this->clear();

        $this->assertNull($this->trainingRepository->find($id));
        $this->assertNotNull($this->trainingRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsTraining(): void
    {
        $training = $this->training();
        $this->training();
        $this->clear();

        $this->assertSame((string) $training->id, (string) $this->trainingRepository->findById(self::id($training))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->trainingRepository->findById(Uuid::v7());
    }

    final public function testFindTrainingsWithoutFiltersReturnsAll(): void
    {
        $first = $this->training(createdAt: '2026-01-01 10:00:00');
        $second = $this->training(createdAt: '2026-01-02 10:00:00');

        $page = $this->trainingRepository->findTrainings($this->indexDto());

        $this->assertSame(self::ids([$second, $first]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindTrainingsFiltersByParticipant(): void
    {
        $user = $this->user();
        $first = $this->training(createdAt: '2026-01-01 10:00:00');
        $second = $this->training(createdAt: '2026-01-02 10:00:00');
        $this->participant($first, $user);
        $this->participant($second, $user);
        $this->participant($this->training(), $this->user());
        $this->training();

        $page = $this->trainingRepository->findTrainings($this->indexDto(userId: self::id($user), sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindTrainingsByParticipantReturnsEachTrainingOnce(): void
    {
        $user = $this->user();
        $training = $this->training();
        $this->participant($training, $user);
        $this->participant($training, $this->user());
        $this->participant($training, $this->user());

        $page = $this->trainingRepository->findTrainings($this->indexDto(userId: self::id($user)));

        $this->assertSame(self::ids([$training]), self::ids($page->getItems()));
        $this->assertSame(1, $page->getTotalCount());
    }

    #[DataProvider('participantStatusProvider')]
    final public function testFindTrainingsByParticipantIgnoresParticipantStatus(SaveStatusEnum $status): void
    {
        $user = $this->user();
        $training = $this->training();
        $this->participant($training, $user, $status);
        $this->training($user);

        $page = $this->trainingRepository->findTrainings($this->indexDto(userId: self::id($user)));

        $this->assertSame(self::ids([$training]), self::ids($page->getItems()));
    }

    public static function participantStatusProvider(): iterable
    {
        foreach (SaveStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindTrainingsFiltersByExactLink(): void
    {
        $training = $this->training(link: 'city-run');
        $this->training(link: 'city-run-2');
        $this->training(link: 'other');

        $page = $this->trainingRepository->findTrainings($this->indexDto(link: 'city-run'));

        $this->assertSame(self::ids([$training]), self::ids($page->getItems()));
    }

    final public function testFindTrainingsFiltersByTitleSubstring(): void
    {
        $first = $this->training(title: 'Morning run', createdAt: '2026-01-01 10:00:00');
        $second = $this->training(title: 'Long run in the woods', createdAt: '2026-01-02 10:00:00');
        $third = $this->training(title: 'run', createdAt: '2026-01-03 10:00:00');
        $this->training(title: 'Swimming');

        $page = $this->trainingRepository->findTrainings($this->indexDto(title: 'run', sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second, $third]), self::ids($page->getItems()));
    }

    final public function testFindTrainingsTitleFilterIsCaseSensitive(): void
    {
        $this->training(title: 'Morning Run');

        $page = $this->trainingRepository->findTrainings($this->indexDto(title: 'run'));

        $this->assertSame([], $page->getItems());
    }

    #[DataProvider('statusProvider')]
    final public function testFindTrainingsFiltersByStatus(ElementStatusEnum $status): void
    {
        $trainings = [];

        foreach (ElementStatusEnum::cases() as $case) {
            $trainings[$case->name] = $this->training(status: $case);
        }

        $page = $this->trainingRepository->findTrainings($this->indexDto(status: $status));

        $this->assertSame(self::ids([$trainings[$status->name]]), self::ids($page->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindTrainingsCombinesAllFilters(): void
    {
        $user = $this->user();
        $match = $this->training(title: 'Evening run', link: 'evening', status: ElementStatusEnum::Active);
        $this->participant($match, $user);
        $wrongStatus = $this->training(title: 'Evening run', link: 'evening-draft', status: ElementStatusEnum::Draft);
        $this->participant($wrongStatus, $user);
        $wrongTitle = $this->training(title: 'Evening swim', link: 'evening-swim', status: ElementStatusEnum::Active);
        $this->participant($wrongTitle, $user);
        $this->training(title: 'Evening run', link: 'evening-other', status: ElementStatusEnum::Active);

        $page = $this->trainingRepository->findTrainings(
            $this->indexDto(self::id($user), 'evening', 'run', ElementStatusEnum::Active),
        );
        $this->assertSame(self::ids([$match]), self::ids($page->getItems()));

        $page = $this->trainingRepository->findTrainings(
            $this->indexDto(self::id($user), 'evening-draft', 'run', ElementStatusEnum::Active),
        );
        $this->assertSame([], $page->getItems());
    }

    final public function testFindTrainingsReturnsEmptyPageWhenNothingMatches(): void
    {
        $this->training(title: 'Swimming');

        $page = $this->trainingRepository->findTrainings($this->indexDto(title: 'run'));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindTrainingsSorts(string $sort, array $expectedOrder): void
    {
        $trainings = [
            $this->training(
                title: 'b',
                location: 'c',
                status: ElementStatusEnum::Active,
                startedAt: '2026-05-02 10:00:00',
                endedAt: '2026-06-03 10:00:00',
                createdAt: '2026-01-01 10:00:00',
            ),
            $this->training(
                title: 'c',
                location: 'a',
                status: ElementStatusEnum::Rejected,
                startedAt: '2026-05-03 10:00:00',
                endedAt: '2026-06-01 10:00:00',
                createdAt: '2026-01-02 10:00:00',
            ),
            $this->training(
                title: 'a',
                location: 'b',
                status: ElementStatusEnum::Draft,
                startedAt: '2026-05-01 10:00:00',
                endedAt: '2026-06-02 10:00:00',
                createdAt: '2026-01-03 10:00:00',
            ),
        ];

        $page = $this->trainingRepository->findTrainings($this->indexDto(sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Training => $trainings[$i], $expectedOrder)),
            self::ids($page->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'title asc' => ['title:asc', [2, 0, 1]];
        yield 'title desc' => ['title:desc', [1, 0, 2]];
        yield 'location asc' => ['location:asc', [1, 2, 0]];
        yield 'location desc' => ['location:desc', [0, 2, 1]];
        yield 'status asc' => ['status:asc', [2, 0, 1]];
        yield 'status desc' => ['status:desc', [1, 0, 2]];
        yield 'createdAt asc' => ['createdAt:asc', [0, 1, 2]];
        yield 'createdAt desc' => ['createdAt:desc', [2, 1, 0]];
        yield 'startedAt asc' => ['startedAt:asc', [2, 0, 1]];
        yield 'startedAt desc' => ['startedAt:desc', [1, 0, 2]];
        yield 'endedAt asc' => ['endedAt:asc', [1, 2, 0]];
        yield 'endedAt desc' => ['endedAt:desc', [0, 2, 1]];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindTrainingsPaginates(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $trainings = [];

        for ($i = 0; $i < 5; ++$i) {
            $trainings[] = $training = $this->training(createdAt: sprintf('2026-01-0%d 10:00:00', $i + 1));
            $this->participant($training, $user);
            $this->participant($training, $this->user());
        }

        $dto = $this->indexDto(userId: self::id($user), sort: 'createdAt:asc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->trainingRepository->findTrainings($dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Training => $trainings[$i], $expectedIndexes)),
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
        yield 'beyond last page' => [4, 2, [], false];
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function training(
        ?User $user = null,
        ?string $title = null,
        ?string $link = null,
        ?string $location = null,
        ?ElementStatusEnum $status = null,
        ?string $startedAt = null,
        ?string $endedAt = null,
        ?string $createdAt = null,
    ): Training {
        $training = TrainingFactory::make(array_filter([
            'user' => $user,
            'title' => $title,
            'link' => $link,
            'location' => $location,
            'status' => $status,
            'startedAt' => $startedAt === null ? null : new DateTimeImmutable($startedAt),
            'endedAt' => $endedAt === null ? null : new DateTimeImmutable($endedAt),
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE trainings SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $training->id],
            );
        }

        return $training;
    }

    private function participant(Training $training, User $user, SaveStatusEnum $status = SaveStatusEnum::Accepted): void
    {
        TrainingParticipantFactory::make(['training' => $training, 'user' => $user, 'status' => $status], $this->em);
    }

    private function indexDto(
        ?Uuid $userId = null,
        ?string $link = null,
        ?string $title = null,
        ?ElementStatusEnum $status = null,
        string $sort = 'createdAt:desc',
    ): TrainingIndexDto {
        $dto = new TrainingIndexDto();
        $dto->filter->userId = $userId;
        $dto->filter->link = $link;
        $dto->filter->title = $title;
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}

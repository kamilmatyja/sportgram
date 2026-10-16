<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\ConversationActivityIndexDto;
use App\Entity\{ConversationActivity, User};
use App\Repository\ConversationActivityRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationActivityFactory, UserFactory};

class ConversationActivityRepositoryTest extends RepositoryTestCase
{
    private ConversationActivityRepository $conversationActivityRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('conversation_activity', 'users');
        $this->conversationActivityRepository = $this->repository(ConversationActivityRepository::class);
    }

    final public function testSavePersistsConversationActivity(): void
    {
        $sender = $this->user();
        $receiver = $this->user();
        $activity = ConversationActivityFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver]);

        $this->conversationActivityRepository->save($activity);
        $this->clear();

        $found = $this->conversationActivityRepository->find(self::id($activity));
        $this->assertNotNull($found);
        $this->assertTrue($found->senderUser->id->equals($sender->id));
        $this->assertTrue($found->receiverUser->id->equals($receiver->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingConversationActivity(): void
    {
        $activity = $this->activity();
        $receiver = $this->user();

        $activity->receiverUser = $receiver;
        $this->conversationActivityRepository->save($activity);
        $this->clear();

        $found = $this->conversationActivityRepository->find(self::id($activity));
        $this->assertTrue($found->receiverUser->id->equals($receiver->id));
        $this->assertSame(1, $this->conversationActivityRepository->count());
    }

    final public function testDeleteRemovesConversationActivity(): void
    {
        $activity = $this->activity();
        $other = $this->activity();
        $id = self::id($activity);

        $this->conversationActivityRepository->delete($activity);
        $this->clear();

        $this->assertNull($this->conversationActivityRepository->find($id));
        $this->assertNotNull($this->conversationActivityRepository->find(self::id($other)));
    }

    final public function testFindOrFailReturnsConversationActivity(): void
    {
        $activity = $this->activity();
        $this->clear();

        $this->assertSame((string) $activity->id, (string) $this->conversationActivityRepository->findOrFail(self::id($activity))->id);
    }

    final public function testFindOrFailThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->conversationActivityRepository->findOrFail(Uuid::v4());
    }

    final public function testFindByUserIdsReturnsActivityOfThePair(): void
    {
        $sender = $this->user();
        $receiver = $this->user();
        $activity = $this->activity($sender, $receiver);
        $this->activity($sender, $this->user());
        $this->activity($this->user(), $receiver);
        $this->clear();

        $found = $this->conversationActivityRepository->findByUserIds(self::id($sender), self::id($receiver));

        $this->assertSame((string) $activity->id, (string) $found?->id);
    }

    final public function testFindByUserIdsIsDirectional(): void
    {
        $sender = $this->user();
        $receiver = $this->user();
        $this->activity($sender, $receiver);

        $this->assertNull($this->conversationActivityRepository->findByUserIds(self::id($receiver), self::id($sender)));
    }

    final public function testFindByUserIdsReturnsNewestActivity(): void
    {
        $sender = $this->user();
        $receiver = $this->user();
        $this->activity($sender, $receiver, '2026-01-01 10:00:00');
        $newest = $this->activity($sender, $receiver, '2026-01-03 10:00:00');
        $this->activity($sender, $receiver, '2026-01-02 10:00:00');
        $this->clear();

        $found = $this->conversationActivityRepository->findByUserIds(self::id($sender), self::id($receiver));

        $this->assertSame((string) $newest->id, (string) $found?->id);
    }

    final public function testFindByUserIdsReturnsNullWithoutActivity(): void
    {
        $this->activity();

        $this->assertNull($this->conversationActivityRepository->findByUserIds(self::id($this->user()), self::id($this->user())));
    }

    final public function testFindActivitiesWithoutFilterMatchesBothDirections(): void
    {
        $user = $this->user();
        $sent = $this->activity($user, $this->user(), '2026-01-01 10:00:00');
        $received = $this->activity($this->user(), $user, '2026-01-02 10:00:00');
        $this->activity($this->user(), $this->user());

        $page = $this->conversationActivityRepository->findActivities(self::id($user), $this->indexDto(sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$sent, $received]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindActivitiesFilteredByUserReturnsOnlyThePairInBothDirections(): void
    {
        $user = $this->user();
        $other = $this->user();
        $sent = $this->activity($user, $other, '2026-01-01 10:00:00');
        $received = $this->activity($other, $user, '2026-01-02 10:00:00');
        $this->activity($user, $this->user());
        $this->activity($this->user(), $user);
        $this->activity($other, $this->user());
        $this->activity($this->user(), $other);

        $page = $this->conversationActivityRepository->findActivities(
            self::id($user),
            $this->indexDto(self::id($other), 'createdAt:asc'),
        );

        $this->assertSame(self::ids([$sent, $received]), self::ids($page->getItems()));
        $this->assertSame(2, $page->getTotalCount());
    }

    final public function testFindActivitiesReturnsEmptyPageWithoutActivity(): void
    {
        $user = $this->user();
        $this->activity($user, $this->user());

        $page = $this->conversationActivityRepository->findActivities(self::id($user), $this->indexDto(self::id($this->user())));

        $this->assertSame([], $page->getItems());
        $this->assertSame(0, $page->getTotalCount());
        $this->assertFalse($page->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindActivitiesSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $activities = [
            $this->activity($user, $this->user(), '2026-01-02 10:00:00', '2026-02-01 10:00:00'),
            $this->activity($this->user(), $user, '2026-01-03 10:00:00', '2026-02-03 10:00:00'),
            $this->activity($user, $this->user(), '2026-01-01 10:00:00', '2026-02-02 10:00:00'),
        ];

        $page = $this->conversationActivityRepository->findActivities(self::id($user), $this->indexDto(sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (int $i): ConversationActivity => $activities[$i], $expectedOrder)),
            self::ids($page->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'createdAt asc' => ['createdAt:asc', [2, 0, 1]];
        yield 'createdAt desc' => ['createdAt:desc', [1, 0, 2]];
        yield 'updatedAt asc' => ['updatedAt:asc', [0, 2, 1]];
        yield 'updatedAt desc' => ['updatedAt:desc', [1, 2, 0]];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindActivitiesPaginates(int $pageNumber, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $activities = [];

        for ($i = 0; $i < 5; ++$i) {
            $activities[] = $this->activity($user, $this->user(), sprintf('2026-01-0%d 10:00:00', $i + 1));
        }

        $dto = $this->indexDto(sort: 'createdAt:asc');
        $dto->page = $pageNumber;
        $dto->limit = $limit;

        $page = $this->conversationActivityRepository->findActivities(self::id($user), $dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): ConversationActivity => $activities[$i], $expectedIndexes)),
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

    private function activity(
        ?User $sender = null,
        ?User $receiver = null,
        ?string $createdAt = null,
        ?string $updatedAt = null,
    ): ConversationActivity {
        $activity = ConversationActivityFactory::make([
            'senderUser' => $sender ?? $this->user(),
            'receiverUser' => $receiver ?? $this->user(),
        ], $this->em);

        $this->em->getConnection()->executeStatement(
            'UPDATE conversation_activity SET created_at = COALESCE(CAST(:createdAt AS TIMESTAMP), created_at), updated_at = COALESCE(CAST(:updatedAt AS TIMESTAMP), updated_at) WHERE id = :id',
            ['createdAt' => $createdAt, 'updatedAt' => $updatedAt, 'id' => (string) $activity->id],
        );

        return $activity;
    }

    private function indexDto(?Uuid $userId = null, string $sort = 'updatedAt:desc'): ConversationActivityIndexDto
    {
        $dto = new ConversationActivityIndexDto();
        $dto->filter->userId = $userId;
        $dto->sort = $sort;

        return $dto;
    }
}

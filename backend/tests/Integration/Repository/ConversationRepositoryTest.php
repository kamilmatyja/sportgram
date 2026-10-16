<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\ConversationIndexDto;
use App\Entity\{Conversation, User};
use App\Enum\ConversationStatusEnum;
use App\Repository\ConversationRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationFactory, UserFactory};

class ConversationRepositoryTest extends RepositoryTestCase
{
    private ConversationRepository $conversationRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('conversations', 'users');
        $this->conversationRepository = $this->repository(ConversationRepository::class);
    }

    final public function testSavePersistsConversation(): void
    {
        $sender = $this->user();
        $receiver = $this->user();
        $conversation = ConversationFactory::make([
            'senderUser' => $sender,
            'receiverUser' => $receiver,
            'text' => 'Hello there',
            'status' => ConversationStatusEnum::Sent,
        ]);

        $this->conversationRepository->save($conversation);
        $this->clear();

        $found = $this->conversationRepository->findById(self::id($conversation));
        $this->assertSame('Hello there', $found->text);
        $this->assertSame(ConversationStatusEnum::Sent, $found->status);
        $this->assertTrue($found->senderUser->id->equals($sender->id));
        $this->assertTrue($found->receiverUser->id->equals($receiver->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingConversation(): void
    {
        $conversation = $this->conversation($this->user(), $this->user(), ConversationStatusEnum::Sent);

        $conversation->status = ConversationStatusEnum::Read;
        $conversation->text = 'Edited';
        $this->conversationRepository->save($conversation);
        $this->clear();

        $found = $this->conversationRepository->findById(self::id($conversation));
        $this->assertSame(ConversationStatusEnum::Read, $found->status);
        $this->assertSame('Edited', $found->text);
        $this->assertSame(1, $this->conversationRepository->count());
    }

    final public function testDeleteRemovesConversation(): void
    {
        $conversation = $this->conversation($this->user(), $this->user());
        $other = $this->conversation($this->user(), $this->user());
        $id = self::id($conversation);

        $this->conversationRepository->delete($conversation);
        $this->clear();

        $this->assertNull($this->conversationRepository->find($id));
        $this->assertNotNull($this->conversationRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsConversation(): void
    {
        $conversation = $this->conversation($this->user(), $this->user());
        $this->clear();

        $this->assertSame((string) $conversation->id, (string) $this->conversationRepository->findById(self::id($conversation))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->conversationRepository->findById(Uuid::v4());
    }

    final public function testFindConversationsReturnsMessagesInBothDirectionsOnly(): void
    {
        $user = $this->user();
        $partner = $this->user();
        $third = $this->user();
        $sent = $this->conversation($user, $partner, createdAt: '2026-01-01 10:00:00');
        $received = $this->conversation($partner, $user, createdAt: '2026-01-01 11:00:00');
        $this->conversation($user, $third, createdAt: '2026-01-01 12:00:00');
        $this->conversation($third, $partner, createdAt: '2026-01-01 13:00:00');
        $this->conversation($third, $user, createdAt: '2026-01-01 14:00:00');
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($user), $this->indexDto($partner, sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$sent, $received]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindConversationsIsSymmetricForBothParticipants(): void
    {
        $user = $this->user();
        $partner = $this->user();
        $first = $this->conversation($user, $partner, createdAt: '2026-01-01 10:00:00');
        $second = $this->conversation($partner, $user, createdAt: '2026-01-01 11:00:00');
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($partner), $this->indexDto($user, sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
    }

    final public function testFindConversationsWithSelfReturnsOnlySelfMessages(): void
    {
        $user = $this->user();
        $self = $this->conversation($user, $user);
        $this->conversation($user, $this->user());
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($user), $this->indexDto($user));

        $this->assertSame(self::ids([$self]), self::ids($window->getItems()));
    }

    #[DataProvider('statusProvider')]
    final public function testFindConversationsFiltersByStatus(ConversationStatusEnum $status): void
    {
        $user = $this->user();
        $partner = $this->user();
        $expected = [];

        foreach (ConversationStatusEnum::cases() as $i => $case) {
            $conversation = $this->conversation($user, $partner, $case, sprintf('2026-01-01 10:00:%02d', $i));

            if ($case === $status) {
                $expected[] = $conversation;
            }
        }

        $this->conversation($user, $this->user(), $status);
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($user), $this->indexDto($partner, $status));

        $this->assertSame(self::ids($expected), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    public static function statusProvider(): iterable
    {
        foreach (ConversationStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindConversationsReturnsEmptyWindowWithoutMessages(): void
    {
        $user = $this->user();
        $this->conversation($user, $this->user());
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($user), $this->indexDto($this->user()));

        $this->assertSame([], self::ids($window->getItems()));
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindConversationsSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $partner = $this->user();
        $conversations = [
            'a' => $this->conversation($user, $partner, ConversationStatusEnum::Read, '2026-01-01 10:00:00'),
            'b' => $this->conversation($partner, $user, ConversationStatusEnum::Sent, '2026-01-02 10:00:00'),
        ];
        $this->clear();

        $window = $this->conversationRepository->findConversations(self::id($user), $this->indexDto($partner, sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (string $key): Conversation => $conversations[$key], $expectedOrder)),
            self::ids($window->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'createdAt asc' => ['createdAt:asc', ['a', 'b']];
        yield 'createdAt desc' => ['createdAt:desc', ['b', 'a']];
        yield 'status asc' => ['status:asc', ['b', 'a']];
        yield 'status desc' => ['status:desc', ['a', 'b']];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindConversationsPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $partner = $this->user();
        $conversations = [];

        for ($i = 0; $i < 5; ++$i) {
            $conversations[] = $this->conversation($user, $partner, createdAt: sprintf('2026-01-01 10:00:%02d', $i));
        }

        $this->clear();

        $dto = $this->indexDto($partner, sort: 'createdAt:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->conversationRepository->findConversations(self::id($user), $dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Conversation => $conversations[$i], $expectedIndexes)),
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
        yield 'exact fit' => [1, 5, [0, 1, 2, 3, 4], false];
        yield 'beyond last page' => [4, 2, [], false];
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function conversation(
        User $sender,
        User $receiver,
        ?ConversationStatusEnum $status = null,
        ?string $createdAt = null,
    ): Conversation {
        $conversation = ConversationFactory::make(array_filter([
            'senderUser' => $sender,
            'receiverUser' => $receiver,
            'status' => $status,
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE conversations SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $conversation->id],
            );
        }

        return $conversation;
    }

    private function indexDto(User $partner, ?ConversationStatusEnum $status = null, string $sort = 'createdAt:desc'): ConversationIndexDto
    {
        $dto = new ConversationIndexDto();
        $dto->filter->userId = self::id($partner);
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}

<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\FriendIndexDto;
use App\Entity\{Friend, User};
use App\Enum\FriendStatusEnum;
use App\Repository\FriendRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FriendFactory, UserFactory};

class FriendRepositoryTest extends RepositoryTestCase
{
    private FriendRepository $friendRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('friends', 'users');
        $this->friendRepository = $this->repository(FriendRepository::class);
    }

    final public function testSavePersistsFriend(): void
    {
        $friend = FriendFactory::make([
            'senderUser' => $this->user(),
            'receiverUser' => $this->user(),
            'status' => FriendStatusEnum::Pending,
        ]);

        $this->friendRepository->save($friend);
        $this->clear();

        $found = $this->friendRepository->findById(self::id($friend));
        $this->assertSame(FriendStatusEnum::Pending, $found->status);
        $this->assertTrue($found->senderUser->id->equals($friend->senderUser->id));
        $this->assertTrue($found->receiverUser->id->equals($friend->receiverUser->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingFriend(): void
    {
        $friend = $this->friend(status: FriendStatusEnum::Pending);

        $friend->status = FriendStatusEnum::Accepted;
        $this->friendRepository->save($friend);
        $this->clear();

        $this->assertSame(FriendStatusEnum::Accepted, $this->friendRepository->findById(self::id($friend))->status);
    }

    final public function testDeleteRemovesFriend(): void
    {
        $friend = $this->friend();
        $id = self::id($friend);

        $this->friendRepository->delete($friend);
        $this->clear();

        $this->assertNull($this->friendRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->friendRepository->findById(Uuid::v7());
    }

    final public function testFindFriendsOfSingleUserMatchesBothDirections(): void
    {
        $user = $this->user();
        $sent = $this->friend($user, $this->user());
        $received = $this->friend($this->user(), $user);
        $this->friend($this->user(), $this->user());
        $this->storeCreatedAt($sent, '-2 minutes');
        $this->storeCreatedAt($received, '-1 minute');

        $window = $this->friendRepository->findFriends($this->indexDto([$user], sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$sent, $received]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindFriendsOfTwoUsersReturnsOnlyTheirRelationship(): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $between = $this->friend($user2, $user1);
        $this->friend($user1, $this->user());
        $this->friend($this->user(), $user2);

        $window = $this->friendRepository->findFriends($this->indexDto([$user1, $user2]));

        $this->assertSame(self::ids([$between]), self::ids($window->getItems()));
    }

    final public function testFindFriendsFiltersByStatus(): void
    {
        $user = $this->user();
        $accepted = $this->friend($user, $this->user(), FriendStatusEnum::Accepted);
        $this->friend($user, $this->user(), FriendStatusEnum::Pending);

        $window = $this->friendRepository->findFriends($this->indexDto([$user], FriendStatusEnum::Accepted));

        $this->assertSame(self::ids([$accepted]), self::ids($window->getItems()));
    }

    #[DataProvider('sortProvider')]
    final public function testFindFriendsSortsByStatus(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $friends = [];

        foreach (array_reverse(FriendStatusEnum::cases()) as $status) {
            $friends[$status->name] = $this->friend($user, $this->user(), $status);
        }

        $window = $this->friendRepository->findFriends($this->indexDto([$user], sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (string $name): Friend => $friends[$name], $expectedOrder)),
            self::ids($window->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        $byValue = array_map(static fn (FriendStatusEnum $s): string => $s->name, FriendStatusEnum::cases());

        yield 'status asc' => ['status:asc', $byValue];
        yield 'status desc' => ['status:desc', array_reverse($byValue)];
    }

    final public function testFindFriendsPaginates(): void
    {
        $user = $this->user();
        $friends = [];

        for ($i = 0; $i < 5; ++$i) {
            $friends[] = $friend = $this->friend($user, $this->user());
            $this->storeCreatedAt($friend, sprintf('-%d minutes', 5 - $i));
        }

        $dto = $this->indexDto([$user], sort: 'createdAt:asc');
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->friendRepository->findFriends($dto);

        $this->assertSame(self::ids([$friends[2], $friends[3]]), self::ids($window->getItems()));
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame(2, $window->getPageNumber());
        $this->assertTrue($window->hasNextPage());
    }

    #[DataProvider('isFriendProvider')]
    final public function testIsFriendRequiresAcceptedRelationshipInEitherDirection(FriendStatusEnum $status, bool $reversed, bool $expected): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $reversed ? $this->friend($user2, $user1, $status) : $this->friend($user1, $user2, $status);

        $this->assertSame($expected, $this->friendRepository->isFriend(self::id($user1), self::id($user2)));
    }

    public static function isFriendProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $status) {
            yield "$status->name sent" => [$status, false, FriendStatusEnum::Accepted === $status];
            yield "$status->name received" => [$status, true, FriendStatusEnum::Accepted === $status];
        }
    }

    final public function testIsFriendIsFalseWithoutRelationship(): void
    {
        $user1 = $this->user();
        $this->friend($user1, $this->user(), FriendStatusEnum::Accepted);

        $this->assertFalse($this->friendRepository->isFriend(self::id($user1), self::id($this->user())));
    }

    #[DataProvider('hasRowProvider')]
    final public function testHasRowIgnoresStatusAndDirection(FriendStatusEnum $status, bool $reversed): void
    {
        $user1 = $this->user();
        $user2 = $this->user();
        $reversed ? $this->friend($user2, $user1, $status) : $this->friend($user1, $user2, $status);

        $this->assertTrue($this->friendRepository->hasRow(self::id($user1), self::id($user2)));
        $this->assertFalse($this->friendRepository->hasRow(self::id($user1), self::id($this->user())));
    }

    public static function hasRowProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $status) {
            yield "$status->name sent" => [$status, false];
            yield "$status->name received" => [$status, true];
        }
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function friend(?User $sender = null, ?User $receiver = null, ?FriendStatusEnum $status = null): Friend
    {
        return FriendFactory::make(array_filter([
            'senderUser' => $sender ?? $this->user(),
            'receiverUser' => $receiver ?? $this->user(),
            'status' => $status,
        ]), $this->em);
    }

    /** @param User[] $users */
    private function indexDto(array $users, ?FriendStatusEnum $status = null, string $sort = 'createdAt:desc'): FriendIndexDto
    {
        $dto = new FriendIndexDto();
        $dto->filter->userIds = array_map(self::id(...), $users);
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}

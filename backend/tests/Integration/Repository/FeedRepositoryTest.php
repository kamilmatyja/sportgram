<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\FeedIndexDto;
use App\Entity\{Feed, User};
use App\Enum\{ElementStatusEnum, FriendStatusEnum};
use App\Repository\FeedRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FeedFactory, FriendFactory, UserFactory};

class FeedRepositoryTest extends RepositoryTestCase
{
    private FeedRepository $feedRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feeds', 'friends', 'users');
        $this->feedRepository = $this->repository(FeedRepository::class);
    }

    final public function testSavePersistsFeed(): void
    {
        $user = $this->user();
        $feed = FeedFactory::make([
            'user' => $user,
            'text' => 'hello',
            'photo' => null,
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->feedRepository->save($feed);
        $this->clear();

        $found = $this->feedRepository->findById(self::id($feed));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame('hello', $found->text);
        $this->assertNull($found->photo);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingFeed(): void
    {
        $feed = $this->feed($this->user(), ['text' => 'before', 'status' => ElementStatusEnum::Draft]);

        $feed->text = 'after';
        $feed->status = ElementStatusEnum::Active;
        $this->feedRepository->save($feed);
        $this->clear();

        $found = $this->feedRepository->findById(self::id($feed));
        $this->assertSame('after', $found->text);
        $this->assertSame(ElementStatusEnum::Active, $found->status);
    }

    final public function testDeleteRemovesFeed(): void
    {
        $feed = $this->feed($this->user());
        $id = self::id($feed);

        $this->feedRepository->delete($feed);
        $this->clear();

        $this->assertNull($this->feedRepository->find($id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->feedRepository->findById(Uuid::v4());
    }

    final public function testFindFeedsReturnsOwnAndAcceptedFriendsFeedsInBothDirections(): void
    {
        $user = $this->user();
        $sentFriend = $this->user();
        $receivedFriend = $this->user();
        $this->friend($user, $sentFriend, FriendStatusEnum::Accepted);
        $this->friend($receivedFriend, $user, FriendStatusEnum::Accepted);

        $visible = [
            $this->feed($user),
            $this->feed($sentFriend),
            $this->feed($receivedFriend),
        ];
        $this->feed($this->user());

        $window = $this->feedRepository->findFeeds(self::id($user), $this->indexDto());

        $this->assertEqualsCanonicalizing(self::ids($visible), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    #[DataProvider('notAcceptedFriendStatusProvider')]
    final public function testFindFeedsExcludesFeedsOfNotAcceptedFriends(FriendStatusEnum $status, bool $reversed): void
    {
        $user = $this->user();
        $other = $this->user();
        $reversed ? $this->friend($other, $user, $status) : $this->friend($user, $other, $status);
        $own = $this->feed($user);
        $this->feed($other);

        $window = $this->feedRepository->findFeeds(self::id($user), $this->indexDto());

        $this->assertSame(self::ids([$own]), self::ids($window->getItems()));
    }

    public static function notAcceptedFriendStatusProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $status) {
            if ($status !== FriendStatusEnum::Accepted) {
                yield "$status->name sent" => [$status, false];
                yield "$status->name received" => [$status, true];
            }
        }
    }

    final public function testFindFeedsExcludesFeedsOfFriendsOfFriends(): void
    {
        $user = $this->user();
        $friend = $this->user();
        $friendOfFriend = $this->user();
        $this->friend($user, $friend, FriendStatusEnum::Accepted);
        $this->friend($friend, $friendOfFriend, FriendStatusEnum::Accepted);
        $friendFeed = $this->feed($friend);
        $this->feed($friendOfFriend);

        $window = $this->feedRepository->findFeeds(self::id($user), $this->indexDto());

        $this->assertSame(self::ids([$friendFeed]), self::ids($window->getItems()));
    }

    final public function testFindFeedsReturnsFriendFeedOnceWithDuplicatedFriendRows(): void
    {
        $user = $this->user();
        $friend = $this->user();
        $this->friend($user, $friend, FriendStatusEnum::Accepted);
        $this->friend($friend, $user, FriendStatusEnum::Accepted);
        $feed = $this->feed($friend);

        $window = $this->feedRepository->findFeeds(self::id($user), $this->indexDto());

        $this->assertSame(self::ids([$feed]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    final public function testFindFeedsReturnsEmptyWindow(): void
    {
        $this->feed($this->user());

        $window = $this->feedRepository->findFeeds(self::id($this->user()), $this->indexDto());

        $this->assertSame([], $window->getItems());
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    final public function testFindFeedsFilteredByUserReturnsOnlyThatUsersFeedsRegardlessOfFriendship(): void
    {
        $user = $this->user();
        $stranger = $this->user();
        $friend = $this->user();
        $this->friend($user, $friend, FriendStatusEnum::Accepted);
        $strangerFeed = $this->feed($stranger);
        $this->feed($user);
        $this->feed($friend);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($stranger);

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$strangerFeed]), self::ids($window->getItems()));
    }

    final public function testFindFeedsFiltersByTextFragment(): void
    {
        $user = $this->user();
        $matching = $this->feed($user, ['text' => 'Morning run in the park']);
        $this->feed($user, ['text' => 'Evening swim']);

        $dto = $this->indexDto();
        $dto->filter->text = 'run in';

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    final public function testFindFeedsFiltersByStatus(): void
    {
        $user = $this->user();
        $matching = $this->feed($user, ['status' => ElementStatusEnum::Active]);
        $this->feed($user, ['status' => ElementStatusEnum::Draft]);
        $this->feed($user, ['status' => ElementStatusEnum::Rejected]);

        $dto = $this->indexDto();
        $dto->filter->status = ElementStatusEnum::Active;

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    final public function testFindFeedsCombinesFilters(): void
    {
        $user = $this->user();
        $author = $this->user();
        $matching = $this->feed($author, ['text' => 'long ride', 'status' => ElementStatusEnum::Active]);
        $this->feed($author, ['text' => 'long ride', 'status' => ElementStatusEnum::Draft]);
        $this->feed($author, ['text' => 'short run', 'status' => ElementStatusEnum::Active]);
        $this->feed($user, ['text' => 'long ride', 'status' => ElementStatusEnum::Active]);

        $dto = $this->indexDto();
        $dto->filter->userId = self::id($author);
        $dto->filter->text = 'ride';
        $dto->filter->status = ElementStatusEnum::Active;

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$matching]), self::ids($window->getItems()));
    }

    final public function testFindFeedsCombinesFriendshipWithTextFilter(): void
    {
        $user = $this->user();
        $friend = $this->user();
        $this->friend($friend, $user, FriendStatusEnum::Accepted);
        $own = $this->feed($user, ['text' => 'tempo run']);
        $friendFeed = $this->feed($friend, ['text' => 'easy run']);
        $this->feed($friend, ['text' => 'swim']);
        $this->feed($this->user(), ['text' => 'stranger run']);

        $dto = $this->indexDto();
        $dto->filter->text = 'run';

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertEqualsCanonicalizing(self::ids([$own, $friendFeed]), self::ids($window->getItems()));
    }

    #[DataProvider('sortProvider')]
    final public function testFindFeedsSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $feeds = [
            'a' => $this->feed($user, ['text' => 'b', 'status' => ElementStatusEnum::Rejected]),
            'b' => $this->feed($user, ['text' => 'c', 'status' => ElementStatusEnum::Draft]),
            'c' => $this->feed($user, ['text' => 'a', 'status' => ElementStatusEnum::Active]),
        ];
        $this->storeCreatedAt($feeds['a'], '2026-01-01 00:00:00');
        $this->storeCreatedAt($feeds['b'], '2026-01-03 00:00:00');
        $this->storeCreatedAt($feeds['c'], '2026-01-02 00:00:00');

        $dto = $this->indexDto();
        $dto->sort = $sort;

        $this->assertSame(
            self::ids(array_map(static fn (string $key): Feed => $feeds[$key], $expectedOrder)),
            self::ids($this->feedRepository->findFeeds(self::id($user), $dto)->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'text asc' => ['text:asc', ['c', 'a', 'b']];
        yield 'text desc' => ['text:desc', ['b', 'a', 'c']];
        yield 'status asc' => ['status:asc', ['b', 'c', 'a']];
        yield 'status desc' => ['status:desc', ['a', 'c', 'b']];
        yield 'createdAt asc' => ['createdAt:asc', ['a', 'c', 'b']];
        yield 'createdAt desc' => ['createdAt:desc', ['b', 'c', 'a']];
    }

    final public function testFindFeedsPaginates(): void
    {
        $user = $this->user();
        $feeds = [];

        for ($i = 0; $i < 5; ++$i) {
            $feeds[] = $feed = $this->feed($user);
            $this->storeCreatedAt($feed, sprintf('2026-01-0%d 00:00:00', $i + 1));
        }

        $dto = $this->indexDto();
        $dto->sort = 'createdAt:asc';
        $dto->page = 2;
        $dto->limit = 2;

        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$feeds[2], $feeds[3]]), self::ids($window->getItems()));
        $this->assertSame(5, $window->getTotalCount());
        $this->assertSame(2, $window->getPageNumber());
        $this->assertTrue($window->hasNextPage());

        $dto->page = 3;
        $window = $this->feedRepository->findFeeds(self::id($user), $dto);

        $this->assertSame(self::ids([$feeds[4]]), self::ids($window->getItems()));
        $this->assertFalse($window->hasNextPage());
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function feed(User $user, array $overrides = []): Feed
    {
        return FeedFactory::make(['user' => $user, 'photo' => null] + $overrides, $this->em);
    }

    private function friend(User $sender, User $receiver, FriendStatusEnum $status): void
    {
        FriendFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver, 'status' => $status], $this->em);
    }

    private function indexDto(): FeedIndexDto
    {
        return new FeedIndexDto();
    }
}

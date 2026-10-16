<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Dto\StoryIndexDto;
use App\Entity\{Story, User};
use App\Enum\{ElementStatusEnum, FriendStatusEnum};
use App\Repository\StoryRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FriendFactory, StoryFactory, UserFactory};

class StoryRepositoryTest extends RepositoryTestCase
{
    private StoryRepository $storyRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('stories', 'friends', 'users');
        $this->storyRepository = $this->repository(StoryRepository::class);
    }

    final public function testSavePersistsStory(): void
    {
        $user = $this->user();
        $story = StoryFactory::make([
            'user' => $user,
            'text' => 'Morning run',
            'photo' => base64_encode('binary-photo'),
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->storyRepository->save($story);
        $this->clear();

        $found = $this->storyRepository->findById(self::id($story));
        $this->assertSame('Morning run', $found->text);
        $this->assertSame(base64_encode('binary-photo'), $found->photo);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingStory(): void
    {
        $story = $this->story($this->user(), status: ElementStatusEnum::Draft);

        $story->status = ElementStatusEnum::Active;
        $story->text = 'Edited';
        $this->storyRepository->save($story);
        $this->clear();

        $found = $this->storyRepository->findById(self::id($story));
        $this->assertSame(ElementStatusEnum::Active, $found->status);
        $this->assertSame('Edited', $found->text);
        $this->assertSame(1, $this->storyRepository->count());
    }

    final public function testDeleteRemovesStory(): void
    {
        $user = $this->user();
        $story = $this->story($user);
        $other = $this->story($user);
        $id = self::id($story);

        $this->storyRepository->delete($story);
        $this->clear();

        $this->assertNull($this->storyRepository->find($id));
        $this->assertNotNull($this->storyRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsStory(): void
    {
        $story = $this->story($this->user());
        $this->clear();

        $this->assertSame((string) $story->id, (string) $this->storyRepository->findById(self::id($story))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->storyRepository->findById(Uuid::v4());
    }

    final public function testFindStoriesWithoutUserFilterReturnsOwnAndAcceptedFriendsStories(): void
    {
        $user = $this->user();
        $sentFriend = $this->user();
        $receivedFriend = $this->user();
        $stranger = $this->user();
        $this->friend($user, $sentFriend, FriendStatusEnum::Accepted);
        $this->friend($receivedFriend, $user, FriendStatusEnum::Accepted);
        $this->friend($sentFriend, $stranger, FriendStatusEnum::Accepted);

        $own = $this->story($user, createdAt: '2026-01-01 10:00:00');
        $ofSentFriend = $this->story($sentFriend, createdAt: '2026-01-01 11:00:00');
        $ofReceivedFriend = $this->story($receivedFriend, createdAt: '2026-01-01 12:00:00');
        $this->story($stranger, createdAt: '2026-01-01 13:00:00');
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto(sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$own, $ofSentFriend, $ofReceivedFriend]), self::ids($window->getItems()));
        $this->assertSame(3, $window->getTotalCount());
    }

    #[DataProvider('notAcceptedFriendProvider')]
    final public function testFindStoriesWithoutUserFilterExcludesNotAcceptedFriends(FriendStatusEnum $status, bool $reversed): void
    {
        $user = $this->user();
        $other = $this->user();
        $reversed ? $this->friend($other, $user, $status) : $this->friend($user, $other, $status);
        $own = $this->story($user);
        $this->story($other);
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto());

        $this->assertSame(self::ids([$own]), self::ids($window->getItems()));
        $this->assertSame(1, $window->getTotalCount());
    }

    public static function notAcceptedFriendProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $status) {
            if ($status === FriendStatusEnum::Accepted) {
                continue;
            }

            yield "$status->name sent" => [$status, false];
            yield "$status->name received" => [$status, true];
        }
    }

    final public function testFindStoriesWithUserFilterReturnsOnlyThatUsersStories(): void
    {
        $viewer = $this->user();
        $friend = $this->user();
        $stranger = $this->user();
        $this->friend($viewer, $friend, FriendStatusEnum::Accepted);
        $this->story($viewer);
        $this->story($friend);
        $first = $this->story($stranger, createdAt: '2026-01-01 10:00:00');
        $second = $this->story($stranger, createdAt: '2026-01-01 11:00:00');
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($viewer), $this->indexDto($stranger, sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$first, $second]), self::ids($window->getItems()));
        $this->assertSame(2, $window->getTotalCount());
    }

    final public function testFindStoriesFiltersByTextSubstring(): void
    {
        $user = $this->user();
        $prefix = $this->story($user, 'run in the park', createdAt: '2026-01-01 10:00:00');
        $middle = $this->story($user, 'long run today', createdAt: '2026-01-01 11:00:00');
        $suffix = $this->story($user, 'evening run', createdAt: '2026-01-01 12:00:00');
        $this->story($user, 'swimming');
        $this->story($user, 'RUNNING uppercase');
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto(text: 'run', sort: 'createdAt:asc'));

        $this->assertSame(self::ids([$prefix, $middle, $suffix]), self::ids($window->getItems()));
    }

    #[DataProvider('statusProvider')]
    final public function testFindStoriesFiltersByStatus(ElementStatusEnum $status): void
    {
        $user = $this->user();
        $expected = null;

        foreach (ElementStatusEnum::cases() as $case) {
            $story = $this->story($user, status: $case);

            if ($case === $status) {
                $expected = $story;
            }
        }

        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto(status: $status));

        $this->assertSame(self::ids([$expected]), self::ids($window->getItems()));
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    final public function testFindStoriesCombinesAllFilters(): void
    {
        $viewer = $this->user();
        $author = $this->user();
        $other = $this->user();
        $this->friend($viewer, $other, FriendStatusEnum::Accepted);
        $match = $this->story($author, 'race day', ElementStatusEnum::Active);
        $this->story($author, 'race day', ElementStatusEnum::Draft);
        $this->story($author, 'rest day', ElementStatusEnum::Active);
        $this->story($other, 'race day', ElementStatusEnum::Active);
        $this->story($viewer, 'race day', ElementStatusEnum::Active);
        $this->clear();

        $window = $this->storyRepository->findStories(
            self::id($viewer),
            $this->indexDto($author, 'race', ElementStatusEnum::Active),
        );

        $this->assertSame(self::ids([$match]), self::ids($window->getItems()));
    }

    final public function testFindStoriesCombinesFriendScopeWithFilters(): void
    {
        $user = $this->user();
        $friend = $this->user();
        $stranger = $this->user();
        $this->friend($user, $friend, FriendStatusEnum::Accepted);
        $own = $this->story($user, 'race day', ElementStatusEnum::Active, '2026-01-01 10:00:00');
        $ofFriend = $this->story($friend, 'race day', ElementStatusEnum::Active, '2026-01-01 11:00:00');
        $this->story($friend, 'race day', ElementStatusEnum::Rejected);
        $this->story($friend, 'rest day', ElementStatusEnum::Active);
        $this->story($stranger, 'race day', ElementStatusEnum::Active);
        $this->clear();

        $window = $this->storyRepository->findStories(
            self::id($user),
            $this->indexDto(text: 'race', status: ElementStatusEnum::Active, sort: 'createdAt:asc'),
        );

        $this->assertSame(self::ids([$own, $ofFriend]), self::ids($window->getItems()));
    }

    final public function testFindStoriesReturnsEmptyWindow(): void
    {
        $user = $this->user();
        $this->story($this->user());
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto());

        $this->assertSame([], self::ids($window->getItems()));
        $this->assertSame(0, $window->getTotalCount());
        $this->assertFalse($window->hasNextPage());
    }

    #[DataProvider('sortProvider')]
    final public function testFindStoriesSorts(string $sort, array $expectedOrder): void
    {
        $user = $this->user();
        $stories = [
            'a' => $this->story($user, 'bravo', ElementStatusEnum::Rejected, '2026-01-01 10:00:00'),
            'b' => $this->story($user, 'charlie', ElementStatusEnum::Draft, '2026-01-02 10:00:00'),
            'c' => $this->story($user, 'alpha', ElementStatusEnum::Active, '2026-01-03 10:00:00'),
        ];
        $this->clear();

        $window = $this->storyRepository->findStories(self::id($user), $this->indexDto(sort: $sort));

        $this->assertSame(
            self::ids(array_map(static fn (string $key): Story => $stories[$key], $expectedOrder)),
            self::ids($window->getItems()),
        );
    }

    public static function sortProvider(): iterable
    {
        yield 'createdAt asc' => ['createdAt:asc', ['a', 'b', 'c']];
        yield 'createdAt desc' => ['createdAt:desc', ['c', 'b', 'a']];
        yield 'text asc' => ['text:asc', ['c', 'a', 'b']];
        yield 'text desc' => ['text:desc', ['b', 'a', 'c']];
        yield 'status asc' => ['status:asc', ['b', 'c', 'a']];
        yield 'status desc' => ['status:desc', ['a', 'c', 'b']];
    }

    #[DataProvider('paginationProvider')]
    final public function testFindStoriesPaginates(int $page, int $limit, array $expectedIndexes, bool $hasNextPage): void
    {
        $user = $this->user();
        $friend = $this->user();
        $this->friend($friend, $user, FriendStatusEnum::Accepted);
        $stories = [];

        for ($i = 0; $i < 5; ++$i) {
            $stories[] = $this->story($i % 2 ? $friend : $user, createdAt: sprintf('2026-01-01 10:00:%02d', $i));
        }

        $this->story($this->user());
        $this->clear();

        $dto = $this->indexDto(sort: 'createdAt:asc');
        $dto->page = $page;
        $dto->limit = $limit;

        $window = $this->storyRepository->findStories(self::id($user), $dto);

        $this->assertSame(
            self::ids(array_map(static fn (int $i): Story => $stories[$i], $expectedIndexes)),
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

    private function friend(User $sender, User $receiver, FriendStatusEnum $status): void
    {
        FriendFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver, 'status' => $status], $this->em);
    }

    private function story(
        User $user,
        ?string $text = null,
        ?ElementStatusEnum $status = null,
        ?string $createdAt = null,
    ): Story {
        $story = StoryFactory::make(array_filter([
            'user' => $user,
            'text' => $text,
            'status' => $status,
        ]), $this->em);

        if ($createdAt !== null) {
            $this->em->getConnection()->executeStatement(
                'UPDATE stories SET created_at = :createdAt WHERE id = :id',
                ['createdAt' => $createdAt, 'id' => (string) $story->id],
            );
        }

        return $story;
    }

    private function indexDto(
        ?User $user = null,
        ?string $text = null,
        ?ElementStatusEnum $status = null,
        string $sort = 'createdAt:desc',
    ): StoryIndexDto {
        $dto = new StoryIndexDto();
        $dto->filter->userId = $user ? self::id($user) : null;
        $dto->filter->text = $text;
        $dto->filter->status = $status;
        $dto->sort = $sort;

        return $dto;
    }
}

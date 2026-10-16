<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\FeedReaction;
use App\Enum\{ElementStatusEnum, FeedReactionEnum};
use App\Repository\FeedReactionRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FeedFactory, FeedReactionFactory, UserFactory};

class FeedReactionRepositoryTest extends RepositoryTestCase
{
    private FeedReactionRepository $feedReactionRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feed_reactions', 'feeds', 'users');
        $this->feedReactionRepository = $this->repository(FeedReactionRepository::class);
    }

    final public function testSavePersistsFeedReaction(): void
    {
        $feed = FeedFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $reaction = FeedReactionFactory::make([
            'feed' => $feed,
            'user' => $user,
            'reaction' => FeedReactionEnum::Love,
            'status' => ElementStatusEnum::Active,
        ]);

        $this->feedReactionRepository->save($reaction);
        $this->clear();

        $found = $this->feedReactionRepository->findById(self::id($reaction));
        $this->assertTrue($found->feed->id->equals($feed->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame(FeedReactionEnum::Love, $found->reaction);
        $this->assertSame(ElementStatusEnum::Active, $found->status);
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveCascadesNewFeedAndUser(): void
    {
        $reaction = FeedReactionFactory::make([
            'feed' => FeedFactory::make(['user' => UserFactory::make()]),
            'user' => UserFactory::make(),
        ]);

        $this->feedReactionRepository->save($reaction);
        $this->clear();

        $found = $this->feedReactionRepository->findById(self::id($reaction));
        $this->assertTrue($found->feed->id->equals($reaction->feed->id));
        $this->assertTrue($found->user->id->equals($reaction->user->id));
    }

    final public function testSaveUpdatesExistingFeedReaction(): void
    {
        $reaction = $this->reaction(FeedReactionEnum::Like, ElementStatusEnum::Draft);

        $reaction->reaction = FeedReactionEnum::Angry;
        $reaction->status = ElementStatusEnum::Rejected;
        $this->feedReactionRepository->save($reaction);
        $this->clear();

        $found = $this->feedReactionRepository->findById(self::id($reaction));
        $this->assertSame(FeedReactionEnum::Angry, $found->reaction);
        $this->assertSame(ElementStatusEnum::Rejected, $found->status);
        $this->assertSame(1, $this->feedReactionRepository->count());
    }

    final public function testDeleteRemovesFeedReaction(): void
    {
        $reaction = $this->reaction();
        $other = $this->reaction();
        $id = self::id($reaction);

        $this->feedReactionRepository->delete($reaction);
        $this->clear();

        $this->assertNull($this->feedReactionRepository->find($id));
        $this->assertNotNull($this->feedReactionRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsFeedReaction(): void
    {
        $reaction = $this->reaction();
        $this->reaction();
        $this->clear();

        $this->assertSame((string) $reaction->id, (string) $this->feedReactionRepository->findById(self::id($reaction))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->feedReactionRepository->findById(Uuid::v4());
    }

    private function reaction(?FeedReactionEnum $reaction = null, ?ElementStatusEnum $status = null): FeedReaction
    {
        return FeedReactionFactory::make(array_filter(['reaction' => $reaction, 'status' => $status]), $this->em);
    }
}

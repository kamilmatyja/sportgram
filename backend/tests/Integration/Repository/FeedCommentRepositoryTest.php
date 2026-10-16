<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\FeedComment;
use App\Enum\ElementStatusEnum;
use App\Repository\FeedCommentRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FeedCommentFactory, FeedFactory, UserFactory};

class FeedCommentRepositoryTest extends RepositoryTestCase
{
    private FeedCommentRepository $feedCommentRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feed_comments', 'feeds', 'users');
        $this->feedCommentRepository = $this->repository(FeedCommentRepository::class);
    }

    final public function testSavePersistsFeedComment(): void
    {
        $feed = FeedFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $comment = FeedCommentFactory::make([
            'feed' => $feed,
            'user' => $user,
            'text' => 'Great run!',
            'status' => ElementStatusEnum::Draft,
        ]);

        $this->feedCommentRepository->save($comment);
        $this->clear();

        $found = $this->feedCommentRepository->findById(self::id($comment));
        $this->assertSame('Great run!', $found->text);
        $this->assertSame(ElementStatusEnum::Draft, $found->status);
        $this->assertTrue($found->feed->id->equals($feed->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingFeedComment(): void
    {
        $comment = $this->comment(ElementStatusEnum::Draft);

        $comment->text = 'Edited';
        $comment->status = ElementStatusEnum::Active;
        $this->feedCommentRepository->save($comment);
        $this->clear();

        $found = $this->feedCommentRepository->findById(self::id($comment));
        $this->assertSame('Edited', $found->text);
        $this->assertSame(ElementStatusEnum::Active, $found->status);
    }

    final public function testDeleteRemovesFeedComment(): void
    {
        $comment = $this->comment();
        $other = $this->comment();
        $id = self::id($comment);

        $this->feedCommentRepository->delete($comment);
        $this->clear();

        $this->assertNull($this->feedCommentRepository->find($id));
        $this->assertNotNull($this->feedCommentRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsMatchingComment(): void
    {
        $this->comment();
        $comment = $this->comment();
        $this->clear();

        $this->assertTrue($this->feedCommentRepository->findById(self::id($comment))->id->equals($comment->id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->feedCommentRepository->findById(Uuid::v4());
    }

    private function comment(?ElementStatusEnum $status = null): FeedComment
    {
        return FeedCommentFactory::make(array_filter(['status' => $status]), $this->em);
    }
}

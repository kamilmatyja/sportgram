<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ElementStatusDto, FeedCommentDto, FeedDto, FeedIndexDto, FeedReactionDto};
use App\Entity\{Feed, FeedComment, FeedReaction, User};
use App\Enum\{ElementStatusEnum, FeedReactionEnum, NotificationTypeEnum};
use App\Repository\{FeedCommentRepository, FeedReactionRepository, FeedRepository, FriendRepository};
use App\Service\FeedService;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{FeedCommentFactory, FeedFactory, FeedReactionFactory, UserFactory};

#[AllowMockObjectsWithoutExpectations]
class FeedServiceTest extends ServiceTestCase
{
    private FeedRepository&MockObject $feedRepository;

    private FeedCommentRepository&MockObject $feedCommentRepository;

    private FeedReactionRepository&MockObject $feedReactionRepository;

    private FriendRepository&MockObject $friendRepository;

    private User $currentUser;

    private FeedService $service;

    protected function setUp(): void
    {
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->feedCommentRepository = $this->createMock(FeedCommentRepository::class);
        $this->feedReactionRepository = $this->createMock(FeedReactionRepository::class);
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new FeedService(
            $this->feedRepository,
            $this->feedCommentRepository,
            $this->feedReactionRepository,
            $this->friendRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    public static function reactionProvider(): iterable
    {
        foreach (FeedReactionEnum::cases() as $reaction) {
            yield $reaction->name => [$reaction];
        }
    }

    final public function testCreateSavesActiveFeedOfCurrentUser(): void
    {
        $dto = self::feedDto('Great run', 'photo-data');
        $saved = null;
        $this->feedRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Feed $feed) use (&$saved): void {
                $saved = $feed;
                self::persist()($feed);
            });

        $id = $this->service->create($dto);

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame('Great run', $saved->text);
        $this->assertSame(base64_encode('photo-data'), $saved->photo);
        $this->assertSame(ElementStatusEnum::Active, $saved->status);
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateSavesTextAndPhoto(): void
    {
        $feed = self::entity(FeedFactory::make(['status' => ElementStatusEnum::Draft]));
        $dto = self::feedDto('Edited', 'new-photo');
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);
        $this->feedRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Feed $saved): bool => $saved === $feed
                && 'Edited' === $saved->text
                && base64_encode('new-photo') === $saved->photo
                && ElementStatusEnum::Draft === $saved->status));

        $this->assertSame($feed->id, $this->service->update($feed->id, $dto));
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(Uuid::v7(), self::feedDto('text', 'photo'));
    }

    #[DataProvider('statusProvider')]
    final public function testUpdateStatusSavesStatusAndNotifiesAuthor(ElementStatusEnum $status): void
    {
        $author = self::entity(UserFactory::make(['link' => 'anna']));
        $feed = self::entity(FeedFactory::make(['user' => $author, 'text' => 'My feed', 'status' => ElementStatusEnum::Draft]));
        $dto = self::statusDto($status);
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);
        $this->feedRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Feed $saved): bool => $saved === $feed && $status === $saved->status));

        $this->assertSame($feed->id, $this->service->updateStatus($feed->id, $dto));
        $this->assertNotifications([[$author, NotificationTypeEnum::FeedStatus, 'My feed', '/users/anna']]);
    }

    final public function testUpdateStatusOfFeedWithoutTextNotifiesWithPlaceholder(): void
    {
        $author = self::entity(UserFactory::make(['link' => 'anna']));
        $feed = self::entity(FeedFactory::make(['user' => $author, 'text' => null]));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->feedRepository->expects($this->once())->method('save')->with($feed);

        $this->service->updateStatus($feed->id, self::statusDto(ElementStatusEnum::Rejected));

        $this->assertNotifications([[$author, NotificationTypeEnum::FeedStatus, '-', '/users/anna']]);
    }

    final public function testUpdateStatusFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('save');

        try {
            $this->service->updateStatus(Uuid::v7(), self::statusDto(ElementStatusEnum::Active));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDelete(): void
    {
        $feed = self::entity(FeedFactory::make());
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);
        $this->feedRepository->expects($this->once())->method('delete')->with($feed);

        $this->assertSame($feed->id, $this->service->delete($feed->id));
    }

    final public function testDeleteFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v7());
    }

    final public function testIndexDelegatesToRepositoryWithCurrentUser(): void
    {
        $dto = new FeedIndexDto();
        $window = self::window([self::entity(FeedFactory::make())]);
        $this->feedRepository->expects($this->once())
            ->method('findFeeds')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $feed = self::entity(FeedFactory::make());
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);

        $this->assertSame($feed, $this->service->details($feed->id));
    }

    final public function testDetailsFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v7());
    }

    final public function testCreateCommentOnFriendsFeedSavesCommentAndNotifiesAuthor(): void
    {
        $author = self::entity(UserFactory::make(['link' => 'anna']));
        $feed = self::entity(FeedFactory::make(['user' => $author, 'text' => 'Feed text']));
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $author->id)
            ->willReturn(true);
        $saved = null;
        $this->feedCommentRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (FeedComment $comment) use (&$saved): void {
                $saved = $comment;
                self::persist()($comment);
            });

        $id = $this->service->createComment($feed->id, self::commentDto('Nice!'));

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($feed, $saved->feed);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame('Nice!', $saved->text);
        $this->assertSame(ElementStatusEnum::Active, $saved->status);
        $this->assertNotifications([[$author, NotificationTypeEnum::FeedComment, 'Nice!', '/users/anna']]);
    }

    final public function testCreateCommentOnOwnFeedIsAllowedWithoutFriendship(): void
    {
        $feed = self::entity(FeedFactory::make(['user' => $this->currentUser]));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->friendRepository->method('isFriend')->willReturn(false);
        $this->feedCommentRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());

        $this->service->createComment($feed->id, self::commentDto('Self comment'));

        $this->assertNotifications([[$this->currentUser, NotificationTypeEnum::FeedComment, 'Self comment', '/users/jan']]);
    }

    final public function testCreateCommentRejectsNonFriend(): void
    {
        $feed = self::entity(FeedFactory::make(['user' => self::user()]));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->friendRepository->expects($this->once())->method('isFriend')->willReturn(false);
        $this->feedCommentRepository->expects($this->never())->method('save');

        try {
            $this->service->createComment($feed->id, self::commentDto('text'));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateCommentFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedCommentRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->createComment(Uuid::v7(), self::commentDto('text'));
    }

    final public function testUpdateCommentSavesText(): void
    {
        $comment = self::entity(FeedCommentFactory::make(['status' => ElementStatusEnum::Draft]));
        $this->feedCommentRepository->expects($this->once())->method('findById')->with($comment->id)->willReturn($comment);
        $this->feedCommentRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (FeedComment $saved): bool => $saved === $comment
                && 'Edited' === $saved->text
                && ElementStatusEnum::Draft === $saved->status));

        $this->assertSame($comment->id, $this->service->updateComment($comment->id, self::commentDto('Edited')));
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateCommentFailsForUnknownComment(): void
    {
        $this->feedCommentRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedCommentRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateComment(Uuid::v7(), self::commentDto('text'));
    }

    #[DataProvider('statusProvider')]
    final public function testUpdateCommentStatusSavesStatusAndNotifiesCommentAuthor(ElementStatusEnum $status): void
    {
        $commentAuthor = self::entity(UserFactory::make(['link' => 'piotr']));
        $comment = self::entity(FeedCommentFactory::make([
            'user' => $commentAuthor,
            'text' => 'Comment text',
            'status' => ElementStatusEnum::Draft,
        ]));
        $this->feedCommentRepository->expects($this->once())->method('findById')->with($comment->id)->willReturn($comment);
        $this->feedCommentRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (FeedComment $saved): bool => $saved === $comment && $status === $saved->status));

        $this->assertSame($comment->id, $this->service->updateCommentStatus($comment->id, self::statusDto($status)));
        $this->assertNotifications([[$commentAuthor, NotificationTypeEnum::FeedCommentStatus, 'Comment text', '/users/piotr']]);
    }

    final public function testUpdateCommentStatusFailsForUnknownComment(): void
    {
        $this->feedCommentRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedCommentRepository->expects($this->never())->method('save');

        try {
            $this->service->updateCommentStatus(Uuid::v7(), self::statusDto(ElementStatusEnum::Active));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteComment(): void
    {
        $comment = self::entity(FeedCommentFactory::make());
        $this->feedCommentRepository->expects($this->once())->method('findById')->with($comment->id)->willReturn($comment);
        $this->feedCommentRepository->expects($this->once())->method('delete')->with($comment);

        $this->assertSame($comment->id, $this->service->deleteComment($comment->id));
    }

    final public function testDeleteCommentFailsForUnknownComment(): void
    {
        $this->feedCommentRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedCommentRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->deleteComment(Uuid::v7());
    }

    #[DataProvider('reactionProvider')]
    final public function testCreateReactionOnFriendsFeedSavesReactionAndNotifiesAuthor(FeedReactionEnum $type): void
    {
        $author = self::entity(UserFactory::make(['link' => 'anna']));
        $feed = self::entity(FeedFactory::make(['user' => $author, 'text' => 'Feed text']));
        $otherReaction = self::entity(FeedReactionFactory::make(['feed' => $feed, 'user' => self::user()]));
        $feed->reactions->add($otherReaction);
        $this->feedRepository->expects($this->once())->method('findById')->with($feed->id)->willReturn($feed);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $author->id)
            ->willReturn(true);
        $saved = null;
        $this->feedReactionRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (FeedReaction $reaction) use (&$saved): void {
                $saved = $reaction;
                self::persist()($reaction);
            });

        $id = $this->service->createReaction($feed->id, self::reactionDto($type));

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($feed, $saved->feed);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame($type, $saved->reaction);
        $this->assertSame(ElementStatusEnum::Active, $saved->status);
        $this->assertNotifications([[$author, NotificationTypeEnum::FeedReaction, 'Feed text', '/users/anna']]);
    }

    final public function testCreateReactionOnOwnFeedIsAllowedWithoutFriendship(): void
    {
        $feed = self::entity(FeedFactory::make(['user' => $this->currentUser, 'text' => 'Mine']));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->friendRepository->method('isFriend')->willReturn(false);
        $this->feedReactionRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());

        $this->service->createReaction($feed->id, self::reactionDto(FeedReactionEnum::Like));

        $this->assertNotifications([[$this->currentUser, NotificationTypeEnum::FeedReaction, 'Mine', '/users/jan']]);
    }

    final public function testCreateReactionRejectsNonFriend(): void
    {
        $feed = self::entity(FeedFactory::make(['user' => self::user()]));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->friendRepository->expects($this->once())->method('isFriend')->willReturn(false);
        $this->feedReactionRepository->expects($this->never())->method('save');

        try {
            $this->service->createReaction($feed->id, self::reactionDto(FeedReactionEnum::Like));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateReactionRejectsSecondReactionOfSameUser(): void
    {
        $feed = self::entity(FeedFactory::make(['user' => self::user()]));
        $feed->reactions->add(self::entity(FeedReactionFactory::make(['feed' => $feed, 'user' => self::user()])));
        $feed->reactions->add(self::entity(FeedReactionFactory::make(['feed' => $feed, 'user' => $this->currentUser])));
        $this->feedRepository->expects($this->once())->method('findById')->willReturn($feed);
        $this->friendRepository->expects($this->once())->method('isFriend')->willReturn(true);
        $this->feedReactionRepository->expects($this->never())->method('save');

        try {
            $this->service->createReaction($feed->id, self::reactionDto(FeedReactionEnum::Love));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User already reacted to this feed.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateReactionFailsForUnknownFeed(): void
    {
        $this->feedRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedReactionRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->createReaction(Uuid::v7(), self::reactionDto(FeedReactionEnum::Like));
    }

    #[DataProvider('reactionProvider')]
    final public function testUpdateReactionSavesType(FeedReactionEnum $type): void
    {
        $reaction = self::entity(FeedReactionFactory::make(['status' => ElementStatusEnum::Draft]));
        $this->feedReactionRepository->expects($this->once())->method('findById')->with($reaction->id)->willReturn($reaction);
        $this->feedReactionRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (FeedReaction $saved): bool => $saved === $reaction
                && $type === $saved->reaction
                && ElementStatusEnum::Draft === $saved->status));

        $this->assertSame($reaction->id, $this->service->updateReaction($reaction->id, self::reactionDto($type)));
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateReactionFailsForUnknownReaction(): void
    {
        $this->feedReactionRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedReactionRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateReaction(Uuid::v7(), self::reactionDto(FeedReactionEnum::Like));
    }

    #[DataProvider('statusProvider')]
    final public function testUpdateReactionStatusSavesStatusAndNotifiesReactionAuthor(ElementStatusEnum $status): void
    {
        $reactionAuthor = self::entity(UserFactory::make(['link' => 'piotr']));
        $feed = self::entity(FeedFactory::make(['text' => 'Feed text']));
        $reaction = self::entity(FeedReactionFactory::make([
            'feed' => $feed,
            'user' => $reactionAuthor,
            'status' => ElementStatusEnum::Draft,
        ]));
        $this->feedReactionRepository->expects($this->once())->method('findById')->with($reaction->id)->willReturn($reaction);
        $this->feedReactionRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (FeedReaction $saved): bool => $saved === $reaction && $status === $saved->status));

        $this->assertSame($reaction->id, $this->service->updateReactionStatus($reaction->id, self::statusDto($status)));
        $this->assertNotifications([[$reactionAuthor, NotificationTypeEnum::FeedReactionStatus, 'Feed text', '/users/piotr']]);
    }

    final public function testUpdateReactionStatusFailsForUnknownReaction(): void
    {
        $this->feedReactionRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedReactionRepository->expects($this->never())->method('save');

        try {
            $this->service->updateReactionStatus(Uuid::v7(), self::statusDto(ElementStatusEnum::Active));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteReaction(): void
    {
        $reaction = self::entity(FeedReactionFactory::make());
        $this->feedReactionRepository->expects($this->once())->method('findById')->with($reaction->id)->willReturn($reaction);
        $this->feedReactionRepository->expects($this->once())->method('delete')->with($reaction);

        $this->assertSame($reaction->id, $this->service->deleteReaction($reaction->id));
    }

    final public function testDeleteReactionFailsForUnknownReaction(): void
    {
        $this->feedReactionRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedReactionRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->deleteReaction(Uuid::v7());
    }

    private static function feedDto(string $text, string $rawPhoto): FeedDto
    {
        $dto = new FeedDto();
        $dto->text = $text;
        $dto->photo = base64_encode($rawPhoto);

        return $dto;
    }

    private static function commentDto(string $text): FeedCommentDto
    {
        $dto = new FeedCommentDto();
        $dto->text = $text;

        return $dto;
    }

    private static function reactionDto(FeedReactionEnum $type): FeedReactionDto
    {
        $dto = new FeedReactionDto();
        $dto->type = $type;

        return $dto;
    }

    private static function statusDto(ElementStatusEnum $status): ElementStatusDto
    {
        $dto = new ElementStatusDto();
        $dto->status = $status;

        return $dto;
    }
}

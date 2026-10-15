<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{FeedComment, User};
use App\Enum\RoleEnum;
use App\Repository\FeedCommentRepository;
use App\Security\Voter\FeedCommentCreatorVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FeedCommentFactory;

class FeedCommentCreatorVoterTest extends VoterTestCase
{
    private FeedCommentRepository&MockObject $feedCommentRepository;

    private FeedCommentCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->feedCommentRepository = $this->createMock(FeedCommentRepository::class);
        $this->voter = new FeedCommentCreatorVoter($this->feedCommentRepository);
    }

    final public function testGrantsAuthor(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $feedComment = $this->feedCommentOwnedBy($owner);
        $this->givenFeedComment($feedComment);

        $this->assertGranted($this->voter, $owner, self::idOf($feedComment), FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    final public function testDeniesOtherUser(): void
    {
        $feedComment = $this->feedCommentOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFeedComment($feedComment);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($feedComment), FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $feedComment = $this->feedCommentOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFeedComment($feedComment);

        $this->assertDenied($this->voter, self::admin(), self::idOf($feedComment), FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->feedCommentRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->feedCommentRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->feedCommentRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, FeedCommentCreatorVoter::FEED_COMMENT_CREATOR);
    }

    final public function testPropagatesMissingFeedComment(): void
    {
        $this->feedCommentRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [FeedCommentCreatorVoter::FEED_COMMENT_CREATOR]);
    }

    private function feedCommentOwnedBy(User $owner): FeedComment
    {
        $feedComment = FeedCommentFactory::make(['user' => $owner]);
        $feedComment->id = Uuid::v7();

        return $feedComment;
    }

    private function givenFeedComment(FeedComment $feedComment): void
    {
        $this->feedCommentRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($feedComment->id)))
            ->willReturn($feedComment);
    }
}

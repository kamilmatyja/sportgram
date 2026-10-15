<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{FeedReaction, User};
use App\Enum\RoleEnum;
use App\Repository\FeedReactionRepository;
use App\Security\Voter\FeedReactionVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FeedReactionFactory;

class FeedReactionVoterTest extends VoterTestCase
{
    private FeedReactionRepository&MockObject $feedReactionRepository;

    private FeedReactionVoter $voter;

    protected function setUp(): void
    {
        $this->feedReactionRepository = $this->createMock(FeedReactionRepository::class);
        $this->voter = new FeedReactionVoter($this->feedReactionRepository);
    }

    final public function testGrantsReactionAuthor(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $feedReaction = $this->feedReactionOwnedBy($owner);
        $this->givenFeedReaction($feedReaction);

        $this->assertGranted($this->voter, self::reloaded($owner), self::idOf($feedReaction), FeedReactionVoter::FEED_REACTION);
    }

    final public function testDeniesOtherUser(): void
    {
        $feedReaction = $this->feedReactionOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFeedReaction($feedReaction);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($feedReaction), FeedReactionVoter::FEED_REACTION);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->feedReactionRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v7(), FeedReactionVoter::FEED_REACTION);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->feedReactionRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', FeedReactionVoter::FEED_REACTION);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->feedReactionRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, FeedReactionVoter::FEED_REACTION);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->feedReactionRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), FeedReactionVoter::FEED_REACTION);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, FeedReactionVoter::FEED_REACTION);
    }

    final public function testPropagatesMissingFeedReaction(): void
    {
        $this->feedReactionRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [FeedReactionVoter::FEED_REACTION]);
    }

    private function feedReactionOwnedBy(User $owner): FeedReaction
    {
        $feedReaction = FeedReactionFactory::make(['user' => $owner]);
        $feedReaction->id = Uuid::v7();

        return $feedReaction;
    }

    private function givenFeedReaction(FeedReaction $feedReaction): void
    {
        $this->feedReactionRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($feedReaction->id)))
            ->willReturn($feedReaction);
    }
}

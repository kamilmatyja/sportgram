<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Feed, User};
use App\Enum\RoleEnum;
use App\Repository\FeedRepository;
use App\Security\Voter\FeedCreatorVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FeedFactory;

class FeedCreatorVoterTest extends VoterTestCase
{
    private FeedRepository&MockObject $feedRepository;

    private FeedCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->voter = new FeedCreatorVoter($this->feedRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsFeedAuthor(RoleEnum $role): void
    {
        $owner = self::user($role);
        $feed = $this->feedOwnedBy($owner);
        $this->givenFeed($feed);

        $this->assertGranted($this->voter, $owner, self::idOf($feed), FeedCreatorVoter::FEED_CREATOR);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $feed = $this->feedOwnedBy($owner);
        $this->givenFeed($feed);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($feed), FeedCreatorVoter::FEED_CREATOR);
    }

    final public function testDeniesOtherUser(): void
    {
        $feed = $this->feedOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFeed($feed);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($feed), FeedCreatorVoter::FEED_CREATOR);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $feed = $this->feedOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFeed($feed);

        $this->assertDenied($this->voter, self::admin(), self::idOf($feed), FeedCreatorVoter::FEED_CREATOR);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $feed = $this->feedOwnedBy($owner);
        $this->givenFeed($feed);

        $this->assertGranted($this->voter, $owner, self::idOf($feed), FeedCreatorVoter::FEED_CREATOR);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->feedRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, FeedCreatorVoter::FEED_CREATOR);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->feedRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), FeedCreatorVoter::FEED_CREATOR);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, FeedCreatorVoter::FEED_CREATOR);
    }

    final public function testPropagatesMissingFeed(): void
    {
        $this->feedRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [FeedCreatorVoter::FEED_CREATOR]);
    }

    private function feedOwnedBy(User $owner): Feed
    {
        $feed = FeedFactory::make(['user' => $owner]);
        $feed->id = Uuid::v7();

        return $feed;
    }

    private function givenFeed(Feed $feed): void
    {
        $this->feedRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($feed->id)))
            ->willReturn($feed);
    }
}

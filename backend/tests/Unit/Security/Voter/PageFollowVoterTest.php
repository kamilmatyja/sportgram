<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{PageFollow, User};
use App\Enum\RoleEnum;
use App\Repository\PageFollowRepository;
use App\Security\Voter\PageFollowVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PageFollowFactory;

class PageFollowVoterTest extends VoterTestCase
{
    private PageFollowRepository&MockObject $pageFollowRepository;

    private PageFollowVoter $voter;

    protected function setUp(): void
    {
        $this->pageFollowRepository = $this->createMock(PageFollowRepository::class);
        $this->voter = new PageFollowVoter($this->pageFollowRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsFollower(RoleEnum $role): void
    {
        $owner = self::user($role);
        $pageFollow = $this->pageFollowOwnedBy($owner);
        $this->givenPageFollow($pageFollow);

        $this->assertGranted($this->voter, $owner, self::idOf($pageFollow), PageFollowVoter::PAGE_FOLLOW);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $pageFollow = $this->pageFollowOwnedBy($owner);
        $this->givenPageFollow($pageFollow);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($pageFollow), PageFollowVoter::PAGE_FOLLOW);
    }

    final public function testDeniesOtherUser(): void
    {
        $pageFollow = $this->pageFollowOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPageFollow($pageFollow);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($pageFollow), PageFollowVoter::PAGE_FOLLOW);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $pageFollow = $this->pageFollowOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPageFollow($pageFollow);

        $this->assertDenied($this->voter, self::admin(), self::idOf($pageFollow), PageFollowVoter::PAGE_FOLLOW);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $pageFollow = $this->pageFollowOwnedBy($owner);
        $this->givenPageFollow($pageFollow);

        $this->assertGranted($this->voter, $owner, self::idOf($pageFollow), PageFollowVoter::PAGE_FOLLOW);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->pageFollowRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, PageFollowVoter::PAGE_FOLLOW);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->pageFollowRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), PageFollowVoter::PAGE_FOLLOW);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, PageFollowVoter::PAGE_FOLLOW);
    }

    final public function testPropagatesMissingPageFollow(): void
    {
        $this->pageFollowRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [PageFollowVoter::PAGE_FOLLOW]);
    }

    private function pageFollowOwnedBy(User $owner): PageFollow
    {
        $pageFollow = PageFollowFactory::make(['user' => $owner]);
        $pageFollow->id = Uuid::v7();

        return $pageFollow;
    }

    private function givenPageFollow(PageFollow $pageFollow): void
    {
        $this->pageFollowRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($pageFollow->id)))
            ->willReturn($pageFollow);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{PageParticipant, User};
use App\Enum\RoleEnum;
use App\Repository\PageParticipantRepository;
use App\Security\Voter\PageParticipantVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PageParticipantFactory;

class PageParticipantVoterTest extends VoterTestCase
{
    private PageParticipantRepository&MockObject $pageParticipantRepository;

    private PageParticipantVoter $voter;

    protected function setUp(): void
    {
        $this->pageParticipantRepository = $this->createMock(PageParticipantRepository::class);
        $this->voter = new PageParticipantVoter($this->pageParticipantRepository);
    }

    final public function testGrantsParticipantUser(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $pageParticipant = $this->pageParticipantOwnedBy($owner);
        $this->givenPageParticipant($pageParticipant);

        $this->assertGranted($this->voter, $owner, self::idOf($pageParticipant), PageParticipantVoter::PAGE_PARTICIPANT);
    }

    final public function testDeniesOtherUser(): void
    {
        $pageParticipant = $this->pageParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPageParticipant($pageParticipant);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($pageParticipant), PageParticipantVoter::PAGE_PARTICIPANT);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $pageParticipant = $this->pageParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPageParticipant($pageParticipant);

        $this->assertDenied($this->voter, self::admin(), self::idOf($pageParticipant), PageParticipantVoter::PAGE_PARTICIPANT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->pageParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, PageParticipantVoter::PAGE_PARTICIPANT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->pageParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', PageParticipantVoter::PAGE_PARTICIPANT);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->pageParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), PageParticipantVoter::PAGE_PARTICIPANT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, PageParticipantVoter::PAGE_PARTICIPANT);
    }

    final public function testPropagatesMissingPageParticipant(): void
    {
        $this->pageParticipantRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [PageParticipantVoter::PAGE_PARTICIPANT]);
    }

    private function pageParticipantOwnedBy(User $owner): PageParticipant
    {
        $pageParticipant = PageParticipantFactory::make(['user' => $owner]);
        $pageParticipant->id = Uuid::v7();

        return $pageParticipant;
    }

    private function givenPageParticipant(PageParticipant $pageParticipant): void
    {
        $this->pageParticipantRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($pageParticipant->id)))
            ->willReturn($pageParticipant);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Page, User};
use App\Enum\RoleEnum;
use App\Repository\PageRepository;
use App\Security\Voter\PageVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PageFactory;

class PageVoterTest extends VoterTestCase
{
    private PageRepository&MockObject $pageRepository;

    private PageVoter $voter;

    protected function setUp(): void
    {
        $this->pageRepository = $this->createMock(PageRepository::class);
        $this->voter = new PageVoter($this->pageRepository);
    }

    final public function testGrantsPageOwner(): void
    {
        $owner = self::user(RoleEnum::Organizer);
        $page = $this->pageOwnedBy($owner);
        $this->givenPage($page);

        $this->assertGranted($this->voter, self::reloaded($owner), self::idOf($page), PageVoter::PAGE);
    }

    final public function testDeniesOtherUser(): void
    {
        $page = $this->pageOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenPage($page);

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), self::idOf($page), PageVoter::PAGE);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v7(), PageVoter::PAGE);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', PageVoter::PAGE);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, PageVoter::PAGE);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), PageVoter::PAGE);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, PageVoter::PAGE);
    }

    final public function testPropagatesMissingPage(): void
    {
        $this->pageRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [PageVoter::PAGE]);
    }

    private function pageOwnedBy(User $owner): Page
    {
        $page = PageFactory::make(['user' => $owner]);
        $page->id = Uuid::v7();

        return $page;
    }

    private function givenPage(Page $page): void
    {
        $this->pageRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($page->id)))
            ->willReturn($page);
    }
}

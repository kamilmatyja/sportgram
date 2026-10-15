<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Page, User};
use App\Enum\{RoleEnum, SaveStatusEnum};
use App\Repository\PageRepository;
use App\Security\Voter\EventCreatorVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageParticipantFactory};

class EventCreatorVoterTest extends VoterTestCase
{
    private PageRepository&MockObject $pageRepository;

    private EventCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->pageRepository = $this->createMock(PageRepository::class);
        $this->voter = new EventCreatorVoter($this->pageRepository);
    }

    final public function testGrantsPageParticipant(): void
    {
        $participant = self::user(RoleEnum::Organizer);
        $page = $this->pageWithParticipants($participant);
        $this->givenPage($page);

        $this->assertGranted(
            $this->voter,
            self::reloaded($participant),
            self::idOf($page),
            EventCreatorVoter::EVENT_CREATOR,
        );
    }

    final public function testGrantsParticipantAmongOthers(): void
    {
        $participant = self::user(RoleEnum::Organizer);
        $page = $this->pageWithParticipants(self::user(RoleEnum::Organizer), $participant, self::user(RoleEnum::Participant));
        $this->givenPage($page);

        $this->assertGranted(
            $this->voter,
            self::reloaded($participant),
            self::idOf($page),
            EventCreatorVoter::EVENT_CREATOR,
        );
    }

    final public function testDeniesUserWhoIsNotParticipant(): void
    {
        $page = $this->pageWithParticipants(self::user(RoleEnum::Organizer));
        $this->givenPage($page);

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Organizer),
            self::idOf($page),
            EventCreatorVoter::EVENT_CREATOR,
        );
    }

    final public function testDeniesWhenPageHasNoParticipants(): void
    {
        $page = $this->pageWithParticipants();
        $this->givenPage($page);

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Organizer),
            self::idOf($page),
            EventCreatorVoter::EVENT_CREATOR,
        );
    }

    final public function testDeniesAdministratorWhoIsNotParticipant(): void
    {
        $page = $this->pageWithParticipants(self::user(RoleEnum::Organizer));
        $this->givenPage($page);

        $this->assertDenied($this->voter, self::admin(), self::idOf($page), EventCreatorVoter::EVENT_CREATOR);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventCreatorVoter::EVENT_CREATOR);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->pageRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventCreatorVoter::EVENT_CREATOR);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventCreatorVoter::EVENT_CREATOR);
    }

    final public function testPropagatesMissingPage(): void
    {
        $this->pageRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventCreatorVoter::EVENT_CREATOR]);
    }

    private function pageWithParticipants(User ...$users): Page
    {
        $page = PageFactory::make();
        $page->id = Uuid::v7();

        foreach ($users as $user) {
            $page->participants->add(
                PageParticipantFactory::make(['page' => $page, 'user' => $user, 'status' => SaveStatusEnum::Accepted]),
            );
        }

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

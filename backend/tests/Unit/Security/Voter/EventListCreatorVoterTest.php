<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{EventDisciplineList, User};
use App\Enum\RoleEnum;
use App\Repository\EventDisciplineListRepository;
use App\Security\Voter\EventListCreatorVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineListFactory, EventFactory, PageParticipantFactory};

class EventListCreatorVoterTest extends VoterTestCase
{
    private EventDisciplineListRepository&MockObject $eventDisciplineListRepository;

    private EventListCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->eventDisciplineListRepository = $this->createMock(EventDisciplineListRepository::class);
        $this->voter = new EventListCreatorVoter($this->eventDisciplineListRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsCreatorOfEventOwningList(RoleEnum $role): void
    {
        $owner = self::user($role);
        $eventDisciplineList = $this->eventDisciplineListOwnedBy($owner);
        $this->givenEventDisciplineList($eventDisciplineList);

        $this->assertGranted($this->voter, $owner, self::idOf($eventDisciplineList), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Organizer);
        $eventDisciplineList = $this->eventDisciplineListOwnedBy($owner);
        $this->givenEventDisciplineList($eventDisciplineList);

        $sameUser = self::user(RoleEnum::Organizer);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($eventDisciplineList), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    final public function testDeniesOtherUser(): void
    {
        $eventDisciplineList = $this->eventDisciplineListOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenEventDisciplineList($eventDisciplineList);

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), self::idOf($eventDisciplineList), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $eventDisciplineList = $this->eventDisciplineListOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenEventDisciplineList($eventDisciplineList);

        $this->assertDenied($this->voter, self::admin(), self::idOf($eventDisciplineList), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $eventDisciplineList = $this->eventDisciplineListOwnedBy($owner);
        $this->givenEventDisciplineList($eventDisciplineList);

        $this->assertGranted($this->voter, $owner, self::idOf($eventDisciplineList), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventListCreatorVoter::EVENT_LIST_CREATOR);
    }

    final public function testPropagatesMissingEventDisciplineList(): void
    {
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventListCreatorVoter::EVENT_LIST_CREATOR]);
    }

    private function eventDisciplineListOwnedBy(User $owner): EventDisciplineList
    {
        $event = EventFactory::make([
            'pageParticipant' => PageParticipantFactory::make(['user' => $owner]),
        ]);
        $eventDisciplineList = EventDisciplineListFactory::make([
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make([
                'eventDiscipline' => EventDisciplineFactory::make(['event' => $event]),
            ]),
        ]);
        $eventDisciplineList->id = Uuid::v7();

        return $eventDisciplineList;
    }

    private function givenEventDisciplineList(EventDisciplineList $eventDisciplineList): void
    {
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($eventDisciplineList->id)))
            ->willReturn($eventDisciplineList);
    }
}

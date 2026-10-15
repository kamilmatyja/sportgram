<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{EventDisciplineList, User};
use App\Enum\RoleEnum;
use App\Repository\EventDisciplineListRepository;
use App\Security\Voter\EventListVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{
    EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventFactory,
    PageParticipantFactory,
};

class EventListVoterTest extends VoterTestCase
{
    private EventDisciplineListRepository&MockObject $eventDisciplineListRepository;

    private EventListVoter $voter;

    protected function setUp(): void
    {
        $this->eventDisciplineListRepository = $this->createMock(EventDisciplineListRepository::class);
        $this->voter = new EventListVoter($this->eventDisciplineListRepository);
    }

    final public function testGrantsEventOrganizer(): void
    {
        $organizer = self::user(RoleEnum::Organizer);
        $list = $this->eventList($organizer, self::user(RoleEnum::Participant));
        $this->givenList($list);

        $this->assertGranted($this->voter, $organizer, self::idOf($list), EventListVoter::EVENT_LIST);
    }

    final public function testGrantsListUser(): void
    {
        $listUser = self::user(RoleEnum::Participant);
        $list = $this->eventList(self::user(RoleEnum::Organizer), $listUser);
        $this->givenList($list);

        $this->assertGranted($this->voter, $listUser, self::idOf($list), EventListVoter::EVENT_LIST);
    }

    final public function testDeniesOtherUser(): void
    {
        $list = $this->eventList(self::user(RoleEnum::Organizer), self::user(RoleEnum::Participant));
        $this->givenList($list);

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Organizer),
            self::idOf($list),
            EventListVoter::EVENT_LIST,
        );
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v7(), EventListVoter::EVENT_LIST);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', EventListVoter::EVENT_LIST);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventListVoter::EVENT_LIST);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->eventDisciplineListRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventListVoter::EVENT_LIST);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventListVoter::EVENT_LIST);
    }

    final public function testPropagatesMissingList(): void
    {
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventListVoter::EVENT_LIST]);
    }

    private function eventList(User $organizer, User $listUser): EventDisciplineList
    {
        $event = EventFactory::make([
            'pageParticipant' => PageParticipantFactory::make(['user' => $organizer]),
        ]);
        $distance = EventDisciplineDistanceFactory::make([
            'eventDiscipline' => EventDisciplineFactory::make(['event' => $event]),
        ]);

        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listUser]);
        $list->id = Uuid::v7();

        return $list;
    }

    private function givenList(EventDisciplineList $list): void
    {
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($list->id)))
            ->willReturn($list);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Event, User};
use App\Enum\RoleEnum;
use App\Repository\EventRepository;
use App\Security\Voter\EventUpdaterVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventFactory, PageParticipantFactory};

class EventUpdaterVoterTest extends VoterTestCase
{
    private EventRepository&MockObject $eventRepository;

    private EventUpdaterVoter $voter;

    protected function setUp(): void
    {
        $this->eventRepository = $this->createMock(EventRepository::class);
        $this->voter = new EventUpdaterVoter($this->eventRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsPageParticipantWhoCreatedEvent(RoleEnum $role): void
    {
        $owner = self::user($role);
        $event = $this->eventOwnedBy($owner);
        $this->givenEvent($event);

        $this->assertGranted($this->voter, $owner, self::idOf($event), EventUpdaterVoter::EVENT_UPDATER);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Organizer);
        $event = $this->eventOwnedBy($owner);
        $this->givenEvent($event);

        $sameUser = self::user(RoleEnum::Organizer);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($event), EventUpdaterVoter::EVENT_UPDATER);
    }

    final public function testDeniesOtherUser(): void
    {
        $event = $this->eventOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenEvent($event);

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), self::idOf($event), EventUpdaterVoter::EVENT_UPDATER);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $event = $this->eventOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenEvent($event);

        $this->assertDenied($this->voter, self::admin(), self::idOf($event), EventUpdaterVoter::EVENT_UPDATER);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $event = $this->eventOwnedBy($owner);
        $this->givenEvent($event);

        $this->assertGranted($this->voter, $owner, self::idOf($event), EventUpdaterVoter::EVENT_UPDATER);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventUpdaterVoter::EVENT_UPDATER);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventUpdaterVoter::EVENT_UPDATER);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventUpdaterVoter::EVENT_UPDATER);
    }

    final public function testPropagatesMissingEvent(): void
    {
        $this->eventRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventUpdaterVoter::EVENT_UPDATER]);
    }

    private function eventOwnedBy(User $owner): Event
    {
        $event = EventFactory::make([
            'pageParticipant' => PageParticipantFactory::make(['user' => $owner]),
        ]);
        $event->id = Uuid::v7();

        return $event;
    }

    private function givenEvent(Event $event): void
    {
        $this->eventRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($event->id)))
            ->willReturn($event);
    }
}

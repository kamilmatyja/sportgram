<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Event, User};
use App\Enum\RoleEnum;
use App\Repository\EventRepository;
use App\Security\Voter\EventVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventFactory, PageParticipantFactory};

class EventVoterTest extends VoterTestCase
{
    private EventRepository&MockObject $eventRepository;

    private EventVoter $voter;

    protected function setUp(): void
    {
        $this->eventRepository = $this->createMock(EventRepository::class);
        $this->voter = new EventVoter($this->eventRepository);
    }

    final public function testGrantsPageParticipantWhoCreatedEvent(): void
    {
        $owner = self::user(RoleEnum::Organizer);
        $event = $this->eventOwnedBy($owner);
        $this->givenEvent($event);

        $this->assertGranted($this->voter, $owner, self::idOf($event), EventVoter::EVENT);
    }

    final public function testDeniesOtherUser(): void
    {
        $event = $this->eventOwnedBy(self::user(RoleEnum::Organizer));
        $this->givenEvent($event);

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $event->id, EventVoter::EVENT);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v7(), EventVoter::EVENT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventVoter::EVENT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', EventVoter::EVENT);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->eventRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventVoter::EVENT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventVoter::EVENT);
    }

    final public function testPropagatesMissingEvent(): void
    {
        $this->eventRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventVoter::EVENT]);
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

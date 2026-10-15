<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{EventDisciplineResult, User};
use App\Enum\RoleEnum;
use App\Repository\EventDisciplineResultRepository;
use App\Security\Voter\EventResultVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{
    EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    EventFactory,
    PageParticipantFactory,
};

class EventResultVoterTest extends VoterTestCase
{
    private EventDisciplineResultRepository&MockObject $eventDisciplineResultRepository;

    private EventResultVoter $voter;

    protected function setUp(): void
    {
        $this->eventDisciplineResultRepository = $this->createMock(EventDisciplineResultRepository::class);
        $this->voter = new EventResultVoter($this->eventDisciplineResultRepository);
    }

    final public function testGrantsCreatorOfTheEvent(): void
    {
        $organizer = self::user(RoleEnum::Organizer);
        $result = $this->resultOfEventCreatedBy($organizer);
        $this->givenResult($result);

        $this->assertGranted($this->voter, self::reloaded($organizer), self::idOf($result), EventResultVoter::EVENT_RESULT);
    }

    final public function testDeniesOtherUser(): void
    {
        $result = $this->resultOfEventCreatedBy(self::user(RoleEnum::Organizer));
        $this->givenResult($result);

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Organizer),
            self::idOf($result),
            EventResultVoter::EVENT_RESULT,
        );
    }

    final public function testDeniesUserWhoSubmittedTheResult(): void
    {
        $athlete = self::user(RoleEnum::Participant);
        $result = $this->resultOfEventCreatedBy(self::user(RoleEnum::Organizer), $athlete);
        $this->givenResult($result);

        $this->assertDenied($this->voter, self::reloaded($athlete), self::idOf($result), EventResultVoter::EVENT_RESULT);
    }

    final public function testDeniesAdministratorWhoDidNotCreateTheEvent(): void
    {
        $result = $this->resultOfEventCreatedBy(self::user(RoleEnum::Organizer));
        $this->givenResult($result);

        $this->assertDenied($this->voter, self::admin(), self::idOf($result), EventResultVoter::EVENT_RESULT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->eventDisciplineResultRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Organizer), $subject, EventResultVoter::EVENT_RESULT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->eventDisciplineResultRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), EventResultVoter::EVENT_RESULT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, EventResultVoter::EVENT_RESULT);
    }

    final public function testPropagatesMissingResult(): void
    {
        $this->eventDisciplineResultRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Organizer)), Uuid::v7(), [EventResultVoter::EVENT_RESULT]);
    }

    private function resultOfEventCreatedBy(User $organizer, ?User $athlete = null): EventDisciplineResult
    {
        $event = EventFactory::make([
            'pageParticipant' => PageParticipantFactory::make(['user' => $organizer]),
        ]);
        $list = EventDisciplineListFactory::make([
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make([
                'eventDiscipline' => EventDisciplineFactory::make(['event' => $event]),
            ]),
        ]);

        $result = EventDisciplineResultFactory::make([
            'eventDisciplineList' => $list,
            'user' => $athlete ?? self::user(RoleEnum::Participant),
        ]);
        $result->id = Uuid::v7();

        return $result;
    }

    private function givenResult(EventDisciplineResult $result): void
    {
        $this->eventDisciplineResultRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($result->id)))
            ->willReturn($result);
    }
}

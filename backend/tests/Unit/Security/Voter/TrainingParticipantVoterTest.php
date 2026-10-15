<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{TrainingParticipant, User};
use App\Enum\RoleEnum;
use App\Repository\TrainingParticipantRepository;
use App\Security\Voter\TrainingParticipantVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\TrainingParticipantFactory;

class TrainingParticipantVoterTest extends VoterTestCase
{
    private TrainingParticipantRepository&MockObject $trainingParticipantRepository;

    private TrainingParticipantVoter $voter;

    protected function setUp(): void
    {
        $this->trainingParticipantRepository = $this->createMock(TrainingParticipantRepository::class);
        $this->voter = new TrainingParticipantVoter($this->trainingParticipantRepository);
    }

    final public function testGrantsParticipantUser(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $trainingParticipant = $this->trainingParticipantOwnedBy($owner);
        $this->givenTrainingParticipant($trainingParticipant);

        $this->assertGranted($this->voter, $owner, self::idOf($trainingParticipant), TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    final public function testDeniesOtherUser(): void
    {
        $trainingParticipant = $this->trainingParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenTrainingParticipant($trainingParticipant);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($trainingParticipant), TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $trainingParticipant = $this->trainingParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenTrainingParticipant($trainingParticipant);

        $this->assertDenied($this->voter, self::admin(), self::idOf($trainingParticipant), TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->trainingParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->trainingParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->trainingParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, TrainingParticipantVoter::TRAINING_PARTICIPANT);
    }

    final public function testPropagatesMissingTrainingParticipant(): void
    {
        $this->trainingParticipantRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [TrainingParticipantVoter::TRAINING_PARTICIPANT]);
    }

    private function trainingParticipantOwnedBy(User $owner): TrainingParticipant
    {
        $trainingParticipant = TrainingParticipantFactory::make(['user' => $owner]);
        $trainingParticipant->id = Uuid::v7();

        return $trainingParticipant;
    }

    private function givenTrainingParticipant(TrainingParticipant $trainingParticipant): void
    {
        $this->trainingParticipantRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($trainingParticipant->id)))
            ->willReturn($trainingParticipant);
    }
}

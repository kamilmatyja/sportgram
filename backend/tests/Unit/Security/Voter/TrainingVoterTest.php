<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Training, User};
use App\Enum\RoleEnum;
use App\Repository\TrainingRepository;
use App\Security\Voter\TrainingVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\TrainingFactory;

class TrainingVoterTest extends VoterTestCase
{
    private TrainingRepository&MockObject $trainingRepository;

    private TrainingVoter $voter;

    protected function setUp(): void
    {
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->voter = new TrainingVoter($this->trainingRepository);
    }

    final public function testGrantsTrainingOwner(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $training = $this->trainingOwnedBy($owner);
        $this->givenTraining($training);

        $this->assertGranted($this->voter, self::reloaded($owner), self::idOf($training), TrainingVoter::TRAINING);
    }

    final public function testDeniesOtherUser(): void
    {
        $training = $this->trainingOwnedBy(self::user(RoleEnum::Participant));
        $this->givenTraining($training);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($training), TrainingVoter::TRAINING);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v7(), TrainingVoter::TRAINING);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', TrainingVoter::TRAINING);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, TrainingVoter::TRAINING);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), TrainingVoter::TRAINING);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, TrainingVoter::TRAINING);
    }

    final public function testPropagatesMissingTraining(): void
    {
        $this->trainingRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [TrainingVoter::TRAINING]);
    }

    private function trainingOwnedBy(User $owner): Training
    {
        $training = TrainingFactory::make(['user' => $owner]);
        $training->id = Uuid::v7();

        return $training;
    }

    private function givenTraining(Training $training): void
    {
        $this->trainingRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($training->id)))
            ->willReturn($training);
    }
}

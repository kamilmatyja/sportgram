<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Training, User};
use App\Enum\RoleEnum;
use App\Repository\TrainingRepository;
use App\Security\Voter\TrainingCreatorVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\TrainingFactory;

class TrainingCreatorVoterTest extends VoterTestCase
{
    private TrainingRepository&MockObject $trainingRepository;

    private TrainingCreatorVoter $voter;

    protected function setUp(): void
    {
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->voter = new TrainingCreatorVoter($this->trainingRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsTrainingAuthor(RoleEnum $role): void
    {
        $owner = self::user($role);
        $training = $this->trainingOwnedBy($owner);
        $this->givenTraining($training);

        $this->assertGranted($this->voter, $owner, self::idOf($training), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $training = $this->trainingOwnedBy($owner);
        $this->givenTraining($training);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($training), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    final public function testDeniesOtherUser(): void
    {
        $training = $this->trainingOwnedBy(self::user(RoleEnum::Participant));
        $this->givenTraining($training);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($training), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $training = $this->trainingOwnedBy(self::user(RoleEnum::Participant));
        $this->givenTraining($training);

        $this->assertDenied($this->voter, self::admin(), self::idOf($training), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $training = $this->trainingOwnedBy($owner);
        $this->givenTraining($training);

        $this->assertGranted($this->voter, $owner, self::idOf($training), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, TrainingCreatorVoter::TRAINING_CREATOR);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->trainingRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), TrainingCreatorVoter::TRAINING_CREATOR);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, TrainingCreatorVoter::TRAINING_CREATOR);
    }

    final public function testPropagatesMissingTraining(): void
    {
        $this->trainingRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [TrainingCreatorVoter::TRAINING_CREATOR]);
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

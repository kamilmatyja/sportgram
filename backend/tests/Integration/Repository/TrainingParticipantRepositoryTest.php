<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\TrainingParticipant;
use App\Enum\SaveStatusEnum;
use App\Repository\TrainingParticipantRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory, UserFactory};

class TrainingParticipantRepositoryTest extends RepositoryTestCase
{
    private TrainingParticipantRepository $trainingParticipantRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_participants', 'trainings', 'feeds', 'users');
        $this->trainingParticipantRepository = $this->repository(TrainingParticipantRepository::class);
    }

    final public function testSavePersistsTrainingParticipant(): void
    {
        $training = TrainingFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $participant = TrainingParticipantFactory::make([
            'training' => $training,
            'user' => $user,
            'status' => SaveStatusEnum::Pending,
        ]);

        $this->trainingParticipantRepository->save($participant);
        $this->clear();

        $found = $this->trainingParticipantRepository->findById(self::id($participant));
        $this->assertSame(SaveStatusEnum::Pending, $found->status);
        $this->assertTrue($found->training->id->equals($training->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingTrainingParticipant(): void
    {
        $participant = $this->participant(SaveStatusEnum::Pending);

        $participant->status = SaveStatusEnum::Accepted;
        $this->trainingParticipantRepository->save($participant);
        $this->clear();

        $this->assertSame(SaveStatusEnum::Accepted, $this->trainingParticipantRepository->findById(self::id($participant))->status);
    }

    final public function testDeleteRemovesTrainingParticipant(): void
    {
        $participant = $this->participant();
        $other = $this->participant();
        $id = self::id($participant);

        $this->trainingParticipantRepository->delete($participant);
        $this->clear();

        $this->assertNull($this->trainingParticipantRepository->find($id));
        $this->assertNotNull($this->trainingParticipantRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsMatchingParticipant(): void
    {
        $this->participant();
        $participant = $this->participant();
        $this->clear();

        $this->assertTrue($this->trainingParticipantRepository->findById(self::id($participant))->id->equals($participant->id));
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->trainingParticipantRepository->findById(Uuid::v4());
    }

    private function participant(?SaveStatusEnum $status = null): TrainingParticipant
    {
        return TrainingParticipantFactory::make(array_filter(['status' => $status]), $this->em);
    }
}

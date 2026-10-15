<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\TrainingDiscipline;
use App\Enum\DisciplineEnum;
use App\Repository\TrainingDisciplineRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{TrainingDisciplineFactory, TrainingFactory};

class TrainingDisciplineRepositoryTest extends RepositoryTestCase
{
    private TrainingDisciplineRepository $trainingDisciplineRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_disciplines', 'trainings', 'feeds', 'users');
        $this->trainingDisciplineRepository = $this->repository(TrainingDisciplineRepository::class);
    }

    final public function testSavePersistsTrainingDiscipline(): void
    {
        $training = TrainingFactory::make(em: $this->em);
        $discipline = TrainingDisciplineFactory::make(['training' => $training, 'discipline' => DisciplineEnum::Swimming]);

        $this->trainingDisciplineRepository->save($discipline);
        $this->clear();

        $found = $this->trainingDisciplineRepository->find(self::id($discipline));
        $this->assertNotNull($found);
        $this->assertTrue($found->training->id->equals($training->id));
        $this->assertSame(DisciplineEnum::Swimming, $found->discipline);
        $this->assertNotNull($found->createdAt);
        $this->assertCount(0, $found->distances);
    }

    final public function testSavedDisciplineIsVisibleFromTraining(): void
    {
        $training = TrainingFactory::make(em: $this->em);
        $discipline = TrainingDisciplineFactory::make(['training' => $training]);

        $this->trainingDisciplineRepository->save($discipline);
        $this->clear();

        $found = $this->trainingDisciplineRepository->find(self::id($discipline));
        $this->assertSame([(string) $discipline->id], self::ids($found->training->disciplines));
    }

    final public function testSaveUpdatesExistingTrainingDiscipline(): void
    {
        $discipline = $this->discipline(DisciplineEnum::Running);

        $discipline->discipline = DisciplineEnum::Cycling;
        $this->trainingDisciplineRepository->save($discipline);
        $this->clear();

        $this->assertSame(DisciplineEnum::Cycling, $this->trainingDisciplineRepository->find(self::id($discipline))?->discipline);
        $this->assertSame(1, $this->trainingDisciplineRepository->count());
    }

    final public function testDeleteRemovesTrainingDiscipline(): void
    {
        $discipline = $this->discipline();
        $other = $this->discipline();
        $id = self::id($discipline);

        $this->trainingDisciplineRepository->delete($discipline);
        $this->clear();

        $this->assertNull($this->trainingDisciplineRepository->find($id));
        $this->assertNotNull($this->trainingDisciplineRepository->find(self::id($other)));
    }

    final public function testFindOrFailReturnsTrainingDiscipline(): void
    {
        $discipline = $this->discipline();
        $this->discipline();
        $this->clear();

        $this->assertSame((string) $discipline->id, (string) $this->trainingDisciplineRepository->findOrFail(self::id($discipline))->id);
    }

    final public function testFindOrFailThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->trainingDisciplineRepository->findOrFail(Uuid::v7());
    }

    private function discipline(?DisciplineEnum $discipline = null): TrainingDiscipline
    {
        return TrainingDisciplineFactory::make(array_filter(['discipline' => $discipline]), $this->em);
    }
}

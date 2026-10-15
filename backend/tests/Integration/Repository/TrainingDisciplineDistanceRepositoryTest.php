<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\TrainingDisciplineDistance;
use App\Repository\TrainingDisciplineDistanceRepository;
use Tests\Factory\{TrainingDisciplineDistanceFactory, TrainingDisciplineFactory};

class TrainingDisciplineDistanceRepositoryTest extends RepositoryTestCase
{
    private TrainingDisciplineDistanceRepository $trainingDisciplineDistanceRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_discipline_distances', 'training_disciplines', 'trainings', 'feeds', 'users');
        $this->trainingDisciplineDistanceRepository = $this->repository(TrainingDisciplineDistanceRepository::class);
    }

    final public function testSavePersistsTrainingDisciplineDistance(): void
    {
        $discipline = TrainingDisciplineFactory::make(em: $this->em);
        $distance = TrainingDisciplineDistanceFactory::make([
            'trainingDiscipline' => $discipline,
            'distance' => 5000,
            'time' => 1500,
        ]);

        $this->trainingDisciplineDistanceRepository->save($distance);
        $this->clear();

        $found = $this->trainingDisciplineDistanceRepository->find(self::id($distance));
        $this->assertInstanceOf(TrainingDisciplineDistance::class, $found);
        $this->assertSame(5000, $found->distance);
        $this->assertSame(1500, $found->time);
        $this->assertTrue($found->trainingDiscipline->id->equals($discipline->id));
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingTrainingDisciplineDistance(): void
    {
        $distance = $this->distance();

        $distance->distance = 10000;
        $distance->time = 3600;
        $this->trainingDisciplineDistanceRepository->save($distance);
        $this->clear();

        $found = $this->trainingDisciplineDistanceRepository->find(self::id($distance));
        $this->assertSame(10000, $found->distance);
        $this->assertSame(3600, $found->time);
    }

    final public function testDeleteRemovesTrainingDisciplineDistance(): void
    {
        $distance = $this->distance();
        $other = $this->distance();
        $id = self::id($distance);

        $this->trainingDisciplineDistanceRepository->delete($distance);
        $this->clear();

        $this->assertNull($this->trainingDisciplineDistanceRepository->find($id));
        $this->assertNotNull($this->trainingDisciplineDistanceRepository->find(self::id($other)));
    }

    private function distance(): TrainingDisciplineDistance
    {
        return TrainingDisciplineDistanceFactory::make(em: $this->em);
    }
}

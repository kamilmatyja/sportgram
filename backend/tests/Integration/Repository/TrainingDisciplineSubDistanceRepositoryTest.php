<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\TrainingDisciplineSubDistance;
use App\Repository\TrainingDisciplineSubDistanceRepository;
use Tests\Factory\{TrainingDisciplineDistanceFactory, TrainingDisciplineSubDistanceFactory};

class TrainingDisciplineSubDistanceRepositoryTest extends RepositoryTestCase
{
    private TrainingDisciplineSubDistanceRepository $trainingDisciplineSubDistanceRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate(
            'training_discipline_sub_distances',
            'training_discipline_distances',
            'training_disciplines',
            'trainings',
            'feeds',
            'users',
        );
        $this->trainingDisciplineSubDistanceRepository = $this->repository(TrainingDisciplineSubDistanceRepository::class);
    }

    final public function testSavePersistsTrainingDisciplineSubDistance(): void
    {
        $distance = TrainingDisciplineDistanceFactory::make(em: $this->em);
        $subDistance = TrainingDisciplineSubDistanceFactory::make([
            'trainingDisciplineDistance' => $distance,
            'subDistance' => 1000,
            'time' => 300,
            'lat' => 52229676,
            'lng' => 21012229,
            'accuracy' => 5,
            'speed' => 12,
        ]);

        $this->trainingDisciplineSubDistanceRepository->save($subDistance);
        $this->clear();

        $found = $this->trainingDisciplineSubDistanceRepository->find(self::id($subDistance));
        $this->assertInstanceOf(TrainingDisciplineSubDistance::class, $found);
        $this->assertTrue($found->trainingDisciplineDistance->id->equals($distance->id));
        $this->assertSame(1000, $found->subDistance);
        $this->assertSame(300, $found->time);
        $this->assertSame(52229676, $found->lat);
        $this->assertSame(21012229, $found->lng);
        $this->assertSame(5, $found->accuracy);
        $this->assertSame(12, $found->speed);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSavePersistsNullableColumnsAsNull(): void
    {
        $subDistance = TrainingDisciplineSubDistanceFactory::make([
            'lat' => null,
            'lng' => null,
            'accuracy' => null,
            'speed' => null,
        ]);

        $this->trainingDisciplineSubDistanceRepository->save($subDistance);
        $this->clear();

        $found = $this->trainingDisciplineSubDistanceRepository->find(self::id($subDistance));
        $this->assertNull($found->lat);
        $this->assertNull($found->lng);
        $this->assertNull($found->accuracy);
        $this->assertNull($found->speed);
    }

    final public function testSaveUpdatesExistingTrainingDisciplineSubDistance(): void
    {
        $subDistance = TrainingDisciplineSubDistanceFactory::make(['subDistance' => 100, 'time' => 10], $this->em);

        $subDistance->subDistance = 200;
        $subDistance->time = 20;
        $this->trainingDisciplineSubDistanceRepository->save($subDistance);
        $this->clear();

        $found = $this->trainingDisciplineSubDistanceRepository->find(self::id($subDistance));
        $this->assertSame(200, $found->subDistance);
        $this->assertSame(20, $found->time);
    }

    final public function testDeleteRemovesTrainingDisciplineSubDistance(): void
    {
        $subDistance = TrainingDisciplineSubDistanceFactory::make(em: $this->em);
        $kept = TrainingDisciplineSubDistanceFactory::make(em: $this->em);
        $id = self::id($subDistance);

        $this->trainingDisciplineSubDistanceRepository->delete($subDistance);
        $this->clear();

        $this->assertNull($this->trainingDisciplineSubDistanceRepository->find($id));
        $this->assertNotNull($this->trainingDisciplineSubDistanceRepository->find(self::id($kept)));
    }
}

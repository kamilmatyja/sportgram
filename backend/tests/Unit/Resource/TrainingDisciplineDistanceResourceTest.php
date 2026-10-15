<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\TrainingDisciplineDistance;
use App\Resource\{TrainingDisciplineDistanceResource, TrainingDisciplineSubDistanceResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{TrainingDisciplineDistanceFactory, TrainingDisciplineFactory, TrainingDisciplineSubDistanceFactory};

class TrainingDisciplineDistanceResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $distance = $this->distance();

        $data = TrainingDisciplineDistanceResource::fromEntity($distance, new TrainingDetailsQueryDto());

        $this->assertSame([
            'id' => $distance->id,
            'trainingDisciplineId' => $distance->trainingDiscipline->id,
            'createdAt' => self::formatDate($distance->createdAt),
            'updatedAt' => self::formatDate($distance->updatedAt),
            'distance' => $distance->distance,
            'time' => $distance->time,
        ], $data);
        $this->assertMatchesSchema(TrainingDisciplineDistanceResource::class, $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesSubDistances(array $include, bool $subDistances): void
    {
        $distance = $this->distanceWithSubDistances();
        $dto = new TrainingDetailsQueryDto();
        $dto->include = $include;

        $data = TrainingDisciplineDistanceResource::fromEntity($distance, $dto);

        if ($subDistances) {
            $this->assertSame(
                array_map(TrainingDisciplineSubDistanceResource::fromEntity(...), $distance->subDistances->toArray()),
                $data['subDistances'],
            );
        } else {
            $this->assertArrayNotHasKey('subDistances', $data);
        }

        $this->assertMatchesSchema(TrainingDisciplineDistanceResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'empty' => [[], false];
        yield 'disciplines' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINES], true];
        yield 'distances' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES], false];
        yield 'sub distances' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_SUB_DISTANCES], false];
        yield 'participants' => [[TrainingDetailsQueryDto::TRAINING_PARTICIPANTS], false];
        yield 'all' => [
            [
                TrainingDetailsQueryDto::TRAINING_DISCIPLINES,
                TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES,
                TrainingDetailsQueryDto::TRAINING_DISCIPLINE_SUB_DISTANCES,
                TrainingDetailsQueryDto::TRAINING_PARTICIPANTS,
            ],
            true,
        ];
    }

    final public function testIncludedSubDistancesMayBeEmpty(): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = [TrainingDetailsQueryDto::TRAINING_DISCIPLINES];

        $data = TrainingDisciplineDistanceResource::fromEntity($this->distance(), $dto);

        $this->assertSame([], $data['subDistances']);
    }

    private function distance(): TrainingDisciplineDistance
    {
        return self::persisted(TrainingDisciplineDistanceFactory::make([
            'trainingDiscipline' => self::persisted(TrainingDisciplineFactory::make()),
        ]));
    }

    private function distanceWithSubDistances(): TrainingDisciplineDistance
    {
        $distance = $this->distance();
        $distance->subDistances->add(self::persisted(TrainingDisciplineSubDistanceFactory::make([
            'trainingDisciplineDistance' => $distance,
        ])));
        $distance->subDistances->add(self::persisted(TrainingDisciplineSubDistanceFactory::make([
            'trainingDisciplineDistance' => $distance,
        ])));

        return $distance;
    }
}

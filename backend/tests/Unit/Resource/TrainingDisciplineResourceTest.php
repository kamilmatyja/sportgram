<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\TrainingDiscipline;
use App\Resource\{TrainingDisciplineDistanceResource, TrainingDisciplineResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{
    TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingDisciplineSubDistanceFactory,
    TrainingFactory,
};

class TrainingDisciplineResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $discipline = $this->discipline();

        $data = TrainingDisciplineResource::fromEntity($discipline, new TrainingDetailsQueryDto());

        $this->assertSame([
            'id' => $discipline->id,
            'trainingId' => $discipline->training->id,
            'createdAt' => self::formatDate($discipline->createdAt),
            'updatedAt' => self::formatDate($discipline->updatedAt),
            'discipline' => $discipline->discipline,
        ], $data);
        $this->assertMatchesSchema(TrainingDisciplineResource::class, $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $distances): void
    {
        $discipline = $this->disciplineWithRelations();
        $dto = new TrainingDetailsQueryDto();
        $dto->include = $include;

        $data = TrainingDisciplineResource::fromEntity($discipline, $dto);

        if ($distances) {
            $this->assertSame(
                array_map(
                    static fn ($distance): array => TrainingDisciplineDistanceResource::fromEntity($distance, $dto),
                    $discipline->distances->toArray(),
                ),
                $data['distances'],
            );
            $this->assertCount(2, $data['distances']);
        } else {
            $this->assertArrayNotHasKey('distances', $data);
        }

        $this->assertMatchesSchema(TrainingDisciplineResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'none' => [[], false];
        yield 'distances' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES], true];
        yield 'other includes only' => [
            [
                TrainingDetailsQueryDto::TRAINING_DISCIPLINES,
                TrainingDetailsQueryDto::TRAINING_DISCIPLINE_SUB_DISTANCES,
                TrainingDetailsQueryDto::TRAINING_PARTICIPANTS,
            ],
            false,
        ];
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

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = [TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES];

        $this->assertSame([], TrainingDisciplineResource::fromEntity($this->discipline(), $dto)['distances']);
    }

    private function discipline(): TrainingDiscipline
    {
        return self::persisted(TrainingDisciplineFactory::make(['training' => self::persisted(TrainingFactory::make())]));
    }

    private function disciplineWithRelations(): TrainingDiscipline
    {
        $discipline = $this->discipline();

        foreach ([1, 2] as $ignored) {
            $distance = self::persisted(TrainingDisciplineDistanceFactory::make(['trainingDiscipline' => $discipline]));
            $distance->subDistances->add(
                self::persisted(TrainingDisciplineSubDistanceFactory::make(['trainingDisciplineDistance' => $distance])),
            );
            $discipline->distances->add($distance);
        }

        return $discipline;
    }
}

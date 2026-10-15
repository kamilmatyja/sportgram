<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\Training;
use App\Resource\{TrainingDisciplineResource, TrainingParticipantResource, TrainingResource};
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{
    FeedFactory,
    TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingFactory,
    TrainingParticipantFactory,
    UserFactory,
};

class TrainingResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $training = $this->training();

        $data = TrainingResource::fromEntity($training);

        $this->assertSame([
            'id' => $training->id,
            'feedId' => $training->feed->id,
            'userId' => $training->user->id,
            'createdAt' => self::formatDate($training->createdAt),
            'updatedAt' => self::formatDate($training->updatedAt),
            'startedAt' => self::formatDate($training->startedAt),
            'endedAt' => self::formatDate($training->endedAt),
            'title' => $training->title,
            'description' => $training->description,
            'link' => $training->link,
            'location' => $training->location,
            'status' => $training->status,
        ], $data);
        $this->assertMatchesSchema(TrainingResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = TrainingResource::fromEntity($this->trainingWithRelations(), new TrainingDetailsQueryDto());

        $this->assertArrayNotHasKey('disciplines', $data);
        $this->assertArrayNotHasKey('participants', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(
        array $include,
        bool $disciplines,
        bool $distances,
        bool $participants,
    ): void {
        $training = $this->trainingWithRelations();
        $dto = new TrainingDetailsQueryDto();
        $dto->include = $include;

        $data = TrainingResource::fromEntity($training, $dto);

        if ($disciplines) {
            $this->assertSame(
                array_map(
                    static fn ($discipline): array => TrainingDisciplineResource::fromEntity($discipline, $dto),
                    $training->disciplines->toArray(),
                ),
                $data['disciplines'],
            );
            $this->assertCount(2, $data['disciplines']);
            $this->assertSame($distances, array_key_exists('distances', $data['disciplines'][0]));
        } else {
            $this->assertArrayNotHasKey('disciplines', $data);
        }

        if ($participants) {
            $this->assertSame(
                array_map(TrainingParticipantResource::fromEntity(...), $training->participants->toArray()),
                $data['participants'],
            );
            $this->assertCount(1, $data['participants']);
        } else {
            $this->assertArrayNotHasKey('participants', $data);
        }

        $this->assertMatchesSchema(TrainingResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'disciplines' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINES], true, false, false];
        yield 'participants' => [[TrainingDetailsQueryDto::TRAINING_PARTICIPANTS], false, false, true];
        yield 'distances only' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES], false, false, false];
        yield 'disciplines with distances' => [
            [TrainingDetailsQueryDto::TRAINING_DISCIPLINES, TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES],
            true,
            true,
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
            true,
            true,
        ];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = [TrainingDetailsQueryDto::TRAINING_DISCIPLINES, TrainingDetailsQueryDto::TRAINING_PARTICIPANTS];

        $data = TrainingResource::fromEntity($this->training(), $dto);

        $this->assertSame([], $data['disciplines']);
        $this->assertSame([], $data['participants']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $trainings = [$this->training(), $this->training()];

        $data = TrainingResource::fromEntityCollection($trainings);

        $this->assertSame(
            [TrainingResource::fromEntity($trainings[0]), TrainingResource::fromEntity($trainings[1])],
            $data,
        );
        $this->assertSame([], TrainingResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = [TrainingDetailsQueryDto::TRAINING_PARTICIPANTS];
        $trainings = [$this->trainingWithRelations(), $this->trainingWithRelations()];

        $data = TrainingResource::fromEntityCollection($trainings, $dto);

        $this->assertSame(
            [TrainingResource::fromEntity($trainings[0], $dto), TrainingResource::fromEntity($trainings[1], $dto)],
            $data,
        );
        $this->assertArrayHasKey('participants', $data[1]);
    }

    private function training(): Training
    {
        $training = self::persisted(TrainingFactory::make([
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));
        $training->disciplines = new ArrayCollection();

        return $training;
    }

    private function trainingWithRelations(): Training
    {
        $training = $this->training();

        foreach ([1, 2] as $ignored) {
            $discipline = self::persisted(TrainingDisciplineFactory::make(['training' => $training]));
            $discipline->distances->add(
                self::persisted(TrainingDisciplineDistanceFactory::make(['trainingDiscipline' => $discipline])),
            );
            $training->disciplines->add($discipline);
        }

        $training->participants->add(self::persisted(TrainingParticipantFactory::make([
            'training' => $training,
            'user' => self::persisted(UserFactory::make()),
        ])));

        return $training;
    }
}

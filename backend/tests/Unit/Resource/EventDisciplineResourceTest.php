<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\EventDiscipline;
use App\Resource\{EventDisciplineDistanceResource, EventDisciplineResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineSubDistanceFactory, EventFactory};

class EventDisciplineResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $discipline = $this->discipline();

        $data = EventDisciplineResource::fromEntity($discipline);

        $this->assertSame([
            'id' => $discipline->id,
            'eventId' => $discipline->event->id,
            'createdAt' => self::formatDate($discipline->createdAt),
            'updatedAt' => self::formatDate($discipline->updatedAt),
            'discipline' => $discipline->discipline,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $this->assertArrayNotHasKey(
            'distances',
            EventDisciplineResource::fromEntity($this->disciplineWithRelations(), new EventDetailsQueryDto()),
        );
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $distances, bool $subDistances): void
    {
        $discipline = $this->disciplineWithRelations();
        $dto = new EventDetailsQueryDto();
        $dto->include = $include;

        $data = EventDisciplineResource::fromEntity($discipline, $dto);

        if ($distances) {
            $this->assertSame(
                array_map(
                    static fn ($distance): array => EventDisciplineDistanceResource::fromEntity($distance, $dto),
                    $discipline->distances->toArray(),
                ),
                $data['distances'],
            );
            $this->assertCount(2, $data['distances']);
            $this->assertSame($subDistances, array_key_exists('subDistances', $data['distances'][0]));
        } else {
            $this->assertArrayNotHasKey('distances', $data);
        }

        $this->assertMatchesSchema(EventDisciplineResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'distances' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES], true, false];
        yield 'disciplines only' => [[EventDetailsQueryDto::EVENT_DISCIPLINES], false, false];
        yield 'sub distances only' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES], false, false];
        yield 'distances with sub distances' => [
            [EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES, EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES],
            true,
            true,
        ];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = [EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES];

        $this->assertSame([], EventDisciplineResource::fromEntity($this->discipline(), $dto)['distances']);
    }

    private function discipline(): EventDiscipline
    {
        return self::persisted(EventDisciplineFactory::make(['event' => self::persisted(EventFactory::make())]));
    }

    private function disciplineWithRelations(): EventDiscipline
    {
        $discipline = $this->discipline();

        foreach ([1, 2] as $ignored) {
            $distance = self::persisted(EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline]));
            $distance->subDistances->add(
                self::persisted(EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance])),
            );
            $discipline->distances->add($distance);
        }

        return $discipline;
    }
}

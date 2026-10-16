<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\EventDisciplineDistance;
use App\Resource\{EventDisciplineDistanceResource, EventDisciplineSubDistanceResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineSubDistanceFactory};

class EventDisciplineDistanceResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $distance = $this->distance();

        $data = EventDisciplineDistanceResource::fromEntity($distance);

        $this->assertSame([
            'id' => $distance->id,
            'eventDisciplineId' => $distance->eventDiscipline->id,
            'createdAt' => self::formatDate($distance->createdAt),
            'updatedAt' => self::formatDate($distance->updatedAt),
            'distance' => $distance->distance,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineDistanceResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $this->assertArrayNotHasKey(
            'subDistances',
            EventDisciplineDistanceResource::fromEntity($this->distanceWithRelations(), new EventDetailsQueryDto()),
        );
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $subDistances): void
    {
        $distance = $this->distanceWithRelations();
        $dto = new EventDetailsQueryDto();
        $dto->include = $include;

        $data = EventDisciplineDistanceResource::fromEntity($distance, $dto);

        if ($subDistances) {
            $this->assertSame(
                array_map(EventDisciplineSubDistanceResource::fromEntity(...), $distance->subDistances->toArray()),
                $data['subDistances'],
            );
            $this->assertCount(2, $data['subDistances']);
        } else {
            $this->assertArrayNotHasKey('subDistances', $data);
        }

        $this->assertMatchesSchema(EventDisciplineDistanceResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'sub distances' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES], true];
        yield 'other includes only' => [
            [EventDetailsQueryDto::EVENT_DISCIPLINES, EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES],
            false,
        ];
        yield 'all' => [
            [
                EventDetailsQueryDto::EVENT_DISCIPLINES,
                EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES,
                EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES,
            ],
            true,
        ];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = [EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES];

        $this->assertSame([], EventDisciplineDistanceResource::fromEntity($this->distance(), $dto)['subDistances']);
    }

    private function distance(): EventDisciplineDistance
    {
        return self::persisted(EventDisciplineDistanceFactory::make([
            'eventDiscipline' => self::persisted(EventDisciplineFactory::make()),
        ]));
    }

    private function distanceWithRelations(): EventDisciplineDistance
    {
        $distance = $this->distance();
        $distance->subDistances->add(
            self::persisted(EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance])),
        );
        $distance->subDistances->add(
            self::persisted(EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance])),
        );

        return $distance;
    }
}

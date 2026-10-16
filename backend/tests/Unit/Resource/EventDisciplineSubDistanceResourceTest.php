<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\EventDisciplineSubDistanceResource;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineSubDistanceFactory};

class EventDisciplineSubDistanceResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $subDistance = self::persisted(EventDisciplineSubDistanceFactory::make([
            'eventDisciplineDistance' => self::persisted(EventDisciplineDistanceFactory::make()),
        ]));

        $data = EventDisciplineSubDistanceResource::fromEntity($subDistance);

        $this->assertSame([
            'id' => $subDistance->id,
            'eventDisciplineDistanceId' => $subDistance->eventDisciplineDistance->id,
            'createdAt' => self::formatDate($subDistance->createdAt),
            'updatedAt' => self::formatDate($subDistance->updatedAt),
            'subDistance' => $subDistance->subDistance,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineSubDistanceResource::class, $data);
    }
}

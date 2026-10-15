<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\EventDisciplineDistanceSubResultResource;
use Tests\Factory\{EventDisciplineResultFactory, EventDisciplineSubDistanceFactory, EventDisciplineSubResultFactory, UserFactory};

class EventDisciplineDistanceSubResultResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $subResult = self::persisted(EventDisciplineSubResultFactory::make([
            'eventDisciplineSubDistance' => self::persisted(EventDisciplineSubDistanceFactory::make()),
            'eventDisciplineResult' => self::persisted(EventDisciplineResultFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));

        $data = EventDisciplineDistanceSubResultResource::fromEntity($subResult);

        $this->assertSame([
            'id' => $subResult->id,
            'eventDisciplineSubDistanceId' => $subResult->eventDisciplineSubDistance->id,
            'eventDisciplineResultId' => $subResult->eventDisciplineResult->id,
            'userId' => $subResult->user->id,
            'createdAt' => self::formatDate($subResult->createdAt),
            'updatedAt' => self::formatDate($subResult->updatedAt),
            'time' => $subResult->time,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineDistanceSubResultResource::class, $data);
    }
}

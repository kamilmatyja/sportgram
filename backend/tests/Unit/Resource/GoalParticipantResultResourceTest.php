<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\GoalParticipantResultResource;
use Tests\Factory\{FeedFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalParticipantResultResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $result = self::persisted(GoalParticipantResultFactory::make([
            'goalParticipant' => self::persisted(GoalParticipantFactory::make()),
            'feed' => self::persisted(FeedFactory::make()),
        ]));

        $data = GoalParticipantResultResource::fromEntity($result);

        $this->assertSame([
            'id' => $result->id,
            'goalParticipantId' => $result->goalParticipant->id,
            'feedId' => $result->feed->id,
            'createdAt' => self::formatDate($result->createdAt),
            'updatedAt' => self::formatDate($result->updatedAt),
            'distance' => $result->distance,
            'time' => $result->time,
            'status' => $result->status,
        ], $data);
        $this->assertMatchesSchema(GoalParticipantResultResource::class, $data);
    }
}

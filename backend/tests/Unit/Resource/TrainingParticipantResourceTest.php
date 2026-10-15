<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\TrainingParticipantResource;
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory, UserFactory};

class TrainingParticipantResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $participant = self::persisted(TrainingParticipantFactory::make([
            'training' => self::persisted(TrainingFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));

        $data = TrainingParticipantResource::fromEntity($participant);

        $this->assertSame([
            'id' => $participant->id,
            'trainingId' => $participant->training->id,
            'userId' => $participant->user->id,
            'createdAt' => self::formatDate($participant->createdAt),
            'updatedAt' => self::formatDate($participant->updatedAt),
            'status' => $participant->status,
        ], $data);
        $this->assertMatchesSchema(TrainingParticipantResource::class, $data);
    }
}

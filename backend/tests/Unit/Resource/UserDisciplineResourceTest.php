<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\UserDisciplineResource;
use Tests\Factory\{UserDisciplineFactory, UserFactory};

class UserDisciplineResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $discipline = self::persisted(UserDisciplineFactory::make(['user' => self::persisted(UserFactory::make())]));

        $data = UserDisciplineResource::fromEntity($discipline);

        $this->assertSame([
            'id' => $discipline->id,
            'userId' => $discipline->user->id,
            'createdAt' => self::formatDate($discipline->createdAt),
            'updatedAt' => self::formatDate($discipline->updatedAt),
            'discipline' => $discipline->discipline,
        ], $data);
        $this->assertMatchesSchema(UserDisciplineResource::class, $data);
    }
}

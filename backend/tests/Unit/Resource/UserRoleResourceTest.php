<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\UserRoleResource;
use Tests\Factory\{UserFactory, UserRoleFactory};

class UserRoleResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $role = self::persisted(UserRoleFactory::make(['user' => self::persisted(UserFactory::make())]));

        $data = UserRoleResource::fromEntity($role);

        $this->assertSame([
            'id' => $role->id,
            'userId' => $role->user->id,
            'createdAt' => self::formatDate($role->createdAt),
            'updatedAt' => self::formatDate($role->updatedAt),
            'role' => $role->role,
        ], $data);
        $this->assertMatchesSchema(UserRoleResource::class, $data);
    }
}

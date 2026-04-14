<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\User;
use App\Entity\UserRole;
use App\Enum\RoleEnum;
use PHPUnit\Framework\TestCase;

class UserRoleTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $role = RoleEnum::Administrator;
        $entity = new UserRole($user, $role);
        $this->assertInstanceOf(UserRole::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($role, $entity->getRole());
    }
}


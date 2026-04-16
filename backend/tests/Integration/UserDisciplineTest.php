<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{User, UserDiscipline};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\TestCase;

class UserDisciplineTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $discipline = DisciplineEnum::Running;
        $entity = new UserDiscipline($user, $discipline);
        $this->assertInstanceOf(UserDiscipline::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($discipline, $entity->discipline);
    }
}

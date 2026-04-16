<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Entry, User};
use App\Enum\EntryTypeEnum;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;

class EntryTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $entityId = Uuid::v4();
        $type = EntryTypeEnum::User;
        $entity = new Entry($user, $entityId, $type);
        $this->assertInstanceOf(Entry::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($entityId, $entity->entityId);
        $this->assertSame($type, $entity->type);
    }
}

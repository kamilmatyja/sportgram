<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Notification;
use App\Entity\User;
use App\Enum\NotificationStatusEnum;
use PHPUnit\Framework\TestCase;

class NotificationTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $text = 'Notification message';
        $status = NotificationStatusEnum::Read;
        $entity = new Notification($user, $text, $status);
        $this->assertInstanceOf(Notification::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($text, $entity->getText());
        $this->assertSame($status, $entity->getStatus());
    }
}

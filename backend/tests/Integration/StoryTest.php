<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Story, User};
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\TestCase;

class StoryTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $text = 'Story text';
        $photo = 'photo';
        $status = ElementStatusEnum::Active;
        $entity = new Story($user, $text, $photo, $status);
        $this->assertInstanceOf(Story::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($text, $entity->getText());
        $this->assertSame($photo, $entity->getPhoto());
        $this->assertSame($status, $entity->getStatus());
    }
}

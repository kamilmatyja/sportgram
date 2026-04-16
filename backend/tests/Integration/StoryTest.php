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
        $this->assertSame($user, $entity->user);
        $this->assertSame($text, $entity->text);
        $this->assertSame($photo, $entity->photo);
        $this->assertSame($status, $entity->status);
    }
}

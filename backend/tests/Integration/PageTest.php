<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Page, User};
use App\Enum\{ColorEnum, ElementStatusEnum};
use PHPUnit\Framework\TestCase;

class PageTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $title = 'Page title';
        $description = 'desc';
        $link = 'page-link';
        $profilePhoto = 'profile';
        $backgroundPhoto = 'bg';
        $color = ColorEnum::Blue;
        $status = ElementStatusEnum::Active;
        $entity = new Page($user, $title, $description, $link, $profilePhoto, $backgroundPhoto, $color, $status);
        $this->assertInstanceOf(Page::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($title, $entity->getTitle());
        $this->assertSame($description, $entity->getDescription());
        $this->assertSame($link, $entity->getLink());
        $this->assertSame($profilePhoto, $entity->getProfilePhoto());
        $this->assertSame($backgroundPhoto, $entity->getBackgroundPhoto());
        $this->assertSame($color, $entity->getColor());
        $this->assertSame($status, $entity->getStatus());
    }
}

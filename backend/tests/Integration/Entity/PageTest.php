<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Page, User};
use App\Enum\{ColorEnum, ElementStatusEnum};
use PHPUnit\Framework\TestCase;

class PageTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createStub(User::class);
        $title = 'Page title';
        $description = 'desc';
        $link = 'page-link';
        $profilePhoto = base64_encode(file_get_contents(__DIR__ . '/../../../public/profile.webp'));
        $backgroundPhoto = base64_encode(file_get_contents(__DIR__ . '/../../../public/background.webp'));
        $color = ColorEnum::Blue;
        $status = ElementStatusEnum::Active;
        $entity = new Page($user, $title, $description, $link, $profilePhoto, $backgroundPhoto, $color, $status);
        $this->assertInstanceOf(Page::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($title, $entity->title);
        $this->assertSame($description, $entity->description);
        $this->assertSame($link, $entity->link);
        $this->assertSame($profilePhoto, $entity->profilePhoto);
        $this->assertSame($backgroundPhoto, $entity->backgroundPhoto);
        $this->assertSame($color, $entity->color);
        $this->assertSame($status, $entity->status);
    }
}

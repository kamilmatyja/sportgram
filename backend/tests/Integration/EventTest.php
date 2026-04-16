<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Event, PageParticipant};
use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class EventTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $pageParticipant = $this->createMock(PageParticipant::class);
        $startedAt = new DateTimeImmutable('-1 hour');
        $endedAt = new DateTimeImmutable('+1 hour');
        $title = 'Event title';
        $description = 'Event description';
        $link = 'https://example.com';
        $rules = 'Event rules';
        $photo = 'binarydata';
        $location = 'Event location';
        $status = ElementStatusEnum::Active;
        $entity = new Event(
            $pageParticipant,
            $startedAt,
            $endedAt,
            $title,
            $description,
            $link,
            $rules,
            $photo,
            $location,
            $status,
        );
        $this->assertInstanceOf(Event::class, $entity);
        $this->assertSame($pageParticipant, $entity->getPageParticipant());
        $this->assertSame($startedAt, $entity->getStartedAt());
        $this->assertSame($endedAt, $entity->getEndedAt());
        $this->assertSame($title, $entity->getTitle());
        $this->assertSame($description, $entity->getDescription());
        $this->assertSame($link, $entity->getLink());
        $this->assertSame($rules, $entity->getRules());
        $this->assertSame($photo, $entity->getPhoto());
        $this->assertSame($location, $entity->getLocation());
        $this->assertSame($status, $entity->getStatus());
    }
}

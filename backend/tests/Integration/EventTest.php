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
        $this->assertSame($pageParticipant, $entity->pageParticipant);
        $this->assertSame($startedAt, $entity->startedAt);
        $this->assertSame($endedAt, $entity->endedAt);
        $this->assertSame($title, $entity->title);
        $this->assertSame($description, $entity->description);
        $this->assertSame($link, $entity->link);
        $this->assertSame($rules, $entity->rules);
        $this->assertSame($photo, $entity->photo);
        $this->assertSame($location, $entity->location);
        $this->assertSame($status, $entity->status);
    }
}

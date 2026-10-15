<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\Event;
use App\Resource\{EventDisciplineResource, EventResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineSubDistanceFactory, EventFactory, PageParticipantFactory};

class EventResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $event = $this->event();

        $data = EventResource::fromEntity($event);

        $this->assertSame([
            'id' => $event->id,
            'pageParticipantId' => $event->pageParticipant->id,
            'createdAt' => self::formatDate($event->createdAt),
            'updatedAt' => self::formatDate($event->updatedAt),
            'startedAt' => self::formatDate($event->startedAt),
            'endedAt' => self::formatDate($event->endedAt),
            'title' => $event->title,
            'description' => $event->description,
            'link' => $event->link,
            'rules' => $event->rules,
            'photo' => $event->photo,
            'location' => $event->location,
            'status' => $event->status,
        ], $data);
        $this->assertMatchesSchema(EventResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = EventResource::fromEntity($this->eventWithRelations(), new EventDetailsQueryDto());

        $this->assertArrayNotHasKey('disciplines', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(
        array $include,
        bool $disciplines,
        bool $distances,
        bool $subDistances,
    ): void {
        $event = $this->eventWithRelations();
        $dto = new EventDetailsQueryDto();
        $dto->include = $include;

        $data = EventResource::fromEntity($event, $dto);

        if (! $disciplines) {
            $this->assertArrayNotHasKey('disciplines', $data);
            $this->assertMatchesSchema(EventResource::class, $data);

            return;
        }

        $this->assertSame(
            array_map(
                static fn ($discipline) => EventDisciplineResource::fromEntity($discipline, $dto),
                $event->disciplines->toArray(),
            ),
            $data['disciplines'],
        );
        $discipline = $data['disciplines'][0];
        $this->assertSame($distances, array_key_exists('distances', $discipline));

        if ($distances) {
            $this->assertCount(2, $discipline['distances']);
            $this->assertSame($subDistances, array_key_exists('subDistances', $discipline['distances'][0]));
        }

        if ($subDistances) {
            $this->assertCount(2, $discipline['distances'][0]['subDistances']);
            $this->assertSame([], $discipline['distances'][1]['subDistances']);
        }

        $this->assertMatchesSchema(EventResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'disciplines' => [[EventDetailsQueryDto::EVENT_DISCIPLINES], true, false, false];
        yield 'distances only' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES], false, false, false];
        yield 'sub distances only' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES], false, false, false];
        yield 'disciplines with distances' => [
            [EventDetailsQueryDto::EVENT_DISCIPLINES, EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES],
            true,
            true,
            false,
        ];
        yield 'disciplines with sub distances' => [
            [EventDetailsQueryDto::EVENT_DISCIPLINES, EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES],
            true,
            false,
            false,
        ];
        yield 'all' => [
            [
                EventDetailsQueryDto::EVENT_DISCIPLINES,
                EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES,
                EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES,
            ],
            true,
            true,
            true,
        ];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = [EventDetailsQueryDto::EVENT_DISCIPLINES];

        $data = EventResource::fromEntity($this->event(), $dto);

        $this->assertSame([], $data['disciplines']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $events = [$this->event(), $this->event()];

        $data = EventResource::fromEntityCollection($events);

        $this->assertSame([EventResource::fromEntity($events[0]), EventResource::fromEntity($events[1])], $data);
        $this->assertSame([], EventResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = [EventDetailsQueryDto::EVENT_DISCIPLINES, EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES];
        $events = [$this->eventWithRelations(), $this->eventWithRelations()];

        $data = EventResource::fromEntityCollection($events, $dto);

        $this->assertSame([EventResource::fromEntity($events[0], $dto), EventResource::fromEntity($events[1], $dto)], $data);
        $this->assertArrayHasKey('distances', $data[1]['disciplines'][0]);
    }

    private function event(): Event
    {
        return self::persisted(EventFactory::make(['pageParticipant' => self::persisted(PageParticipantFactory::make())]));
    }

    private function eventWithRelations(): Event
    {
        $event = $this->event();
        $discipline = self::persisted(EventDisciplineFactory::make(['event' => $event]));
        $distance = self::persisted(EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline]));
        $distance->subDistances->add(self::persisted(EventDisciplineSubDistanceFactory::make([
            'eventDisciplineDistance' => $distance,
        ])));
        $distance->subDistances->add(self::persisted(EventDisciplineSubDistanceFactory::make([
            'eventDisciplineDistance' => $distance,
        ])));
        $discipline->distances->add($distance);
        $discipline->distances->add(self::persisted(EventDisciplineDistanceFactory::make([
            'eventDiscipline' => $discipline,
        ])));
        $event->disciplines->add($discipline);
        $event->disciplines->add(self::persisted(EventDisciplineFactory::make(['event' => $event])));

        return $event;
    }
}

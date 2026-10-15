<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EventListDetailsQueryDto;
use App\Entity\EventDisciplineList;
use App\Resource\{EventDisciplineDistanceListResource, EventDisciplineDistanceResultResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineListFactory, EventDisciplineResultFactory, EventDisciplineSubResultFactory, FeedFactory, UserFactory};

class EventDisciplineDistanceListResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $list = $this->list();

        $data = EventDisciplineDistanceListResource::fromEntity($list);

        $this->assertSame([
            'id' => $list->id,
            'eventDisciplineDistanceId' => $list->eventDisciplineDistance->id,
            'feedId' => $list->feed->id,
            'userId' => $list->user->id,
            'createdAt' => self::formatDate($list->createdAt),
            'updatedAt' => self::formatDate($list->updatedAt),
            'status' => $list->status,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineDistanceListResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $list = $this->listWithResults();

        $this->assertArrayNotHasKey('results', EventDisciplineDistanceListResource::fromEntity($list));
        $this->assertArrayNotHasKey(
            'results',
            EventDisciplineDistanceListResource::fromEntity($list, new EventListDetailsQueryDto()),
        );
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $results, bool $subResults): void
    {
        $list = $this->listWithResults();
        $dto = new EventListDetailsQueryDto();
        $dto->include = $include;

        $data = EventDisciplineDistanceListResource::fromEntity($list, $dto);

        if ($results) {
            $this->assertSame(
                array_map(
                    static fn ($result) => EventDisciplineDistanceResultResource::fromEntity($result, $dto),
                    $list->results->toArray(),
                ),
                $data['results'],
            );
            $this->assertSame($subResults, array_key_exists('subResults', $data['results'][0]));
        } else {
            $this->assertArrayNotHasKey('results', $data);
        }

        $this->assertMatchesSchema(EventDisciplineDistanceListResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'results' => [[EventListDetailsQueryDto::EVENT_LIST_RESULTS], true, false];
        yield 'sub results without results' => [[EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS], false, false];
        yield 'both' => [
            [EventListDetailsQueryDto::EVENT_LIST_RESULTS, EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS],
            true,
            true,
        ];
    }

    final public function testPassesDtoDownToSubResults(): void
    {
        $list = $this->listWithResults();
        $dto = new EventListDetailsQueryDto();
        $dto->include = [EventListDetailsQueryDto::EVENT_LIST_RESULTS, EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS];

        $data = EventDisciplineDistanceListResource::fromEntity($list, $dto);

        $this->assertCount(2, $data['results'][0]['subResults']);
        $this->assertSame([], $data['results'][1]['subResults']);
    }

    final public function testIncludedResultsMayBeEmpty(): void
    {
        $dto = new EventListDetailsQueryDto();
        $dto->include = [EventListDetailsQueryDto::EVENT_LIST_RESULTS];

        $data = EventDisciplineDistanceListResource::fromEntity($this->list(), $dto);

        $this->assertSame([], $data['results']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $lists = [$this->list(), $this->list()];

        $data = EventDisciplineDistanceListResource::fromEntityCollection($lists);

        $this->assertSame(
            [
                EventDisciplineDistanceListResource::fromEntity($lists[0]),
                EventDisciplineDistanceListResource::fromEntity($lists[1]),
            ],
            $data,
        );
        $this->assertSame([], EventDisciplineDistanceListResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new EventListDetailsQueryDto();
        $dto->include = [EventListDetailsQueryDto::EVENT_LIST_RESULTS];
        $lists = [$this->listWithResults(), $this->listWithResults()];

        $data = EventDisciplineDistanceListResource::fromEntityCollection($lists, $dto);

        $this->assertSame(
            [
                EventDisciplineDistanceListResource::fromEntity($lists[0], $dto),
                EventDisciplineDistanceListResource::fromEntity($lists[1], $dto),
            ],
            $data,
        );
        $this->assertArrayHasKey('results', $data[1]);
    }

    private function list(): EventDisciplineList
    {
        return self::persisted(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => self::persisted(EventDisciplineDistanceFactory::make()),
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));
    }

    private function listWithResults(): EventDisciplineList
    {
        $list = $this->list();
        $first = self::persisted(EventDisciplineResultFactory::make([
            'eventDisciplineList' => $list,
            'feed' => $list->feed,
            'user' => $list->user,
        ]));
        $first->subResults->add(self::persisted(EventDisciplineSubResultFactory::make(['eventDisciplineResult' => $first])));
        $first->subResults->add(self::persisted(EventDisciplineSubResultFactory::make(['eventDisciplineResult' => $first])));
        $list->results->add($first);
        $list->results->add(self::persisted(EventDisciplineResultFactory::make([
            'eventDisciplineList' => $list,
            'feed' => $list->feed,
            'user' => $list->user,
        ])));

        return $list;
    }
}

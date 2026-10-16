<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EventListDetailsQueryDto;
use App\Entity\{EventDisciplineResult, EventDisciplineSubResult};
use App\Resource\{EventDisciplineDistanceResultResource, EventDisciplineDistanceSubResultResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    EventDisciplineSubDistanceFactory,
    EventDisciplineSubResultFactory,
    FeedFactory,
    UserFactory,
};

class EventDisciplineDistanceResultResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $result = $this->distanceResult();

        $data = EventDisciplineDistanceResultResource::fromEntity($result);

        $this->assertSame([
            'id' => $result->id,
            'eventDisciplineListId' => $result->eventDisciplineList->id,
            'feedId' => $result->feed->id,
            'userId' => $result->user->id,
            'createdAt' => self::formatDate($result->createdAt),
            'updatedAt' => self::formatDate($result->updatedAt),
            'time' => $result->time,
        ], $data);
        $this->assertMatchesSchema(EventDisciplineDistanceResultResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = EventDisciplineDistanceResultResource::fromEntity(
            $this->distanceResultWithSubResults(),
            new EventListDetailsQueryDto(),
        );

        $this->assertArrayNotHasKey('subResults', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $subResults): void
    {
        $result = $this->distanceResultWithSubResults();
        $dto = new EventListDetailsQueryDto();
        $dto->include = $include;

        $data = EventDisciplineDistanceResultResource::fromEntity($result, $dto);

        if ($subResults) {
            $this->assertSame(
                array_map(EventDisciplineDistanceSubResultResource::fromEntity(...), $result->subResults->toArray()),
                $data['subResults'],
            );
            $this->assertCount(2, $data['subResults']);
        } else {
            $this->assertArrayNotHasKey('subResults', $data);
        }

        $this->assertMatchesSchema(EventDisciplineDistanceResultResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'results only' => [[EventListDetailsQueryDto::EVENT_LIST_RESULTS], false];
        yield 'sub results' => [[EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS], true];
        yield 'both' => [
            [EventListDetailsQueryDto::EVENT_LIST_RESULTS, EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS],
            true,
        ];
    }

    final public function testIncludedSubResultsMayBeEmpty(): void
    {
        $dto = new EventListDetailsQueryDto();
        $dto->include = [EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS];

        $data = EventDisciplineDistanceResultResource::fromEntity($this->distanceResult(), $dto);

        $this->assertSame([], $data['subResults']);
    }

    private function distanceResult(): EventDisciplineResult
    {
        return self::persisted(EventDisciplineResultFactory::make([
            'eventDisciplineList' => self::persisted(EventDisciplineListFactory::make()),
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));
    }

    private function distanceResultWithSubResults(): EventDisciplineResult
    {
        $result = $this->distanceResult();

        $result->subResults->add($this->subResult($result));
        $result->subResults->add($this->subResult($result));

        return $result;
    }

    private function subResult(EventDisciplineResult $result): EventDisciplineSubResult
    {
        return self::persisted(EventDisciplineSubResultFactory::make([
            'eventDisciplineSubDistance' => self::persisted(EventDisciplineSubDistanceFactory::make()),
            'eventDisciplineResult' => $result,
            'user' => $result->user,
        ]));
    }
}

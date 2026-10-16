<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\FeedDetailsQueryDto;
use App\Entity\Feed;
use App\Resource\{EventDisciplineDistanceListResource, EventDisciplineDistanceResultResource, FeedCommentResource, FeedReactionResource, FeedResource, GoalParticipantResultResource, GoalResource, TrainingResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineListFactory, EventDisciplineResultFactory, FeedCommentFactory, FeedFactory, FeedReactionFactory, GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory, TrainingFactory, UserFactory};

class FeedResourceTest extends ResourceTestCase
{
    private const array RELATIONS = [
        FeedDetailsQueryDto::FEED_COMMENTS => 'comments',
        FeedDetailsQueryDto::FEED_REACTIONS => 'reactions',
        FeedDetailsQueryDto::EVENT_DISCIPLINE_LIST => 'eventDisciplineList',
        FeedDetailsQueryDto::EVENT_DISCIPLINE_RESULT => 'eventDisciplineResult',
        FeedDetailsQueryDto::GOAL => 'goal',
        FeedDetailsQueryDto::GOAL_PARTICIPANT_RESULT => 'goalParticipantResult',
        FeedDetailsQueryDto::TRAINING => 'training',
    ];

    final public function testMapsAllFields(): void
    {
        $feed = $this->feed();

        $data = FeedResource::fromEntity($feed);

        $this->assertSame([
            'id' => $feed->id,
            'userId' => $feed->user->id,
            'createdAt' => self::formatDate($feed->createdAt),
            'updatedAt' => self::formatDate($feed->updatedAt),
            'text' => $feed->text,
            'photo' => $feed->photo,
            'status' => $feed->status,
        ], $data);
        $this->assertMatchesSchema(FeedResource::class, $data);
    }

    final public function testMapsMissingTextAndPhotoToNull(): void
    {
        $data = FeedResource::fromEntity($this->feed(['text' => null, 'photo' => null]));

        $this->assertArrayHasKey('text', $data);
        $this->assertArrayHasKey('photo', $data);
        $this->assertNull($data['text']);
        $this->assertNull($data['photo']);
        $this->assertMatchesSchema(FeedResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $feed = $this->feedWithRelations();

        foreach ([FeedResource::fromEntity($feed), FeedResource::fromEntity($feed, new FeedDetailsQueryDto())] as $data) {
            foreach (self::RELATIONS as $key) {
                $this->assertArrayNotHasKey($key, $data);
            }
        }
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include): void
    {
        $feed = $this->feedWithRelations();
        $dto = new FeedDetailsQueryDto();
        $dto->include = $include;

        $data = FeedResource::fromEntity($feed, $dto);

        $expected = [
            'comments' => array_map(FeedCommentResource::fromEntity(...), $feed->comments->toArray()),
            'reactions' => array_map(FeedReactionResource::fromEntity(...), $feed->reactions->toArray()),
            'eventDisciplineList' => EventDisciplineDistanceListResource::fromEntity($feed->eventDisciplineList),
            'eventDisciplineResult' => EventDisciplineDistanceResultResource::fromEntity($feed->eventDisciplineResult),
            'goal' => GoalResource::fromEntity($feed->goal),
            'goalParticipantResult' => GoalParticipantResultResource::fromEntity($feed->goalParticipantResult),
            'training' => TrainingResource::fromEntity($feed->training),
        ];

        foreach (self::RELATIONS as $option => $key) {
            if (in_array($option, $include, true)) {
                $this->assertSame($expected[$key], $data[$key], $key);
            } else {
                $this->assertArrayNotHasKey($key, $data);
            }
        }

        $this->assertMatchesSchema(FeedResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        foreach (array_keys(self::RELATIONS) as $option) {
            yield $option => [[$option]];
        }

        yield 'all' => [array_keys(self::RELATIONS)];
    }

    final public function testMissingRelationsMapToNullAndEmptyCollections(): void
    {
        $dto = new FeedDetailsQueryDto();
        $dto->include = array_keys(self::RELATIONS);

        $data = FeedResource::fromEntity($this->feed(), $dto);

        $this->assertSame([], $data['comments']);
        $this->assertSame([], $data['reactions']);
        $this->assertNull($data['eventDisciplineList']);
        $this->assertNull($data['eventDisciplineResult']);
        $this->assertNull($data['goal']);
        $this->assertNull($data['goalParticipantResult']);
        $this->assertNull($data['training']);
        $this->assertMatchesSchema(FeedResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $feeds = [$this->feed(), $this->feed()];

        $data = FeedResource::fromEntityCollection($feeds);

        $this->assertSame([FeedResource::fromEntity($feeds[0]), FeedResource::fromEntity($feeds[1])], $data);
        $this->assertSame([], FeedResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::GOAL];
        $feeds = [$this->feedWithRelations(), $this->feedWithRelations()];

        $data = FeedResource::fromEntityCollection($feeds, $dto);

        $this->assertSame([FeedResource::fromEntity($feeds[0], $dto), FeedResource::fromEntity($feeds[1], $dto)], $data);
        $this->assertArrayHasKey('goal', $data[1]);
    }

    private function feed(array $overrides = []): Feed
    {
        return self::persisted(FeedFactory::make(['user' => self::persisted(UserFactory::make())] + $overrides));
    }

    private function feedWithRelations(): Feed
    {
        $feed = $this->feed();
        $user = $feed->user;
        $feed->comments->add(self::persisted(FeedCommentFactory::make(['feed' => $feed, 'user' => $user])));
        $feed->comments->add(self::persisted(FeedCommentFactory::make(['feed' => $feed, 'user' => $user])));
        $feed->reactions->add(self::persisted(FeedReactionFactory::make(['feed' => $feed, 'user' => $user])));
        $feed->eventDisciplineList = self::persisted(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => self::persisted(EventDisciplineDistanceFactory::make()),
            'feed' => $feed,
            'user' => $user,
        ]));
        $feed->eventDisciplineResult = self::persisted(EventDisciplineResultFactory::make([
            'eventDisciplineList' => $feed->eventDisciplineList,
            'feed' => $feed,
            'user' => $user,
        ]));
        $feed->goal = self::persisted(GoalFactory::make(['feed' => $feed, 'user' => $user]));
        $feed->goalParticipantResult = self::persisted(GoalParticipantResultFactory::make([
            'goalParticipant' => self::persisted(GoalParticipantFactory::make()),
            'feed' => $feed,
        ]));
        $feed->training = self::persisted(TrainingFactory::make(['feed' => $feed, 'user' => $user]));

        return $feed;
    }
}

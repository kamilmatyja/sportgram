<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\FeedDetailsQueryDto;
use App\Entity\Feed;
use App\Enum\DisciplineEnum;
use App\Resource\{FeedCommentResource, FeedReactionResource, FeedResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineListFactory, EventDisciplineResultFactory, EventFactory, FeedCommentFactory, FeedFactory, FeedReactionFactory, GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory, TrainingDisciplineDistanceFactory, TrainingDisciplineFactory, TrainingFactory, UserFactory};

class FeedResourceTest extends ResourceTestCase
{
    private const array RELATIONS = [
        FeedDetailsQueryDto::FEED_COMMENTS => 'comments',
        FeedDetailsQueryDto::FEED_REACTIONS => 'reactions',
        FeedDetailsQueryDto::FEED_ORIGIN => 'feedOrigin',
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
            'feedOrigin' => sprintf(
                '%s: {discipline:%s}, {distance:%d}',
                $feed->eventDisciplineList->eventDisciplineDistance->eventDiscipline->event->title,
                $feed->eventDisciplineList->eventDisciplineDistance->eventDiscipline->discipline->name,
                $feed->eventDisciplineList->eventDisciplineDistance->distance,
            ),
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
        $this->assertNull($data['feedOrigin']);
        $this->assertMatchesSchema(FeedResource::class, $data);
    }

    final public function testFeedOriginWithEvent(): void
    {
        $feed = $this->feed();
        $event = self::persisted(EventFactory::make([
            'feed' => $feed,
            'title' => 'Bieg Niepodległości',
        ]));
        $ed1 = self::persisted(EventDisciplineFactory::make([
            'event' => $event,
            'discipline' => DisciplineEnum::Running,
        ]));
        $edd1 = self::persisted(EventDisciplineDistanceFactory::make([
            'eventDiscipline' => $ed1,
            'distance' => 10000,
        ]));
        $ed1->distances->add($edd1);
        $event->disciplines->add($ed1);

        $feed->event = $event;

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Bieg Niepodległości: {discipline:Running}, {distance:10000}', $data['feedOrigin']);
    }

    final public function testFeedOriginWithEventWithoutDisciplines(): void
    {
        $feed = $this->feed();
        $event = self::persisted(EventFactory::make([
            'feed' => $feed,
            'title' => 'Bieg Niepodległości',
        ]));
        $feed->event = $event;

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Bieg Niepodległości', $data['feedOrigin']);
    }

    final public function testFeedOriginWithEventDisciplineList(): void
    {
        $feed = $this->feed();
        $event = self::persisted(EventFactory::make(['title' => 'Maraton Warszawski']));
        $eventDiscipline = self::persisted(EventDisciplineFactory::make([
            'event' => $event,
            'discipline' => DisciplineEnum::Running,
        ]));
        $distance = self::persisted(EventDisciplineDistanceFactory::make([
            'eventDiscipline' => $eventDiscipline,
            'distance' => 42195,
        ]));
        $feed->eventDisciplineList = self::persisted(EventDisciplineListFactory::make([
            'feed' => $feed,
            'eventDisciplineDistance' => $distance,
        ]));

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Maraton Warszawski: {discipline:Running}, {distance:42195}', $data['feedOrigin']);
    }

    final public function testFeedOriginWithEventDisciplineResult(): void
    {
        $feed = $this->feed();
        $event = self::persisted(EventFactory::make(['title' => 'Półmaraton']));
        $eventDiscipline = self::persisted(EventDisciplineFactory::make([
            'event' => $event,
            'discipline' => DisciplineEnum::Cycling,
        ]));
        $distance = self::persisted(EventDisciplineDistanceFactory::make([
            'eventDiscipline' => $eventDiscipline,
            'distance' => 21097,
        ]));
        $list = self::persisted(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => $distance,
        ]));
        $feed->eventDisciplineResult = self::persisted(EventDisciplineResultFactory::make([
            'feed' => $feed,
            'eventDisciplineList' => $list,
            'time' => 5400,
        ]));

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Półmaraton: {discipline:Cycling}, {distance:21097}, {time:5400}', $data['feedOrigin']);
    }

    final public function testFeedOriginWithGoal(): void
    {
        $feed = $this->feed();
        $feed->goal = self::persisted(GoalFactory::make([
            'feed' => $feed,
            'text' => 'Przebiec 100km w miesiąc',
            'discipline' => DisciplineEnum::Running,
            'distance' => 100000,
        ]));

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Przebiec 100km w miesiąc: {discipline:Running}, {distance:100000}', $data['feedOrigin']);
    }

    final public function testFeedOriginWithGoalParticipantResult(): void
    {
        $feed = $this->feed();
        $goal = self::persisted(GoalFactory::make([
            'text' => 'Rowerowe wyzwanie',
            'discipline' => DisciplineEnum::Cycling,
        ]));
        $participant = self::persisted(GoalParticipantFactory::make(['goal' => $goal]));
        $feed->goalParticipantResult = self::persisted(GoalParticipantResultFactory::make([
            'feed' => $feed,
            'goalParticipant' => $participant,
            'distance' => 15000,
            'time' => 3600,
        ]));

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Rowerowe wyzwanie: {discipline:Cycling}, {distance:15000}, {time:3600}', $data['feedOrigin']);
    }

    final public function testFeedOriginWithTraining(): void
    {
        $feed = $this->feed();
        $training = self::persisted(TrainingFactory::make([
            'feed' => $feed,
            'title' => 'Trening interwałowy',
        ]));
        $td1 = self::persisted(TrainingDisciplineFactory::make([
            'training' => $training,
            'discipline' => DisciplineEnum::Running,
        ]));
        $tdd1 = self::persisted(TrainingDisciplineDistanceFactory::make([
            'trainingDiscipline' => $td1,
            'distance' => 5000,
            'time' => 1500,
        ]));
        $td1->distances->add($tdd1);
        $training->disciplines->add($td1);

        $td2 = self::persisted(TrainingDisciplineFactory::make([
            'training' => $training,
            'discipline' => DisciplineEnum::Swimming,
        ]));
        $tdd2 = self::persisted(TrainingDisciplineDistanceFactory::make([
            'trainingDiscipline' => $td2,
            'distance' => 1000,
            'time' => 1200,
        ]));
        $td2->distances->add($tdd2);
        $training->disciplines->add($td2);

        $feed->training = $training;

        $dto = new FeedDetailsQueryDto();
        $dto->include = [FeedDetailsQueryDto::FEED_ORIGIN];

        $data = FeedResource::fromEntity($feed, $dto);

        $this->assertSame('Trening interwałowy: {discipline:Running}, {distance:5000}, {time:1500}; {discipline:Swimming}, {distance:1000}, {time:1200}', $data['feedOrigin']);
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
        $dto->include = [FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::FEED_ORIGIN];
        $feeds = [$this->feedWithRelations(), $this->feedWithRelations()];

        $data = FeedResource::fromEntityCollection($feeds, $dto);

        $this->assertSame([FeedResource::fromEntity($feeds[0], $dto), FeedResource::fromEntity($feeds[1], $dto)], $data);
        $this->assertArrayHasKey('feedOrigin', $data[1]);
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

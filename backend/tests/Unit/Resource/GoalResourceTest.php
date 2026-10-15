<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\GoalDetailsQueryDto;
use App\Entity\Goal;
use App\Resource\{GoalParticipantResource, GoalResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{FeedFactory, GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory, UserFactory};

class GoalResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $goal = $this->goal();

        $data = GoalResource::fromEntity($goal);

        $this->assertSame([
            'id' => $goal->id,
            'userId' => $goal->user->id,
            'feedId' => $goal->feed->id,
            'createdAt' => self::formatDate($goal->createdAt),
            'updatedAt' => self::formatDate($goal->updatedAt),
            'startedAt' => self::formatDate($goal->startedAt),
            'endedAt' => self::formatDate($goal->endedAt),
            'text' => $goal->text,
            'link' => $goal->link,
            'discipline' => $goal->discipline,
            'distance' => $goal->distance,
            'time' => $goal->time,
            'status' => $goal->status,
        ], $data);
        $this->assertMatchesSchema(GoalResource::class, $data);
    }

    final public function testMapsMissingOptionalFieldsToNull(): void
    {
        $data = GoalResource::fromEntity($this->goal(['startedAt' => null, 'endedAt' => null, 'time' => null]));

        $this->assertNull($data['startedAt']);
        $this->assertNull($data['endedAt']);
        $this->assertNull($data['time']);
        $this->assertMatchesSchema(GoalResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $this->assertArrayNotHasKey(
            'participants',
            GoalResource::fromEntity($this->goalWithRelations(), new GoalDetailsQueryDto()),
        );
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $participants, bool $results): void
    {
        $goal = $this->goalWithRelations();
        $dto = new GoalDetailsQueryDto();
        $dto->include = $include;

        $data = GoalResource::fromEntity($goal, $dto);

        if ($participants) {
            $this->assertSame(
                array_map(
                    static fn ($participant): array => GoalParticipantResource::fromEntity($participant, $dto),
                    $goal->participants->toArray(),
                ),
                $data['participants'],
            );
            $this->assertCount(2, $data['participants']);
            $this->assertSame($results, array_key_exists('results', $data['participants'][0]));
        } else {
            $this->assertArrayNotHasKey('participants', $data);
        }

        $this->assertMatchesSchema(GoalResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'participants' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS], true, false];
        yield 'results only' => [[GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS], false, false];
        yield 'both' => [
            [GoalDetailsQueryDto::GOAL_PARTICIPANTS, GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS],
            true,
            true,
        ];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = [GoalDetailsQueryDto::GOAL_PARTICIPANTS];

        $this->assertSame([], GoalResource::fromEntity($this->goal(), $dto)['participants']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $goals = [$this->goal(), $this->goal()];

        $data = GoalResource::fromEntityCollection($goals);

        $this->assertSame([GoalResource::fromEntity($goals[0]), GoalResource::fromEntity($goals[1])], $data);
        $this->assertSame([], GoalResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = [GoalDetailsQueryDto::GOAL_PARTICIPANTS];
        $goals = [$this->goalWithRelations(), $this->goalWithRelations()];

        $data = GoalResource::fromEntityCollection($goals, $dto);

        $this->assertSame([GoalResource::fromEntity($goals[0], $dto), GoalResource::fromEntity($goals[1], $dto)], $data);
        $this->assertArrayHasKey('participants', $data[1]);
    }

    private function goal(array $overrides = []): Goal
    {
        return self::persisted(GoalFactory::make([
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
            ...$overrides,
        ]));
    }

    private function goalWithRelations(): Goal
    {
        $goal = $this->goal();

        foreach ([1, 2] as $ignored) {
            $participant = self::persisted(GoalParticipantFactory::make([
                'goal' => $goal,
                'user' => self::persisted(UserFactory::make()),
            ]));
            $participant->results->add(self::persisted(GoalParticipantResultFactory::make([
                'goalParticipant' => $participant,
                'feed' => self::persisted(FeedFactory::make()),
            ])));
            $goal->participants->add($participant);
        }

        return $goal;
    }
}

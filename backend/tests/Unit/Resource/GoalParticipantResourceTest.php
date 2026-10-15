<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\GoalDetailsQueryDto;
use App\Entity\GoalParticipant;
use App\Resource\{GoalParticipantResource, GoalParticipantResultResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{FeedFactory, GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory, UserFactory};

class GoalParticipantResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $participant = $this->participant();

        $data = GoalParticipantResource::fromEntity($participant);

        $this->assertSame([
            'id' => $participant->id,
            'goalId' => $participant->goal->id,
            'userId' => $participant->user->id,
            'createdAt' => self::formatDate($participant->createdAt),
            'updatedAt' => self::formatDate($participant->updatedAt),
            'status' => $participant->status,
        ], $data);
        $this->assertMatchesSchema(GoalParticipantResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = GoalParticipantResource::fromEntity($this->participantWithResults(), new GoalDetailsQueryDto());

        $this->assertArrayNotHasKey('results', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $results): void
    {
        $participant = $this->participantWithResults();
        $dto = new GoalDetailsQueryDto();
        $dto->include = $include;

        $data = GoalParticipantResource::fromEntity($participant, $dto);

        if ($results) {
            $this->assertSame(
                array_map(GoalParticipantResultResource::fromEntity(...), $participant->results->toArray()),
                $data['results'],
            );
            $this->assertCount(2, $data['results']);
        } else {
            $this->assertArrayNotHasKey('results', $data);
        }

        $this->assertMatchesSchema(GoalParticipantResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'participants only' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS], false];
        yield 'results' => [[GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS], true];
        yield 'both' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS, GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS], true];
    }

    final public function testIncludedResultsMayBeEmpty(): void
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = [GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS];

        $data = GoalParticipantResource::fromEntity($this->participant(), $dto);

        $this->assertSame([], $data['results']);
    }

    private function participant(): GoalParticipant
    {
        return self::persisted(GoalParticipantFactory::make([
            'goal' => self::persisted(GoalFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));
    }

    private function participantWithResults(): GoalParticipant
    {
        $participant = $this->participant();
        $participant->results->add(self::persisted(GoalParticipantResultFactory::make([
            'goalParticipant' => $participant,
            'feed' => self::persisted(FeedFactory::make()),
        ])));
        $participant->results->add(self::persisted(GoalParticipantResultFactory::make([
            'goalParticipant' => $participant,
            'feed' => self::persisted(FeedFactory::make()),
        ])));

        return $participant;
    }
}

<?php

namespace App\Resource;

use App\Dto\FeedDetailsQueryDto;
use App\Entity\{Feed, FeedComment, FeedReaction};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'text',
        'photo',
        'status',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'New post'),
        new OA\Property(property: 'photo', type: 'string', example: 'base64string'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'comments',
            type: 'array',
            items: new OA\Items(ref: new Model(type: FeedCommentResource::class)),
        ),
        new OA\Property(
            property: 'reactions',
            type: 'array',
            items: new OA\Items(ref: new Model(type: FeedReactionResource::class)),
        ),
        new OA\Property(
            property: 'eventDisciplineList',
            ref: new Model(type: EventDisciplineDistanceListResource::class),
            nullable: true,
        ),
        new OA\Property(
            property: 'eventDisciplineResult',
            ref: new Model(type: EventDisciplineDistanceResultResource::class),
            nullable: true,
        ),
        new OA\Property(
            property: 'goal',
            ref: new Model(type: GoalResource::class),
            nullable: true,
        ),
        new OA\Property(
            property: 'goalParticipantResult',
            ref: new Model(type: GoalParticipantResultResource::class),
            nullable: true,
        ),
        new OA\Property(
            property: 'training',
            ref: new Model(type: TrainingResource::class),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class FeedResource
{
    public static function fromEntity(Feed $feed, ?FeedDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $feed->id->toString(),
            'userId' => $feed->user->id->toString(),
            'createdAt' => $feed->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $feed->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $feed->text,
            'photo' => base64_encode($feed->photo),
            'status' => $feed->status->value,
        ];

        if ($dto && in_array($dto::FEED_COMMENTS, $dto->include)) {
            $data['comments'] = array_map(
                fn (FeedComment $comment) => FeedCommentResource::fromEntity($comment),
                $feed->comments->toArray(),
            );
        }

        if ($dto && in_array($dto::FEED_REACTIONS, $dto->include)) {
            $data['reactions'] = array_map(
                fn (FeedReaction $reaction) => FeedReactionResource::fromEntity($reaction),
                $feed->reactions->toArray(),
            );
        }

        if ($dto && in_array($dto::EVENT_DISCIPLINE_LIST, $dto->include)) {
            $data['eventDisciplineList'] = $feed->eventDisciplineList ? EventDisciplineDistanceListResource::fromEntity(
                $feed->eventDisciplineList
            ) : null;
        }

        if ($dto && in_array($dto::EVENT_DISCIPLINE_RESULT, $dto->include)) {
            $data['eventDisciplineResult'] = $feed->eventDisciplineResult ? EventDisciplineDistanceResultResource::fromEntity(
                $feed->eventDisciplineResult
            ) : null;
        }

        if ($dto && in_array($dto::GOAL, $dto->include)) {
            $data['goal'] = $feed->goal ? GoalResource::fromEntity($feed->goal) : null;
        }

        if ($dto && in_array($dto::GOAL_PARTICIPANT_RESULT, $dto->include)) {
            $data['goalParticipantResult'] = $feed->goalParticipantResult ? GoalParticipantResultResource::fromEntity(
                $feed->goalParticipantResult
            ) : null;
        }

        if ($dto && in_array($dto::TRAINING, $dto->include)) {
            $data['training'] = $feed->training ? TrainingResource::fromEntity($feed->training) : null;
        }

        return $data;
    }

    /** @param Feed[] $feeds */
    public static function fromEntityCollection(array $feeds): array
    {
        return array_map(fn (Feed $feed) => self::fromEntity($feed), $feeds);
    }
}

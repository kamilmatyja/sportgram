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
        new OA\Property(property: 'text', type: 'string', example: 'New post', nullable: true),
        new OA\Property(property: 'photo', type: 'string', example: 'base64string', nullable: true),
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
            property: 'feedOrigin',
            type: 'string',
            example: 'Title: {discipline:Running}, {distance:1000}, {time:3600}',
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
            'id' => $feed->id,
            'userId' => $feed->user->id,
            'createdAt' => $feed->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $feed->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $feed->text,
            'photo' => $feed->photo,
            'status' => $feed->status,
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

        if ($dto && in_array($dto::FEED_ORIGIN, $dto->include)) {
            $data['feedOrigin'] = self::resolveFeedOrigin($feed);
        }

        return $data;
    }

    /** @param Feed[] $feeds */
    public static function fromEntityCollection(array $feeds, ?FeedDetailsQueryDto $dto = null): array
    {
        return array_map(fn (Feed $feed) => self::fromEntity($feed, $dto), $feeds);
    }

    private static function resolveFeedOrigin(Feed $feed): ?string
    {
        if (null !== $feed->event) {
            $parts = [];
            foreach ($feed->event->disciplines as $eventDiscipline) {
                $disciplineName = $eventDiscipline->discipline->name;
                foreach ($eventDiscipline->distances as $distance) {
                    $parts[] = sprintf('{discipline:%s}, {distance:%d}', $disciplineName, $distance->distance);
                }
            }

            if (! empty($parts)) {
                return sprintf('%s: %s', $feed->event->title, implode('; ', $parts));
            }

            return $feed->event->title;
        }

        if (null !== $feed->eventDisciplineList) {
            $distance = $feed->eventDisciplineList->eventDisciplineDistance;
            $eventDiscipline = $distance->eventDiscipline;

            return sprintf(
                '%s: {discipline:%s}, {distance:%d}',
                $eventDiscipline->event->title,
                $eventDiscipline->discipline->name,
                $distance->distance,
            );
        }

        if (null !== $feed->eventDisciplineResult) {
            $distance = $feed->eventDisciplineResult->eventDisciplineList->eventDisciplineDistance;
            $eventDiscipline = $distance->eventDiscipline;

            return sprintf(
                '%s: {discipline:%s}, {distance:%d}, {time:%d}',
                $eventDiscipline->event->title,
                $eventDiscipline->discipline->name,
                $distance->distance,
                $feed->eventDisciplineResult->time,
            );
        }

        if (null !== $feed->goal) {
            return sprintf(
                '%s: {discipline:%s}, {distance:%d}',
                $feed->goal->text,
                $feed->goal->discipline->name,
                $feed->goal->distance,
            );
        }

        if (null !== $feed->goalParticipantResult) {
            return sprintf(
                '%s: {discipline:%s}, {distance:%d}, {time:%d}',
                $feed->goalParticipantResult->goalParticipant->goal->text,
                $feed->goalParticipantResult->goalParticipant->goal->discipline->name,
                $feed->goalParticipantResult->distance,
                $feed->goalParticipantResult->time,
            );
        }

        if (null !== $feed->training) {
            $parts = [];
            foreach ($feed->training->disciplines as $trainingDiscipline) {
                $disciplineName = $trainingDiscipline->discipline->name;
                foreach ($trainingDiscipline->distances as $distance) {
                    $parts[] = sprintf('{discipline:%s}, {distance:%d}, {time:%d}', $disciplineName, $distance->distance, $distance->time);
                }
            }

            if (! empty($parts)) {
                return sprintf('%s: %s', $feed->training->title, implode('; ', $parts));
            }

            return $feed->training->title;
        }

        return null;
    }
}

<?php

namespace App\Resource;

use App\Dto\FeedDetailsQueryDto;
use App\Entity\{Feed, FeedComment, FeedReaction};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FeedResource',
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
            property: 'Id',
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
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'comments',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/FeedCommentResource'),
        ),
        new OA\Property(
            property: 'reactions',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/FeedReactionResource'),
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

        return $data;
    }

    public static function fromEntityCollection(array $feeds): array
    {
        return array_map(fn (Feed $feed) => self::fromEntity($feed), $feeds);
    }
}

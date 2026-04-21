<?php

namespace App\Resource;

use App\Entity\{PageFollow};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PageFollowResource',
    required: [
        'id',
        'pageId',
        'userId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'pageId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class PageFollowResource
{
    public static function fromEntity(PageFollow $pageFollow): array
    {
        return [
            'id' => $pageFollow->id?->toString(),
            'pageId' => $pageFollow->page->id?->toString(),
            'userId' => $pageFollow->user->id?->toString(),
            'createdAt' => $pageFollow->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $pageFollow->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $pageFollow->status->value,
        ];
    }

    public static function fromEntityCollection(array $pageFollows): array
    {
        return array_map(fn (PageFollow $pageFollow) => self::fromEntity($pageFollow), $pageFollows);
    }
}

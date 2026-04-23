<?php

namespace App\Resource;

use App\Entity\{PageParticipant};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PageParticipantResource',
    required: [
        'id',
        'pageId',
        'userId',
        'createdAt',
        'updatedAt',
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
            property: 'pageId',
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
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class PageParticipantResource
{
    public static function fromEntity(PageParticipant $pageParticipant): array
    {
        return [
            'id' => $pageParticipant->id->toString(),
            'pageId' => $pageParticipant->page->id->toString(),
            'userId' => $pageParticipant->user->id->toString(),
            'createdAt' => $pageParticipant->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $pageParticipant->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $pageParticipant->status->value,
        ];
    }
}

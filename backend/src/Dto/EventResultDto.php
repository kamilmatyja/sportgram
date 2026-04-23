<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Type;

#[OA\Schema(
    schema: 'EventResultDto',
    required: ['userId', 'time'],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subResults',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/EventSubResultDto'),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventResultDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    public string $userId;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $time;

    /** @var EventSubResultDto[] */
    #[Assert\Valid]
    #[Type('array<App\Dto\EventSubResultDto>')]
    public array $subResults = [];
}

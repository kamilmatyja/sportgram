<?php

namespace App\Dto;

use App\Enum\NotificationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'NotificationFilterDto',
    required: [],
    properties: [
        new OA\Property(property: 'text', type: 'string', example: 'new message', nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class NotificationFilterDto
{
    #[Assert\Length(min: 1, max: 2048)]
    public ?string $text = null;

    #[Assert\Choice(callback: [NotificationStatusEnum::class, 'values'])]
    public ?int $status = null;
}

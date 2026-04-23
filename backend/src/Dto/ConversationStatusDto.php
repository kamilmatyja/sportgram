<?php

namespace App\Dto;

use App\Enum\ConversationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'ConversationStatusDto',
    required: ['status'],
    properties: [
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class ConversationStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ConversationStatusEnum::class, 'values'])]
    public int $status;
}

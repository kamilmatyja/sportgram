<?php

namespace App\Dto;

use App\Enum\GoalStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['status'],
    properties: [
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class GoalStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [GoalStatusEnum::class, 'values'])]
    public int $status;
}

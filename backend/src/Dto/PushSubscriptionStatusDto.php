<?php

namespace App\Dto;

use App\Enum\PushSubscriptionStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['status'],
    properties: [
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class PushSubscriptionStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [PushSubscriptionStatusEnum::class, 'cases'])]
    public PushSubscriptionStatusEnum $status;
}

<?php

namespace App\Dto;

use App\Enum\PushSubscriptionStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['endpoint', 'p256dh', 'auth', 'status'],
    properties: [
        new OA\Property(property: 'endpoint', type: 'string', example: 'endpoint-url'),
        new OA\Property(property: 'p256dh', type: 'string', example: 'p256dh-key'),
        new OA\Property(property: 'auth', type: 'string', example: 'auth-key'),
        new OA\Property(property: 'userAgent', type: 'string', example: 'user-agent-string'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class PushSubscriptionDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 2048)]
    public string $endpoint;

    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 256)]
    public string $p256dh;

    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 256)]
    public string $auth;

    #[Assert\Length(min: 4, max: 1024)]
    public ?string $userAgent = null;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [PushSubscriptionStatusEnum::class, 'values'])]
    public int $status;
}

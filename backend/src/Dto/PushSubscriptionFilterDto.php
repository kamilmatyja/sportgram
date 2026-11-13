<?php

namespace App\Dto;

use App\Entity\User;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    properties: [
        new OA\Property(property: 'userId', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'endpoint', type: 'string', example: 'endpoint-url', nullable: true),
        new OA\Property(property: 'p256dh', type: 'string', example: 'p256dh-key', nullable: true),
        new OA\Property(property: 'auth', type: 'string', example: 'auth-key', nullable: true),
    ],
    type: 'object',
)]
class PushSubscriptionFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?Uuid $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    public ?string $endpoint = null;

    #[Assert\Length(min: 1, max: 256)]
    public ?string $p256dh = null;

    #[Assert\Length(min: 1, max: 256)]
    public ?string $auth = null;
}

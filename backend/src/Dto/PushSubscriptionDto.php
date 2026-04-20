<?php

namespace App\Dto;

use App\Enum\PushSubscriptionStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'PushSubscriptionDto')]
class PushSubscriptionDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 2048)]
    #[OA\Property(example: 'some-endpoint-url')]
    public string $endpoint;

    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 256)]
    #[OA\Property(example: 'p256dh-key')]
    public string $p256dh;

    #[Assert\NotBlank]
    #[Assert\Length(min: 4, max: 256)]
    #[OA\Property(example: 'auth-key')]
    public string $auth;

    #[Assert\Length(min: 4, max: 1024)]
    #[OA\Property(example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')]
    public ?string $userAgent = null;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [PushSubscriptionStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}

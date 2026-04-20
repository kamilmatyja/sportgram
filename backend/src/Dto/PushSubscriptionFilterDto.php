<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class PushSubscriptionFilterDto
{
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'endpoint-url')]
    public ?string $endpoint = null;

    #[Assert\Length(min: 1, max: 256)]
    #[OA\Property(example: 'p256dh-key')]
    public ?string $p256dh = null;

    #[Assert\Length(min: 1, max: 256)]
    #[OA\Property(example: 'auth-key')]
    public ?string $auth = null;
}

<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['email'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jan@kowalski.pl'),
    ],
    type: 'object',
)]
class UserEmailDto
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(min: 5, max: 64)]
    public string $email;
}

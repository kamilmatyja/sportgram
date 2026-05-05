<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['email', 'password'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jan@kowalski.pl'),
        new OA\Property(property: 'password', type: 'string', example: 'password123'),
    ],
    type: 'object',
)]
class UserSignDto
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(min: 5, max: 64)]
    public string $email;

    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 32)]
    public string $password;
}

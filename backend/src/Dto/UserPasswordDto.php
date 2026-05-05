<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['password', 'code'],
    properties: [
        new OA\Property(property: 'password', type: 'string', example: 'password123'),
        new OA\Property(property: 'code', type: 'integer', example: 213700),
    ],
    type: 'object',
)]
class UserPasswordDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 32)]
    public string $password;

    #[Assert\NotBlank]
    #[Assert\Range(min: 100000, max: 999999)]
    public int $code;
}

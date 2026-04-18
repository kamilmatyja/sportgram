<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'UserPasswordDto')]
class UserPasswordDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 32)]
    #[OA\Property(example: 'password123')]
    public string $password;

    #[Assert\NotBlank]
    #[Assert\Range(min: 100000, max: 999999)]
    #[OA\Property(example: 213700)]
    public int $code;
}

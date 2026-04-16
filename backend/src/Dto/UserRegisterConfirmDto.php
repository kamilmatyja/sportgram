<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema]
class UserRegisterConfirmDto
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(min: 5, max: 64)]
    #[OA\Property(example: 'test@test.pl')]
    public string $email;

    #[Assert\NotBlank]
    #[Assert\Range(min: 100000, max: 999999)]
    #[OA\Property(example: 213700)]
    public int $code;
}

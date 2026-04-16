<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema]
class UserSignConfirmDto
{
    #[Assert\NotBlank]
    #[Assert\Range(min: 100000, max: 999999)]
    #[OA\Property(example: 213700)]
    public int $code;
}

<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'UserCodeDto',
    required: ['code'],
    properties: [
        new OA\Property(property: 'code', type: 'integer', example: 213700),
    ],
    type: 'object',
)]
class UserCodeDto
{
    #[Assert\NotBlank]
    #[Assert\Range(min: 100000, max: 999999)]
    public int $code;
}

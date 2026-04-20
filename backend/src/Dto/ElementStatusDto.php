<?php

namespace App\Dto;

use App\Enum\ElementStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'ElementStatusDto')]
class ElementStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ElementStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}

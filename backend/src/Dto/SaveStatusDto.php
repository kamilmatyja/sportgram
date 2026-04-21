<?php

namespace App\Dto;

use App\Enum\SaveStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class SaveStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [SaveStatusEnum::class, 'values'])]
    #[OA\Property(example: 2)]
    public int $status;
}

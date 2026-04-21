<?php

namespace App\Dto;

use App\Enum\GoalStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class GoalStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [GoalStatusEnum::class, 'values'])]
    #[OA\Property(example: 2)]
    public int $status;
}

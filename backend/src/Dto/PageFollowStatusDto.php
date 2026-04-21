<?php

namespace App\Dto;

use App\Enum\PageFollowStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'PageFollowStatusDto')]
class PageFollowStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [PageFollowStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}

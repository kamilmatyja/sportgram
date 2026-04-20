<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class NotificationIndexDto
{
    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    #[OA\Property(example: 1)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    #[OA\Property(example: 10)]
    public int $limit = 10;

    #[Assert\Regex(pattern: '/^(text|status|createdAt)(:(asc|desc))?$/')]
    #[OA\Property(example: 'createdAt:desc')]
    public ?string $sort = null;

    #[Assert\Valid]
    public NotificationFilterDto $filter;

    public function __construct()
    {
        $this->filter = new NotificationFilterDto();
    }
}

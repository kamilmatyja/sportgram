<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class UserListDto
{
    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    #[OA\Property(example: 1)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    #[OA\Property(example: 10)]
    public int $limit = 10;

    #[Assert\Regex(
        pattern: '/^(firstName|lastName|gender|country|birthAt)(:(asc|desc))?$/',
        message: 'Invalid sort format',
    )]
    #[OA\Property(example: 'firstName:asc')]
    public ?string $sort = null;

    #[Assert\Valid]
    public UserFilterDto $filter;

    public function __construct()
    {
        $this->filter = new UserFilterDto();
    }
}

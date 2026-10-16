<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\DisciplineEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    properties: [
        new OA\Property(
            property: 'userIds',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            nullable: true,
        ),
        new OA\Property(property: 'discipline', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'distance', type: 'integer', example: 100, nullable: true),
    ],
    type: 'object',
)]
class StatisticFilterDto
{
    /** @var Uuid[] */
    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $userIds = [];

    #[Assert\Choice(callback: [DisciplineEnum::class, 'cases'])]
    public ?DisciplineEnum $discipline = null;

    #[Assert\Positive]
    public ?int $distance = null;

    final public function addUserId(Uuid $userId): void
    {
        $this->userIds[] = $userId;
    }
}

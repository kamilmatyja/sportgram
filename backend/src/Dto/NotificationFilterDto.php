<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\NotificationStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    properties: [
        new OA\Property(property: 'userId', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'text', type: 'string', example: 'new message', nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class NotificationFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?Uuid $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    public ?string $text = null;

    #[Assert\Choice(callback: [NotificationStatusEnum::class, 'cases'])]
    public ?NotificationStatusEnum $status = null;
}

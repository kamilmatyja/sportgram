<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PageParticipant;
use App\Enum\SaveStatusEnum;

final class PageParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = []): PageParticipant
    {
        $defaults = [
            'page' => PageFactory::make(),
            'user' => UserFactory::make(),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new PageParticipant(
            $data['page'],
            $data['user'],
            $data['status'],
        );
    }
}

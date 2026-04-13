<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PageParticipant;

final class PageParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = []): PageParticipant
    {
        $defaults = [
            'page' => PageFactory::make(),
            'user' => UserFactory::make(),
        ];

        $data = array_replace($defaults, $overrides);

        return new PageParticipant(
            $data['page'],
            $data['user']
        );
    }
}

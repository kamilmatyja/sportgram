<?php

namespace App\Event;

use App\Entity\User;
use App\Enum\NotificationTypeEnum;

readonly class NotificationEvent
{
    public function __construct(
        private User $user,
        private NotificationTypeEnum $type,
        private string $text,
        private ?string $link,
    ) {
    }

    final public function getUser(): User
    {
        return $this->user;
    }

    final public function getType(): NotificationTypeEnum
    {
        return $this->type;
    }

    final public function getText(): string
    {
        return $this->text;
    }

    final public function getLink(): ?string
    {
        return $this->link;
    }
}

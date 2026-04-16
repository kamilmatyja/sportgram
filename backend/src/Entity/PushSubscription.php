<?php

namespace App\Entity;

use App\Enum\PushSubscriptionStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'push_subscriptions')]
#[ORM\HasLifecycleCallbacks]
class PushSubscription
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null {
        get {
            return $this->id;
        }
    }

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    public User $user {
        get {
            return $this->user;
        }
    }

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt {
        get {
            return $this->createdAt;
        }
    }

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt {
        get {
            return $this->updatedAt;
        }
    }

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null {
        get {
            return $this->deletedAt;
        }
    }

    #[ORM\Column(name: 'endpoint', type: 'text', length: 2048)]
    public string $endpoint {
        get {
            return $this->endpoint;
        }
    }

    #[ORM\Column(name: 'p256dh', length: 256)]
    public string $p256dh {
        get {
            return $this->p256dh;
        }
    }

    #[ORM\Column(name: 'auth', length: 256)]
    public string $auth {
        get {
            return $this->auth;
        }
    }

    #[ORM\Column(name: 'user_agent', type: 'text', length: 1024, nullable: true)]
    public ?string $userAgent = null {
        get {
            return $this->userAgent;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: PushSubscriptionStatusEnum::class)]
    public PushSubscriptionStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(
        User $user,
        string $endpoint,
        string $p256dh,
        string $auth,
        ?string $userAgent,
        PushSubscriptionStatusEnum $status,
    ) {
        $this->user = $user;
        $this->endpoint = $endpoint;
        $this->p256dh = $p256dh;
        $this->auth = $auth;
        $this->userAgent = $userAgent;
        $this->status = $status;
    }

    #[ORM\PrePersist]
    final public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    final public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}

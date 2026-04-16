<?php

namespace App\Entity;

use App\Enum\UnauthorizedStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'user_registers')]
#[ORM\HasLifecycleCallbacks]
class UserRegister
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    public ?Uuid $id = null {
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
    public DateTimeImmutable $createdAt {
        get {
            return $this->createdAt;
        }
    }

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    public DateTimeImmutable $updatedAt {
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

    #[ORM\Column(name: 'code', type: 'integer', length: 6)]
    public int $code {
        get {
            return $this->code;
        }
    }

    #[ORM\Column(name: 'attempt', type: 'integer', length: 4)]
    public int $attempt {
        get {
            return $this->attempt;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: UnauthorizedStatusEnum::class)]
    public UnauthorizedStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(
        User $user,
        int $code,
        int $attempt,
        UnauthorizedStatusEnum $status,
    ) {
        $this->user = $user;
        $this->code = $code;
        $this->attempt = $attempt;
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

    final public function softDelete(): void
    {
        $this->deletedAt = new DateTimeImmutable();
    }

    final public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }
}

<?php

namespace App\Entity;

use App\Enum\ConversationStatusEnum;
use App\Repository\ConversationRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ConversationRepository::class)]
#[ORM\Table(name: 'conversations')]
#[ORM\HasLifecycleCallbacks]
class Conversation
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

    #[ORM\ManyToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'sender_user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public User $senderUser {
        get {
            return $this->senderUser;
        }
    }

    #[ORM\ManyToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'receiver_user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public User $receiverUser {
        get {
            return $this->receiverUser;
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

    #[ORM\Column(name: 'text', type: 'text', length: 2048)]
    public string $text {
        get {
            return $this->text;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ConversationStatusEnum::class)]
    public ConversationStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(User $senderUser, User $receiverUser, string $text, ConversationStatusEnum $status)
    {
        $this->senderUser = $senderUser;
        $this->receiverUser = $receiverUser;
        $this->text = $text;
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

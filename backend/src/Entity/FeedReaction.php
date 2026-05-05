<?php

namespace App\Entity;

use App\Enum\{ElementStatusEnum,FeedReactionEnum};
use App\Repository\FeedReactionRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: FeedReactionRepository::class)]
#[ORM\Table(name: 'feed_reactions')]
#[ORM\HasLifecycleCallbacks]
class FeedReaction
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

    #[ORM\ManyToOne(targetEntity: Feed::class, cascade: ['persist'], inversedBy: 'reactions')]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public Feed $feed {
        get {
            return $this->feed;
        }
    }

    #[ORM\ManyToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
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

    #[ORM\Column(name: 'reaction', type: 'integer', enumType: FeedReactionEnum::class)]
    public FeedReactionEnum $reaction {
        get {
            return $this->reaction;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    public ElementStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(
        Feed $feed,
        User $user,
        FeedReactionEnum $reaction,
        ElementStatusEnum $status,
    ) {
        $this->feed = $feed;
        $this->user = $user;
        $this->reaction = $reaction;
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

<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use App\Repository\FeedCommentRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: FeedCommentRepository::class)]
#[ORM\Table(name: 'feed_comments')]
#[ORM\HasLifecycleCallbacks]
class FeedComment
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

    #[ORM\ManyToOne(targetEntity: Feed::class, cascade: ['persist'], inversedBy: 'comments')]
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

    #[ORM\Column(name: 'text', type: 'text', length: 2048)]
    public string $text {
        get {
            return $this->text;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    public ElementStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(Feed $feed, User $user, string $text, ElementStatusEnum $status)
    {
        $this->feed = $feed;
        $this->user = $user;
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

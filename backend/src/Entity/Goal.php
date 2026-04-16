<?php

namespace App\Entity;

use App\Enum\{DisciplineEnum, GoalStatusEnum};
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'goals')]
#[ORM\HasLifecycleCallbacks]
class Goal
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

    #[ORM\ManyToOne(targetEntity: Feed::class)]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false)]
    public Feed $feed {
        get {
            return $this->feed;
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

    #[ORM\Column(name: 'started_at', type: 'datetime_immutable', nullable: true)]
    public ?DateTimeImmutable $startedAt = null {
        get {
            return $this->startedAt;
        }
    }

    #[ORM\Column(name: 'ended_at', type: 'datetime_immutable', nullable: true)]
    public ?DateTimeImmutable $endedAt = null {
        get {
            return $this->endedAt;
        }
    }

    #[ORM\Column(name: 'text', type: 'text', length: 2048)]
    public string $text {
        get {
            return $this->text;
        }
    }

    #[ORM\Column(name: 'link', type: 'text', length: 64, unique: true)]
    public string $link {
        get {
            return $this->link;
        }
    }

    #[ORM\Column(name: 'discipline', type: 'integer', enumType: DisciplineEnum::class)]
    public DisciplineEnum $discipline {
        get {
            return $this->discipline;
        }
    }

    #[ORM\Column(name: 'distance', type: 'integer')]
    public int $distance {
        get {
            return $this->distance;
        }
    }

    #[ORM\Column(name: 'time', type: 'integer', nullable: true)]
    public ?int $time = null {
        get {
            return $this->time;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: GoalStatusEnum::class)]
    public GoalStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(
        Feed $feed,
        User $user,
        ?DateTimeImmutable $startedAt,
        ?DateTimeImmutable $endedAt,
        string $text,
        string $link,
        DisciplineEnum $discipline,
        int $distance,
        ?int $time,
        GoalStatusEnum $status,
    ) {
        $this->feed = $feed;
        $this->user = $user;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->text = $text;
        $this->link = $link;
        $this->discipline = $discipline;
        $this->distance = $distance;
        $this->time = $time;
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

<?php

namespace App\Entity;

use App\Enum\SaveStatusEnum;
use App\Repository\GoalParticipantResultRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: GoalParticipantResultRepository::class)]
#[ORM\Table(name: 'goal_participant_results')]
#[ORM\HasLifecycleCallbacks]
class GoalParticipantResult
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

    #[ORM\ManyToOne(targetEntity: GoalParticipant::class, cascade: ['persist'], inversedBy: 'results')]
    #[ORM\JoinColumn(name: 'goal_participant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public GoalParticipant $goalParticipant {
        get {
            return $this->goalParticipant;
        }
    }

    #[ORM\ManyToOne(targetEntity: Feed::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public Feed $feed {
        get {
            return $this->feed;
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

    #[ORM\Column(name: 'distance', type: 'integer')]
    public int $distance {
        get {
            return $this->distance;
        }
    }

    #[ORM\Column(name: 'time', type: 'integer')]
    public int $time {
        get {
            return $this->time;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: SaveStatusEnum::class)]
    public SaveStatusEnum $status {
        get {
            return $this->status;
        }
    }

    public function __construct(
        GoalParticipant $goalParticipant,
        Feed $feed,
        int $distance,
        int $time,
        SaveStatusEnum $status,
    ) {
        $this->goalParticipant = $goalParticipant;
        $this->feed = $feed;
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

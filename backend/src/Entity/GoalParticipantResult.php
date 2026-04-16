<?php

namespace App\Entity;

use App\Enum\SaveStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
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

    #[ORM\ManyToOne(targetEntity: GoalParticipant::class)]
    #[ORM\JoinColumn(name: 'goal_participant_id', referencedColumnName: 'id', nullable: false)]
    public GoalParticipant $goalParticipant {
        get {
            return $this->goalParticipant;
        }
    }

    #[ORM\ManyToOne(targetEntity: Feed::class)]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false)]
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

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null {
        get {
            return $this->deletedAt;
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
        SaveStatusEnum $status,
    ) {
        $this->goalParticipant = $goalParticipant;
        $this->feed = $feed;
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

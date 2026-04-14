<?php

namespace App\Entity;

use App\Enum\ParticipantStatusEnum;
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
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: GoalParticipant::class)]
    #[ORM\JoinColumn(name: 'goal_participant_id', referencedColumnName: 'id', nullable: false)]
    private GoalParticipant $goalParticipant;
    #[ORM\ManyToOne(targetEntity: Feed::class)]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false)]
    private Feed $feed;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'status', type: 'integer', enumType: ParticipantStatusEnum::class)]
    private ParticipantStatusEnum $status;

    public function __construct(
        GoalParticipant $goalParticipant,
        Feed $feed,
        ParticipantStatusEnum $status,
    ) {
        $this->goalParticipant = $goalParticipant;
        $this->feed = $feed;
        $this->status = $status;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getGoalParticipant(): GoalParticipant
    {
        return $this->goalParticipant;
    }

    public function getFeed(): Feed
    {
        return $this->feed;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function getStatus(): ParticipantStatusEnum
    {
        return $this->status;
    }
}

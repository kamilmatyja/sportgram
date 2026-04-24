<?php

namespace App\Entity;

use App\Enum\SaveStatusEnum;
use App\Repository\GoalParticipantRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: GoalParticipantRepository::class)]
#[ORM\Table(name: 'goal_participants')]
#[ORM\HasLifecycleCallbacks]
class GoalParticipant
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

    #[ORM\ManyToOne(targetEntity: Goal::class, inversedBy: 'participants')]
    #[ORM\JoinColumn(name: 'goal_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public Goal $goal {
        get {
            return $this->goal;
        }
    }

    #[ORM\ManyToOne(targetEntity: User::class)]
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

    #[ORM\Column(name: 'status', type: 'integer', enumType: SaveStatusEnum::class)]
    public SaveStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var GoalParticipantResult[] */
    #[ORM\OneToMany(targetEntity: GoalParticipantResult::class, mappedBy: 'participant')]
    public Collection $results;

    public function __construct(Goal $goal, User $user, SaveStatusEnum $status)
    {
        $this->goal = $goal;
        $this->user = $user;
        $this->status = $status;
        $this->results = new ArrayCollection();
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

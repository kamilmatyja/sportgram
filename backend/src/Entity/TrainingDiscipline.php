<?php

namespace App\Entity;

use App\Enum\DisciplineEnum;
use App\Repository\TrainingDisciplineRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TrainingDisciplineRepository::class)]
#[ORM\Table(name: 'training_disciplines')]
#[ORM\HasLifecycleCallbacks]
class TrainingDiscipline
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

    #[ORM\ManyToOne(targetEntity: TrainingParticipant::class)]
    #[ORM\JoinColumn(name: 'training_participant_id', referencedColumnName: 'id', nullable: false)]
    public TrainingParticipant $trainingParticipant {
        get {
            return $this->trainingParticipant;
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

    #[ORM\Column(name: 'discipline', type: 'integer', enumType: DisciplineEnum::class)]
    public DisciplineEnum $discipline {
        get {
            return $this->discipline;
        }
    }

    public function __construct(TrainingParticipant $trainingParticipant, DisciplineEnum $discipline)
    {
        $this->trainingParticipant = $trainingParticipant;
        $this->discipline = $discipline;
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

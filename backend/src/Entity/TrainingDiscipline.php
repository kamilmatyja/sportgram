<?php

namespace App\Entity;

use App\Enum\DisciplineEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'training_disciplines')]
#[ORM\HasLifecycleCallbacks]
class TrainingDiscipline
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: TrainingParticipant::class)]
    #[ORM\JoinColumn(name: 'training_participant_id', referencedColumnName: 'id', nullable: false)]
    private TrainingParticipant $trainingParticipant;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'discipline', type: 'integer', enumType: DisciplineEnum::class)]
    private DisciplineEnum $discipline;

    public function __construct(TrainingParticipant $trainingParticipant, DisciplineEnum $discipline)
    {
        $this->trainingParticipant = $trainingParticipant;
        $this->discipline = $discipline;
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

    public function getTrainingParticipant(): TrainingParticipant
    {
        return $this->trainingParticipant;
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

    public function getDiscipline(): DisciplineEnum
    {
        return $this->discipline;
    }
}

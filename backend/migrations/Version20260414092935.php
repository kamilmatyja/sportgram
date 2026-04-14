<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260414092935 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE goal_participants ADD status INT NOT NULL');
        $this->addSql('ALTER TABLE notifications ADD link TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE page_participants ADD status INT NOT NULL');
        $this->addSql('ALTER TABLE training_participants ADD status INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE goal_participants DROP status');
        $this->addSql('ALTER TABLE notifications DROP link');
        $this->addSql('ALTER TABLE page_participants DROP status');
        $this->addSql('ALTER TABLE training_participants DROP status');
    }
}

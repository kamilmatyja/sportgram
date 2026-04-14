<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260414144225 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE UNIQUE INDEX UNIQ_5387574A36AC99F1 ON events (link)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C7241E2F36AC99F1 ON goals (link)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6000B0D336AC99F1 ON notifications (link)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_2074E57536AC99F1 ON pages (link)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_66DC433036AC99F1 ON trainings (link)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX UNIQ_5387574A36AC99F1');
        $this->addSql('DROP INDEX UNIQ_C7241E2F36AC99F1');
        $this->addSql('DROP INDEX UNIQ_6000B0D336AC99F1');
        $this->addSql('DROP INDEX UNIQ_2074E57536AC99F1');
        $this->addSql('DROP INDEX UNIQ_66DC433036AC99F1');
    }
}

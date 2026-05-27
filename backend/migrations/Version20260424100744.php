<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260424100744 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conversation_activity DROP CONSTRAINT fk_4c3ab64a2a98155e');
        $this->addSql('ALTER TABLE conversation_activity DROP CONSTRAINT fk_4c3ab64ada57e237');
        $this->addSql('ALTER TABLE conversation_activity DROP deleted_at');
        $this->addSql(
            'ALTER TABLE conversation_activity ADD CONSTRAINT FK_4C3AB64A2A98155E FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE conversation_activity ADD CONSTRAINT FK_4C3AB64ADA57E237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE conversations DROP CONSTRAINT fk_c2521bf12a98155e');
        $this->addSql('ALTER TABLE conversations DROP CONSTRAINT fk_c2521bf1da57e237');
        $this->addSql('ALTER TABLE conversations DROP deleted_at');
        $this->addSql(
            'ALTER TABLE conversations ADD CONSTRAINT FK_C2521BF12A98155E FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE conversations ADD CONSTRAINT FK_C2521BF1DA57E237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE entries DROP CONSTRAINT fk_2df8b3c5a76ed395');
        $this->addSql('ALTER TABLE entries DROP deleted_at');
        $this->addSql(
            'ALTER TABLE entries ADD CONSTRAINT FK_2DF8B3C5A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE event_discipline_distances DROP CONSTRAINT fk_5a83c853810b97ad');
        $this->addSql('ALTER TABLE event_discipline_distances DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_discipline_distances ADD CONSTRAINT FK_5A83C853810B97AD FOREIGN KEY (event_discipline_id) REFERENCES event_disciplines (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT fk_6951cf258a47c642');
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT fk_6951cf2551a5bc03');
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT fk_6951cf25a76ed395');
        $this->addSql('ALTER TABLE event_discipline_lists DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT FK_6951CF258A47C642 FOREIGN KEY (event_discipline_distance_id) REFERENCES event_discipline_distances (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT FK_6951CF2551A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT FK_6951CF25A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT fk_cf4b4cdc51a5bc03');
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT fk_cf4b4cdca76ed395');
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT fk_cf4b4cdc8a47c642');
        $this->addSql('DROP INDEX idx_cf4b4cdc8a47c642');
        $this->addSql('ALTER TABLE event_discipline_results DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_discipline_results RENAME COLUMN event_discipline_distance_id TO event_discipline_list_id',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT FK_CF4B4CDC51A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT FK_CF4B4CDCA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT FK_CF4B4CDC6D46BE43 FOREIGN KEY (event_discipline_list_id) REFERENCES event_discipline_lists (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('CREATE INDEX IDX_CF4B4CDC6D46BE43 ON event_discipline_results (event_discipline_list_id)');
        $this->addSql('ALTER TABLE event_discipline_sub_distances DROP CONSTRAINT fk_513ba7708a47c642');
        $this->addSql('ALTER TABLE event_discipline_sub_distances DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_discipline_sub_distances ADD CONSTRAINT FK_513BA7708A47C642 FOREIGN KEY (event_discipline_distance_id) REFERENCES event_discipline_distances (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP CONSTRAINT fk_79255ac1e9e3c652');
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP CONSTRAINT fk_79255ac1a76ed395');
        $this->addSql('ALTER TABLE event_discipline_sub_results ADD event_discipline_result_id UUID NOT NULL');
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD CONSTRAINT FK_79255AC1E9E3C652 FOREIGN KEY (event_discipline_sub_distance_id) REFERENCES event_discipline_sub_distances (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD CONSTRAINT FK_79255AC1A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD CONSTRAINT FK_79255AC1DC899037 FOREIGN KEY (event_discipline_result_id) REFERENCES event_discipline_results (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('CREATE INDEX IDX_79255AC1DC899037 ON event_discipline_sub_results (event_discipline_result_id)');
        $this->addSql('ALTER TABLE event_disciplines DROP CONSTRAINT fk_6948f5871f7e88b');
        $this->addSql('ALTER TABLE event_disciplines DROP deleted_at');
        $this->addSql(
            'ALTER TABLE event_disciplines ADD CONSTRAINT FK_6948F5871F7E88B FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE events DROP CONSTRAINT fk_5387574a2c86034d');
        $this->addSql('ALTER TABLE events DROP deleted_at');
        $this->addSql(
            'ALTER TABLE events ADD CONSTRAINT FK_5387574A2C86034D FOREIGN KEY (page_participant_id) REFERENCES page_participants (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE feed_comments DROP CONSTRAINT fk_7f4b018d51a5bc03');
        $this->addSql('ALTER TABLE feed_comments DROP CONSTRAINT fk_7f4b018da76ed395');
        $this->addSql('ALTER TABLE feed_comments DROP deleted_at');
        $this->addSql(
            'ALTER TABLE feed_comments ADD CONSTRAINT FK_7F4B018D51A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE feed_comments ADD CONSTRAINT FK_7F4B018DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE feed_reactions DROP CONSTRAINT fk_70e19c6f51a5bc03');
        $this->addSql('ALTER TABLE feed_reactions DROP CONSTRAINT fk_70e19c6fa76ed395');
        $this->addSql('ALTER TABLE feed_reactions DROP deleted_at');
        $this->addSql(
            'ALTER TABLE feed_reactions ADD CONSTRAINT FK_70E19C6F51A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE feed_reactions ADD CONSTRAINT FK_70E19C6FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE feeds DROP CONSTRAINT fk_5a29f52fa76ed395');
        $this->addSql('ALTER TABLE feeds DROP deleted_at');
        $this->addSql(
            'ALTER TABLE feeds ADD CONSTRAINT FK_5A29F52FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE friends DROP CONSTRAINT fk_21ee70692a98155e');
        $this->addSql('ALTER TABLE friends DROP CONSTRAINT fk_21ee7069da57e237');
        $this->addSql('ALTER TABLE friends DROP deleted_at');
        $this->addSql(
            'ALTER TABLE friends ADD CONSTRAINT FK_21EE70692A98155E FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE friends ADD CONSTRAINT FK_21EE7069DA57E237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE goal_participant_results DROP CONSTRAINT fk_4c201ef916981853');
        $this->addSql('ALTER TABLE goal_participant_results DROP CONSTRAINT fk_4c201ef951a5bc03');
        $this->addSql('ALTER TABLE goal_participant_results ADD distance INT NOT NULL');
        $this->addSql('ALTER TABLE goal_participant_results ADD time INT NOT NULL');
        $this->addSql('ALTER TABLE goal_participant_results DROP deleted_at');
        $this->addSql(
            'ALTER TABLE goal_participant_results ADD CONSTRAINT FK_4C201EF916981853 FOREIGN KEY (goal_participant_id) REFERENCES goal_participants (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE goal_participant_results ADD CONSTRAINT FK_4C201EF951A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE goal_participants DROP CONSTRAINT fk_5498e4f3667d1afe');
        $this->addSql('ALTER TABLE goal_participants DROP CONSTRAINT fk_5498e4f3a76ed395');
        $this->addSql('ALTER TABLE goal_participants DROP deleted_at');
        $this->addSql(
            'ALTER TABLE goal_participants ADD CONSTRAINT FK_5498E4F3667D1AFE FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE goal_participants ADD CONSTRAINT FK_5498E4F3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE goals DROP CONSTRAINT fk_c7241e2f51a5bc03');
        $this->addSql('ALTER TABLE goals DROP CONSTRAINT fk_c7241e2fa76ed395');
        $this->addSql('ALTER TABLE goals DROP deleted_at');
        $this->addSql(
            'ALTER TABLE goals ADD CONSTRAINT FK_C7241E2F51A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE goals ADD CONSTRAINT FK_C7241E2FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT fk_6000b0d3a76ed395');
        $this->addSql('ALTER TABLE notifications DROP deleted_at');
        $this->addSql(
            'ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE page_follows DROP CONSTRAINT fk_b10361e6c4663e4');
        $this->addSql('ALTER TABLE page_follows DROP CONSTRAINT fk_b10361e6a76ed395');
        $this->addSql('ALTER TABLE page_follows DROP deleted_at');
        $this->addSql(
            'ALTER TABLE page_follows ADD CONSTRAINT FK_B10361E6C4663E4 FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE page_follows ADD CONSTRAINT FK_B10361E6A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE page_participants DROP CONSTRAINT fk_cf75dcdcc4663e4');
        $this->addSql('ALTER TABLE page_participants DROP CONSTRAINT fk_cf75dcdca76ed395');
        $this->addSql('ALTER TABLE page_participants DROP deleted_at');
        $this->addSql(
            'ALTER TABLE page_participants ADD CONSTRAINT FK_CF75DCDCC4663E4 FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE page_participants ADD CONSTRAINT FK_CF75DCDCA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE pages DROP CONSTRAINT fk_2074e575a76ed395');
        $this->addSql('ALTER TABLE pages DROP deleted_at');
        $this->addSql(
            'ALTER TABLE pages ADD CONSTRAINT FK_2074E575A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE push_subscriptions DROP CONSTRAINT fk_3fec449da76ed395');
        $this->addSql('ALTER TABLE push_subscriptions DROP deleted_at');
        $this->addSql(
            'ALTER TABLE push_subscriptions ADD CONSTRAINT FK_3FEC449DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE stories DROP CONSTRAINT fk_9c8b9d5fa76ed395');
        $this->addSql('ALTER TABLE stories DROP deleted_at');
        $this->addSql(
            'ALTER TABLE stories ADD CONSTRAINT FK_9C8B9D5FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE training_discipline_distances DROP CONSTRAINT fk_9cdb1da0dbfb4890');
        $this->addSql('ALTER TABLE training_discipline_distances DROP deleted_at');
        $this->addSql(
            'ALTER TABLE training_discipline_distances ADD CONSTRAINT FK_9CDB1DA0DBFB4890 FOREIGN KEY (training_discipline_id) REFERENCES training_disciplines (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE training_discipline_sub_distances DROP CONSTRAINT fk_4ecf593b436f943f');
        $this->addSql('ALTER TABLE training_discipline_sub_distances DROP deleted_at');
        $this->addSql(
            'ALTER TABLE training_discipline_sub_distances ADD CONSTRAINT FK_4ECF593B436F943F FOREIGN KEY (training_discipline_distance_id) REFERENCES training_discipline_distances (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE training_disciplines DROP CONSTRAINT fk_976260f1a6a3aa4');
        $this->addSql('DROP INDEX idx_976260f1a6a3aa4');
        $this->addSql('ALTER TABLE training_disciplines DROP deleted_at');
        $this->addSql('ALTER TABLE training_disciplines RENAME COLUMN training_participant_id TO training_id');
        $this->addSql(
            'ALTER TABLE training_disciplines ADD CONSTRAINT FK_976260FBEFD98D1 FOREIGN KEY (training_id) REFERENCES trainings (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('CREATE INDEX IDX_976260FBEFD98D1 ON training_disciplines (training_id)');
        $this->addSql('ALTER TABLE training_participants DROP CONSTRAINT fk_697a5c9fbefd98d1');
        $this->addSql('ALTER TABLE training_participants DROP CONSTRAINT fk_697a5c9fa76ed395');
        $this->addSql('ALTER TABLE training_participants DROP deleted_at');
        $this->addSql(
            'ALTER TABLE training_participants ADD CONSTRAINT FK_697A5C9FBEFD98D1 FOREIGN KEY (training_id) REFERENCES trainings (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE training_participants ADD CONSTRAINT FK_697A5C9FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE trainings DROP CONSTRAINT fk_66dc433051a5bc03');
        $this->addSql('ALTER TABLE trainings DROP CONSTRAINT fk_66dc4330a76ed395');
        $this->addSql('ALTER TABLE trainings DROP deleted_at');
        $this->addSql(
            'ALTER TABLE trainings ADD CONSTRAINT FK_66DC433051A5BC03 FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql(
            'ALTER TABLE trainings ADD CONSTRAINT FK_66DC4330A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE user_disciplines DROP CONSTRAINT fk_406954da76ed395');
        $this->addSql('ALTER TABLE user_disciplines DROP deleted_at');
        $this->addSql(
            'ALTER TABLE user_disciplines ADD CONSTRAINT FK_406954DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE user_password_resets DROP CONSTRAINT fk_8c06922ea76ed395');
        $this->addSql('ALTER TABLE user_password_resets DROP deleted_at');
        $this->addSql(
            'ALTER TABLE user_password_resets ADD CONSTRAINT FK_8C06922EA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE user_registers DROP CONSTRAINT fk_16b6fd2a76ed395');
        $this->addSql('ALTER TABLE user_registers DROP deleted_at');
        $this->addSql(
            'ALTER TABLE user_registers ADD CONSTRAINT FK_16B6FD2A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE user_roles DROP CONSTRAINT fk_54fcd59fa76ed395');
        $this->addSql('ALTER TABLE user_roles DROP deleted_at');
        $this->addSql(
            'ALTER TABLE user_roles ADD CONSTRAINT FK_54FCD59FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE user_signs DROP CONSTRAINT fk_a35695d9a76ed395');
        $this->addSql('ALTER TABLE user_signs DROP deleted_at');
        $this->addSql(
            'ALTER TABLE user_signs ADD CONSTRAINT FK_A35695D9A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE',
        );
        $this->addSql('ALTER TABLE users DROP deleted_at');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conversation_activity DROP CONSTRAINT FK_4C3AB64A2A98155E');
        $this->addSql('ALTER TABLE conversation_activity DROP CONSTRAINT FK_4C3AB64ADA57E237');
        $this->addSql('ALTER TABLE conversation_activity ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE conversation_activity ADD CONSTRAINT fk_4c3ab64a2a98155e FOREIGN KEY (sender_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE conversation_activity ADD CONSTRAINT fk_4c3ab64ada57e237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE conversations DROP CONSTRAINT FK_C2521BF12A98155E');
        $this->addSql('ALTER TABLE conversations DROP CONSTRAINT FK_C2521BF1DA57E237');
        $this->addSql('ALTER TABLE conversations ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE conversations ADD CONSTRAINT fk_c2521bf12a98155e FOREIGN KEY (sender_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE conversations ADD CONSTRAINT fk_c2521bf1da57e237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE entries DROP CONSTRAINT FK_2DF8B3C5A76ED395');
        $this->addSql('ALTER TABLE entries ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE entries ADD CONSTRAINT fk_2df8b3c5a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE event_discipline_distances DROP CONSTRAINT FK_5A83C853810B97AD');
        $this->addSql(
            'ALTER TABLE event_discipline_distances ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_distances ADD CONSTRAINT fk_5a83c853810b97ad FOREIGN KEY (event_discipline_id) REFERENCES event_disciplines (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT FK_6951CF258A47C642');
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT FK_6951CF2551A5BC03');
        $this->addSql('ALTER TABLE event_discipline_lists DROP CONSTRAINT FK_6951CF25A76ED395');
        $this->addSql('ALTER TABLE event_discipline_lists ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT fk_6951cf258a47c642 FOREIGN KEY (event_discipline_distance_id) REFERENCES event_discipline_distances (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT fk_6951cf2551a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_lists ADD CONSTRAINT fk_6951cf25a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT FK_CF4B4CDC51A5BC03');
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT FK_CF4B4CDCA76ED395');
        $this->addSql('ALTER TABLE event_discipline_results DROP CONSTRAINT FK_CF4B4CDC6D46BE43');
        $this->addSql('DROP INDEX IDX_CF4B4CDC6D46BE43');
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results RENAME COLUMN event_discipline_list_id TO event_discipline_distance_id',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT fk_cf4b4cdc51a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT fk_cf4b4cdca76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_results ADD CONSTRAINT fk_cf4b4cdc8a47c642 FOREIGN KEY (event_discipline_distance_id) REFERENCES event_discipline_distances (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('CREATE INDEX idx_cf4b4cdc8a47c642 ON event_discipline_results (event_discipline_distance_id)');
        $this->addSql('ALTER TABLE event_discipline_sub_distances DROP CONSTRAINT FK_513BA7708A47C642');
        $this->addSql(
            'ALTER TABLE event_discipline_sub_distances ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_sub_distances ADD CONSTRAINT fk_513ba7708a47c642 FOREIGN KEY (event_discipline_distance_id) REFERENCES event_discipline_distances (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP CONSTRAINT FK_79255AC1E9E3C652');
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP CONSTRAINT FK_79255AC1A76ED395');
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP CONSTRAINT FK_79255AC1DC899037');
        $this->addSql('DROP INDEX IDX_79255AC1DC899037');
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql('ALTER TABLE event_discipline_sub_results DROP event_discipline_result_id');
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD CONSTRAINT fk_79255ac1e9e3c652 FOREIGN KEY (event_discipline_sub_distance_id) REFERENCES event_discipline_sub_distances (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE event_discipline_sub_results ADD CONSTRAINT fk_79255ac1a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE event_disciplines DROP CONSTRAINT FK_6948F5871F7E88B');
        $this->addSql('ALTER TABLE event_disciplines ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE event_disciplines ADD CONSTRAINT fk_6948f5871f7e88b FOREIGN KEY (event_id) REFERENCES events (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE events DROP CONSTRAINT FK_5387574A2C86034D');
        $this->addSql('ALTER TABLE events ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE events ADD CONSTRAINT fk_5387574a2c86034d FOREIGN KEY (page_participant_id) REFERENCES page_participants (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE feed_comments DROP CONSTRAINT FK_7F4B018D51A5BC03');
        $this->addSql('ALTER TABLE feed_comments DROP CONSTRAINT FK_7F4B018DA76ED395');
        $this->addSql('ALTER TABLE feed_comments ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE feed_comments ADD CONSTRAINT fk_7f4b018d51a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE feed_comments ADD CONSTRAINT fk_7f4b018da76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE feed_reactions DROP CONSTRAINT FK_70E19C6F51A5BC03');
        $this->addSql('ALTER TABLE feed_reactions DROP CONSTRAINT FK_70E19C6FA76ED395');
        $this->addSql('ALTER TABLE feed_reactions ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE feed_reactions ADD CONSTRAINT fk_70e19c6f51a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE feed_reactions ADD CONSTRAINT fk_70e19c6fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE feeds DROP CONSTRAINT FK_5A29F52FA76ED395');
        $this->addSql('ALTER TABLE feeds ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE feeds ADD CONSTRAINT fk_5a29f52fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE friends DROP CONSTRAINT FK_21EE70692A98155E');
        $this->addSql('ALTER TABLE friends DROP CONSTRAINT FK_21EE7069DA57E237');
        $this->addSql('ALTER TABLE friends ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE friends ADD CONSTRAINT fk_21ee70692a98155e FOREIGN KEY (sender_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE friends ADD CONSTRAINT fk_21ee7069da57e237 FOREIGN KEY (receiver_user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE goal_participant_results DROP CONSTRAINT FK_4C201EF916981853');
        $this->addSql('ALTER TABLE goal_participant_results DROP CONSTRAINT FK_4C201EF951A5BC03');
        $this->addSql(
            'ALTER TABLE goal_participant_results ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql('ALTER TABLE goal_participant_results DROP distance');
        $this->addSql('ALTER TABLE goal_participant_results DROP time');
        $this->addSql(
            'ALTER TABLE goal_participant_results ADD CONSTRAINT fk_4c201ef916981853 FOREIGN KEY (goal_participant_id) REFERENCES goal_participants (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE goal_participant_results ADD CONSTRAINT fk_4c201ef951a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE goal_participants DROP CONSTRAINT FK_5498E4F3667D1AFE');
        $this->addSql('ALTER TABLE goal_participants DROP CONSTRAINT FK_5498E4F3A76ED395');
        $this->addSql('ALTER TABLE goal_participants ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE goal_participants ADD CONSTRAINT fk_5498e4f3667d1afe FOREIGN KEY (goal_id) REFERENCES goals (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE goal_participants ADD CONSTRAINT fk_5498e4f3a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE goals DROP CONSTRAINT FK_C7241E2F51A5BC03');
        $this->addSql('ALTER TABLE goals DROP CONSTRAINT FK_C7241E2FA76ED395');
        $this->addSql('ALTER TABLE goals ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE goals ADD CONSTRAINT fk_c7241e2f51a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE goals ADD CONSTRAINT fk_c7241e2fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT FK_6000B0D3A76ED395');
        $this->addSql('ALTER TABLE notifications ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE notifications ADD CONSTRAINT fk_6000b0d3a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE page_follows DROP CONSTRAINT FK_B10361E6C4663E4');
        $this->addSql('ALTER TABLE page_follows DROP CONSTRAINT FK_B10361E6A76ED395');
        $this->addSql('ALTER TABLE page_follows ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE page_follows ADD CONSTRAINT fk_b10361e6c4663e4 FOREIGN KEY (page_id) REFERENCES pages (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE page_follows ADD CONSTRAINT fk_b10361e6a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE page_participants DROP CONSTRAINT FK_CF75DCDCC4663E4');
        $this->addSql('ALTER TABLE page_participants DROP CONSTRAINT FK_CF75DCDCA76ED395');
        $this->addSql('ALTER TABLE page_participants ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE page_participants ADD CONSTRAINT fk_cf75dcdcc4663e4 FOREIGN KEY (page_id) REFERENCES pages (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE page_participants ADD CONSTRAINT fk_cf75dcdca76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE pages DROP CONSTRAINT FK_2074E575A76ED395');
        $this->addSql('ALTER TABLE pages ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE pages ADD CONSTRAINT fk_2074e575a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE push_subscriptions DROP CONSTRAINT FK_3FEC449DA76ED395');
        $this->addSql('ALTER TABLE push_subscriptions ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE push_subscriptions ADD CONSTRAINT fk_3fec449da76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE stories DROP CONSTRAINT FK_9C8B9D5FA76ED395');
        $this->addSql('ALTER TABLE stories ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE stories ADD CONSTRAINT fk_9c8b9d5fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE training_discipline_distances DROP CONSTRAINT FK_9CDB1DA0DBFB4890');
        $this->addSql(
            'ALTER TABLE training_discipline_distances ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql(
            'ALTER TABLE training_discipline_distances ADD CONSTRAINT fk_9cdb1da0dbfb4890 FOREIGN KEY (training_discipline_id) REFERENCES training_disciplines (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE training_discipline_sub_distances DROP CONSTRAINT FK_4ECF593B436F943F');
        $this->addSql(
            'ALTER TABLE training_discipline_sub_distances ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL',
        );
        $this->addSql(
            'ALTER TABLE training_discipline_sub_distances ADD CONSTRAINT fk_4ecf593b436f943f FOREIGN KEY (training_discipline_distance_id) REFERENCES training_discipline_distances (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE training_disciplines DROP CONSTRAINT FK_976260FBEFD98D1');
        $this->addSql('DROP INDEX IDX_976260FBEFD98D1');
        $this->addSql('ALTER TABLE training_disciplines ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE training_disciplines RENAME COLUMN training_id TO training_participant_id');
        $this->addSql(
            'ALTER TABLE training_disciplines ADD CONSTRAINT fk_976260f1a6a3aa4 FOREIGN KEY (training_participant_id) REFERENCES training_participants (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('CREATE INDEX idx_976260f1a6a3aa4 ON training_disciplines (training_participant_id)');
        $this->addSql('ALTER TABLE training_participants DROP CONSTRAINT FK_697A5C9FBEFD98D1');
        $this->addSql('ALTER TABLE training_participants DROP CONSTRAINT FK_697A5C9FA76ED395');
        $this->addSql('ALTER TABLE training_participants ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE training_participants ADD CONSTRAINT fk_697a5c9fbefd98d1 FOREIGN KEY (training_id) REFERENCES trainings (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE training_participants ADD CONSTRAINT fk_697a5c9fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE trainings DROP CONSTRAINT FK_66DC433051A5BC03');
        $this->addSql('ALTER TABLE trainings DROP CONSTRAINT FK_66DC4330A76ED395');
        $this->addSql('ALTER TABLE trainings ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE trainings ADD CONSTRAINT fk_66dc433051a5bc03 FOREIGN KEY (feed_id) REFERENCES feeds (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql(
            'ALTER TABLE trainings ADD CONSTRAINT fk_66dc4330a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE user_disciplines DROP CONSTRAINT FK_406954DA76ED395');
        $this->addSql('ALTER TABLE user_disciplines ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE user_disciplines ADD CONSTRAINT fk_406954da76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE user_password_resets DROP CONSTRAINT FK_8C06922EA76ED395');
        $this->addSql('ALTER TABLE user_password_resets ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE user_password_resets ADD CONSTRAINT fk_8c06922ea76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE user_registers DROP CONSTRAINT FK_16B6FD2A76ED395');
        $this->addSql('ALTER TABLE user_registers ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE user_registers ADD CONSTRAINT fk_16b6fd2a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE user_roles DROP CONSTRAINT FK_54FCD59FA76ED395');
        $this->addSql('ALTER TABLE user_roles ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE user_roles ADD CONSTRAINT fk_54fcd59fa76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE user_signs DROP CONSTRAINT FK_A35695D9A76ED395');
        $this->addSql('ALTER TABLE user_signs ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE user_signs ADD CONSTRAINT fk_a35695d9a76ed395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE',
        );
        $this->addSql('ALTER TABLE users ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }
}

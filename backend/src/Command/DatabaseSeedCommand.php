<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\{
    Conversation,
    ConversationActivity,
    Entry,
    Event,
    EventDiscipline,
    EventDisciplineDistance,
    EventDisciplineList,
    EventDisciplineResult,
    EventDisciplineSubDistance,
    EventDisciplineSubResult,
    Feed,
    FeedComment,
    FeedReaction,
    Friend,
    Goal,
    GoalParticipant,
    GoalParticipantResult,
    Notification,
    Page,
    PageFollow,
    PageParticipant,
    PushSubscription,
    Story,
    Training,
    TrainingDiscipline,
    TrainingDisciplineDistance,
    TrainingDisciplineSubDistance,
    TrainingParticipant,
    User,
    UserDiscipline,
    UserPasswordReset,
    UserRegister,
    UserRole,
    UserSign
};
use App\Enum\{
    ColorEnum,
    ConversationStatusEnum,
    CountryEnum,
    DisciplineEnum,
    ElementStatusEnum,
    EntryTypeEnum,
    FeedReactionEnum,
    FriendStatusEnum,
    GenderEnum,
    GoalStatusEnum,
    LanguageEnum,
    NotificationStatusEnum,
    PageFollowStatusEnum,
    PushSubscriptionStatusEnum,
    RoleEnum,
    SaveStatusEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum
};
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputInterface, InputOption};
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:seed',
    description: 'Populates the database with realistic interconnected test data across all tables',
)]
class DatabaseSeedCommand extends Command
{
    /** @var array<string, User> */
    private array $users = [];

    /** @var array<string, Page> */
    private array $pages = [];

    /** @var array<string, PageParticipant> */
    private array $pageParticipants = [];

    /** @var array<string, Event> */
    private array $events = [];

    /** @var array<string, Training> */
    private array $trainings = [];

    /** @var array<string, Goal> */
    private array $goals = [];

    /** @var array<Feed> */
    private array $feeds = [];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('fresh', null, InputOption::VALUE_NONE, 'Truncate all application tables before seeding');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Sportgram Database Seeder');

        if ($input->getOption('fresh')) {
            $io->section('Cleaning existing database tables...');
            $this->truncateTables();
            $io->success('All application tables truncated successfully.');
        }

        $io->section('1. Seeding Users (with roles, disciplines, registers, signs, resets, push subscriptions)...');
        $this->seedUsers();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d users.', count($this->users)));

        $io->section('2. Seeding Friendships...');
        $friendsCount = $this->seedFriends();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d friendships.', $friendsCount));

        $io->section('3. Seeding Pages, Page Participants & Followers...');
        $this->seedPages();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d pages.', count($this->pages)));

        $io->section('4. Seeding Events (disciplines, distances, start lists, results, sub-results)...');
        $this->seedEvents();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d events with start lists and results.', count($this->events)));

        $io->section('5. Seeding Trainings (participants, disciplines, distances, GPS track sub-distances)...');
        $this->seedTrainings();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d trainings.', count($this->trainings)));

        $io->section('6. Seeding Goals (participants & participant results)...');
        $this->seedGoals();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d goals.', count($this->goals)));

        $io->section('7. Seeding Standalone Feeds, Comments & Reactions...');
        $feedsCount = $this->seedFeeds();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d standalone feeds with comments and reactions.', $feedsCount));

        $io->section('8. Seeding Stories...');
        $storiesCount = $this->seedStories();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d stories.', $storiesCount));

        $io->section('9. Seeding Conversations & Activity...');
        $conversationsCount = $this->seedConversations();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d conversation messages and activities.', $conversationsCount));

        $io->section('10. Seeding Notifications...');
        $notificationsCount = $this->seedNotifications();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d notifications.', $notificationsCount));

        $io->section('11. Seeding Additional Push Subscriptions for UI pagination...');
        $pushCount = $this->seedPushSubscriptions();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d additional push subscriptions.', $pushCount));

        $io->section('12. Seeding Entity View Entries...');
        $entriesCount = $this->seedEntries();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d entry tracking records.', $entriesCount));

        $io->section('13. Seeding Feeds...');
        $io->text(sprintf('   Seeded %d feeds.', count($this->feeds)));

        $io->success([
            'Database successfully populated with rich, realistic, interconnected data!',
            'Login credentials for all seeded users: Password123!',
            'Key accounts: admin@sportgram.local, organizer@sportgram.local, jan.kowalski@sportgram.local',
        ]);

        return Command::SUCCESS;
    }

    private function truncateTables(): void
    {
        $tables = [
            'entries',
            'push_subscriptions',
            'notifications',
            'conversation_activity',
            'conversations',
            'stories',
            'feed_reactions',
            'feed_comments',
            'goal_participant_results',
            'goal_participants',
            'goals',
            'training_discipline_sub_distances',
            'training_discipline_distances',
            'training_disciplines',
            'training_participants',
            'trainings',
            'event_discipline_sub_results',
            'event_discipline_results',
            'event_discipline_lists',
            'event_discipline_sub_distances',
            'event_discipline_distances',
            'event_disciplines',
            'events',
            'page_follows',
            'page_participants',
            'pages',
            'friends',
            'feeds',
            'user_signs',
            'user_registers',
            'user_password_resets',
            'user_disciplines',
            'user_roles',
            'users',
        ];

        $connection = $this->em->getConnection();
        $sql = sprintf('TRUNCATE TABLE %s CASCADE', implode(', ', $tables));
        $connection->executeStatement($sql);
    }

    private function seedUsers(): void
    {
        $userData = [
            [
                'email' => 'admin@sportgram.local',
                'firstName' => 'Adam',
                'lastName' => 'Adamski',
                'gender' => GenderEnum::Male,
                'phone' => 600100201,
                'link' => 'adam-adamski',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Administrator, RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling, DisciplineEnum::Swimming, DisciplineEnum::Rowing],
                'bio' => 'Główny administrator i pasjonat triathlonu. Zawsze gotowy na nowe sportowe wyzwania!',
                'birthAt' => new DateTimeImmutable('1988-04-12'),
                'browser' => 'Chrome na macOS',
            ],
            [
                'email' => 'organizer@sportgram.local',
                'firstName' => 'Olga',
                'lastName' => 'Organizerska',
                'gender' => GenderEnum::Female,
                'phone' => 600100202,
                'link' => 'olga-organizerska',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::InlineSkating],
                'bio' => 'Koordynatorka imprez biegowych i zawodów rolkowych w całej Polsce.',
                'birthAt' => new DateTimeImmutable('1991-08-25'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'jan.kowalski@sportgram.local',
                'firstName' => 'Jan',
                'lastName' => 'Kowalski',
                'gender' => GenderEnum::Male,
                'phone' => 600100203,
                'link' => 'jan-kowalski',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing, DisciplineEnum::Cycling, DisciplineEnum::Swimming],
                'bio' => 'Biegacz długodystansowy i kolarz. Przygotowuję się do maratonu poniżej 3 godzin oraz zawodów gravelowych.',
                'birthAt' => new DateTimeImmutable('1994-02-14'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'anna.nowak@sportgram.local',
                'firstName' => 'Anna',
                'lastName' => 'Nowak',
                'gender' => GenderEnum::Female,
                'phone' => 600100204,
                'link' => 'anna-nowak',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Miłośniczka porannych wybiegań i pływania na wodach otwartych.',
                'birthAt' => new DateTimeImmutable('1996-06-30'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'piotr.wisniewski@sportgram.local',
                'firstName' => 'Piotr',
                'lastName' => 'Wiśniewski',
                'gender' => GenderEnum::Male,
                'phone' => 600100205,
                'link' => 'piotr-wisniewski',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Skateboarding],
                'bio' => 'Gravel, szosa i bikepacking. Organizuję rajdy rowerowe po Jurze.',
                'birthAt' => new DateTimeImmutable('1990-11-05'),
                'browser' => 'Chrome na Android',
            ],
            [
                'email' => 'katarzyna.wojcik@sportgram.local',
                'firstName' => 'Katarzyna',
                'lastName' => 'Wójcik',
                'gender' => GenderEnum::Female,
                'phone' => 600100206,
                'link' => 'katarzyna-wojcik',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Rowing],
                'bio' => 'Biegi górskie i wioślarstwo. Kocham kontakt z naturą i wysiłek fizyczny.',
                'birthAt' => new DateTimeImmutable('1993-09-18'),
                'browser' => 'Firefox na Windows',
            ],
            [
                'email' => 'tomasz.kaminski@sportgram.local',
                'firstName' => 'Tomasz',
                'lastName' => 'Kamiński',
                'gender' => GenderEnum::Male,
                'phone' => 600100207,
                'link' => 'tomasz-kaminski',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Snowboarding],
                'bio' => 'Zimą deska, latem kolarstwo szosowe. Sport to dla mnie styl życia!',
                'birthAt' => new DateTimeImmutable('1989-12-01'),
                'browser' => 'Safari na macOS',
            ],
            [
                'email' => 'magdalena.lewandowska@sportgram.local',
                'firstName' => 'Magdalena',
                'lastName' => 'Lewandowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100208,
                'link' => 'magdalena-lewandowska',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::IceSkating],
                'bio' => 'Instruktorka biegania i łyżwiarstwa. Prowadzę grupę biegową w Krakowie.',
                'birthAt' => new DateTimeImmutable('1992-03-21'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'michal.zielinski@sportgram.local',
                'firstName' => 'Michał',
                'lastName' => 'Zieliński',
                'gender' => GenderEnum::Male,
                'phone' => 600100209,
                'link' => 'michal-zielinski',
                'color' => ColorEnum::Gray,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Canoeing],
                'bio' => 'Pływak masters i kajakarz. Każdy wolny weekend spędzam nad wodą.',
                'birthAt' => new DateTimeImmutable('1995-07-09'),
                'browser' => 'Chrome na Linux',
            ],
            [
                'email' => 'aleksandra.szymanska@sportgram.local',
                'firstName' => 'Aleksandra',
                'lastName' => 'Szymańska',
                'gender' => GenderEnum::Female,
                'phone' => 600100210,
                'link' => 'aleksandra-szymanska',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Duathlonistka amatorka. Łączę bieganie z kolarstwem szosowym.',
                'birthAt' => new DateTimeImmutable('1997-10-14'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'krzysztof.wozniak@sportgram.local',
                'firstName' => 'Krzysztof',
                'lastName' => 'Woźniak',
                'gender' => GenderEnum::Male,
                'phone' => 600100211,
                'link' => 'krzysztof-wozniak',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Pasjonat biegówek w Jakuszycach i maratonów rowerowych MTB.',
                'birthAt' => new DateTimeImmutable('1987-05-19'),
                'browser' => 'Firefox na Windows',
            ],
            [
                'email' => 'joanna.dabrowska@sportgram.local',
                'firstName' => 'Joanna',
                'lastName' => 'Dąbrowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100212,
                'link' => 'joanna-dabrowska',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Organizator zawodów pływackich w Trójmieście. Promuję zdrowy tryb życia.',
                'birthAt' => new DateTimeImmutable('1991-01-28'),
                'browser' => 'Edge na Windows',
            ],
            [
                'email' => 'marcin.kozlowski@sportgram.local',
                'firstName' => 'Marcin',
                'lastName' => 'Kozłowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100213,
                'link' => 'marcin-kozlowski',
                'color' => ColorEnum::Brown,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Skateboarding, DisciplineEnum::Snowboarding],
                'bio' => 'Sporty ekstremalne to moja pasja od najmłodszych lat.',
                'birthAt' => new DateTimeImmutable('1999-04-03'),
                'browser' => 'Chrome na Android',
            ],
            [
                'email' => 'paulina.mazur@sportgram.local',
                'firstName' => 'Paulina',
                'lastName' => 'Mazur',
                'gender' => GenderEnum::Female,
                'phone' => 600100214,
                'link' => 'paulina-mazur',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::IceSkating],
                'bio' => 'Biegam dla czystej przyjemności i endorfin. Przygotowuję się do dychy.',
                'birthAt' => new DateTimeImmutable('1998-12-22'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'jakub.krawczyk@sportgram.local',
                'firstName' => 'Jakub',
                'lastName' => 'Krawczyk',
                'gender' => GenderEnum::Male,
                'phone' => 600100215,
                'link' => 'jakub-krawczyk',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Rowing, DisciplineEnum::Canoeing],
                'bio' => 'Wioślarz z Gdańska. Trenuję na rzece Motławie w sekcji akademickiej.',
                'birthAt' => new DateTimeImmutable('1994-08-11'),
                'browser' => 'Chrome na Linux',
            ],
            [
                'email' => 'natalia.piotrowska@sportgram.local',
                'firstName' => 'Natalia',
                'lastName' => 'Piotrowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100216,
                'link' => 'natalia-piotrowska',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Cycling],
                'bio' => 'Pływanie i rower szosowy. Kolejnym krokiem będzie pierwszy start w 1/4 Ironman.',
                'birthAt' => new DateTimeImmutable('1996-03-15'),
                'browser' => 'Chrome na macOS',
            ],
            [
                'email' => 'lukasz.grabowski@sportgram.local',
                'firstName' => 'Łukasz',
                'lastName' => 'Grabowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100217,
                'link' => 'lukasz-grabowski',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Biegi ultra i kolarstwo górskie. Im trudniejsza trasa, tym lepsza zabawa.',
                'birthAt' => new DateTimeImmutable('1986-09-04'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'monika.pawlak@sportgram.local',
                'firstName' => 'Monika',
                'lastName' => 'Pawlak',
                'gender' => GenderEnum::Female,
                'phone' => 600100218,
                'link' => 'monika-pawlak',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::InlineSkating],
                'bio' => 'Propagatorka rolek i biegów rekreacyjnych dla całych rodzin.',
                'birthAt' => new DateTimeImmutable('1990-07-27'),
                'browser' => 'Edge na Windows',
            ],
            [
                'email' => 'grzegorz.michalak@sportgram.local',
                'firstName' => 'Grzegorz',
                'lastName' => 'Michalak',
                'gender' => GenderEnum::Male,
                'phone' => 600100219,
                'link' => 'grzegorz-michalak',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Swimming],
                'bio' => 'Rower szosowy i basen. Regularny uczestnik rajdów na 200 km.',
                'birthAt' => new DateTimeImmutable('1985-11-16'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'ewelina.nowicka@sportgram.local',
                'firstName' => 'Ewelina',
                'lastName' => 'Nowicka',
                'gender' => GenderEnum::Female,
                'phone' => 600100220,
                'link' => 'ewelina-nowicka',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Biegi przełajowe i narty biegowe. Świeże powietrze w lesie to najlepsza regeneracja.',
                'birthAt' => new DateTimeImmutable('1995-05-02'),
                'browser' => 'Safari na iPad',
            ],
            [
                'email' => 'mateusz.adamczyk@sportgram.local',
                'firstName' => 'Mateusz',
                'lastName' => 'Adamczyk',
                'gender' => GenderEnum::Male,
                'phone' => 600100221,
                'link' => 'mateusz-adamczyk',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Triathlonista amator, startuję w zawodach 1/2 IM.',
                'birthAt' => new DateTimeImmutable('1991-03-12'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'karolina.dudek@sportgram.local',
                'firstName' => 'Karolina',
                'lastName' => 'Dudek',
                'gender' => GenderEnum::Female,
                'phone' => 600100222,
                'link' => 'karolina-dudek',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Biegam codziennie rano przed pracą po bulwarach.',
                'birthAt' => new DateTimeImmutable('1994-07-22'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'bartek.zajac@sportgram.local',
                'firstName' => 'Bartek',
                'lastName' => 'Zając',
                'gender' => GenderEnum::Male,
                'phone' => 600100223,
                'link' => 'bartek-zajac',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Skateboarding],
                'bio' => 'Kolarstwo grawelowe i zjazdy leśnymi ścieżkami.',
                'birthAt' => new DateTimeImmutable('1993-11-04'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'patrycja.wieczorek@sportgram.local',
                'firstName' => 'Patrycja',
                'lastName' => 'Wieczorek',
                'gender' => GenderEnum::Female,
                'phone' => 600100224,
                'link' => 'patrycja-wieczorek',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::InlineSkating],
                'bio' => 'Trenerka fitnessu i pasjonatka maratonów.',
                'birthAt' => new DateTimeImmutable('1992-06-18'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'rafal.jablonski@sportgram.local',
                'firstName' => 'Rafał',
                'lastName' => 'Jabłoński',
                'gender' => GenderEnum::Male,
                'phone' => 600100225,
                'link' => 'rafal-jablonski',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Biegi górskie, Beskidy i Tatry to mój drugi dom.',
                'birthAt' => new DateTimeImmutable('1988-09-30'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'martyna.krol@sportgram.local',
                'firstName' => 'Martyna',
                'lastName' => 'Król',
                'gender' => GenderEnum::Female,
                'phone' => 600100226,
                'link' => 'martyna-krol',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Rowing],
                'bio' => 'Pływanie open water oraz wioślarstwo regatowe.',
                'birthAt' => new DateTimeImmutable('1996-01-15'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'damian.majewski@sportgram.local',
                'firstName' => 'Damian',
                'lastName' => 'Majewski',
                'gender' => GenderEnum::Male,
                'phone' => 600100227,
                'link' => 'damian-majewski',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Szosowe ustawki i szybkie wybiegania na dychę.',
                'birthAt' => new DateTimeImmutable('1990-12-08'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'weronika.olszewska@sportgram.local',
                'firstName' => 'Weronika',
                'lastName' => 'Olszewska',
                'gender' => GenderEnum::Female,
                'phone' => 600100228,
                'link' => 'weronika-olszewska',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Biegam z psem po lasach, startuję w canicrossie.',
                'birthAt' => new DateTimeImmutable('1997-04-29'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'kamil.jaworski@sportgram.local',
                'firstName' => 'Kamil',
                'lastName' => 'Jaworski',
                'gender' => GenderEnum::Male,
                'phone' => 600100229,
                'link' => 'kamil-jaworski',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::InlineSkating, DisciplineEnum::Cycling],
                'bio' => 'Rolkarz szybki i kolarz kryteryjny.',
                'birthAt' => new DateTimeImmutable('1995-10-11'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'justyna.malinowska@sportgram.local',
                'firstName' => 'Justyna',
                'lastName' => 'Malinowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100230,
                'link' => 'justyna-malinowska',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Snowboarding],
                'bio' => 'Zimą snowboard w Alpach, wiosną przygotowania do półmaratonu.',
                'birthAt' => new DateTimeImmutable('1993-08-03'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'sebastian.pawlowski@sportgram.local',
                'firstName' => 'Sebastian',
                'lastName' => 'Pawłowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100231,
                'link' => 'sebastian-pawlowski',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Kolarz szosowy z zamiłowaniem do stromych podjazdów.',
                'birthAt' => new DateTimeImmutable('1987-02-17'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'dominika.gorny@sportgram.local',
                'firstName' => 'Dominika',
                'lastName' => 'Górny',
                'gender' => GenderEnum::Female,
                'phone' => 600100232,
                'link' => 'dominika-gorny',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Canoeing],
                'bio' => 'Spływy kajakowe i pływanie na dystansie 3km.',
                'birthAt' => new DateTimeImmutable('1998-05-24'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'adrian.witkowski@sportgram.local',
                'firstName' => 'Adrian',
                'lastName' => 'Witkowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100233,
                'link' => 'adrian-witkowski',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Rowing],
                'bio' => 'Wioślarz i biegacz. Siła, wydolność i dyscyplina.',
                'birthAt' => new DateTimeImmutable('1994-09-09'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'klaudia.walczak@sportgram.local',
                'firstName' => 'Klaudia',
                'lastName' => 'Walczak',
                'gender' => GenderEnum::Female,
                'phone' => 600100234,
                'link' => 'klaudia-walczak',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::InlineSkating, DisciplineEnum::Running],
                'bio' => 'Maratony rolkowe i parkruny w każdą sobotę.',
                'birthAt' => new DateTimeImmutable('1996-12-14'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'filip.stepien@sportgram.local',
                'firstName' => 'Filip',
                'lastName' => 'Stępień',
                'gender' => GenderEnum::Male,
                'phone' => 600100235,
                'link' => 'filip-stepien',
                'color' => ColorEnum::Brown,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Skateboarding, DisciplineEnum::Cycling],
                'bio' => 'Pumptrack, street i kolarstwo miejskie.',
                'birthAt' => new DateTimeImmutable('1999-07-07'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'sylwia.rutkowska@sportgram.local',
                'firstName' => 'Sylwia',
                'lastName' => 'Rutkowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100236,
                'link' => 'sylwia-rutkowska',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Biegam cały rok bez względu na pogodę.',
                'birthAt' => new DateTimeImmutable('1991-11-20'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'przemyslaw.sikora@sportgram.local',
                'firstName' => 'Przemysław',
                'lastName' => 'Sikora',
                'gender' => GenderEnum::Male,
                'phone' => 600100237,
                'link' => 'przemyslaw-sikora',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Swimming],
                'bio' => 'Gravelowe wyprawy z namiotem i pływanie w jeziorach.',
                'birthAt' => new DateTimeImmutable('1989-04-05'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'kinga.baran@sportgram.local',
                'firstName' => 'Kinga',
                'lastName' => 'Baran',
                'gender' => GenderEnum::Female,
                'phone' => 600100238,
                'link' => 'kinga-baran',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Zdrowy tryb życia, poranne interwały i joga.',
                'birthAt' => new DateTimeImmutable('1995-03-27'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'hubert.szewczyk@sportgram.local',
                'firstName' => 'Hubert',
                'lastName' => 'Szewczyk',
                'gender' => GenderEnum::Male,
                'phone' => 600100239,
                'link' => 'hubert-szewczyk',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Maratończyk z życiówką 3:15, celuję w 2:59.',
                'birthAt' => new DateTimeImmutable('1992-10-19'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'marta.ostrowska@sportgram.local',
                'firstName' => 'Marta',
                'lastName' => 'Ostrowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100240,
                'link' => 'marta-ostrowska',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Rowing],
                'bio' => 'Sekcja wioślarska i pływanie stylem grzbietowym.',
                'birthAt' => new DateTimeImmutable('1997-08-16'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'maciej.tomaszewski@sportgram.local',
                'firstName' => 'Maciej',
                'lastName' => 'Tomaszewski',
                'gender' => GenderEnum::Male,
                'phone' => 600100241,
                'link' => 'maciej-tomaszewski',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Szosa i przełaje. Uwielbiam błoto i trudne trasy.',
                'birthAt' => new DateTimeImmutable('1986-06-02'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'aneta.pietrzak@sportgram.local',
                'firstName' => 'Aneta',
                'lastName' => 'Pietrzak',
                'gender' => GenderEnum::Female,
                'phone' => 600100242,
                'link' => 'aneta-pietrzak',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::InlineSkating],
                'bio' => 'Rekreacyjny jogging i jazda figurowa na lodzie i rolkach.',
                'birthAt' => new DateTimeImmutable('1994-01-30'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'wojciech.marciniak@sportgram.local',
                'firstName' => 'Wojciech',
                'lastName' => 'Marciniak',
                'gender' => GenderEnum::Male,
                'phone' => 600100243,
                'link' => 'wojciech-marciniak',
                'color' => ColorEnum::Gray,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Treningi siłowe w połączeniu z bieganiem w terenie.',
                'birthAt' => new DateTimeImmutable('1990-05-13'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'dagmara.jasinska@sportgram.local',
                'firstName' => 'Dagmara',
                'lastName' => 'Jasińska',
                'gender' => GenderEnum::Female,
                'phone' => 600100244,
                'link' => 'dagmara-jasinska',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Swimming],
                'bio' => 'Rower szosowy to moja wolność.',
                'birthAt' => new DateTimeImmutable('1993-09-25'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'norbert.jakubowski@sportgram.local',
                'firstName' => 'Norbert',
                'lastName' => 'Jakubowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100245,
                'link' => 'norbert-jakubowski',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Przygotowania do maratonu warszawskiego w toku.',
                'birthAt' => new DateTimeImmutable('1995-12-03'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'oliwia.zawadzka@sportgram.local',
                'firstName' => 'Oliwia',
                'lastName' => 'Zawadzka',
                'gender' => GenderEnum::Female,
                'phone' => 600100246,
                'link' => 'oliwia-zawadzka',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Running],
                'bio' => 'Pływaczka długodystansowa i miłośniczka runmageddonu.',
                'birthAt' => new DateTimeImmutable('1998-02-11'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'radoslaw.chmielewski@sportgram.local',
                'firstName' => 'Radosław',
                'lastName' => 'Chmielewski',
                'gender' => GenderEnum::Male,
                'phone' => 600100247,
                'link' => 'radoslaw-chmielewski',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::InlineSkating],
                'bio' => 'Treningi na torze kolarskim i rolkowym.',
                'birthAt' => new DateTimeImmutable('1988-08-14'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'paula.borkowska@sportgram.local',
                'firstName' => 'Paula',
                'lastName' => 'Borkowska',
                'gender' => GenderEnum::Female,
                'phone' => 600100248,
                'link' => 'paula-borkowska',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Aktywna mama, biegam z wózkiem biegowym.',
                'birthAt' => new DateTimeImmutable('1992-04-01'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'cezary.czarnecki@sportgram.local',
                'firstName' => 'Cezary',
                'lastName' => 'Czarnecki',
                'gender' => GenderEnum::Male,
                'phone' => 600100249,
                'link' => 'cezary-czarnecki',
                'color' => ColorEnum::Brown,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Rowing],
                'bio' => 'Ergometr wioślarski zimą, wiosną powrót na ścieżki.',
                'birthAt' => new DateTimeImmutable('1991-07-17'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'izabela.sawicka@sportgram.local',
                'firstName' => 'Izabela',
                'lastName' => 'Sawicka',
                'gender' => GenderEnum::Female,
                'phone' => 600100250,
                'link' => 'izabela-sawicka',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Kolarstwo górskie i rajdy na orientację.',
                'birthAt' => new DateTimeImmutable('1996-10-09'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'artur.sokolowski@sportgram.local',
                'firstName' => 'Artur',
                'lastName' => 'Sokołowski',
                'gender' => GenderEnum::Male,
                'phone' => 600100251,
                'link' => 'artur-sokolowski',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Cycling],
                'bio' => 'Triathlon na dystansie olimpijskim.',
                'birthAt' => new DateTimeImmutable('1989-11-28'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'renata.urbanska@sportgram.local',
                'firstName' => 'Renata',
                'lastName' => 'Urbańska',
                'gender' => GenderEnum::Female,
                'phone' => 600100252,
                'link' => 'renata-urbanska',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Biegi narciarskie w Jakuszycach i leśne biegi w Kampinosie.',
                'birthAt' => new DateTimeImmutable('1994-03-06'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'mariusz.kaczmarek@sportgram.local',
                'firstName' => 'Mariusz',
                'lastName' => 'Kaczmarek',
                'gender' => GenderEnum::Male,
                'phone' => 600100253,
                'link' => 'mariusz-kaczmarek',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Kolarz amator z Wielkopolski, maratony MTB.',
                'birthAt' => new DateTimeImmutable('1987-12-19'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'beata.krajewska@sportgram.local',
                'firstName' => 'Beata',
                'lastName' => 'Krajewska',
                'gender' => GenderEnum::Female,
                'phone' => 600100254,
                'link' => 'beata-krajewska',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Pływanie kraulem i biegi na 10 kilometrów.',
                'birthAt' => new DateTimeImmutable('1995-06-15'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'daniel.lis@sportgram.local',
                'firstName' => 'Daniel',
                'lastName' => 'Lis',
                'gender' => GenderEnum::Male,
                'phone' => 600100255,
                'link' => 'daniel-lis',
                'color' => ColorEnum::Yellow,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::InlineSkating, DisciplineEnum::Skateboarding],
                'bio' => 'Rolki agresywne i miejski slalom.',
                'birthAt' => new DateTimeImmutable('1997-09-02'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'kamila.zietek@sportgram.local',
                'firstName' => 'Kamila',
                'lastName' => 'Ziętek',
                'gender' => GenderEnum::Female,
                'phone' => 600100256,
                'link' => 'kamila-zietek',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Regularne wycieczki rowerowe i biegi parkowe.',
                'birthAt' => new DateTimeImmutable('1993-02-23'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'emil.blaszczyk@sportgram.local',
                'firstName' => 'Emil',
                'lastName' => 'Błaszczyk',
                'gender' => GenderEnum::Male,
                'phone' => 600100257,
                'link' => 'emil-blaszczyk',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Swimming],
                'bio' => 'Biegi z przeszkodami i pływanie na basenie.',
                'birthAt' => new DateTimeImmutable('1990-08-08'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'dorota.cieslak@sportgram.local',
                'firstName' => 'Dorota',
                'lastName' => 'Cieślak',
                'gender' => GenderEnum::Female,
                'phone' => 600100258,
                'link' => 'dorota-cieslak',
                'color' => ColorEnum::Orange,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Rowing],
                'bio' => 'Rower gravelowy i turystyka kajakowa.',
                'birthAt' => new DateTimeImmutable('1992-11-12'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'arkadiusz.mroz@sportgram.local',
                'firstName' => 'Arkadiusz',
                'lastName' => 'Mróz',
                'gender' => GenderEnum::Male,
                'phone' => 600100259,
                'link' => 'arkadiusz-mroz',
                'color' => ColorEnum::Gray,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Zimowe bieganie to najlepszy test charakteru.',
                'birthAt' => new DateTimeImmutable('1985-05-21'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'aleksandra.bednarek@sportgram.local',
                'firstName' => 'Aleksandra',
                'lastName' => 'Bednarek',
                'gender' => GenderEnum::Female,
                'phone' => 600100260,
                'link' => 'aleksandra-bednarek',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Running],
                'bio' => 'Pływanie na wodach otwartych, jeziora i zatoka.',
                'birthAt' => new DateTimeImmutable('1998-04-14'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'bogdan.krawiec@sportgram.local',
                'firstName' => 'Bogdan',
                'lastName' => 'Krawiec',
                'gender' => GenderEnum::Male,
                'phone' => 600100261,
                'link' => 'bogdan-krawiec',
                'color' => ColorEnum::Green,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Running],
                'bio' => 'Szosowe kilometry i maratony w całej Europie.',
                'birthAt' => new DateTimeImmutable('1986-10-27'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'agnieszka.sobczak@sportgram.local',
                'firstName' => 'Agnieszka',
                'lastName' => 'Sobczak',
                'gender' => GenderEnum::Female,
                'phone' => 600100262,
                'link' => 'agnieszka-sobczak',
                'color' => ColorEnum::Purple,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::InlineSkating],
                'bio' => 'Bieganie w grupie to podwójna motywacja.',
                'birthAt' => new DateTimeImmutable('1994-12-05'),
                'browser' => 'Firefox na Linux',
            ],
            [
                'email' => 'igor.glowacki@sportgram.local',
                'firstName' => 'Igor',
                'lastName' => 'Głowacki',
                'gender' => GenderEnum::Male,
                'phone' => 600100263,
                'link' => 'igor-glowacki',
                'color' => ColorEnum::Blue,
                'roles' => [RoleEnum::Organizer, RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Swimming, DisciplineEnum::Canoeing],
                'bio' => 'Kajakarstwo górskie i treningi pływackie.',
                'birthAt' => new DateTimeImmutable('1996-07-19'),
                'browser' => 'Chrome na Windows',
            ],
            [
                'email' => 'julia.szczepanska@sportgram.local',
                'firstName' => 'Julia',
                'lastName' => 'Szczepańska',
                'gender' => GenderEnum::Female,
                'phone' => 600100264,
                'link' => 'julia-szczepanska',
                'color' => ColorEnum::Pink,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::Cycling],
                'bio' => 'Aktywność fizyczna to mój sposób na redukcję stresu.',
                'birthAt' => new DateTimeImmutable('1997-03-31'),
                'browser' => 'Safari na iPhone',
            ],
            [
                'email' => 'wiktor.kozak@sportgram.local',
                'firstName' => 'Wiktor',
                'lastName' => 'Kozak',
                'gender' => GenderEnum::Male,
                'phone' => 600100265,
                'link' => 'wiktor-kozak',
                'color' => ColorEnum::Red,
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Cycling, DisciplineEnum::Snowboarding],
                'bio' => 'Góry latem na rowerze, zimą na snowboardzie.',
                'birthAt' => new DateTimeImmutable('1991-09-14'),
                'browser' => 'Firefox na Linux',
            ],
        ];

        $hashedPassword = null;
        foreach ($userData as $data) {
            $profilePhoto = $this->generateProfilePhoto(
                $data['color'],
                $data['link'] . '_user',
            );
            $backgroundPhoto = $this->generateLandscapeSvg(
                $data['color'],
                $data['link'] . '_bg',
            );

            $user = new User(
                $data['birthAt'],
                $data['firstName'],
                $data['lastName'],
                $data['gender'],
                $data['phone'],
                $data['email'],
                $data['link'],
                LanguageEnum::Polish,
                CountryEnum::Poland,
                ThemeEnum::Light,
                $data['color'],
                $profilePhoto,
                $backgroundPhoto,
                $data['bio'],
                UserStatusEnum::Accepted,
            );

            if ($hashedPassword === null) {
                $hashedPassword = $this->hasher->hashPassword($user, 'Password123!');
            }
            $user->password = $hashedPassword;
            $this->em->persist($user);

            foreach ($data['roles'] as $role) {
                $userRole = new UserRole($user, $role);
                $this->em->persist($userRole);
            }

            foreach ($data['disciplines'] as $discipline) {
                $userDiscipline = new UserDiscipline($user, $discipline);
                $this->em->persist($userDiscipline);
            }

            $userRegister = new UserRegister($user, 123456, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userRegister);

            $userSign = new UserSign($user, 654321, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userSign);

            $userPasswordReset = new UserPasswordReset($user, 112233, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userPasswordReset);

            $pushSub = new PushSubscription(
                $user,
                sprintf('https://fcm.googleapis.com/fcm/send/%s', bin2hex(random_bytes(16))),
                base64_encode(random_bytes(65)),
                base64_encode(random_bytes(16)),
                $data['browser'],
                PushSubscriptionStatusEnum::Active,
            );
            $this->em->persist($pushSub);

            $this->users[$data['email']] = $user;
        }
    }

    private function seedFriends(): int
    {
        $janEmail = 'jan.kowalski@sportgram.local';
        $jan = $this->users[$janEmail];
        $count = 0;

        $otherEmails = array_values(array_filter(
            array_keys($this->users),
            static fn (string $email): bool => $email !== 'jan.kowalski@sportgram.local',
        ));

        foreach (array_slice($otherEmails, 0, 55) as $i => $otherEmail) {
            $other = $this->users[$otherEmail];
            $status = match (true) {
                $i < 42 => FriendStatusEnum::Accepted,
                $i < 49 => FriendStatusEnum::Pending,
                default => FriendStatusEnum::Rejected,
            };
            $friend = new Friend($jan, $other, $status);
            $this->em->persist($friend);
            $count++;
        }

        $extraPairs = [
            ['admin@sportgram.local', 'organizer@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'anna.nowak@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'piotr.wisniewski@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'magdalena.lewandowska@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'michal.zielinski@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'joanna.dabrowska@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'michal.zielinski@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'paulina.mazur@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'aleksandra.szymanska@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'organizer@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'grzegorz.michalak@sportgram.local', FriendStatusEnum::Accepted],
            ['organizer@sportgram.local', 'magdalena.lewandowska@sportgram.local', FriendStatusEnum::Accepted],
            ['organizer@sportgram.local', 'monika.pawlak@sportgram.local', FriendStatusEnum::Accepted],
            ['organizer@sportgram.local', 'joanna.dabrowska@sportgram.local', FriendStatusEnum::Accepted],
            ['magdalena.lewandowska@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['michal.zielinski@sportgram.local', 'jakub.krawczyk@sportgram.local', FriendStatusEnum::Accepted],
            ['michal.zielinski@sportgram.local', 'natalia.piotrowska@sportgram.local', FriendStatusEnum::Accepted],
            ['joanna.dabrowska@sportgram.local', 'jakub.krawczyk@sportgram.local', FriendStatusEnum::Accepted],
            ['lukasz.grabowski@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['marcin.kozlowski@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['ewelina.nowicka@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Accepted],
            ['mateusz.adamczyk@sportgram.local', 'karolina.dudek@sportgram.local', FriendStatusEnum::Accepted],
            ['mateusz.adamczyk@sportgram.local', 'bartek.zajac@sportgram.local', FriendStatusEnum::Accepted],
            ['patrycja.wieczorek@sportgram.local', 'rafal.jablonski@sportgram.local', FriendStatusEnum::Accepted],
            ['martyna.krol@sportgram.local', 'damian.majewski@sportgram.local', FriendStatusEnum::Accepted],
            ['weronika.olszewska@sportgram.local', 'kamil.jaworski@sportgram.local', FriendStatusEnum::Accepted],
        ];

        foreach ($extraPairs as [$u1Email, $u2Email, $st]) {
            $u1 = $this->users[$u1Email] ?? null;
            $u2 = $this->users[$u2Email] ?? null;
            if ($u1 && $u2) {
                $friend = new Friend($u1, $u2, $st);
                $this->em->persist($friend);
                $count++;
            }
        }

        return $count;
    }

    private function seedPages(): void
    {
        $pageTitles = [
            ['wkb', 'Warszawski Klub Biegacza', 'Oficjalna strona stowarzyszenia biegaczy w Warszawie. Cykliczne treningi w Parku Skaryszewskim, sprawdziany na 5 km i biegi uliczne.', 'warszawski-klub-biegacza', ColorEnum::Blue, 'admin@sportgram.local', ElementStatusEnum::Active],
            ['velo', 'Velo Silesia Cycling Team', 'Śląska społeczność pasjonatów dwóch kółek: szosa, gravel i MTB. Wspólne ustawki weekendowe i rajdy.', 'velo-silesia-cycling-team', ColorEnum::Red, 'organizer@sportgram.local', ElementStatusEnum::Active],
            ['triton', 'Triton Triathlon Polska', 'Ogólnopolski klub triathlonowy. Łączymy pływanie, kolarstwo i bieg w jedną całość. Dystanse sprint do pełnego IM.', 'triton-triathlon-polska', ColorEnum::Orange, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['krakow_trail', 'Kraków Ultra Trail Runners', 'Grupa zrzeszająca biegaczy górskich w Małopolsce. Treningi podbiegowe w Lasku Wolskim i wypady w Tatry.', 'krakow-ultra-trail-runners', ColorEnum::Green, 'magdalena.lewandowska@sportgram.local', ElementStatusEnum::Active],
            ['baltic', 'Baltic Swimming & Rowing Club', 'Klub sportów wodnych w Trójmieście. Sekcja pływania open water w Zatoce Gdańskiej oraz wioślarstwo na Motławie.', 'baltic-swimming-rowing-club', ColorEnum::Blue, 'joanna.dabrowska@sportgram.local', ElementStatusEnum::Active],
            ['poznan_half', 'Poznań Półmaraton Team', 'Oficjalny team biegowy z Poznania. Przygotowania do maratonu i półmaratonu nad Maltą.', 'poznan-polmaraton-team', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['wroclaw_krasnale', 'Wrocławskie Krasnale Biegu', 'Dolnośląska ekipa biegowa. Trenujemy w Parku Szczytnickim i wałach nad Odrą.', 'wroclawskie-krasnale-biegu', ColorEnum::Yellow, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['tatry_skitour', 'Tatrzański Klub Skitourowy', 'Zimą narty i podejścia w Tatrach, latem biegi alpejskie i skyrunning.', 'tatrzanski-klub-skitourowy', ColorEnum::Blue, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['dolnoslaska_szosa', 'Dolnośląska Grupa Kolarska', 'Treningi kolarskie wokół Przełęczy Tąpadła, Masywu Ślęży i Gór Sowich.', 'dolnoslaska-grupa-kolarska', ColorEnum::Red, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['trojmiasto_swim', 'Trójmiejska Akademia Pływania', 'Treningi techniki pływania kraulem, masters i open water w Sopocie i Gdyni.', 'trojmiejska-akademia-plywania', ColorEnum::Blue, 'michal.zielinski@sportgram.local', ElementStatusEnum::Active],
            ['lodz_park', 'Łódź Biega w Parkach', 'Biegi w Parku na Zdrowiu, Parku Poniatowskiego i Lesie Łagiewnickim.', 'lodz-biega-w-parkach', ColorEnum::Purple, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['szczecin_rowing', 'Szczecin Rowing Club', 'Wioślarstwo na Odrze i Jeziorze Dąbie dla amatorów i zaawansowanych.', 'szczecin-rowing-club', ColorEnum::Blue, 'jakub.krawczyk@sportgram.local', ElementStatusEnum::Active],
            ['lublin_inline', 'Lubelskie Stowarzyszenie Rolkowe', 'Jazda szybka na rolkach, nightskating i technika miejska wokół Zalewu Zemborzyckiego.', 'lubelskie-stowarzyszenie-rolkowe', ColorEnum::Orange, 'monika.pawlak@sportgram.local', ElementStatusEnum::Active],
            ['bieszczady_wataha', 'Bieszczadzka Wataha Biegowa', 'Dzikie szlaki, błoto, potoki i wspaniałe bieszczadzkie połoniny.', 'bieszczadzka-wataha-biegowa', ColorEnum::Brown, 'lukasz.grabowski@sportgram.local', ElementStatusEnum::Active],
            ['mazowsze_gravel', 'Mazowieckie Gravelowe Ustawki', 'Szutrowe drogi wzdłuż Wisły, Narwi, Bugu i po Puszczy Kampinoskiej.', 'mazowieckie-gravelowe-ustawki', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['torun_tri', 'Toruńska Grupa Triathlonowa', 'Klub ludzi z żelaza z Torunia i Bydgoszczy. Basen, trenażery i biegi.', 'torunska-grupa-triathlonowa', ColorEnum::Red, 'anna.nowak@sportgram.local', ElementStatusEnum::Active],
            ['plock_kajaki', 'Płockie Wiosła i Kajaki', 'Wodne wyprawy po Wiśle, treningi wytrzymałościowe i rekreacyjne.', 'plockie-wiosla-i-kajaki', ColorEnum::Blue, 'michal.zielinski@sportgram.local', ElementStatusEnum::Active],
            ['karkonosze_team', 'Karkonoski Team Górski', 'Biegi z Przełęczy Okraj na Śnieżkę, Szrenicę i Kotły Wielkiego Stawu.', 'karkonoski-team-gorski', ColorEnum::Gray, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['beskidy_enduro', 'Beskidzcy Rowerzyści Enduro', 'Singletracki w Bielsku-Białej, Szczyrku i Wiśle. Zjazdy i ostre podjazdy.', 'beskidzcy-rowerzysci-enduro', ColorEnum::Orange, 'tomasz.kaminski@sportgram.local', ElementStatusEnum::Active],
            ['bialystok_wilki', 'Białostockie Wilki Biegowe', 'Puszcza Knyszyńska, Park Planty i leśne ścieżki Podlasia.', 'bialostockie-wilki-biegowe', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['jura_mtb', 'Jura MTB Explorers', 'Wapienne ostańce, zamki Szlaku Orlich Gniazd i techniczne trasy MTB.', 'jura-mtb-explorers', ColorEnum::Red, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['opole_bieg', 'Opolski Klub Biegacza', 'Wyspa Bolko, wały Odry i Park Nadodrzański. Biegi dla każdego.', 'opolski-klub-biegacza', ColorEnum::Yellow, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['bydgoszcz_sup', 'Bydgoszcz Kayak & SUP', 'Brda, Kanał Bydgoski i Wyspa Młyńska z perspektywy wody.', 'bydgoszcz-kayak-sup', ColorEnum::Blue, 'michal.zielinski@sportgram.local', ElementStatusEnum::Active],
            ['slask_lyzwy', 'Śląska Sekcja Łyżwiarstwa Szybkiego', 'Treningi na torze lodowym i rolkowym w Katowicach i Tychach.', 'slaska-sekcja-lyzwiarstwa-szybkiego', ColorEnum::Blue, 'organizer@sportgram.local', ElementStatusEnum::Active],
            ['podhale_bieg', 'Podhalański Klub Biegowy', 'Górskie powietrze, biegi pod Reglami i Dolina Kościeliska.', 'podhalanski-klub-biegowy', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['zgora_bike', 'Zielonogórskie Ustawki Rowerowe', 'Winnice, lasy lubuskie i trasy wzdłuż Odry.', 'zielonogorskie-ustawki-rowerowe', ColorEnum::Green, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['rzeszow_run', 'Rzeszowska Grupa Biegowa', 'Bulwary nad Wisłokiem, Lisi Kąt i sprawdziany na 10 km.', 'rzeszowska-grupa-biegowa', ColorEnum::Red, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['suwalki_biegowki', 'Suwalski Klub Narciarstwa Biegowego', 'Polska Syberia, trasy biegowe w Szelmencie i Suwalskim Parku Krajobrazowym.', 'suwalski-klub-narciarstwa-biegowego', ColorEnum::Blue, 'krzysztof.wozniak@sportgram.local', ElementStatusEnum::Active],
            ['sopot_openwater', 'Sopot Open Water Swimmers', 'Pływanie wokół sopockiego molo, pianki i bojki asekuracyjne.', 'sopot-open-water-swimmers', ColorEnum::Blue, 'joanna.dabrowska@sportgram.local', ElementStatusEnum::Active],
            ['olsztyn_warmia', 'Olsztyńska Warmia Biegowa', 'Jezioro Ukiel, Las Miejski i malownicze ścieżki Warmii.', 'olsztynska-warmia-biegowa', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['kielce_trail', 'Kielce Trail Runners', 'Góry Świętokrzyskie, Łysica, Chęciny i kamieniołom Kadzielnia.', 'kielce-trail-runners', ColorEnum::Brown, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['wielkopolska_szosa', 'Wielkopolski Klub Kolarski', 'Płaskie i wietrzne kilometry, formacja wachlarza i wysokie prędkości.', 'wielkopolski-klub-kolarski', ColorEnum::Red, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['gdynia_rowers', 'Gdynia Sailors & Rowers', 'Wiosła na Bałtyku i regaty w marinie gdyńskiej.', 'gdynia-sailors-rowers', ColorEnum::Blue, 'jakub.krawczyk@sportgram.local', ElementStatusEnum::Active],
            ['zakopane_morsy', 'Zakopiańskie Morsy i Biegacze', 'Hartowanie ciała w górskich potokach i biegi po śniegu.', 'zakopianskie-morsy-i-biegacze', ColorEnum::Blue, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['zamosc_cyklisci', 'Zamojska Grupa Cyklistów', 'Roztoczańskie wąwozy, lasy i ścieżki Green Velo.', 'zamojska-grupa-cyklistow', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['siedlce_la', 'Siedlecki Klub Lekkoatletyczny', 'Treningi sprinterskie, skoki i biegi średniodystansowe.', 'siedlecki-klub-lekkoatletyczny', ColorEnum::Yellow, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['radom_wyprawy', 'Radomskie Rowerowe Wyprawy', 'Weekendowe wycieczki krajoznawcze po ziemi radomskiej.', 'radomskie-rowerowe-wyprawy', ColorEnum::Orange, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['gorzow_plywanie', 'Gorzowska Akademia Pływacka', 'Pływanie sportowe i ratownictwo wodne na rzece Warcie.', 'gorzowska-akademia-plywacka', ColorEnum::Blue, 'michal.zielinski@sportgram.local', ElementStatusEnum::Active],
            ['koszalin_bieg', 'Koszaliński Team Biegowy', 'Góra Chełmska i leśne ścieżki w kierunku Bałtyku.', 'koszalinski-team-biegowy', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['tarnow_tri', 'Tarnowski Klub Triathlonu', 'Treningi kolarskie po Pogórzu Ciężkowickim i biegi parkowe.', 'tarnowski-klub-triathlonu', ColorEnum::Red, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['czestochowa_szosa', 'Częstochowska Szosa i Gravel', 'Pętle kolarskie wokół Jury i lasów lublinieckich.', 'czestochowska-szosa-i-gravel', ColorEnum::Orange, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['bielsko_skyrunning', 'Bielsko-Biała Skyrunning Team', 'Klimczok, Szyndzielnia, Błatnia i Magurka Wilkowicka.', 'bielsko-biala-skyrunning-team', ColorEnum::Green, 'magdalena.lewandowska@sportgram.local', ElementStatusEnum::Active],
            ['rybnik_bike', 'Rybnicka Grupa Rowerowa', 'Trasy rowerowe wokół Zalewu Rybnickiego i Puszczy Rudzkiej.', 'rybnicka-grupa-rowerowa', ColorEnum::Red, 'organizer@sportgram.local', ElementStatusEnum::Active],
            ['legnica_bieg', 'Legnicki Klub Biegacza', 'Park Miejski w Legnicy i biegi wałami rzeki Kaczawy.', 'legnicki-klub-biegacza', ColorEnum::Yellow, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['elblag_wiosla', 'Elbląska Przystań Wioślarska', 'Rzeka Elbląg i Jezioro Druzno z bogatą przyrodą.', 'elblaska-przystan-wioslarska', ColorEnum::Blue, 'jakub.krawczyk@sportgram.local', ElementStatusEnum::Active],
            ['kalisz_bike', 'Kaliski Klub Kolarski', 'Tradycje najstarszego miasta w Polsce i wielkopolskie szosy.', 'kaliski-klub-kolarski', ColorEnum::Red, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['plock_bieg', 'Płocki Klub Biegacza', 'Wzgórze Tumskie, skarpa wiślana i Park Północny.', 'plocki-klub-biegacza', ColorEnum::Blue, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['grudziadz_woda', 'Grudziądzkie Wilki Wodne', 'Pływanie na Jeziorze Rudnickim Wielkim i kajaki na Wiśle.', 'grudziadzkie-wilki-wodne', ColorEnum::Blue, 'michal.zielinski@sportgram.local', ElementStatusEnum::Active],
            ['slupsk_bieg', 'Słupska Brygada Biegowa', 'Dolina Słupi, biegi przełajowe i wybiegania do Ustki.', 'slupska-brygada-biegowa', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['jaworzno_bike', 'Jaworznicka Grupa Kolarska', 'GEOsfera, Park Gródek (polskie Malediwy) i welodrom.', 'jaworznicka-grupa-kolarska', ColorEnum::Purple, 'organizer@sportgram.local', ElementStatusEnum::Active],
            ['ostrow_teren', 'Ostrów Biega w Terenie', 'Piaski Szczygliczka i leśne ścieżki powiatu ostrowskiego.', 'ostrow-biega-w-terenie', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['nowysacz_skitour', 'Nowosądecki Klub Skiturowy', 'Beskid Sądecki, Jaworzyna Krynicka i Radziejowa.', 'nowosadecki-klub-skiturowy', ColorEnum::Blue, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['pabianice_rolki', 'Pabianicka Grupa Rolkowa', 'Rolki fitness i rekreacja na miejskich alejkach i torach.', 'pabianicka-grupa-rolkowa', ColorEnum::Pink, 'monika.pawlak@sportgram.local', ElementStatusEnum::Active],
            ['konin_tri', 'Konin Triathlon Masters', 'Jeziora konińskie z ciepłą wodą i płaskie trasy rowerowe.', 'konin-triathlon-masters', ColorEnum::Orange, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['stargard_szosa', 'Stargardzka Szosa Masters', 'Szybkie jazdy wokół Jeziora Miedwie i po Pomorzu Zachodnim.', 'stargardzka-szosa-masters', ColorEnum::Red, 'piotr.wisniewski@sportgram.local', ElementStatusEnum::Active],
            ['zgierz_plywanie', 'Zgierski Klub Pływacki', 'Sekcja juniorska i masters w Parku Wodnym Malinka.', 'zgierski-klub-plywacki', ColorEnum::Blue, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['elk_wiosla', 'Ełcka Grupa Wioślarska', 'Jezioro Ełckie, Mazury i treningi na ergometrach.', 'elcka-grupa-wioslarska', ColorEnum::Blue, 'jakub.krawczyk@sportgram.local', ElementStatusEnum::Active],
            ['przemysl_rower', 'Przemyski Klub Rowerowy', 'Fort Twierdzy Przemyśl, strome zjazdy i Pogórze Przemyskie.', 'przemyski-klub-rowerowy', ColorEnum::Brown, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['cieszyn_bieg', 'Cieszyńska Szkoła Biegowa', 'Biegi nad Olzą, Wzgórze Zamkowe i polsko-czeskie pogranicze.', 'cieszynska-szkola-biegowa', ColorEnum::Green, 'jan.kowalski@sportgram.local', ElementStatusEnum::Active],
            ['zdunskawola_szosa', 'Zduńskowolski Team Kolarski', 'Treningi szosowe ziemi sieradzkiej i łaskiej.', 'zdunskowolski-team-kolarski', ColorEnum::Yellow, 'jan.kowalski@sportgram.local', ElementStatusEnum::Rejected],
        ];

        $janEmail = 'jan.kowalski@sportgram.local';
        $jan = $this->users[$janEmail];

        foreach ($pageTitles as [$key, $title, $desc, $link, $col, $ownerEmail, $status]) {
            $owner = $this->users[$ownerEmail] ?? $jan;
            $profilePhoto = $this->generateProfilePhoto(
                $col,
                $key . '_page',
            );
            $backgroundPhoto = $this->generateLandscapeSvg(
                $col,
                $key . '_bg',
            );
            $page = new Page(
                $owner,
                $title,
                $desc,
                $link,
                $profilePhoto,
                $backgroundPhoto,
                $col,
                $status,
            );
            $this->em->persist($page);
            $this->pages[$key] = $page;

            $ownerPart = new PageParticipant($page, $owner, SaveStatusEnum::Accepted);
            $this->em->persist($ownerPart);
            $this->pageParticipants[sprintf('%s_%s', $key, $owner->email)] = $ownerPart;

            if ($owner->email !== $janEmail) {
                $janPart = new PageParticipant($page, $jan, SaveStatusEnum::Accepted);
                $this->em->persist($janPart);
                $this->pageParticipants[sprintf('%s_%s', $key, $janEmail)] = $janPart;
            }

            $followerEmails = ['admin@sportgram.local', 'anna.nowak@sportgram.local', 'piotr.wisniewski@sportgram.local', 'magdalena.lewandowska@sportgram.local'];
            foreach ($followerEmails as $fEmail) {
                $follower = $this->users[$fEmail] ?? null;
                if ($follower && ! $follower->id->equals($owner->id)) {
                    $follow = new PageFollow($page, $follower, PageFollowStatusEnum::Accepted);
                    $this->em->persist($follow);
                }
            }
        }
    }

    private function seedEvents(): void
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];

        $eventDefs = [
            ['polmaraton-warszawski-2026', 'Półmaraton Warszawski 2026', 'Największy bieg wiosenny w stolicy. Szybka trasa przez Most Świętokrzyski.', 'Warszawa, PGE Narodowy', 30, DisciplineEnum::Running, 21097, 4950, 'wkb'],
            ['silesia-gravel-100', 'Silesia Gravel Classic 100km', 'Górnośląskie szutry i leśne dukty wokół Doliny Trzech Stawów.', 'Katowice, Dolina Trzech Stawów', 45, DisciplineEnum::Cycling, 100000, 11400, 'velo'],
            ['triathlon-gdynia-sprint', 'Triathlon Gdynia Sprint 2026', 'Sprint 750m pływania, 20km szosy i 5km biegu Bulwarem Nadmorskim.', 'Gdynia, Plaża Miejska', 60, DisciplineEnum::Swimming, 750, 720, 'baltic'],
            ['maraton-krakowski-2026', 'Cracovia Maraton 2026', 'Królewski dystans ze startem i metą na Rynku Głównym w Krakowie.', 'Kraków, Rynek Główny', 15, DisciplineEnum::Running, 42195, 11800, 'krakow_trail'],
            ['bieg-rzeznika-ultra', 'Bieg Rzeźnika Ultra 80km', 'Kultowy bieg bieszczadzki czerwonym szlakiem z Komańczy do Cisnej.', 'Cisna, Bieszczady', -10, DisciplineEnum::Running, 80000, 36000, 'bieszczady_wataha'],
            ['nocny-polmaraton-wroclaw', 'Nocny Wrocław Półmaraton 2026', 'Wyjątkowa nocna sceneria, podświetlone mosty i Stadion Olimpijski.', 'Wrocław, Stadion Olimpijski', 50, DisciplineEnum::Running, 21097, 5100, 'wroclaw_krasnale'],
            ['dycha-warszawska-wiosna', 'Bieg Na Piątkę i Dychę Warszawa', 'Atestowane trasy wzdłuż Wisłostrady sprzyjające rekordom życiowym.', 'Warszawa, Bulwary Wiślane', -5, DisciplineEnum::Running, 10000, 2350, 'wkb'],
            ['jura-gran-fondo', 'Jura Gran Fondo Szosa 120km', 'Szosowy klasyk przez jurajskie wzgórza, zamek Ogrodzieniec i Bobolice.', 'Zawiercie, Rynek', 25, DisciplineEnum::Cycling, 120000, 13800, 'jura_mtb'],
            ['bydgoszcz-open-water', 'Bydgoszcz Open Water Swim 3km', 'Pływanie z prądem rzeki Brdy przez samo serce miasta.', 'Bydgoszcz, Wyspa Młyńska', 70, DisciplineEnum::Swimming, 3000, 2700, 'bydgoszcz_sup'],
            ['silesia-roller-cup', 'Silesia Roller Cup 20km', 'Szybki wyścig na rolkach alejkami Parku Śląskiego.', 'Chorzów, Park Śląski', 40, DisciplineEnum::InlineSkating, 20000, 2400, 'slask_lyzwy'],
            ['bieg-piastow-jakuszyce', 'Bieg Piastów Jakuszyce 50km CT', 'Święto narciarstwa biegowego na Polanie Jakuszyckiej.', 'Jakuszyce, Polana Jakuszycka', -20, DisciplineEnum::CrossCountrySkiing, 50000, 12600, 'suwalki_biegowki'],
            ['regaty-motlawa-gdansk', 'Regaty Wioślarskie Motława Sprint', 'Wioślarskie osady w wyścigach na 2000 metrów pod Żurawiem.', 'Gdańsk, Długie Pobrzeże', 35, DisciplineEnum::Rowing, 2000, 410, 'baltic'],
            ['bieg-niepodleglosci-waw', 'Bieg Niepodległości Warszawa 10km', 'Narodowy bieg alejami Jana Pawła II z biało-czerwoną flagą.', 'Warszawa, al. Jana Pawła II', -80, DisciplineEnum::Running, 10000, 2390, 'wkb'],
            ['poznan-maraton-jesien', 'Poznań Maraton im. Macieja Frankiewicza', 'Szybka trasa przez stolicę Wielkopolski z metą na MTP.', 'Poznań, Międzynarodowe Targi Poznańskie', -40, DisciplineEnum::Running, 42195, 11900, 'poznan_half'],
            ['beskidy-gravel-tour', 'Beskidy Gravel Tour 75km', 'Szutry i górskie drogi stokowe wokół Skrzycznego i Baraniej Góry.', 'Wisła, Plac Hoffa', 55, DisciplineEnum::Cycling, 75000, 9600, 'beskidy_enduro'],
            ['tatry-skyrunning-zakopane', 'Tatry Skyrunning Kasprowy Wierch', 'Ekstremalny bieg alpejski z Kuźnic na szczyt Kasprowego Wierchu.', 'Zakopane, Kuźnice', 80, DisciplineEnum::Running, 8500, 3100, 'tatry_skitour'],
            ['gdansk-maraton-rolkowy', 'Gdański Półmaraton Rolkowy', 'Trasa wokół stadionu Polsat Plus Arena Gdańsk.', 'Gdańsk, Stadion Letnica', 65, DisciplineEnum::InlineSkating, 21097, 2600, 'baltic'],
            ['zalew-zemborzycki-15k', 'Dookoła Zalewu Zemborzyckiego 15km', 'Malownicza pętla biegowa wokół lubelskiego akwenu.', 'Lublin, Dąbrowa', 18, DisciplineEnum::Running, 15000, 3550, 'lublin_inline'],
            ['mazovia-mtb-otwock', 'Mazovia MTB Marathon Otwock 50km', 'Piaszczyste wydmy i leśne single Mazowieckiego Parku Krajobrazowego.', 'Otwock, Park Miejski', 22, DisciplineEnum::Cycling, 50000, 6300, 'mazowsze_gravel'],
            ['zegrze-open-water-1500', 'Zegrze Open Water Cup 1500m', 'Otwarte wody Jeziora Zegrzyńskiego pod okiem ratowników WOPR.', 'Nieporęt, Dzika Plaża', 48, DisciplineEnum::Swimming, 1500, 1420, 'wkb'],
            ['karkonosze-ultra-trail', 'Karkonosze Ultra Trail 55km', 'Szlak Grzbietowy od Szklarskiej Poręby przez Śnieżkę do Karpacza.', 'Karpacz, Stadion Miejski', 75, DisciplineEnum::Running, 55000, 22000, 'karkonosze_team'],
            ['wroclaw-klasyk-szosowy', 'Wrocławski Klasyk Szosowy 80km', 'Płaska i szybka pętla wokół Trzebnicy i Wzgórz Trzebnickich.', 'Trzebnica, Rynek', 33, DisciplineEnum::Cycling, 80000, 8400, 'dolnoslaska_szosa'],
            ['plock-maraton-wisla-kajak', 'Płocki Maraton Kajakowy 40km', 'Spływ Wisłą z Wyszogrodu do Płocka z widokiem na Wzgórze Tumskie.', 'Płock, Molo', 85, DisciplineEnum::Canoeing, 40000, 12000, 'plock_kajaki'],
            ['bieg-trzech-kopcow', 'Bieg Trzech Kopców Kraków', 'Międzynarodowe Otwarte Mistrzostwa Krakowa w Biegu Górskim.', 'Kraków, Kopiec Krakusa', -15, DisciplineEnum::Running, 13000, 3120, 'krakow_trail'],
            ['dycha-do-maratonu-lublin', 'Pierwsza Dycha do Maratonu Lublin', 'Sprawdzian formy przed Lubelskim Maratonem.', 'Lublin, Arena Lublin', 12, DisciplineEnum::Running, 10000, 2380, 'lublin_inline'],
            ['szczecin-polmaraton-gryfa', 'Szczeciński Półmaraton Gryfa', 'Bieg ulicami portowego Szczecina i Parku Kasprowicza.', 'Szczecin, Jasne Błonia', 38, DisciplineEnum::Running, 21097, 5080, 'szczecin_rowing'],
            ['mazury-gravel-tour', 'Mazurski Rajd Gravelowy 110km', 'Szkwały, leśne drogi Puszczy Piskiej i widoki na jeziora.', 'Mikołajki, Rynek', 90, DisciplineEnum::Cycling, 110000, 13500, 'elk_wiosla'],
            ['sopot-sunset-run-5k', 'Sopot Sunset Beach Run 5km', 'Bieg po plaży o zachodzie słońca przy brzegu morza.', 'Sopot, Plaża przy Molo', 52, DisciplineEnum::Running, 5000, 1190, 'sopot_openwater'],
            ['slask-maraton-katowice', 'Silesia Marathon 2026', 'Jedyny w Europie maraton prowadzony przez cztery śląskie miasta.', 'Chorzów, Stadion Śląski', 42, DisciplineEnum::Running, 42195, 11700, 'velo'],
            ['czestochowa-gravel-60k', 'Częstochowski Szlak Szutrowy 60km', 'Przejazd przez Złoty Potok, Olsztyn i leśne rezerwaty.', 'Częstochowa, Jasna Góra', 28, DisciplineEnum::Cycling, 60000, 7200, 'czestochowa_szosa'],
            ['zakopane-dycha-pod-reglami', 'Dycha pod Reglami Zakopane', 'Ścieżka pod Reglami z widokiem na panoramę Tatr.', 'Zakopane, Wielka Krokiew', 16, DisciplineEnum::Running, 10000, 2600, 'zakopane_morsy'],
            ['bialystok-polmaraton-las', 'Półmaraton Puszczy Knyszyńskiej', 'Dzika przyroda Podlasia i miękka leśna nawierzchnia.', 'Supraśl, Rynek', 62, DisciplineEnum::Running, 21097, 5300, 'bialystok_wilki'],
            ['kielce-trail-lysica', 'Świętokrzyski Bieg na Łysicę 25km', 'Głobocznice, gołoborza i strome podejścia Gór Świętokrzyskich.', 'Święta Katarzyna', 72, DisciplineEnum::Running, 25000, 6900, 'kielce_trail'],
            ['pomorze-maraton-szosowy', 'Pomorski Maraton Szosowy 150km', 'Długi dystans wzdłuż wybrzeża z metą na Helu.', 'Władysławowo, Rynek', 88, DisciplineEnum::Cycling, 150000, 16800, 'gdynia_rowers'],
            ['jezioro-ukiel-swim-2k', 'Ukiel Swim Challenge 2000m', 'Czyste wody Jeziora Krzywego w stolicy Warmii.', 'Olsztyn, Plaża Miejska', 58, DisciplineEnum::Swimming, 2000, 1850, 'olsztyn_warmia'],
            ['rzeszow-polmaraton-wiosna', 'PKO Rzeszów Półmaraton', 'Szybka dwupętlowa trasa ulicami Rzeszowa.', 'Rzeszów, Rynek', 20, DisciplineEnum::Running, 21097, 5150, 'rzeszow_run'],
            ['opole-bieg-odrzanski-10k', 'Opolski Bieg Odrzański 10km', 'Nawierzchnia asfaltowa wzdłuż rzeki Odry.', 'Opole, Plac Wolności', 24, DisciplineEnum::Running, 10000, 2410, 'opole_bieg'],
            ['zielona-gora-cross-15k', 'Zielonogórski Cross Winiarski 15km', 'Bieg pośród wzgórz winorośli i lasów lubuskich.', 'Zielona Góra, Palmiarnia', 36, DisciplineEnum::Running, 15000, 3700, 'zgora_bike'],
            ['torun-polmaraton-staromiejski', 'Toruński Półmaraton Gotycki', 'Start z fosy staromiejskiej z widokiem na gotyckie mury.', 'Toruń, Rynek Staromiejski', 44, DisciplineEnum::Running, 21097, 5200, 'torun_tri'],
            ['gorzow-dycha-nad-warta', 'Gorzowska Dycha nad Wartą', 'Bieg po bulwarach i nowej trasie wzdłuż rzeki Warty.', 'Gorzów Wielkopolski, Bulwar', 14, DisciplineEnum::Running, 10000, 2430, 'gorzow_plywanie'],
            ['koszalin-gora-chelmska-run', 'Bieg na Górę Chełmską 12km', 'Wymagający bieg przełajowy ze stromym finiszem pod wieżę.', 'Koszalin, Góra Chełmska', 66, DisciplineEnum::Running, 12000, 3100, 'koszalin_bieg'],
            ['tarnow-gravel-50k', 'Gravel po Pogórzu Ciężkowickim', 'Wąskie drogi asfaltowe i szutrowe w krainie Skamieniałego Miasta.', 'Tarnów, Rynek', 78, DisciplineEnum::Cycling, 50000, 6100, 'tarnow_tri'],
            ['rybnik-bieg-wokol-zalewu', 'Półmaraton Rybnicki wokół Zalewu', 'Piękne widoki na wodę i szybka, płaska trasa.', 'Rybnik, Ruda', 26, DisciplineEnum::Running, 21097, 5180, 'rybnik_bike'],
            ['legnica-bieg-parkowy-5k', 'Legnicki Bieg Parkowy 5km', 'Błyskawiczny sprawdzian szybkości w cieniu starych platanów.', 'Legnica, Park Miejski', 8, DisciplineEnum::Running, 5000, 1180, 'legnica_bieg'],
            ['kalisz-maraton-najstarszy', 'Bieg Najstarszego Miasta Kalisz', 'Trasa wytyczona wzdłuż rzeki Prosny i zabytkowego parku.', 'Kalisz, Główny Rynek', 54, DisciplineEnum::Running, 10000, 2400, 'kalisz_bike'],
            ['slupsk-trail-dolina-slupi', 'Trail Doliny Słupi 25km', 'Meandry rzeki Słupi, zwalone pnie i naturalne przeszkody.', 'Słupsk, Zamek Książąt Pomorskich', 82, DisciplineEnum::Running, 25000, 6800, 'slupsk_bieg'],
            ['jaworzno-grodek-run', 'Jaworznicki Bieg Polskie Malediwy', 'Trasa wokół lazurowych zbiorników Parku Gródek.', 'Jaworzno, Park Gródek', 32, DisciplineEnum::Running, 10000, 2420, 'jaworzno_bike'],
            ['nowy-sacz-polmaraton-dunajec', 'Półmaraton Doliny Dunajca', 'Szybki zbieg z gór wzdłuż wartkiego nurtu Dunajca.', 'Nowy Sącz, Rynek', 68, DisciplineEnum::Running, 21097, 4980, 'nowysacz_skitour'],
            ['konin-swim-patnowskie', 'Jezioro Pątnowskie Open Water 1km', 'Zawody pływackie w ciepłych wodach jeziora konińskiego.', 'Konin, Ośrodek Gosławice', 74, DisciplineEnum::Swimming, 1000, 940, 'konin_tri'],
            ['stargard-bieg-miedwie-10k', 'Bieg Wokół Miedwia 10km', 'Płaska trasa przy linii brzegowej piątego największego jeziora w Polsce.', 'Morzyczyn, Promenada', 22, DisciplineEnum::Running, 10000, 2370, 'stargard_szosa'],
            ['zgierz-cross-malinka', 'Zgierski Cross Leśny 8km', 'Ostre podbiegi na Malince i piaszczyste ścieżki leśne.', 'Zgierz, Ośrodek Malinka', 10, DisciplineEnum::Running, 8000, 1980, 'zgierz_plywanie'],
            ['elk-maraton-mazurski', 'Półmaraton Ełcki 2026', 'Trasa biegnąca malowniczą promenadą Jeziora Ełckiego.', 'Ełk, Promenada', 46, DisciplineEnum::Running, 21097, 5120, 'elk_wiosla'],
            ['przemysl-twierdza-trail', 'Bieg Twierdzy Przemyśl 20km', 'Bieg po carskich i austriackich fortach obronnych.', 'Przemyśl, Rynek', 84, DisciplineEnum::Running, 20000, 5600, 'przemysl_rower'],
            ['cieszyn-transgraniczny-10k', 'Cieszyński Bieg Transgraniczny', 'Trasa przekraczająca graniczny most na rzece Olzie.', 'Cieszyn, Most Przyjaźni', 30, DisciplineEnum::Running, 10000, 2410, 'cieszyn_bieg'],
            ['pabianice-polmaraton-polny', 'Półmaraton Pabianicki 21km', 'Wiosenny bieg pośród kwitnących pól centralnej Polski.', 'Pabianice, MOSiR', 18, DisciplineEnum::Running, 21097, 5250, 'pabianice_rolki'],
            ['suwalki-bieg-wigry-25k', 'Bieg Wokół Jeziora Wigry', 'Kamedulski klasztor i dzika przyroda Wigierskiego Parku.', 'Wigry, Klasztor', 76, DisciplineEnum::Running, 25000, 6700, 'suwalki_biegowki'],
            ['ostrow-piaski-run-10k', 'Piaski Szczygliczka Run 10km', 'Bieg wokół ostrowskiego zalewu rekreacyjnego.', 'Ostrów Wielkopolski, Piaski', 24, DisciplineEnum::Running, 10000, 2390, 'ostrow_teren'],
            ['katowice-nocny-parkrun', 'Nocny Bieg Parkowy Katowice 5km', 'Oświetlone alejki Doliny Trzech Stawów nocną porą.', 'Katowice, Dolina Trzech Stawów', 12, DisciplineEnum::Running, 5000, 1170, 'velo'],
            ['warszawa-triathlon-1-4', 'Warszawa Triathlon 1/4 IM', '950m pływania w Zegrzu, 45km szosy i 10.5km biegu.', 'Warszawa, Port Nieporęt', 64, DisciplineEnum::Swimming, 950, 920, 'triton'],
            ['krakow-blonia-sprawdzian-5k', 'Sprawdzian Biegowy Błonia 5km', 'Błyskawiczna asfaltowa pętla wokół krakowskich Błoń.', 'Kraków, al. 3 Maja', 5, DisciplineEnum::Running, 5000, 1160, 'krakow_trail'],
        ];

        $organizer = $this->users['organizer@sportgram.local'] ?? $admin;
        $organizers = [$jan, $admin, $organizer, $piotr];
        $athletes = [$jan, $anna, $piotr, $admin];

        foreach ($eventDefs as $i => [$link, $title, $desc, $loc, $days, $disc, $dist, $finishTime, $pageKey]) {
            $organizerUser = $organizers[$i % count($organizers)];
            $partKey = sprintf('%s_%s', $pageKey, $organizerUser->email);
            $part = $this->pageParticipants[$partKey] ?? array_values($this->pageParticipants)[0];

            $eventFeed = new Feed($organizerUser, null, null, ElementStatusEnum::Active);
            $this->em->persist($eventFeed);
            $this->feeds[] = $eventFeed;

            $startedAt = new DateTimeImmutable(sprintf('%+d days 09:00:00', $days));
            $endedAt = $startedAt->modify('+4 hours');
            $status = ($i % 15 === 14) ? ElementStatusEnum::Rejected : ElementStatusEnum::Active;

            $photo = $this->generateLandscapeSvg(
                $part->page->color,
                $link . '_bg',
            );

            $event = new Event(
                $part,
                $eventFeed,
                $startedAt,
                $endedAt,
                $title,
                $desc,
                $link,
                '1. Przestrzegaj regulaminu imprezy. 2. Limit czasu zgodnie z komunikatem technicznym.',
                $photo,
                $loc,
                $status,
            );
            $this->em->persist($event);
            $this->events[$link] = $event;

            $ed = new EventDiscipline($event, $disc);
            $this->em->persist($ed);

            $edd = new EventDisciplineDistance($ed, $dist);
            $this->em->persist($edd);

            $subDistVal = (int)round($dist / 2);
            $subDist = new EventDisciplineSubDistance($edd, $subDistVal);
            $this->em->persist($subDist);

            $runner = $athletes[$i % count($athletes)];
            $listFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
            $this->em->persist($listFeed);
            $this->feeds[] = $listFeed;

            $listEntry = new EventDisciplineList($edd, $listFeed, $runner, SaveStatusEnum::Accepted);
            $this->em->persist($listEntry);

            $competitor = $athletes[($i + 1) % count($athletes)];
            $compListFeed = new Feed($competitor, null, null, ElementStatusEnum::Active);
            $this->em->persist($compListFeed);
            $this->feeds[] = $compListFeed;

            $compListEntry = new EventDisciplineList($edd, $compListFeed, $competitor, SaveStatusEnum::Accepted);
            $this->em->persist($compListEntry);

            if ($days < 0 || $i % 3 === 0) {
                $resFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
                $this->em->persist($resFeed);
                $this->feeds[] = $resFeed;

                $result = new EventDisciplineResult($listEntry, $resFeed, $runner, $finishTime);
                $this->em->persist($result);

                $subRes = new EventDisciplineSubResult($subDist, $result, $runner, (int)round($finishTime / 2));
                $this->em->persist($subRes);

                $compFinishTime = (int)round($finishTime * 1.05);
                $compResFeed = new Feed($competitor, null, null, ElementStatusEnum::Active);
                $this->em->persist($compResFeed);
                $this->feeds[] = $compResFeed;

                $compResult = new EventDisciplineResult($compListEntry, $compResFeed, $competitor, $compFinishTime);
                $this->em->persist($compResult);

                $compSubRes = new EventDisciplineSubResult($subDist, $compResult, $competitor, (int)round($compFinishTime / 2));
                $this->em->persist($compSubRes);
            }
        }
    }

    private function seedTrainings(): void
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $athletes = [$jan, $anna, $piotr, $admin];
        $allAthletes = array_values($this->users);

        /**
         * Training definitions format:
         * [title, link, location, daysAgo, creatorEmail, [ [DisciplineEnum, [ [distanceMeters, durationSeconds], ... ]], ... ]]
         *
         * @var array<int, array{0: string, 1: string, 2: string, 3: int, 4: string|null, 5: array<int, array{0: DisciplineEnum, 1: array<int, array{0: int, 1: int}>}>}>
         */
        $trainingDefs = [
            // --- Single discipline Running (single & multi-distance) ---
            ['Poranny rozruch wzdłuż Wisły', 'poranny-rozruch-wisla-1k', 'Warszawa, Bulwary Wiślane', -1, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[1000, 240]]],
            ]],
            ['Szybki kilometr z hakiem', 'szybki-odcinek-1500m', 'Warszawa, Park Skaryszewski', -2, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[1500, 375]]],
            ]],
            ['Odcinek testowy w Agrykoli', 'odcinek-testowy-2k', 'Warszawa, Park Ujazdowski', -3, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[2000, 520]]],
            ]],
            ['Bieg tempowy 3 km w trupa', 'bieg-tempowy-3k', 'Warszawa, Kępa Potocka', -4, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[3000, 780]]],
            ]],
            ['Czwórka na rozgrzewkę przed zawodami', 'czworka-rozgrzewka-4k', 'Warszawa, Pole Mokotowskie', -5, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[4000, 1020]]],
            ]],
            ['Piątka parkrun w Parku Skaryszewskim', 'piatka-parkrun-5k', 'Warszawa, Park Skaryszewski', -6, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[5000, 1260]]],
            ]],
            ['Spokojne 6 km po pracy', 'spokojne-szesc-km', 'Warszawa, Lasek Bielański', -7, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[6000, 1500]]],
            ]],
            ['Siódemka o poranku przed pracą', 'siodemka-o-poranku-7k', 'Warszawa, Bulwary Wiślane', -8, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[7000, 1750]]],
            ]],
            ['Ósemka interwałowa na bieżni AWF', 'osemka-interwalowa-8k', 'Warszawa, Stadion AWF', -9, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [2000, 520],
                    [4000, 960],
                    [2000, 500],
                ]],
            ]],
            ['Dziewięć kilometrów w drugim zakresie', 'dziewiec-km-zakres-2', 'Warszawa, Las Kabacki', -10, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[9000, 2220]]],
            ]],
            ['Klasyczna dycha w tempie maratońskim', 'klasyczna-dycha-10k', 'Warszawa, Wał Zawadowski', -11, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [1500, 420],
                    [7000, 1680],
                    [1500, 360],
                ]],
            ]],
            ['Jedenastka w tlenie w lesie', 'jedenastka-w-tlenie-11k', 'Warszawa, Puszcza Kampinoska', -12, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[11000, 2700]]],
            ]],
            ['Dwanaście kilometrów z narastającą prędkością', 'dwunastka-bnp-12k', 'Warszawa, Park Młociński', -13, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [4000, 1050],
                    [4000, 980],
                    [4000, 920],
                ]],
            ]],
            ['Trzynaście kilometrów regeneracji', 'trzynascie-km-regeneracji', 'Warszawa, Bulwary Wiślane', -14, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[13000, 3190]]],
            ]],
            ['Czternaście kilometrów po pagórkach', 'czternastka-podbiegi-14k', 'Warszawa, Skarpa Ursynowska', -15, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[14000, 3440]]],
            ]],
            ['Piętnaście kilometrów w stałym tempie', 'pietnastka-stale-tempo-15k', 'Warszawa, Las Młociński', -16, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [2000, 540],
                    [11000, 2640],
                    [2000, 510],
                ]],
            ]],
            ['Szesnastka weekendowa w Kampinosie', 'szesnastka-kampinos-16k', 'Izabelin, Kampinos', -17, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[16000, 3930]]],
            ]],
            ['Osiemnaście kilometrów przed maratonem', 'osiemnastka-przedmaratonska-18k', 'Warszawa, Wał Miedzeszyński', -18, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[18000, 4450]]],
            ]],
            ['Dwudziestka w tlenie w słońcu', 'dwudziestka-w-tlenie-20k', 'Warszawa, Bulwary Wiślane', -19, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[20000, 4980]]],
            ]],
            ['Sprawdzian na dystansie półmaratonu', 'sprawdzian-polmaraton-21k', 'Warszawa, Trasa Półmaratonu', -20, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [5000, 1260],
                    [10000, 2460],
                    [6097, 1520],
                ]],
            ]],
            ['Długie wybieganie 25 km w niedzielę', 'dlugie-wybieganie-25k', 'Warszawa, Kampinoski PN', -21, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[25000, 6300]]],
            ]],
            ['Trzydziestka w ramach przygotowań do maratonu', 'trzydziestka-maratonska-30k', 'Warszawa, Trasa wzdłuż Wisły', -22, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[30000, 7800]]],
            ]],
            ['Długie wybieganie z akcentem 32 km', 'wybieganie-akcent-32k', 'Warszawa, Las Kabacki', -23, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [10000, 2650],
                    [12000, 3050],
                    [10000, 2650],
                ]],
            ]],
            ['Ostatnie długie wybieganie 35 km', 'ostatnia-trzydziestka-piatka-35k', 'Puszcza Kampinoska, Granica', -24, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[35000, 9200]]],
            ]],
            ['Symulacja maratonu na atestowanej trasie', 'symulacja-maratonu-42k', 'Warszawa, Trasa Maratonu', -25, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [10000, 2700],
                    [10000, 2700],
                    [10000, 2700],
                    [12195, 3300],
                ]],
            ]],

            // --- Single discipline Cycling (single & multi-distance) ---
            ['Rozgrzewka szosowa na pętli', 'rozgrzewka-szosa-10k', 'Warszawa, Pętla Gassy', -26, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[10000, 1200]]],
            ]],
            ['Szybka runda wokół komina', 'szybka-runda-15k', 'Warszawa, Wilanów', -27, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[15000, 1750]]],
            ]],
            ['Dwudziestka regeneracyjna na szosie', 'dwudziestka-szosa-20k', 'Warszawa, Konstancin', -28, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[20000, 2300]]],
            ]],
            ['Dwadzieścia pięć kilometrów w tlenie', 'dwadziescia-piec-km-szosa', 'Warszawa, Wał Miedzeszyński', -29, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[25000, 2850]]],
            ]],
            ['Pętla szosowa Gassy 30 km', 'petla-gassy-30k', 'Konstancin, Gassy', -30, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[30000, 3400]]],
            ]],
            ['Trzydzieści pięć kilometrów ze średnią 34', 'trzydziesci-piec-km-szosa', 'Otwock, Karczew', -31, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[35000, 3950]]],
            ]],
            ['Czterdziestka szosowa w słońcu', 'czterdziestka-szosa-40k', 'Piaseczno, Góra Kalwaria', -32, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[40000, 4500]]],
            ]],
            ['Trening jazdy na czas 45 km', 'jazda-na-czas-45k', 'Góra Kalwaria, Czersk', -33, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [5000, 650],
                    [35000, 3850],
                    [5000, 600],
                ]],
            ]],
            ['Pięćdziesiątka szosowa z grupą', 'piecdziesiatka-szosa-50k', 'Warszawa, Szosa Lubelska', -34, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [10000, 1200],
                    [30000, 3150],
                    [10000, 1300],
                ]],
            ]],
            ['Sześćdziesiąt kilometrów gravelu po lesie', 'szescdziesiatka-gravel-60k', 'Puszcza Kampinoska', -35, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[60000, 6800]]],
            ]],
            ['Siedemdziesiąt kilometrów w peletonie', 'siedemdziesiatka-peleton-70k', 'Warszawa, Mazowsze Płd', -36, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[70000, 7950]]],
            ]],
            ['Osiemdziesiąt kilometrów po Jurze', 'osiemdziesiatka-jura-80k', 'Zawiercie, Ogrodzieniec', -37, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [15000, 1900],
                    [50000, 5250],
                    [15000, 1950],
                ]],
            ]],
            ['Dziewięćdziesiąt kilometrów z przewyższeniami', 'dziewiecdziesiatka-szosa-90k', 'Podkarpacie, Strzyżów', -38, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[90000, 10300]]],
            ]],
            ['Gran Fondo 100 km z przyjaciółmi', 'gran-fondo-100k', 'Warszawa - Góra Kalwaria - Warszawa', -39, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [30000, 3600],
                    [40000, 4400],
                    [30000, 3500],
                ]],
            ]],
            ['Długi rajd kolarski 120 km', 'dlugi-rajd-szosa-120k', 'Mazowsze, Pętla Grójecka', -40, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [[120000, 14000]]],
            ]],

            // --- Single discipline Swimming (single & multi-distance) ---
            ['Krótki basen na technikę 400m', 'krotki-basen-technika-400m', 'Warszawa, OSiR Polna', -41, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[400, 420]]],
            ]],
            ['Pięćsetka rozgrzewkowa kraulem', 'piecsetka-rozgrzewka-500m', 'Warszawa, Wodny Park Warszawianka', -42, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[500, 510]]],
            ]],
            ['Dystans sprinterski w triathlonie 750m', 'sprint-tri-plywanie-750m', 'Warszawa, Basen Inflancka', -43, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[750, 760]]],
            ]],
            ['Osiemsetka stylem dowolnym', 'osiemsetka-dowolny-800m', 'Warszawa, CSR WUM', -44, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[800, 800]]],
            ]],
            ['Kilometr w wodzie z łapkami', 'kilometr-z-lapkami-1000m', 'Warszawa, Wodny Park Warszawianka', -45, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[1000, 1020]]],
            ]],
            ['Tysiąc dwieście metrów interwałów', 'tysiac-dwiescie-interwaly-1200m', 'Warszawa, OSiR Żoliborz', -46, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [300, 330],
                    [600, 580],
                    [300, 320],
                ]],
            ]],
            ['Półtora kilometra ciągłego pływania', 'poltora-km-ciagly-1500m', 'Warszawa, Basen Olimpijski', -47, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [300, 320],
                    [1000, 990],
                    [200, 220],
                ]],
            ]],
            ['Dystans 1/2 Ironmana w wodzie 1900m', 'dystans-polowki-im-1900m', 'Jezioro Zegrzyńskie, Nieporęt', -48, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[1900, 1950]]],
            ]],
            ['Dwa kilometry w piance open water', 'dwa-km-open-water-2000m', 'Zalew Zegrzyński', -49, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[2000, 2060]]],
            ]],
            ['Dwa i pół kilometra na Zegrzu', 'dwa-i-pol-km-zegrze-2500m', 'Jezioro Zegrzyńskie, Port Pilawa', -50, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [500, 530],
                    [1500, 1540],
                    [500, 530],
                ]],
            ]],
            ['Trzy kilometry treningu tlenowego', 'trzy-km-trening-tlenowy-3000m', 'Warszawa, Wodny Park Warszawianka', -51, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[3000, 3150]]],
            ]],
            ['Pełny dystans pływacki Ironmana 3800m', 'pelny-dystans-im-plywanie-3800m', 'Zalew Zegrzyński, Dzika Plaża', -52, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [1900, 2000],
                    [1900, 2050],
                ]],
            ]],

            // --- Single discipline Inline Skating ---
            ['Rolki szybkościowe dycha w parku', 'rolki-dycha-park-10k', 'Warszawa, Park Szczęśliwicki', -53, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[10000, 1600]]],
            ]],
            ['Piętnaście kilometrów na kółkach 110mm', 'pietnastka-rolki-15k', 'Chorzów, Park Śląski', -54, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::InlineSkating, [
                    [2000, 350],
                    [11000, 1700],
                    [2000, 350],
                ]],
            ]],
            ['Dwudziestka rolkowa po płaskim asfalcie', 'dwudziestka-rolki-20k', 'Warszawa, Bulwary Wiślane', -55, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[20000, 3200]]],
            ]],

            // --- Individual specific trainings ---
            ['Bieg regeneracyjny Adama', 'adam-bieg-regeneracyjny', 'Warszawa, Park Agrykola', -2, 'admin@sportgram.local', [
                [DisciplineEnum::Running, [[8000, 2100]]],
            ]],
            ['Poranne pływanie Ani', 'anna-poranne-plywanie', 'Warszawa, Inflancka', -3, 'anna.nowak@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [500, 550],
                    [1000, 1100],
                    [500, 550],
                ]],
            ]],
            ['Szosa Piotra w Jurze', 'piotr-szosa-jura', 'Zawiercie, Kromołów', -4, 'piotr.wisniewski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [15000, 1800],
                    [35000, 3900],
                    [15000, 1800],
                ]],
            ]],
            ['Basen techniczny Michała', 'michal-basen-techniczny', 'Warszawa, WUM', -5, 'michal.zielinski@sportgram.local', [
                [DisciplineEnum::Swimming, [[2500, 2700]]],
            ]],
            ['Trening rolkowy Olgi', 'olga-trening-rolkowy', 'Katowice, Muchowiec', -6, 'organizer@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[18000, 2900]]],
            ]],

            // --- Multi-discipline Triathlons & Duathlons ---
            ['Triathlon Olimpijski - przetarcie szlaków', 'triathlon-olimpijski-zegrze', 'Jezioro Zegrzyńskie, Nieporęt', -8, 'admin@sportgram.local', [
                [DisciplineEnum::Swimming, [[1500, 1560]]],
                [DisciplineEnum::Cycling, [
                    [35000, 3600],
                    [5000, 600],
                ]],
                [DisciplineEnum::Running, [
                    [8000, 2080],
                    [2000, 520],
                ]],
            ]],
            ['Triathlon Sprinterski w Parku Skaryszewskim', 'sprint-triathlon-kamionkowskie', 'Warszawa, Park Skaryszewski', -11, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Swimming, [[750, 780]]],
                [DisciplineEnum::Cycling, [[20000, 2200]]],
                [DisciplineEnum::Running, [[5000, 1260]]],
            ]],
            ['Klasyczny Duathlon w Parku Śląskim', 'klasyczny-duathlon-park-slaski', 'Chorzów, Park Śląski', -14, 'organizer@sportgram.local', [
                [DisciplineEnum::Running, [[5000, 1250]]],
                [DisciplineEnum::Cycling, [[20000, 2200]]],
                [DisciplineEnum::Running, [[2500, 650]]],
            ]],
            ['Trening zakładkowy (Brick) przed połówką IM', 'brick-trening-gassy-szosa-bieg', 'Konstancin, Gassy', -15, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [35000, 3700],
                    [10000, 1200],
                ]],
                [DisciplineEnum::Running, [
                    [6000, 1500],
                    [2000, 540],
                ]],
            ]],
            ['Aquathlon Zegrzyński (Woda + Bieg)', 'aquathlon-zegrzynski-woda-bieg', 'Jezioro Zegrzyńskie, Nieporęt', -17, 'anna.nowak@sportgram.local', [
                [DisciplineEnum::Swimming, [[1000, 1050]]],
                [DisciplineEnum::Running, [[5000, 1280]]],
            ]],
            ['Duathlon przełajowy w Kampinosie', 'duathlon-kampinos-przelaj', 'Warszawa, Puszcza Kampinoska', -19, 'piotr.wisniewski@sportgram.local', [
                [DisciplineEnum::Running, [[4000, 1080]]],
                [DisciplineEnum::Cycling, [[15000, 2200]]],
                [DisciplineEnum::Running, [[2000, 580]]],
            ]],
            ['Cross-training wioślarsko-biegowy na Malcie', 'cross-wioslarstwo-bieg-malta', 'Poznań, Tor Regatowy Malta', -22, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Rowing, [[4000, 920]]],
                [DisciplineEnum::Running, [[6000, 1500]]],
            ]],
            ['Morska wyprawa kajakowa z pływaniem wpław', 'wyprawa-kajak-plywanie-brzezno', 'Gdańsk, Molo Brzeźno', -23, 'anna.nowak@sportgram.local', [
                [DisciplineEnum::Canoeing, [[6000, 2400]]],
                [DisciplineEnum::Swimming, [[1200, 1300]]],
            ]],
            ['Miejskie combo: rolki i deskorolka', 'miejskie-combo-rolki-deska', 'Warszawa, Pole Mokotowskie', -25, 'organizer@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[12000, 1950]]],
                [DisciplineEnum::Skateboarding, [[4000, 980]]],
            ]],
            ['Zimowy biathlon amatorski w Jakuszycach', 'zimowy-biathlon-jakuszyce', 'Szklarska Poręba, Jakuszyce', -27, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::CrossCountrySkiing, [
                    [10000, 2200],
                    [5000, 1100],
                ]],
                [DisciplineEnum::Running, [[3000, 850]]],
            ]],
            ['Tatry: podejście biegowe i zjazd snowboardowy', 'tatry-skitour-snowboard-nosal', 'Zakopane, Nosal', -28, 'admin@sportgram.local', [
                [DisciplineEnum::Running, [[4000, 1400]]],
                [DisciplineEnum::Snowboarding, [[3000, 600]]],
            ]],
            ['Łyżwiarstwo szybkie Stegny z rozgrzewką biegową', 'stegny-lyzwiarstwo-bieg-rozgrzewka', 'Warszawa, Tor Stegny', -30, 'admin@sportgram.local', [
                [DisciplineEnum::Running, [[3000, 800]]],
                [DisciplineEnum::IceSkating, [[10000, 1450]]],
            ]],
            ['Kajakarstwo na Wiśle i bieg bulwarami', 'kajakarstwo-wisla-krakow-bulwary', 'Kraków, Bulwary Wiślane', -31, 'michal.zielinski@sportgram.local', [
                [DisciplineEnum::Canoeing, [[5000, 2100]]],
                [DisciplineEnum::Running, [[5000, 1300]]],
            ]],
            ['Wioślarstwo i bieg wokół zalewu', 'wioslarstwo-bieg-zalew-zegrzynski', 'Jezioro Zegrzyńskie, Port Pilawa', -33, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Rowing, [[5000, 1150]]],
                [DisciplineEnum::Running, [[7000, 1850]]],
            ]],
            ['Rolki i deska wzdłuż Bałtyku', 'gdynia-rolki-deska-bulwar', 'Gdynia, Bulwar Nadmorski', -34, 'organizer@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[10000, 1600]]],
                [DisciplineEnum::Skateboarding, [[3000, 720]]],
            ]],
            ['Nartorolki i bieg w Parku Śląskim', 'nartorolki-bieg-park-slaski', 'Chorzów, Park Śląski', -36, 'organizer@sportgram.local', [
                [DisciplineEnum::InlineSkating, [[14000, 2200]]],
                [DisciplineEnum::Running, [[4000, 1020]]],
            ]],
            ['Triathlon treningowy 1/4 IM na Zakrzówku', 'triathlon-treningowy-zakrzowek', 'Kraków, Zakrzówek', -37, 'admin@sportgram.local', [
                [DisciplineEnum::Swimming, [[950, 990]]],
                [DisciplineEnum::Cycling, [
                    [35000, 3700],
                    [10000, 1100],
                ]],
                [DisciplineEnum::Running, [
                    [8000, 2080],
                    [2500, 670],
                ]],
            ]],
            ['Duathlon sprinterski we Wrocławiu', 'duathlon-szczytnicki-wroclaw', 'Wrocław, Park Szczytnicki', -39, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::Running, [[3000, 750]]],
                [DisciplineEnum::Cycling, [[12000, 1350]]],
                [DisciplineEnum::Running, [[1500, 390]]],
            ]],
            ['Kajakowy spływ i bieg po plaży', 'kajak-bieg-plaza-reagana', 'Gdańsk, Park Reagana', -41, 'anna.nowak@sportgram.local', [
                [DisciplineEnum::Canoeing, [[4000, 1700]]],
                [DisciplineEnum::Running, [[6000, 1550]]],
            ]],
            ['Bieg górski z elementami snowboardu', 'koscieliska-gorski-snowboard', 'Zakopane, Dolina Kościeliska', -43, 'piotr.wisniewski@sportgram.local', [
                [DisciplineEnum::Running, [[8000, 2500]]],
                [DisciplineEnum::Snowboarding, [[4000, 800]]],
            ]],
            ['Pływanie open water i rozbieganie na Malcie', 'malta-plywanie-openwater-bieg', 'Poznań, Tor Regatowy Malta', -44, 'anna.nowak@sportgram.local', [
                [DisciplineEnum::Swimming, [[2000, 2100]]],
                [DisciplineEnum::Running, [[8000, 2050]]],
            ]],
            ['Wioślarstwo i trening interwałowy na AWF', 'awf-wioslarstwo-bieznia-interwaly', 'Warszawa, Stadion AWF', -46, 'admin@sportgram.local', [
                [DisciplineEnum::Rowing, [[3000, 700]]],
                [DisciplineEnum::Running, [[5000, 1200]]],
            ]],
            ['Łyżwiarstwo i bieg wokół Parku Śląskiego', 'lyzwiarstwo-bieg-slaski-lod', 'Chorzów, Park Śląski', -47, 'organizer@sportgram.local', [
                [DisciplineEnum::Running, [[4000, 1040]]],
                [DisciplineEnum::IceSkating, [[8000, 1200]]],
            ]],
            ['Duathlon szosowy z finiszem pod Górę Zamkową', 'duathlon-jura-ogrodzieniec', 'Zawiercie, Ogrodzieniec', -49, 'piotr.wisniewski@sportgram.local', [
                [DisciplineEnum::Running, [[6000, 1600]]],
                [DisciplineEnum::Cycling, [[30000, 3300]]],
                [DisciplineEnum::Running, [[3000, 820]]],
            ]],
            ['Biegi narciarskie i marszobieg zimowy', 'jakuszyce-biegowki-marszobieg', 'Szklarska Poręba, Jakuszyce', -51, 'jan.kowalski@sportgram.local', [
                [DisciplineEnum::CrossCountrySkiing, [
                    [15000, 3300],
                    [5000, 1100],
                ]],
                [DisciplineEnum::Running, [[4000, 1100]]],
            ]],

            // --- Additional endurance workouts with team athletes ---
            ['Gravelowa eksploracja Kampinosu Katarzyny', 'katarzyna-gravel-kampinos-55k', 'Warszawa, Puszcza Kampinoska', -5, 'katarzyna.wojcik@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [15000, 1950],
                    [30000, 3600],
                    [10000, 1300],
                ]],
            ]],
            ['Mocne interwały na bieżni AWF Tomasza', 'tomasz-interwaly-awf-12k', 'Warszawa, Stadion AWF', -7, 'tomasz.lewandowski@sportgram.local', [
                [DisciplineEnum::Running, [
                    [3000, 780],
                    [6000, 1440],
                    [3000, 810],
                ]],
            ]],
            ['Długi trening open water Magdy na Zegrzu', 'magda-plywanie-zegrze-open-water', 'Zalew Zegrzyński, Dzika Plaża', -9, 'magdalena.kaminska@sportgram.local', [
                [DisciplineEnum::Swimming, [
                    [1000, 1050],
                    [1500, 1550],
                    [500, 520],
                ]],
            ]],
            ['Szosa Czersk - Góra Kalwaria Marcina', 'marcin-szosa-czersk-gora-kalwaria', 'Góra Kalwaria, Czersk', -12, 'marcin.mazur@sportgram.local', [
                [DisciplineEnum::Cycling, [
                    [20000, 2300],
                    [30000, 3300],
                    [15000, 1750],
                ]],
            ]],
            ['Szybkie rolki w Dolinie Trzech Stawów Natalii', 'natalia-rolki-dolina-trzech-stawow', 'Katowice, Dolina Trzech Stawów', -13, 'natalia.wozniak@sportgram.local', [
                [DisciplineEnum::InlineSkating, [
                    [4000, 680],
                    [14000, 2200],
                    [4000, 700],
                ]],
            ]],
        ];

        foreach ($trainingDefs as $i => [$title, $link, $loc, $daysAgo, $creatorEmail, $disciplinesData]) {
            $creator = ($creatorEmail !== null && isset($this->users[$creatorEmail]))
                ? $this->users[$creatorEmail]
                : (($i % 4 !== 0) ? $athletes[$i % count($athletes)] : ($allAthletes[$i % count($allAthletes)] ?? $jan));

            $totalDist = 0;
            $totalTime = 0;
            foreach ($disciplinesData as [, $distances]) {
                foreach ($distances as [$dDist, $dTm]) {
                    $totalDist += $dDist;
                    $totalTime += $dTm;
                }
            }

            $tFeed = new Feed($creator, null, null, ElementStatusEnum::Active);
            $this->em->persist($tFeed);
            $this->feeds[] = $tFeed;

            $startedAt = new DateTimeImmutable(sprintf('%+d days 07:00:00', $daysAgo));
            $endedAt = $startedAt->modify(sprintf('+%d seconds', $totalTime));
            $status = ($i % 30 === 29) ? ElementStatusEnum::Rejected : ElementStatusEnum::Active;

            $training = new Training(
                $tFeed,
                $creator,
                $startedAt,
                $endedAt,
                $title,
                sprintf(
                    'Trening na łącznym dystansie %d m w czasie %d s (%d min). Świetne samopoczucie, optymalne tętno i doskonałe warunki na trasie.',
                    $totalDist,
                    $totalTime,
                    (int) round($totalTime / 60),
                ),
                $link,
                $loc,
                $status,
            );
            $this->em->persist($training);
            $this->trainings[$link] = $training;

            $tpCreator = new TrainingParticipant($training, $creator, SaveStatusEnum::Accepted);
            $this->em->persist($tpCreator);

            $availablePartners = array_values(array_filter(
                $allAthletes,
                static fn (User $u): bool => $u->email !== $creator->email,
            ));
            if (!empty($availablePartners)) {
                $partner1 = $availablePartners[$i % count($availablePartners)];
                $tpPartner = new TrainingParticipant($training, $partner1, SaveStatusEnum::Accepted);
                $this->em->persist($tpPartner);

                if ($i % 3 === 0) {
                    $partner2 = $availablePartners[($i + 1) % count($availablePartners)];
                    $tpSecond = new TrainingParticipant($training, $partner2, SaveStatusEnum::Accepted);
                    $this->em->persist($tpSecond);
                }

                if ($i % 7 === 0) {
                    $partner3 = $availablePartners[($i + 2) % count($availablePartners)];
                    $tpThird = new TrainingParticipant($training, $partner3, SaveStatusEnum::Accepted);
                    $this->em->persist($tpThird);
                }
            }

            [$baseLat, $baseLng] = $this->resolveBaseCoordinates($loc);

            foreach ($disciplinesData as $discIdx => [$discEnum, $distances]) {
                $td = new TrainingDiscipline($training, $discEnum);
                $this->em->persist($td);

                foreach ($distances as $distIdx => [$distMeters, $distSeconds]) {
                    $tdd = new TrainingDisciplineDistance($td, $distMeters, $distSeconds);
                    $this->em->persist($tdd);

                    $subCount = $this->resolveSubdistanceCount($distMeters);
                    $routeAngle = (($i * 43 + $discIdx * 71 + $distIdx * 109) % 360) * (M_PI / 180.0);

                    for ($s = 1; $s <= $subCount; $s++) {
                        $subDist = (int) round(($distMeters * $s) / $subCount);
                        $subTime = (int) round(($distSeconds * $s) / $subCount);

                        $progress = $s / (float) $subCount;
                        $curvedHeading = $routeAngle + 0.35 * sin($progress * M_PI * 2.0);

                        if ($distMeters > 10000) {
                            $loopAngle = $routeAngle + ($progress * 2.0 * M_PI * 0.85);
                            $radiusMeters = min(3000, (int) round($distMeters / 6));
                            $dLat = (int) round(cos($loopAngle) * $radiusMeters * 9.0 * $progress + cos($routeAngle) * ($subDist % 1500) * 4.0);
                            $dLng = (int) round(sin($loopAngle) * $radiusMeters * 14.6 * $progress + sin($routeAngle) * ($subDist % 1500) * 6.5);
                        } else {
                            $dLat = (int) round(cos($curvedHeading) * $subDist * 9.0 * 0.8);
                            $dLng = (int) round(sin($curvedHeading) * $subDist * 14.6 * 0.8);
                        }

                        $lat = $baseLat + $dLat;
                        $lng = $baseLng + $dLng;
                        $accuracy = 3 + (($i + $s) % 4);
                        $speed = max(1, (int) round($distMeters / max(1, $distSeconds)));

                        $sub = new TrainingDisciplineSubDistance($tdd, $subDist, $subTime, $lat, $lng, $accuracy, $speed);
                        $this->em->persist($sub);
                    }
                }
            }
        }
    }

    /**
     * @return array{0: int, 1: int} Base GPS latitude & longitude multiplied by 1_000_000
     */
    private function resolveBaseCoordinates(string $location): array
    {
        $cityCoordinates = [
            'Bulwary Wiślane' => [52243500, 21019800],
            'Park Skaryszewski' => [52244200, 21056500],
            'Kamionkowskie' => [52247000, 21059000],
            'Park Ujazdowski' => [52220500, 21025500],
            'Agrykola' => [52218000, 21028000],
            'Kępa Potocka' => [52277000, 20987000],
            'Pole Mokotowskie' => [52210500, 20998000],
            'Lasek Bielański' => [52289000, 20961000],
            'AWF' => [52285000, 20958000],
            'Las Kabacki' => [52128000, 21055000],
            'Wał Zawadowski' => [52165000, 21102000],
            'Wał Miedzeszyński' => [52185000, 21125000],
            'Kampinos' => [52305000, 20785000],
            'Park Młociński' => [52302000, 20935000],
            'Skarpa Ursynowska' => [52158000, 21045000],
            'Las Młociński' => [52310000, 20925000],
            'Park Szczęśliwicki' => [52204000, 20958000],
            'Wilanów' => [52165000, 21085000],
            'Warszawianka' => [52199000, 21024000],
            'Polna' => [52217000, 21015000],
            'Inflancka' => [52254000, 20999000],
            'WUM' => [52207000, 20986000],
            'Żoliborz' => [52270000, 20978000],
            'Stegny' => [52187000, 21048000],
            'Gassy' => [52100000, 21180000],
            'Konstancin' => [52090000, 21120000],
            'Karczew' => [52100000, 21260000],
            'Góra Kalwaria' => [51970000, 21230000],
            'Czersk' => [51965000, 21225000],
            'Zawiercie' => [50452000, 19558000],
            'Ogrodzieniec' => [50452000, 19558000],
            'Kromołów' => [50495000, 19485000],
            'Strzyżów' => [49870000, 21790000],
            'Zegrz' => [52445000, 21040000],
            'Nieporęt' => [52430000, 21040000],
            'Pilawa' => [52438000, 21055000],
            'Park Śląski' => [50286000, 18988000],
            'Chorzów' => [50286000, 18988000],
            'Muchowiec' => [50238000, 19034000],
            'Trzech Stawów' => [50242000, 19038000],
            'Katowice' => [50238000, 19034000],
            'Kraków' => [50059100, 19914400],
            'Zakrzówek' => [50039000, 19912000],
            'Błonia' => [50059100, 19914400],
            'Gdańsk' => [54412000, 18618000],
            'Brzeźno' => [54417000, 18635000],
            'Reagana' => [54412000, 18618000],
            'Gdynia' => [54512000, 18552000],
            'Sopot' => [54445000, 18570000],
            'Poznań' => [52401000, 16974000],
            'Malta' => [52401000, 16974000],
            'Jakuszyce' => [50819000, 15438000],
            'Szklarska Poręba' => [50819000, 15438000],
            'Zakopane' => [49278000, 19870000],
            'Tatry' => [49278000, 19870000],
            'Kościeliska' => [49278000, 19870000],
            'Nosal' => [49282000, 19985000],
            'Wrocław' => [51114000, 17086000],
            'Szczytnicki' => [51114000, 17086000],
        ];

        foreach ($cityCoordinates as $key => $coords) {
            if (str_contains($location, $key)) {
                return $coords;
            }
        }

        return [52229700, 21012200];
    }

    private function resolveSubdistanceCount(int $distanceMeters): int
    {
        if ($distanceMeters <= 1000) {
            return 4;
        }
        if ($distanceMeters <= 5000) {
            return 5;
        }
        if ($distanceMeters <= 15000) {
            return 6;
        }
        if ($distanceMeters <= 35000) {
            return 7;
        }

        return 8;
    }

    private function seedGoals(): void
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];
        $athletes = [$jan, $anna, $admin, $piotr];

        $goalDefs = [
            ['Złamać 40 minut na 10 km w oficjalnych zawodach', 'zlamac-40-minut-na-10km', DisciplineEnum::Running, 10000, 2400, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Przebiec Maraton poniżej 3 godzin i 30 minut', 'maraton-ponizej-3h30m', DisciplineEnum::Running, 42195, 12600, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Półmaraton poniżej 1 godziny i 30 minut', 'polmaraton-ponizej-1h30m', DisciplineEnum::Running, 21097, 5400, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Piątka poniżej 19 minut na parkrunie', 'piatka-ponizej-19-minut', DisciplineEnum::Running, 5000, 1140, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['100 km na rowerze szosowym ze średnią 30 km/h', '100km-rower-srednia-30', DisciplineEnum::Cycling, 100000, 12000, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Gravelowa setka z przewyższeniem 1000m', 'gravel-setka-1000m-up', DisciplineEnum::Cycling, 100000, 14400, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Przepłynąć 1500m kraulem poniżej 25 minut', 'plywanie-1500m-ponizej-25m', DisciplineEnum::Swimming, 1500, 1500, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Przepłynąć 3000m na wodach otwartych', 'plywanie-3000m-open-water', DisciplineEnum::Swimming, 3000, 3300, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Jazda szybka na rolkach 20km poniżej 40 minut', 'rolki-20km-ponizej-40-minut', DisciplineEnum::InlineSkating, 20000, 2400, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Bieg narciarski 50km Bieg Piastów poniżej 3h30m', 'bieg-piastow-50km-cel', DisciplineEnum::CrossCountrySkiing, 50000, 12600, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Ergometr wioślarski 2000m poniżej 6 minut 45 sekund', 'ergometr-wioslarski-2k-cel', DisciplineEnum::Rowing, 2000, 405, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Sprawdzian na 3000m na bieżni poniżej 10:30', 'sprawdzian-3000m-ponizej-1030', DisciplineEnum::Running, 3000, 630, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Bieg na 15 km w tempie 4:10 min/km', 'bieg-15km-tempo-410', DisciplineEnum::Running, 15000, 3750, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Szosowa czasówka 20 km poniżej 30 minut', 'czasowka-szosa-20km', DisciplineEnum::Cycling, 20000, 1800, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Przepłynąć 1000m poniżej 16 minut', 'plywanie-1000m-ponizej-16m', DisciplineEnum::Swimming, 1000, 960, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Bieg na 5 km poniżej 18:30', 'bieg-5km-ponizej-1830', DisciplineEnum::Running, 5000, 1110, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Maraton poniżej 3h15m jesienią', 'maraton-ponizej-3h15m', DisciplineEnum::Running, 42195, 11700, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Ukończyć 1/4 Ironmana poniżej 2h15m', 'ukonczyc-1-4-im-ponizej-2h15', DisciplineEnum::Swimming, 950, 900, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Szosowa setka ze średnią 32 km/h', 'szosowa-setka-srednia-32', DisciplineEnum::Cycling, 100000, 11250, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Długie wybieganie 30 km w tempie 4:45', 'dlugie-wybieganie-30k-tempo-445', DisciplineEnum::Running, 30000, 8550, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #21: 26000m w tempie docelowym', 'cel-treningowy-21-26000m', DisciplineEnum::Running, 26000, 6240, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #22: 27000m w tempie docelowym', 'cel-treningowy-22-27000m', DisciplineEnum::Running, 27000, 6480, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #23: 28000m w tempie docelowym', 'cel-treningowy-23-28000m', DisciplineEnum::Running, 28000, 6720, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #24: 29000m w tempie docelowym', 'cel-treningowy-24-29000m', DisciplineEnum::Running, 29000, 6960, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #25: 30000m w tempie docelowym', 'cel-treningowy-25-30000m', DisciplineEnum::Running, 30000, 7200, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #26: 31000m w tempie docelowym', 'cel-treningowy-26-31000m', DisciplineEnum::Running, 31000, 7440, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #27: 32000m w tempie docelowym', 'cel-treningowy-27-32000m', DisciplineEnum::Running, 32000, 7680, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #28: 33000m w tempie docelowym', 'cel-treningowy-28-33000m', DisciplineEnum::Running, 33000, 7920, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #29: 34000m w tempie docelowym', 'cel-treningowy-29-34000m', DisciplineEnum::Running, 34000, 8160, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #30: 35000m w tempie docelowym', 'cel-treningowy-30-35000m', DisciplineEnum::Running, 35000, 8400, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #31: 36000m w tempie docelowym', 'cel-treningowy-31-36000m', DisciplineEnum::Running, 36000, 8640, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #32: 37000m w tempie docelowym', 'cel-treningowy-32-37000m', DisciplineEnum::Running, 37000, 8880, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #33: 38000m w tempie docelowym', 'cel-treningowy-33-38000m', DisciplineEnum::Running, 38000, 9120, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #34: 39000m w tempie docelowym', 'cel-treningowy-34-39000m', DisciplineEnum::Running, 39000, 9360, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #35: 40000m w tempie docelowym', 'cel-treningowy-35-40000m', DisciplineEnum::Running, 40000, 9600, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #36: 41000m w tempie docelowym', 'cel-treningowy-36-41000m', DisciplineEnum::Running, 41000, 9840, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #37: 42000m w tempie docelowym', 'cel-treningowy-37-42000m', DisciplineEnum::Running, 42000, 10080, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #38: 43000m w tempie docelowym', 'cel-treningowy-38-43000m', DisciplineEnum::Running, 43000, 10320, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #39: 44000m w tempie docelowym', 'cel-treningowy-39-44000m', DisciplineEnum::Running, 44000, 10560, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #40: 45000m w tempie docelowym', 'cel-treningowy-40-45000m', DisciplineEnum::Running, 45000, 10800, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #41: 46000m w tempie docelowym', 'cel-treningowy-41-46000m', DisciplineEnum::Running, 46000, 11040, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #42: 47000m w tempie docelowym', 'cel-treningowy-42-47000m', DisciplineEnum::Running, 47000, 11280, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #43: 48000m w tempie docelowym', 'cel-treningowy-43-48000m', DisciplineEnum::Running, 48000, 11520, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #44: 49000m w tempie docelowym', 'cel-treningowy-44-49000m', DisciplineEnum::Running, 49000, 11760, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #45: 50000m w tempie docelowym', 'cel-treningowy-45-50000m', DisciplineEnum::Running, 50000, 12000, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #46: 51000m w tempie docelowym', 'cel-treningowy-46-51000m', DisciplineEnum::Running, 51000, 12240, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #47: 52000m w tempie docelowym', 'cel-treningowy-47-52000m', DisciplineEnum::Running, 52000, 12480, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #48: 53000m w tempie docelowym', 'cel-treningowy-48-53000m', DisciplineEnum::Running, 53000, 12720, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #49: 54000m w tempie docelowym', 'cel-treningowy-49-54000m', DisciplineEnum::Running, 54000, 12960, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #50: 55000m w tempie docelowym', 'cel-treningowy-50-55000m', DisciplineEnum::Running, 55000, 13200, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #51: 56000m w tempie docelowym', 'cel-treningowy-51-56000m', DisciplineEnum::Running, 56000, 13440, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #52: 57000m w tempie docelowym', 'cel-treningowy-52-57000m', DisciplineEnum::Running, 57000, 13680, GoalStatusEnum::Completed, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #53: 58000m w tempie docelowym', 'cel-treningowy-53-58000m', DisciplineEnum::Running, 58000, 13920, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #54: 59000m w tempie docelowym', 'cel-treningowy-54-59000m', DisciplineEnum::Running, 59000, 14160, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Cel treningowy #55: 60000m w tempie docelowym', 'cel-treningowy-55-60000m', DisciplineEnum::Running, 60000, 14400, GoalStatusEnum::Active, 'jan.kowalski@sportgram.local'],
            ['Anna: Bieg na 5 km poniżej 22 minut', 'anna-5km-ponizej-22', DisciplineEnum::Running, 5000, 1320, GoalStatusEnum::Active, 'anna.nowak@sportgram.local'],
            ['Adam: Złamać 3h w maratonie', 'adam-maraton-sub-3h', DisciplineEnum::Running, 42195, 10790, GoalStatusEnum::Active, 'admin@sportgram.local'],
            ['Piotr: Gravel 150 km non-stop', 'piotr-gravel-150k', DisciplineEnum::Cycling, 150000, 18000, GoalStatusEnum::Completed, 'piotr.wisniewski@sportgram.local'],
            ['Michał: 400m kraulem poniżej 4:40', 'michal-400m-kraul', DisciplineEnum::Swimming, 400, 280, GoalStatusEnum::Active, 'michal.zielinski@sportgram.local'],
            ['Olga: Półmaraton rolkowy poniżej 42 min', 'olga-polmaraton-rolki', DisciplineEnum::InlineSkating, 21097, 2520, GoalStatusEnum::Active, 'organizer@sportgram.local'],
        ];

        foreach ($goalDefs as $i => [$text, $link, $disc, $dist, $tm, $st, $creatorEmail]) {
            $creator = ($creatorEmail === 'jan.kowalski@sportgram.local' && $i % 4 !== 0)
                ? $athletes[$i % count($athletes)]
                : ($this->users[$creatorEmail] ?? $jan);
            $gFeed = new Feed($creator, null, null, ElementStatusEnum::Active);
            $this->em->persist($gFeed);
            $this->feeds[] = $gFeed;

            $goal = new Goal(
                $gFeed,
                $creator,
                new DateTimeImmutable('-30 days'),
                new DateTimeImmutable('+60 days'),
                $text,
                $link,
                $disc,
                $dist,
                $tm,
                $st,
            );
            $this->em->persist($goal);
            $this->goals[$link] = $goal;

            $gp = new GoalParticipant($goal, $creator, SaveStatusEnum::Accepted);
            $this->em->persist($gp);

            $buddies = array_values(array_filter(
                $athletes,
                static fn (User $u): bool => $u->email !== $creator->email,
            ));
            $friendUser = $buddies[$i % count($buddies)];
            $gpFriend = new GoalParticipant($goal, $friendUser, SaveStatusEnum::Accepted);
            $this->em->persist($gpFriend);

            $rFeed = new Feed($creator, null, null, ElementStatusEnum::Active);
            $this->em->persist($rFeed);
            $this->feeds[] = $rFeed;

            $achievedTime = (int)round($tm * 1.02);
            $gpr = new GoalParticipantResult($gp, $rFeed, $dist, $achievedTime, SaveStatusEnum::Accepted);
            $this->em->persist($gpr);

            if ($st === GoalStatusEnum::Completed && $i % 2 === 0) {
                $fFeed = new Feed($friendUser, null, null, ElementStatusEnum::Active);
                $this->em->persist($fFeed);
                $this->feeds[] = $fFeed;

                $friendTime = (int)round($tm * 1.04);
                $gprFriend = new GoalParticipantResult($gpFriend, $fFeed, $dist, $friendTime, SaveStatusEnum::Accepted);
                $this->em->persist($gprFriend);
            }
        }
    }

    private function seedFeeds(): int
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];

        $athletes = [$jan, $anna, $admin, $piotr];

        $postTexts = [
            'Nowy sezon biegowy rozpoczęty z przytupem! Pierwszy akcent tempowy w tym roku wszedł gładko. Kto z Was trenuje dziś na zewnątrz?',
            'Wschód słońca nad Wisłą i 15 km w tlenie przed pracą. Taki poranek ustawia energię na cały nadchodzący tydzień!',
            'Test nowych butów karbonowych zaliczony. Sprężystość na asfalcie jest niesamowita, tempo 3:50/km bez uczucia zmęczenia nóg.',
            'Regeneracja po długim wybieganiu: rolowanie, stretching i duża micha owsianki z owocami i orzechami. Dbajcie o odbudowę mięśni!',
            'Piątkowy sprawdzian na 5 km w Parku Skaryszewskim. Życiówka poprawiona o 14 sekund! Czas na małe świętowanie.',
            'Gravelowy wypad w Kampinos. Błoto, piach, powalone drzewa i 60 km czystej kolarskiej frajdy z ekipą.',
            'Wiosenne przygotowania do Półmaratonu Warszawskiego idą pełną parą. Objętość tygodniowa przekroczyła 75 km.',
            'Interwały 8x 1000m na stadionie lekkoatletycznym. Każdy odcinek równo w 3:35. Płuca paliły, ale satysfakcja bezcenna!',
            'Poranna kawa smakuje najlepiej po 10 kilometrach w chłodnym porannym powietrzu. Jakie macie plany treningowe na weekend?',
            'Spokojne wybieganie regeneracyjne w tempie konwersacyjnym. Pamiętajcie, że wolne biegi budują bazę tlenową pod szybkie starty.',
            'Niedzielne 30 km w tlenie. Pogoda wymarzona: 12 stopni, brak wiatru i puste ścieżki leśne.',
            'Trening siły biegowej: podbiegi 10x 200m z mocnym akcentem na pracę ramion i wysokie unoszenie kolan.',
            'Dzisiaj zamieniłem buty biegowe na rower szosowy. 70 km w słońcu po mazowieckich asfaltach.',
            'Równowaga to klucz: po ciężkim tygodniu treningowym dziś pełny dzień odpoczynku i sauna na regenerację.',
            'Pierwszy start w zawodach w tym sezonie tuż tuż! Emocje rosną, pakiety startowe odebrane, nogi rwą się do biegu.',
            'Śniadanie mistrzów przed zawodami: banany, miód, ryż i espresso. A co u Was sprawdza się najlepiej przed startem?',
            'Wieczorny bieg z czołówką po lesie. Zupełnie inna perspektywa, zmysły wyostrzone, cisza i spokój natury.',
            'Dziś pękła kolejna setka kilometrów w tym miesiącu. Systematyczność i cierpliwość przynoszą upragnione efekty.',
            'Trening tempowy w zmiennych warunkach: 4 km rozgrzewki, 6 km w drugim zakresie i 2 km schłodzenia.',
            'Kiedy nie chce się wyjść na trening, właśnie wtedy wychodzi się z największą korzyścią dla głowy i charakteru.',
            'Dziś sprawdzian na 10 km na bieżni mechanicznej. Równe tempo 4:05/km, tętno pod pełną kontrolą.',
            'Pływanie na wodach otwartych w piance. Temperatura wody 16 stopni – orzeźwienie gwarantowane!',
            'Podjazdy pod wzgórza tynieckie: 12 powtórzeń na maksymalnym zaangażowaniu. Nogi płoną!',
            'Nowa owijka na kierownicy szosówki i precyzyjne ustawienie bloków SPD. Rower gotowy na weekend.',
            'Długie niedzielne wybieganie z kubkiem domowego izotonika. Pamiętajcie o nawadnianiu nawet w chłodne dni.',
            'Test żeli energetycznych przed zbliżającym się startem maratońskim. Smak cytrynowy wchodzi bez problemu.',
            'Wieczorny powrót z pracy rowerem wzdłuż bulwarów wiślanych. Najlepszy sposób na przewietrzenie głowy.',
            'Rozciąganie powięziowe i rolowanie pasma biodrowo-piszczelowego po 18 km w lesie. Czyste złoto.',
            'Trening siły ogólnej na siłowni: przysiady ze sztangą, wykroki i martwy ciąg na prostych nogach.',
            'Poranna sesja jogi dla biegaczy. Mobilność bioder i elastyczność kręgosłupa to fundament bezkontuzyjności.',
            'Bieg ciągły w drugim zakresie tętna. 12 km ze średnią 4:18/km, wiatr w plecy na powrocie pomagał.',
            'Pierwszy raz na rolkach po zimowej przerwie! Asfalt w Parku Śląskim idealnie gładki.',
            'Wspólny trening klubowy na stadionie. W grupie kilkunastu osób kilometry mijają nieporównywalnie szybciej.',
            'Mokry i błotnisty bieg przełajowy po Jurze. Przyczepność butów trailowych zdała egzamin celująco.',
            'Owsianka pieczona z bananem i orzechami – najlepsze paliwo przed 80 km na gravelu.',
            'Analiza techniki biegu z nagrania wideo. Praca nad lądowaniem na śródstopiu i krótszym czasem kontaktu z podłożem.',
            'Czasówka na szosie: 20 km z profilem aerodynamicznym. Średnia moc 285W utrzymana przez cały dystans.',
            'Spokojne pływanie regeneracyjne w basenie: 1000m kraulem, 500m na plecach i ćwiczenia oddechowe.',
            'Podbiegi pod Górę Świętej Anny. Ostatnie 3 powtórzenia wymagały maksymalnej dyscypliny mentalnej.',
            'Poranny parkrun w doborowym towarzystwie. Cudowna atmosfera i mnóstwo uśmiechniętych ludzi.',
            'Dzisiejsza pogoda nie zachęcała do wyjścia, ale po pierwszych 2 kilometrach deszcz przestał mieć jakiekolwiek znaczenie.',
            'Bikepacking po Mazurach – zapakowane sakwy, zaplanowane 200 km i nocleg pod namiotem.',
            'Trening progowy: 3x 3000m na przerwie 3 minuty w truchcie. Wykonany w 100% zgodnie z założeniami trenera.',
            'Kąpiel solankowa i kompresja po 32 km wybiegania. Regeneracja to integralna część każdego dobrego planu.',
            'Nowe opony bezdętkowe założone i zalane świeżym mleczkiem. Zero obaw o drobne przebicia na kamieniach.',
            'Wschód słońca na szczycie Kasprowego Wierchu po stromym podejściu o świcie. Widoki zapierają dech w piersiach!',
            'Wyścig ze samym sobą na pętli wokół Błoń. Każde okrążenie równe co do sekundy.',
            'Kajakowy spływ rzeką Pilicą – świetny trening stabilizacji korpusu i siły ramion.',
            'Trening czucia tempa: 5x 1000m bez spoglądania na zegarek. Błąd pomiaru poniżej 2 sekund na kilometr!',
            'Bieg z psem leśnymi duktami. Czworonożny kompan dyktował tempo przez całe 10 kilometrów.',
            'Przygotowania sprzętowe do triathlonu: pianka, rower czasowy, kask aero i buty z elastycznymi sznurówkami.',
            'Nocne bieganie po pustych ulicach miasta. Światła latarni, cisza i miarowy stukot butów o asfalt.',
            'Zaliczona setka na rowerze w strefie tlenowej. Zapas energii pozostał nawet na krótki bieg transition.',
            'Ostatnie przetarcie przed niedzielnymi zawodami. Krótkie rytmy, dynamiczny stretching i pozytywne nastawienie!',
            'Kolejny udany mikrocykl treningowy domknięty. Czas na regenerację i naładowanie baterii przed kolejnym wyzwaniem.',
        ];

        $sampleComments = [
            'Świetny trening, tempo i forma robią ogromne wrażenie! 🔥',
            'Znakomity czas! Do zobaczenia na kolejnym wspólnym wybieganiu.',
            'Forma idzie w górę jak z nut! Oby tak dalej do samych zawodów.',
            'Brawo za determinację, warunki dzisiaj były naprawdę wymagające.',
            'Rewelacja, z taką dyspozycją życiówka na zawodach murowana!',
            'Mocna jednostka treningowa, szacunek za konsekwencję w planie!',
            'Piękna trasa i świetne cyfry, gratulacje!',
            'Dobra robota! Pamiętaj o solidnym posiłku regeneracyjnym.',
        ];

        $count = 0;
        foreach ($postTexts as $i => $text) {
            $author = $athletes[$i % count($athletes)];
            $photo = ($i % 3 === 2)
                ? null
                : $this->generateLandscapeSvg($author->color, $author->link . '_feed');
            $feed = new Feed($author, $text, $photo, ElementStatusEnum::Active);
            $this->em->persist($feed);
            $this->feeds[] = $feed;
            $count++;

            $commenters = array_values(array_filter(
                $athletes,
                static fn (User $u): bool => $u->email !== $author->email,
            ));
            $commentUser = $commenters[$i % count($commenters)];
            $commentTxt = $sampleComments[$i % count($sampleComments)];
            $comment = new FeedComment($feed, $commentUser, $commentTxt, ElementStatusEnum::Active);
            $this->em->persist($comment);

            $rUser1 = $commenters[0];
            $rType1 = match ($i % 3) {
                0 => FeedReactionEnum::Love,
                1 => FeedReactionEnum::Like,
                default => FeedReactionEnum::Wow,
            };
            $r1 = new FeedReaction($feed, $rUser1, $rType1, ElementStatusEnum::Active);
            $this->em->persist($r1);

            $rUser2 = $commenters[1] ?? $jan;
            $rType2 = ($i % 2 === 0) ? FeedReactionEnum::Like : FeedReactionEnum::Love;
            $r2 = new FeedReaction($feed, $rUser2, $rType2, ElementStatusEnum::Active);
            $this->em->persist($r2);

            if (isset($commenters[2]) && $i % 2 === 0) {
                $r3 = new FeedReaction($feed, $commenters[2], FeedReactionEnum::Wow, ElementStatusEnum::Active);
                $this->em->persist($r3);
            }
        }

        $otherPosts = [
            ['anna.nowak@sportgram.local', 'Wschód słońca nad Zegrzem i poranny trening pływacki na wodach otwartych.'],
            ['admin@sportgram.local', 'Zapisy na Półmaraton Warszawski oficjalnie otwarte! Zapraszamy wszystkich.'],
            ['piotr.wisniewski@sportgram.local', 'Gravelowa runda po Jurze zaliczona. 85 km, wspaniałe ostańce i zjazdy.'],
            ['magdalena.lewandowska@sportgram.local', 'Podbiegi pod Kopiec Kościuszki w Krakowie. Płuca płoną, moc w nogach rośnie!'],
            ['michal.zielinski@sportgram.local', 'Puste tory na basenie olimpijskim o 6 rano to najlepszy start dnia.'],
        ];
        foreach ($otherPosts as [$authorEmail, $txt]) {
            $author = $this->users[$authorEmail] ?? $admin;
            $photo = $this->generateLandscapeSvg($author->color, $author->link . '_feed');
            $feed = new Feed($author, $txt, $photo, ElementStatusEnum::Active);
            $this->em->persist($feed);
            $this->feeds[] = $feed;
            $count++;
        }

        return $count;
    }

    private function seedStories(): int
    {
        $count = 0;

        $multiStoryUsers = [
            'jan.kowalski@sportgram.local' => 'Jan Kowalski - Poranny rozruch w terenie i przygotowania do maratonu',
            'anna.nowak@sportgram.local' => 'Anna Nowak - Trening pływacki i biegi o wschodzie słońca',
            'admin@sportgram.local' => 'Adam Adamski - Przygotowania do triathlonu i organizacja zawodów',
            'piotr.wisniewski@sportgram.local' => 'Piotr Wiśniewski - Wyprawa gravelowa i bikepacking po Jurze',
            'organizer@sportgram.local' => 'Olga Organizerska - Trening rolkowy i koordynacja eventów biegowych',
        ];

        $storyCaptions = [
            'Wschód słońca na trasie – rześkie poranne powietrze i puste ścieżki.',
            'Kolejne kilometry wpadają na konto. Dziś skupienie na technice i rytmie.',
            'Cudowne widoki na trasie! Taki trening to czysta przyjemność i reset głowy.',
            'Przerwa na łyk izotonika i podziwianie panoramy. Forma rośnie!',
            'Gravelowe szutry o zachodzie słońca – najlepsza pora na rower.',
            'Interwały zaliczone! Nogi piekły, ale satysfakcja na mecie bezcenna.',
            'Poranny rozruch przed zawodami. Wszystko dopięte na ostatni guzik.',
            'Regeneracja w wodzie – czucie wody i luźne pociągnięcia kraulem.',
            'Wspólna runda ze znajomymi. W grupie kilometry mijają dwa razy szybciej!',
            'Nowa trasa przetestowana i zatwierdzona. Zdecydowanie tu wrócę.',
            'Podbiegi w lesie – budujemy siłę biegową przed zbliżającym się startem.',
            'Dzień odpoczynku i rozciągania. Dbajcie o regenerację tak samo jak o kilometry!',
        ];

        foreach ($multiStoryUsers as $email => $description) {
            $user = $this->users[$email] ?? null;
            if (! $user) {
                continue;
            }

            for ($i = 1; $i <= 31; $i++) {
                $caption = $storyCaptions[($i - 1) % count($storyCaptions)];
                $text = sprintf('%s – %s (#%d)', $description, $caption, $i);
                $photo = $this->generateLandscapeSvg($user->color, $user->link . '_story');
                $story = new Story($user, $text, $photo, ElementStatusEnum::Active);
                $this->em->persist($story);
                $count++;
            }
        }

        $otherStories = [
            [$this->users['katarzyna.wojcik@sportgram.local'] ?? null, 'Zachód słońca po 15 km w lesie kabackim.'],
            [$this->users['tomasz.kaminski@sportgram.local'] ?? null, 'Nowy łańcuch i smarowanie, rower gotowy do startu.'],
            [$this->users['magdalena.lewandowska@sportgram.local'] ?? null, 'Dzień podbiegów pod Kopiec Kościuszki.'],
            [$this->users['michal.zielinski@sportgram.local'] ?? null, '6 rano na basenie - puste tory to raj.'],
            [$this->users['aleksandra.szymanska@sportgram.local'] ?? null, 'Cardio przed śniadaniem zrobione!'],
            [$this->users['lukasz.grabowski@sportgram.local'] ?? null, 'Beskidzkie szlaki nigdy nie zawodzą.'],
        ];
        foreach ($otherStories as [$user, $text]) {
            if ($user) {
                $photo = $this->generateLandscapeSvg($user->color, $user->link . '_story');
                $story = new Story($user, $text, $photo, ElementStatusEnum::Active);
                $this->em->persist($story);
                $count++;
            }
        }

        return $count;
    }

    private function seedConversations(): int
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $count = 0;

        $otherUsers = array_values(array_filter(
            $this->users,
            static fn (User $u): bool => $u->email !== 'jan.kowalski@sportgram.local',
        ));

        $sampleDialogs = [
            'Cześć! Wybierasz się w sobotę na wspólne wybieganie z klubem?',
            'Hej! Jak poszedł Twój dzisiejszy trening tempowy?',
            'Cześć! Czy masz ochotę na dłuższą rundę szosową w niedzielę rano?',
            'Hej Janek, polecasz jakieś dobre buty z karbonem na maraton?',
            'Cześć, widzimy się na starcie Półmaratonu Warszawskiego?',
            'Hej! Masz może ślad GPX tej trasy po lesie kabackim?',
            'Cześć! Gratulacje wczorajszego wyniku, piękny progres!',
            'Hej, o której godzinie planujesz jutrzejszy trening?',
        ];

        $sampleReplies = [
            'Hej! Bardzo chętnie, pasuje mi jak najbardziej. Daj znać o której się widzimy!',
            'Cześć! Trening wszedł idealnie, tempo równe, nogi podawały znakomicie.',
            'Jasne, niedziela rano brzmi super. Proponuję start o 8:00 z parkingu pod lasem.',
            'Zdecydowanie polecam modele z pianką PEBA i pełną płytką węglową, robią ogromną różnicę!',
            'Będę na pewno! Odbieram pakiet w piątek, możemy zrobić wspólną rozgrzewkę przed startem.',
            'Jasne, zaraz podeślę Ci plik GPX. Trasa jest malownicza i dobrze utwardzona.',
            'Dzięki wielkie! Systematyczne treningi wreszcie zaczynają przynosić upragnione efekty.',
            'Planuję wyjść punktualnie o 7:30, żeby zdążyć przed popołudniowym upałem.',
        ];

        foreach (array_slice($otherUsers, 0, 52) as $i => $friend) {
            $act1 = new ConversationActivity($jan, $friend);
            $this->em->persist($act1);
            $act2 = new ConversationActivity($friend, $jan);
            $this->em->persist($act2);

            $question = $sampleDialogs[$i % count($sampleDialogs)];
            $reply = $sampleReplies[$i % count($sampleReplies)];

            $c1 = new Conversation($jan, $friend, $question, ConversationStatusEnum::Read);
            $this->em->persist($c1);
            $count++;

            $status = ($i % 3 === 0) ? ConversationStatusEnum::Sent : ConversationStatusEnum::Read;
            $c2 = new Conversation($friend, $jan, $reply, $status);
            $this->em->persist($c2);
            $count++;
        }

        return $count;
    }

    private function seedNotifications(): int
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];
        $recipients = [$jan, $anna, $piotr];
        $count = 0;

        $otherUsers = array_values(array_filter(
            $this->users,
            static fn (User $u): bool => $u->email !== 'jan.kowalski@sportgram.local',
        ));

        $notificationTemplates = [
            ['%s zaakceptował Twoje zaproszenie do grona znajomych.', '/users/anna-nowak', NotificationStatusEnum::Sent],
            ['Nowy komentarz od %s do Twojego wpisu biegowego.', '/users/jan-kowalski/feeds', NotificationStatusEnum::Sent],
            ['Zostałeś dodany do listy startowej wydarzenia Półmaraton Warszawski 2026.', '/events/polmaraton-warszawski-2026', NotificationStatusEnum::Sent],
            ['Nowa wiadomość od użytkownika %s.', '/users/jan-kowalski/conversations', NotificationStatusEnum::NotSent],
            ['Użytkownik %s zareagował na Twój ostatni trening.', '/trainings/poranny-rozruch-wisla-1k', NotificationStatusEnum::Sent],
            ['Nowy wynik w celu: Złamać 40 minut na 10 km został zatwierdzony.', '/goals/zlamac-40-minut-na-10km', NotificationStatusEnum::Sent],
            ['Strona Warszawski Klub Biegacza dodała nowe wydarzenie.', '/pages/warszawski-klub-biegacza', NotificationStatusEnum::Sent],
            ['Przypomnienie: do zawodów Silesia Gravel Classic zostało 45 dni.', '/events/silesia-gravel-100', NotificationStatusEnum::NotSent],
        ];

        for ($i = 1; $i <= 55; $i++) {
            [$tmpl, $link, $st] = $notificationTemplates[($i - 1) % count($notificationTemplates)];
            $sender = $otherUsers[($i - 1) % count($otherUsers)];
            $recipient = ($i <= 45) ? $jan : $recipients[$i % count($recipients)];
            $text = sprintf($tmpl, $sender->firstName . ' ' . $sender->lastName);
            $notif = new Notification($recipient, $text, $link, $st);
            $this->em->persist($notif);
            $count++;
        }

        for ($j = 1; $j <= 15; $j++) {
            $notif = new Notification($admin, sprintf('Powiadomienie systemowe dla administratora #%d.', $j), '/pages/warszawski-klub-biegacza', NotificationStatusEnum::Sent);
            $this->em->persist($notif);
            $count++;
        }

        return $count;
    }

    private function seedPushSubscriptions(): int
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];
        $count = 0;

        $browsers = [
            'Chrome 124 na Windows 11',
            'Safari 17.4 na iPhone 15 Pro',
            'Firefox 125 na Ubuntu 24.04 LTS',
            'Microsoft Edge 124 na Windows 11',
            'Chrome 124 na Android 14 (Samsung Galaxy S24)',
            'Safari 17.4 na macOS Sonoma (MacBook Pro 16)',
            'Opera 109 na Windows 10',
            'Brave 1.65 na Linux Mint',
            'Samsung Internet 25 na Galaxy Tab S9',
            'Chrome 123 na iPadOS 17',
            'Vivaldi 6.6 na macOS Ventura',
        ];

        for ($i = 1; $i <= 55; $i++) {
            $browser = $browsers[($i - 1) % count($browsers)];
            $status = ($i % 5 === 0) ? PushSubscriptionStatusEnum::Rejected : PushSubscriptionStatusEnum::Active;
            $targetUser = match (true) {
                $i <= 35 => $jan,
                $i <= 42 => $anna,
                $i <= 49 => $admin,
                default => $piotr,
            };
            $pushSub = new PushSubscription(
                $targetUser,
                sprintf('https://fcm.googleapis.com/fcm/send/%s_%d', bin2hex(random_bytes(16)), $i),
                base64_encode(random_bytes(65)),
                base64_encode(random_bytes(16)),
                sprintf('%s (Urządzenie #%d)', $browser, $i),
                $status,
            );
            $this->em->persist($pushSub);
            $count++;
        }

        return $count;
    }

    private function seedEntries(): int
    {
        $jan = $this->users['jan.kowalski@sportgram.local'];
        $anna = $this->users['anna.nowak@sportgram.local'];
        $admin = $this->users['admin@sportgram.local'];
        $piotr = $this->users['piotr.wisniewski@sportgram.local'];
        $viewers = [$jan, $anna, $admin, $piotr];
        $count = 0;

        foreach (array_values(array_slice($this->users, 0, 20)) as $i => $user) {
            $entry = new Entry($viewers[$i % count($viewers)], $user->id, EntryTypeEnum::User);
            $this->em->persist($entry);
            $count++;
        }

        foreach (array_values(array_slice($this->pages, 0, 15)) as $i => $page) {
            $entry = new Entry($viewers[$i % count($viewers)], $page->id, EntryTypeEnum::Page);
            $this->em->persist($entry);
            $count++;
        }

        foreach (array_values(array_slice($this->events, 0, 15)) as $i => $event) {
            $entry = new Entry($viewers[$i % count($viewers)], $event->id, EntryTypeEnum::Event);
            $this->em->persist($entry);
            $count++;
        }

        foreach (array_values(array_slice($this->trainings, 0, 10)) as $i => $training) {
            $entry = new Entry($viewers[$i % count($viewers)], $training->id, EntryTypeEnum::Training);
            $this->em->persist($entry);
            $count++;
        }

        foreach (array_values(array_slice($this->goals, 0, 10)) as $i => $goal) {
            $entry = new Entry($viewers[$i % count($viewers)], $goal->id, EntryTypeEnum::Goal);
            $this->em->persist($entry);
            $count++;
        }

        return $count;
    }

    private function generateProfilePhoto(
        ColorEnum $color,
        string $seed,
    ): string {
        $palette = $this->resolvePalette($color);
        [$c1, $c2, $c3, $c4, $c5] = $palette;
        $id = 'usr_' . substr(md5($seed), 0, 8);
        $variant = abs(crc32($seed)) % 4;

        $hair = match ($variant) {
            0 => sprintf('<path d="M 105,120 Q 150,70 195,120 Q 180,85 150,80 Q 120,85 105,120 Z" fill="%s" />', $c5),
            1 => sprintf('<path d="M 98,135 C 95,85 120,65 150,65 C 180,65 205,85 202,135 C 190,105 175,95 150,95 C 125,95 110,105 98,135 Z" fill="%s" />', $c1),
            2 => sprintf('<path d="M 95,125 Q 150,85 205,125 L 212,135 Q 150,110 88,135 Z" fill="%s" /><ellipse cx="150" cy="95" rx="44" ry="18" fill="%s" />', $c4, $c4),
            default => sprintf('<circle cx="150" cy="80" r="22" fill="%s" /><path d="M 108,125 Q 150,90 192,125" stroke="%s" stroke-width="8" fill="none" stroke-linecap="round" />', $c3, $c3),
        };

        $svg = <<<SVG
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="{$id}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="{$c1}" />
                  <stop offset="60%" stop-color="{$c2}" />
                  <stop offset="100%" stop-color="{$c3}" />
                </linearGradient>
                <linearGradient id="{$id}_torso" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="{$c4}" />
                  <stop offset="100%" stop-color="{$c2}" />
                </linearGradient>
              </defs>
              <rect width="300" height="300" fill="url(#{$id}_bg)" />
              <circle cx="150" cy="150" r="130" fill="{$c3}" opacity="0.25" />
              <circle cx="230" cy="70" r="50" fill="{$c4}" opacity="0.18" />
              <circle cx="60" cy="220" r="40" fill="{$c5}" opacity="0.2" />

              <path d="M 40,300 C 45,225 90,195 150,195 C 210,195 255,225 260,300 Z" fill="url(#{$id}_torso)" />
              <path d="M 115,200 L 150,225 L 185,200 Z" fill="{$c1}" opacity="0.4" />

              <rect x="135" y="148" width="30" height="35" rx="6" fill="#fcd34d" />
              <circle cx="150" cy="122" r="44" fill="#fde68a" />
              {$hair}

              <path d="M 118,118 Q 150,126 182,118 Q 185,130 150,134 Q 115,130 118,118 Z" fill="{$c1}" opacity="0.85" />
              <path d="M 122,120 Q 150,126 178,120" stroke="{$c5}" stroke-width="2" fill="none" opacity="0.7" />
            </svg>
            SVG;

        return base64_encode($svg);
    }

    private function generateLandscapeSvg(ColorEnum $color, string $seed): string
    {
        $w = 1200;
        $h = 400;
        $palette = $this->resolvePalette($color);
        [$c1, $c2, $c3, $c4, $c5] = $palette;
        $id = 'geo_' . substr(md5($seed), 0, 8);
        $variant = abs(crc32($seed)) % 5;

        switch ($variant) {
            case 0:
                $sunX = (int)($w * 0.75);
                $sunY = (int)($h * 0.3);
                $sunR = (int)(min($w, $h) * 0.2);
                $sunR1 = (int)($sunR * 1.35);

                $m1y1 = (int)($h * 0.65);
                $m1x2 = (int)($w * 0.22);
                $m1y2 = (int)($h * 0.38);
                $m1x3 = (int)($w * 0.44);
                $m1y3 = (int)($h * 0.58);
                $m1x4 = (int)($w * 0.68);
                $m1y4 = (int)($h * 0.35);
                $m1x5 = (int)($w * 0.9);
                $m1y5 = (int)($h * 0.52);
                $m1y6 = (int)($h * 0.45);

                $m2y1 = (int)($h * 0.78);
                $m2x2 = (int)($w * 0.18);
                $m2y2 = (int)($h * 0.62);
                $m2x3 = (int)($w * 0.38);
                $m2y3 = (int)($h * 0.72);
                $m2x4 = (int)($w * 0.62);
                $m2y4 = (int)($h * 0.52);
                $m2x5 = (int)($w * 0.85);
                $m2y5 = (int)($h * 0.68);
                $m2y6 = (int)($h * 0.6);

                $fgY = (int)($h * 0.88);
                $fgQx = (int)($w * 0.3);
                $fgQy = (int)($h * 0.72);
                $fgEx = (int)($w * 0.65);
                $fgEy = (int)($h * 0.84);
                $fgTy = (int)($h * 0.78);

                $t1x1 = (int)($w * 0.12);
                $t1y1 = (int)($h * 0.78);
                $t1x2 = (int)($w * 0.15);
                $t1y2 = (int)($h * 0.88);
                $t1x3 = (int)($w * 0.09);

                $t2x1 = (int)($w * 0.18);
                $t2y1 = (int)($h * 0.75);
                $t2x2 = (int)($w * 0.21);
                $t2y2 = (int)($h * 0.86);
                $t2x3 = (int)($w * 0.15);

                $t3x1 = (int)($w * 0.75);
                $t3y1 = (int)($h * 0.8);
                $t3x2 = (int)($w * 0.78);
                $t3y2 = (int)($h * 0.9);
                $t3x3 = (int)($w * 0.72);

                $svg = <<<SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" viewBox="0 0 {$w} {$h}">
                      <defs>
                        <linearGradient id="{$id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="{$c1}" />
                          <stop offset="55%" stop-color="{$c2}" />
                          <stop offset="100%" stop-color="{$c3}" />
                        </linearGradient>
                      </defs>
                      <rect width="{$w}" height="{$h}" fill="url(#{$id}_sky)" />
                      <circle cx="{$sunX}" cy="{$sunY}" r="{$sunR}" fill="{$c4}" opacity="0.85" />
                      <circle cx="{$sunX}" cy="{$sunY}" r="{$sunR1}" fill="{$c5}" opacity="0.2" />

                      <path d="M 0,{$h} L 0,{$m1y1} L {$m1x2},{$m1y2} L {$m1x3},{$m1y3} L {$m1x4},{$m1y4} L {$m1x5},{$m1y5} L {$w},{$m1y6} L {$w},{$h} Z" fill="{$c2}" opacity="0.75" />
                      <path d="M 0,{$h} L 0,{$m2y1} L {$m2x2},{$m2y2} L {$m2x3},{$m2y3} L {$m2x4},{$m2y4} L {$m2x5},{$m2y5} L {$w},{$m2y6} L {$w},{$h} Z" fill="{$c1}" opacity="0.9" />

                      <path d="M 0,{$h} L 0,{$fgY} Q {$fgQx},{$fgQy} {$fgEx},{$fgEy} T {$w},{$fgTy} L {$w},{$h} Z" fill="{$c1}" />
                      <polygon points="{$t1x1},{$t1y1} {$t1x2},{$t1y2} {$t1x3},{$t1y2}" fill="{$c3}" />
                      <polygon points="{$t2x1},{$t2y1} {$t2x2},{$t2y2} {$t2x3},{$t2y2}" fill="{$c4}" opacity="0.8" />
                      <polygon points="{$t3x1},{$t3y1} {$t3x2},{$t3y2} {$t3x3},{$t3y2}" fill="{$c3}" />
                    </svg>
                    SVG;

                break;

            case 1:
                $sunX = (int)($w * 0.25);
                $sunY = (int)($h * 0.35);
                $sunR = (int)(min($w, $h) * 0.18);

                $h1y = (int)($h * 0.55);
                $h1qx = (int)($w * 0.3);
                $h1qy = (int)($h * 0.42);
                $h1ex = (int)($w * 0.6);
                $h1ey = (int)($h * 0.52);
                $h1ty = (int)($h * 0.48);

                $h2y = (int)($h * 0.68);
                $h2qx = (int)($w * 0.4);
                $h2qy = (int)($h * 0.55);
                $h2ex = (int)($w * 0.75);
                $h2ey = (int)($h * 0.66);
                $h2ty = (int)($h * 0.62);

                $fgY = (int)($h * 0.8);
                $fgQx = (int)($w * 0.35);
                $fgQy = (int)($h * 0.7);
                $fgEx = (int)($w * 0.7);
                $fgEy = (int)($h * 0.82);
                $fgTy = (int)($h * 0.75);

                $pSx = (int)($w * 0.15);
                $pQx = (int)($w * 0.35);
                $pQy = (int)($h * 0.84);
                $pEx = (int)($w * 0.45);
                $pEy = (int)($h * 0.72);
                $pTx = (int)($w * 0.6);
                $pTy = (int)($h * 0.58);

                $tr1x = (int)($w * 0.22);
                $tr1y = (int)($h * 0.74);
                $tr1r = (int)($w * 0.025 + 10);
                $tr2x = (int)($w * 0.78);
                $tr2y = (int)($h * 0.72);
                $tr2r = (int)($w * 0.03 + 12);

                $svg = <<<SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" viewBox="0 0 {$w} {$h}">
                      <defs>
                        <linearGradient id="{$id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="{$c1}" />
                          <stop offset="60%" stop-color="{$c2}" />
                          <stop offset="100%" stop-color="{$c4}" />
                        </linearGradient>
                      </defs>
                      <rect width="{$w}" height="{$h}" fill="url(#{$id}_sky)" />
                      <circle cx="{$sunX}" cy="{$sunY}" r="{$sunR}" fill="{$c5}" opacity="0.75" />

                      <path d="M 0,{$h1y} Q {$h1qx},{$h1qy} {$h1ex},{$h1ey} T {$w},{$h1ty} L {$w},{$h} L 0,{$h} Z" fill="{$c3}" opacity="0.65" />
                      <path d="M 0,{$h2y} Q {$h2qx},{$h2qy} {$h2ex},{$h2ey} T {$w},{$h2ty} L {$w},{$h} L 0,{$h} Z" fill="{$c2}" opacity="0.85" />
                      <path d="M 0,{$fgY} Q {$fgQx},{$fgQy} {$fgEx},{$fgEy} T {$w},{$fgTy} L {$w},{$h} L 0,{$h} Z" fill="{$c1}" />

                      <path d="M {$pSx},{$h} Q {$pQx},{$pQy} {$pEx},{$pEy} T {$pTx},{$pTy}" stroke="{$c4}" stroke-width="4" fill="none" opacity="0.6" stroke-dasharray="10 6" />

                      <circle cx="{$tr1x}" cy="{$tr1y}" r="{$tr1r}" fill="{$c3}" />
                      <circle cx="{$tr2x}" cy="{$tr2y}" r="{$tr2r}" fill="{$c3}" />
                    </svg>
                    SVG;

                break;

            case 2:
                $sunX = (int)($w * 0.5);
                $sunY = (int)($h * 0.42);
                $sunR = (int)(min($w, $h) * 0.16);

                $w1y = (int)($h * 0.64);
                $w1c1x = (int)($w * 0.25);
                $w1c1y = (int)($h * 0.6);
                $w1c2x = (int)($w * 0.4);
                $w1c2y = (int)($h * 0.68);
                $w1ex = (int)($w * 0.65);
                $w1ey = (int)($h * 0.62);
                $w1c3x = (int)($w * 0.85);
                $w1c3y = (int)($h * 0.58);
                $w1c4x = (int)($w * 0.95);
                $w1c4y = (int)($h * 0.65);

                $w2y = (int)($h * 0.76);
                $w2c1x = (int)($w * 0.3);
                $w2c1y = (int)($h * 0.72);
                $w2c2x = (int)($w * 0.5);
                $w2c2y = (int)($h * 0.8);
                $w2ex = (int)($w * 0.75);
                $w2ey = (int)($h * 0.74);
                $w2c3x = (int)($w * 0.9);
                $w2c3y = (int)($h * 0.7);

                $fgY = (int)($h * 0.88);
                $fgC1x = (int)($w * 0.2);
                $fgC1y = (int)($h * 0.82);
                $fgC2x = (int)($w * 0.45);
                $fgC2y = (int)($h * 0.92);
                $fgEx = (int)($w * 0.7);
                $fgEy = (int)($h * 0.85);

                $svg = <<<SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" viewBox="0 0 {$w} {$h}">
                      <defs>
                        <linearGradient id="{$id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="{$c1}" />
                          <stop offset="50%" stop-color="{$c2}" />
                          <stop offset="100%" stop-color="{$c4}" />
                        </linearGradient>
                      </defs>
                      <rect width="{$w}" height="{$h}" fill="url(#{$id}_sky)" />
                      <circle cx="{$sunX}" cy="{$sunY}" r="{$sunR}" fill="{$c5}" opacity="0.85" />

                      <path d="M 0,{$w1y} C {$w1c1x},{$w1c1y} {$w1c2x},{$w1c2y} {$w1ex},{$w1ey} C {$w1c3x},{$w1c3y} {$w1c4x},{$w1c4y} {$w},{$w1y} L {$w},{$h} L 0,{$h} Z" fill="{$c3}" opacity="0.7" />
                      <path d="M 0,{$w2y} C {$w2c1x},{$w2c1y} {$w2c2x},{$w2c2y} {$w2ex},{$w2ey} C {$w2c3x},{$w2c3y} {$w},{$w2y} {$w},{$w2y} L {$w},{$h} L 0,{$h} Z" fill="{$c2}" opacity="0.85" />

                      <path d="M 0,{$fgY} C {$fgC1x},{$fgC1y} {$fgC2x},{$fgC2y} {$fgEx},{$fgEy} T {$w},{$fgY} L {$w},{$h} L 0,{$h} Z" fill="{$c1}" />
                      <path d="M 0,{$fgY} C {$fgC1x},{$fgC1y} {$fgC2x},{$fgC2y} {$fgEx},{$fgEy} T {$w},{$fgY}" stroke="{$c5}" stroke-width="3" fill="none" opacity="0.6" />
                    </svg>
                    SVG;

                break;

            case 3:
                $sunX = (int)($w * 0.8);
                $sunY = (int)($h * 0.25);
                $sunR = (int)(min($w, $h) * 0.2);

                $d1y = (int)($h * 0.6);
                $d1qx = (int)($w * 0.4);
                $d1qy = (int)($h * 0.45);
                $d1ex = (int)($w * 0.75);
                $d1ey = (int)($h * 0.62);
                $d1ty = (int)($h * 0.55);

                $d2y = (int)($h * 0.74);
                $d2qx = (int)($w * 0.3);
                $d2qy = (int)($h * 0.62);
                $d2ex = (int)($w * 0.6);
                $d2ey = (int)($h * 0.75);
                $d2ty = (int)($h * 0.68);

                $fgY = (int)($h * 0.85);
                $fgQx = (int)($w * 0.5);
                $fgQy = (int)($h * 0.7);
                $fgEy = (int)($h * 0.82);

                $svg = <<<SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" viewBox="0 0 {$w} {$h}">
                      <defs>
                        <linearGradient id="{$id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="{$c1}" />
                          <stop offset="45%" stop-color="{$c2}" />
                          <stop offset="100%" stop-color="{$c4}" />
                        </linearGradient>
                      </defs>
                      <rect width="{$w}" height="{$h}" fill="url(#{$id}_sky)" />
                      <circle cx="{$sunX}" cy="{$sunY}" r="{$sunR}" fill="{$c5}" opacity="0.9" />

                      <path d="M 0,{$d1y} Q {$d1qx},{$d1qy} {$d1ex},{$d1ey} T {$w},{$d1ty} L {$w},{$h} L 0,{$h} Z" fill="{$c3}" opacity="0.75" />
                      <path d="M 0,{$d2y} Q {$d2qx},{$d2qy} {$d2ex},{$d2ey} T {$w},{$d2ty} L {$w},{$h} L 0,{$h} Z" fill="{$c2}" opacity="0.9" />

                      <path d="M 0,{$fgY} Q {$fgQx},{$fgQy} {$w},{$fgEy} L {$w},{$h} L 0,{$h} Z" fill="{$c1}" />
                      <path d="M 0,{$fgY} Q {$fgQx},{$fgQy} {$w},{$fgEy}" stroke="{$c4}" stroke-width="4" fill="none" opacity="0.6" />
                    </svg>
                    SVG;

                break;

            default:
                $moonX = (int)($w * 0.2);
                $moonY = (int)($h * 0.25);
                $moonR = (int)(min($w, $h) * 0.12);
                $cresX = $moonX + (int)($moonR * 0.35);
                $cresY = $moonY - (int)($moonR * 0.15);
                $cresR = (int)($moonR * 0.88);

                $shoreY = (int)($h * 0.56);
                $lakeH = $h - $shoreY;

                $t1x1 = (int)($w * 0.1);
                $t1y1 = (int)($h * 0.5);
                $t1x2 = (int)($w * 0.12);
                $t1x3 = (int)($w * 0.08);

                $t2x1 = (int)($w * 0.2);
                $t2y1 = (int)($h * 0.48);
                $t2x2 = (int)($w * 0.22);
                $t2x3 = (int)($w * 0.18);

                $t3x1 = (int)($w * 0.55);
                $t3y1 = (int)($h * 0.49);
                $t3x2 = (int)($w * 0.58);
                $t3x3 = (int)($w * 0.52);

                $t4x1 = (int)($w * 0.72);
                $t4y1 = (int)($h * 0.5);
                $t4x2 = (int)($w * 0.75);
                $t4x3 = (int)($w * 0.69);

                $r1y = (int)($h * 0.68);
                $r1rx = (int)($moonR * 1.5);
                $r2y = (int)($h * 0.75);
                $r2rx = (int)($moonR * 2.2);

                $fgY = (int)($h * 0.92);
                $fgQx = (int)($w * 0.4);
                $fgQy = (int)($h * 0.86);
                $fgEy = (int)($h * 0.94);

                $svg = <<<SVG
                    <svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" viewBox="0 0 {$w} {$h}">
                      <defs>
                        <linearGradient id="{$id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="{$c1}" />
                          <stop offset="60%" stop-color="{$c2}" />
                          <stop offset="100%" stop-color="{$c3}" />
                        </linearGradient>
                      </defs>
                      <rect width="{$w}" height="{$h}" fill="url(#{$id}_sky)" />

                      <circle cx="{$moonX}" cy="{$moonY}" r="{$moonR}" fill="{$c5}" opacity="0.85" />
                      <circle cx="{$cresX}" cy="{$cresY}" r="{$cresR}" fill="{$c1}" />

                      <path d="M 0,{$shoreY} L {$w},{$shoreY} L {$w},{$h} L 0,{$h} Z" fill="{$c2}" opacity="0.8" />
                      <polygon points="{$t1x1},{$t1y1} {$t1x2},{$shoreY} {$t1x3},{$shoreY}" fill="{$c1}" />
                      <polygon points="{$t2x1},{$t2y1} {$t2x2},{$shoreY} {$t2x3},{$shoreY}" fill="{$c1}" />
                      <polygon points="{$t3x1},{$t3y1} {$t3x2},{$shoreY} {$t3x3},{$shoreY}" fill="{$c1}" />
                      <polygon points="{$t4x1},{$t4y1} {$t4x2},{$shoreY} {$t4x3},{$shoreY}" fill="{$c1}" />

                      <rect y="{$shoreY}" width="{$w}" height="{$lakeH}" fill="{$c1}" opacity="0.9" />
                      <ellipse cx="{$moonX}" cy="{$r1y}" rx="{$r1rx}" ry="4" fill="{$c5}" opacity="0.3" />
                      <ellipse cx="{$moonX}" cy="{$r2y}" rx="{$r2rx}" ry="5" fill="{$c5}" opacity="0.25" />

                      <path d="M 0,{$fgY} Q {$fgQx},{$fgQy} {$w},{$fgEy} L {$w},{$h} L 0,{$h} Z" fill="{$c2}" />
                    </svg>
                    SVG;

                break;
        }

        return base64_encode($svg);
    }

    private function resolvePalette(ColorEnum $color): array
    {
        return match ($color) {
            ColorEnum::Blue => ['#0c4a6e', '#0369a1', '#0284c7', '#38bdf8', '#bae6fd'],
            ColorEnum::Green => ['#064e3b', '#047857', '#10b981', '#34d399', '#a7f3d0'],
            ColorEnum::Red => ['#450a0a', '#991b1b', '#dc2626', '#ef4444', '#fca5a5'],
            ColorEnum::Yellow => ['#451a03', '#78350f', '#b45309', '#f59e0b', '#fde68a'],
            ColorEnum::Purple => ['#3b0764', '#581c87', '#9333ea', '#c084fc', '#f3e8ff'],
            ColorEnum::Orange => ['#18181b', '#9a3412', '#c2410c', '#ea580c', '#fdba74'],
            ColorEnum::Pink => ['#4a044e', '#831843', '#be185d', '#ec4899', '#fbcfe8'],
            ColorEnum::Brown => ['#29180f', '#451a03', '#78350f', '#9a3412', '#fed7aa'],
            ColorEnum::Gray => ['#09090b', '#18181b', '#27272a', '#71717a', '#d4d4d8'],
        };
    }
}

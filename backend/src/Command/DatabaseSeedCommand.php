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
    private string $profilePhotoBase64;

    private string $backgroundPhotoBase64;

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
    private array $allFeeds = [];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'fresh',
                null,
                InputOption::VALUE_NONE,
                'Truncate all application tables before seeding',
            );
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

        $this->loadDefaultPhotos();

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

        $io->section('11. Seeding Entity View Entries...');
        $entriesCount = $this->seedEntries();
        $this->em->flush();
        $io->text(sprintf('   Seeded %d entry tracking records.', $entriesCount));

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

    private function loadDefaultPhotos(): void
    {
        $profilePath = $this->projectDir . '/public/profile.webp';
        $backgroundPath = $this->projectDir . '/public/background.webp';

        $this->profilePhotoBase64 = file_exists($profilePath)
            ? base64_encode(file_get_contents($profilePath))
            : base64_encode('dummy_profile_photo');

        $this->backgroundPhotoBase64 = file_exists($backgroundPath)
            ? base64_encode(file_get_contents($backgroundPath))
            : base64_encode('dummy_background_photo');
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
                'roles' => [RoleEnum::Participant],
                'disciplines' => [DisciplineEnum::Running, DisciplineEnum::CrossCountrySkiing],
                'bio' => 'Biegacz długodystansowy. Przygotowuję się do maratonu poniżej 3 godzin.',
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
        ];

        foreach ($userData as $data) {
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
                $this->profilePhotoBase64,
                $this->backgroundPhotoBase64,
                $data['bio'],
                UserStatusEnum::Accepted,
            );

            $user->password = $this->hasher->hashPassword($user, 'Password123!');
            $this->em->persist($user);

            // User Roles
            foreach ($data['roles'] as $role) {
                $userRole = new UserRole($user, $role);
                $this->em->persist($userRole);
            }

            // User Disciplines
            foreach ($data['disciplines'] as $discipline) {
                $userDiscipline = new UserDiscipline($user, $discipline);
                $this->em->persist($userDiscipline);
            }

            // Registration code verified
            $userRegister = new UserRegister($user, 123456, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userRegister);

            // Successful login history
            $userSign = new UserSign($user, 654321, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userSign);

            // Password reset record
            $userPasswordReset = new UserPasswordReset($user, 112233, 1, UnauthorizedStatusEnum::Correct);
            $this->em->persist($userPasswordReset);

            // Push subscription for notification testing
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
        $pairs = [
            // Jan Kowalski friendships
            ['jan.kowalski@sportgram.local', 'anna.nowak@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'admin@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'piotr.wisniewski@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'magdalena.lewandowska@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'organizer@sportgram.local', FriendStatusEnum::Accepted],
            ['jan.kowalski@sportgram.local', 'lukasz.grabowski@sportgram.local', FriendStatusEnum::Pending],

            // Adam Adamski friendships (wide network)
            ['admin@sportgram.local', 'organizer@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'anna.nowak@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'piotr.wisniewski@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'magdalena.lewandowska@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'michal.zielinski@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'joanna.dabrowska@sportgram.local', FriendStatusEnum::Accepted],
            ['admin@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],

            // Anna Nowak friendships
            ['anna.nowak@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'michal.zielinski@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'paulina.mazur@sportgram.local', FriendStatusEnum::Accepted],
            ['anna.nowak@sportgram.local', 'aleksandra.szymanska@sportgram.local', FriendStatusEnum::Accepted],

            // Piotr Wiśniewski friendships
            ['piotr.wisniewski@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'organizer@sportgram.local', FriendStatusEnum::Accepted],
            ['piotr.wisniewski@sportgram.local', 'grzegorz.michalak@sportgram.local', FriendStatusEnum::Accepted],

            // Olga Organizerska friendships
            ['organizer@sportgram.local', 'magdalena.lewandowska@sportgram.local', FriendStatusEnum::Accepted],
            ['organizer@sportgram.local', 'monika.pawlak@sportgram.local', FriendStatusEnum::Accepted],
            ['organizer@sportgram.local', 'joanna.dabrowska@sportgram.local', FriendStatusEnum::Accepted],

            // Other connections
            ['magdalena.lewandowska@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['michal.zielinski@sportgram.local', 'jakub.krawczyk@sportgram.local', FriendStatusEnum::Accepted],
            ['michal.zielinski@sportgram.local', 'natalia.piotrowska@sportgram.local', FriendStatusEnum::Accepted],
            ['joanna.dabrowska@sportgram.local', 'jakub.krawczyk@sportgram.local', FriendStatusEnum::Accepted],
            ['lukasz.grabowski@sportgram.local', 'katarzyna.wojcik@sportgram.local', FriendStatusEnum::Accepted],
            ['marcin.kozlowski@sportgram.local', 'tomasz.kaminski@sportgram.local', FriendStatusEnum::Accepted],
            ['ewelina.nowicka@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Accepted],

            // Pending and Rejected friendships for realistic statuses
            ['aleksandra.szymanska@sportgram.local', 'michal.zielinski@sportgram.local', FriendStatusEnum::Pending],
            ['grzegorz.michalak@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Pending],
            ['tomasz.kaminski@sportgram.local', 'krzysztof.wozniak@sportgram.local', FriendStatusEnum::Rejected],
        ];

        $count = 0;
        foreach ($pairs as [$senderEmail, $receiverEmail, $status]) {
            $sender = $this->users[$senderEmail] ?? null;
            $receiver = $this->users[$receiverEmail] ?? null;

            if (! $sender || ! $receiver) {
                continue;
            }

            $friend = new Friend($sender, $receiver, $status);
            $this->em->persist($friend);
            $count++;
        }

        return $count;
    }

    private function seedPages(): void
    {
        $pageDefs = [
            [
                'key' => 'wkb',
                'owner' => 'admin@sportgram.local',
                'title' => 'Warszawski Klub Biegacza',
                'description' => 'Oficjalna strona stowarzyszenia biegaczy w Warszawie. Organizujemy cykliczne treningi w Parku Skaryszewskim, sprawdziany na 5 km i doroczne biegi uliczne.',
                'link' => 'warszawski-klub-biegacza',
                'color' => ColorEnum::Blue,
                'participants' => [
                    'admin@sportgram.local' => SaveStatusEnum::Accepted,
                    'jan.kowalski@sportgram.local' => SaveStatusEnum::Accepted,
                    'anna.nowak@sportgram.local' => SaveStatusEnum::Accepted,
                    'piotr.wisniewski@sportgram.local' => SaveStatusEnum::Pending,
                ],
                'followers' => [
                    'katarzyna.wojcik@sportgram.local',
                    'tomasz.kaminski@sportgram.local',
                    'magdalena.lewandowska@sportgram.local',
                    'michal.zielinski@sportgram.local',
                    'aleksandra.szymanska@sportgram.local',
                    'lukasz.grabowski@sportgram.local',
                ],
            ],
            [
                'key' => 'velo',
                'owner' => 'organizer@sportgram.local',
                'title' => 'Velo Silesia Cycling Team',
                'description' => 'Śląska społeczność pasjonatów dwóch kółek: szosa, gravel i MTB. Wspólne ustawki weekendowe, maratony rowerowe i szkolenia z techniki jazdy.',
                'link' => 'velo-silesia-cycling-team',
                'color' => ColorEnum::Red,
                'participants' => [
                    'organizer@sportgram.local' => SaveStatusEnum::Accepted,
                    'piotr.wisniewski@sportgram.local' => SaveStatusEnum::Accepted,
                    'tomasz.kaminski@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'followers' => [
                    'admin@sportgram.local',
                    'krzysztof.wozniak@sportgram.local',
                    'grzegorz.michalak@sportgram.local',
                    'marcin.kozlowski@sportgram.local',
                    'lukasz.grabowski@sportgram.local',
                ],
            ],
            [
                'key' => 'triton',
                'owner' => 'piotr.wisniewski@sportgram.local',
                'title' => 'Triton Triathlon Polska',
                'description' => 'Ogólnopolski klub triathlonowy. Łączymy pływanie, kolarstwo i bieg w jedną harmonijną całość. Treningi pod dystanse od sprintu do pełnego IM.',
                'link' => 'triton-triathlon-polska',
                'color' => ColorEnum::Orange,
                'participants' => [
                    'piotr.wisniewski@sportgram.local' => SaveStatusEnum::Accepted,
                    'admin@sportgram.local' => SaveStatusEnum::Accepted,
                    'michal.zielinski@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'followers' => [
                    'anna.nowak@sportgram.local',
                    'natalia.piotrowska@sportgram.local',
                    'aleksandra.szymanska@sportgram.local',
                    'grzegorz.michalak@sportgram.local',
                ],
            ],
            [
                'key' => 'krakow_trail',
                'owner' => 'magdalena.lewandowska@sportgram.local',
                'title' => 'Kraków Ultra Trail Runners',
                'description' => 'Grupa zrzeszająca biegaczy górskich i przełajowych w Małopolsce. Treningi podbiegowe w Lasku Wolskim i wypady w Beskidy i Tatry.',
                'link' => 'krakow-ultra-trail-runners',
                'color' => ColorEnum::Green,
                'participants' => [
                    'magdalena.lewandowska@sportgram.local' => SaveStatusEnum::Accepted,
                    'jan.kowalski@sportgram.local' => SaveStatusEnum::Accepted,
                    'katarzyna.wojcik@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'followers' => [
                    'admin@sportgram.local',
                    'lukasz.grabowski@sportgram.local',
                    'ewelina.nowicka@sportgram.local',
                ],
            ],
            [
                'key' => 'baltic',
                'owner' => 'joanna.dabrowska@sportgram.local',
                'title' => 'Baltic Swimming & Rowing Club',
                'description' => 'Klub sportów wodnych w Trójmieście. Sekcja pływania open water w Zatoce Gdańskiej oraz wioślarstwa na torze regatowym.',
                'link' => 'baltic-swimming-rowing-club',
                'color' => ColorEnum::Blue,
                'participants' => [
                    'joanna.dabrowska@sportgram.local' => SaveStatusEnum::Accepted,
                    'anna.nowak@sportgram.local' => SaveStatusEnum::Accepted,
                    'jakub.krawczyk@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'followers' => [
                    'michal.zielinski@sportgram.local',
                    'natalia.piotrowska@sportgram.local',
                    'admin@sportgram.local',
                ],
            ],
        ];

        foreach ($pageDefs as $def) {
            $owner = $this->users[$def['owner']];

            $page = new Page(
                $owner,
                $def['title'],
                $def['description'],
                $def['link'],
                $this->profilePhotoBase64,
                $this->backgroundPhotoBase64,
                $def['color'],
                ElementStatusEnum::Active,
            );
            $this->em->persist($page);
            $this->pages[$def['key']] = $page;

            // Participants
            foreach ($def['participants'] as $userEmail => $status) {
                $user = $this->users[$userEmail] ?? null;
                if (! $user) {
                    continue;
                }

                $participant = new PageParticipant($page, $user, $status);
                $this->em->persist($participant);

                $participantKey = sprintf('%s_%s', $def['key'], $userEmail);
                $this->pageParticipants[$participantKey] = $participant;
            }

            // Followers
            foreach ($def['followers'] as $followerEmail) {
                $follower = $this->users[$followerEmail] ?? null;
                if (! $follower) {
                    continue;
                }

                $follow = new PageFollow($page, $follower, PageFollowStatusEnum::Accepted);
                $this->em->persist($follow);
            }
        }
    }

    private function seedEvents(): void
    {
        // 1. Półmaraton Warszawski 2026 (WKB)
        $wkbParticipant = $this->pageParticipants['wkb_admin@sportgram.local'];
        $event1Feed = new Feed($wkbParticipant->user, null, null, ElementStatusEnum::Active);
        $this->em->persist($event1Feed);
        $this->allFeeds[] = $event1Feed;

        $event1 = new Event(
            $wkbParticipant,
            new DateTimeImmutable('+30 days 09:00:00'),
            new DateTimeImmutable('+30 days 14:00:00'),
            'Półmaraton Warszawski 2026',
            'Największy bieg wiosenny w stolicy! Start i meta na Błoniach Stadionu Narodowego. Szybka, atestowana trasa sprzyjająca biciu rekordów życiowych.',
            'polmaraton-warszawski-2026',
            '1. Zawody odbywają się zgodnie z przepisami PZLA. 2. Limit czasu na dystansie 21 km wynosi 3h, na 5 km - 45 min. 3. Każdy uczestnik otrzymuje pamiątkowy medal i pakiet startowy.',
            $this->profilePhotoBase64,
            'Warszawa, PGE Narodowy, al. Księcia Józefa Poniatowskiego 1',
            ElementStatusEnum::Active,
        );
        $this->em->persist($event1);
        $this->events['polmaraton'] = $event1;

        // Discipline: Running
        $discRun = new EventDiscipline($event1, DisciplineEnum::Running);
        $this->em->persist($discRun);

        // Distance 1: 5000m (Bieg na 5 km)
        $dist5k = new EventDisciplineDistance($discRun, 5000);
        $this->em->persist($dist5k);

        $subDist5k_1 = new EventDisciplineSubDistance($dist5k, 2500);
        $this->em->persist($subDist5k_1);
        $subDist5k_2 = new EventDisciplineSubDistance($dist5k, 5000);
        $this->em->persist($subDist5k_2);

        // Participants on 5k start list
        $runners5k = [
            ['jan.kowalski@sportgram.local', 1195, 590],
            ['anna.nowak@sportgram.local', 1340, 660],
            ['katarzyna.wojcik@sportgram.local', 1480, 730],
        ];

        foreach ($runners5k as [$runnerEmail, $finishTime, $splitTime]) {
            $runner = $this->users[$runnerEmail];

            // List registration has its own 1-to-1 feed
            $listFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
            $this->em->persist($listFeed);
            $this->allFeeds[] = $listFeed;

            $listEntry = new EventDisciplineList($dist5k, $listFeed, $runner, SaveStatusEnum::Accepted);
            $this->em->persist($listEntry);

            // Official race result has its own 1-to-1 feed
            $resultFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
            $this->em->persist($resultFeed);
            $this->allFeeds[] = $resultFeed;

            $result = new EventDisciplineResult($listEntry, $resultFeed, $runner, $finishTime);
            $this->em->persist($result);

            // Sub-results
            $subRes1 = new EventDisciplineSubResult($subDist5k_1, $result, $runner, $splitTime);
            $this->em->persist($subRes1);
            $subRes2 = new EventDisciplineSubResult($subDist5k_2, $result, $runner, $finishTime);
            $this->em->persist($subRes2);
        }

        // Distance 2: 21097m (Półmaraton)
        $dist21k = new EventDisciplineDistance($discRun, 21097);
        $this->em->persist($dist21k);

        $subDist21k_1 = new EventDisciplineSubDistance($dist21k, 10000);
        $this->em->persist($subDist21k_1);
        $subDist21k_2 = new EventDisciplineSubDistance($dist21k, 21097);
        $this->em->persist($subDist21k_2);

        $runners21k = [
            ['admin@sportgram.local', 4950, 2320],
            ['piotr.wisniewski@sportgram.local', 5410, 2540],
            ['magdalena.lewandowska@sportgram.local', 5890, 2780],
        ];

        foreach ($runners21k as [$runnerEmail, $finishTime, $splitTime]) {
            $runner = $this->users[$runnerEmail];

            $listFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
            $this->em->persist($listFeed);
            $this->allFeeds[] = $listFeed;

            $listEntry = new EventDisciplineList($dist21k, $listFeed, $runner, SaveStatusEnum::Accepted);
            $this->em->persist($listEntry);

            $resultFeed = new Feed($runner, null, null, ElementStatusEnum::Active);
            $this->em->persist($resultFeed);
            $this->allFeeds[] = $resultFeed;

            $result = new EventDisciplineResult($listEntry, $resultFeed, $runner, $finishTime);
            $this->em->persist($result);

            $subRes1 = new EventDisciplineSubResult($subDist21k_1, $result, $runner, $splitTime);
            $this->em->persist($subRes1);
            $subRes2 = new EventDisciplineSubResult($subDist21k_2, $result, $runner, $finishTime);
            $this->em->persist($subRes2);
        }

        // 2. Silesia Gravel Classic 100km (Velo Silesia)
        $veloParticipant = $this->pageParticipants['velo_organizer@sportgram.local'];
        $event2Feed = new Feed($veloParticipant->user, null, null, ElementStatusEnum::Active);
        $this->em->persist($event2Feed);
        $this->allFeeds[] = $event2Feed;

        $event2 = new Event(
            $veloParticipant,
            new DateTimeImmutable('+45 days 08:30:00'),
            new DateTimeImmutable('+45 days 18:00:00'),
            'Silesia Gravel Classic 100km',
            'Wyścig po najpiękniejszych ścieżkach leśnych i szutrach Górnego Śląska i Zagłębia. Dwa dystanse: 50 km i 100 km.',
            'silesia-gravel-classic-100km',
            '1. Obowiązkowy kask sztywny oraz sprawne oświetlenie. 2. Trasa nie jest zabezpieczana ruchem drogowym - obowiązują przepisy KRD.',
            $this->profilePhotoBase64,
            'Katowice, Dolina Trzech Stawów',
            ElementStatusEnum::Active,
        );
        $this->em->persist($event2);
        $this->events['gravel'] = $event2;

        $discBike = new EventDiscipline($event2, DisciplineEnum::Cycling);
        $this->em->persist($discBike);

        $dist50k = new EventDisciplineDistance($discBike, 50000);
        $this->em->persist($dist50k);
        $subDist50k = new EventDisciplineSubDistance($dist50k, 50000);
        $this->em->persist($subDist50k);

        $dist100k = new EventDisciplineDistance($discBike, 100000);
        $this->em->persist($dist100k);
        $subDist100k = new EventDisciplineSubDistance($dist100k, 100000);
        $this->em->persist($subDist100k);

        // Register cyclist on 100k
        $cyclist = $this->users['piotr.wisniewski@sportgram.local'];
        $listFeedBike = new Feed($cyclist, null, null, ElementStatusEnum::Active);
        $this->em->persist($listFeedBike);
        $this->allFeeds[] = $listFeedBike;

        $listBike = new EventDisciplineList($dist100k, $listFeedBike, $cyclist, SaveStatusEnum::Accepted);
        $this->em->persist($listBike);

        $resFeedBike = new Feed($cyclist, null, null, ElementStatusEnum::Active);
        $this->em->persist($resFeedBike);
        $this->allFeeds[] = $resFeedBike;

        $resBike = new EventDisciplineResult($listBike, $resFeedBike, $cyclist, 11100);
        $this->em->persist($resBike);

        $subResBike = new EventDisciplineSubResult($subDist100k, $resBike, $cyclist, 11100);
        $this->em->persist($subResBike);

        // 3. Triathlon Gdynia Sprint (Triton)
        $tritonParticipant = $this->pageParticipants['triton_piotr.wisniewski@sportgram.local'];
        $event3Feed = new Feed($tritonParticipant->user, null, null, ElementStatusEnum::Active);
        $this->em->persist($event3Feed);
        $this->allFeeds[] = $event3Feed;

        $event3 = new Event(
            $tritonParticipant,
            new DateTimeImmutable('+60 days 10:00:00'),
            new DateTimeImmutable('+60 days 16:00:00'),
            'Triathlon Gdynia Sprint 2026',
            'Zawody triathlonowe na dystansie sprinterskim: 750m pływania w Zatoce, 20km szybkiej jazdy rowerem oraz 5km biegu wzdłuż Bulwaru Nadmorskiego.',
            'triathlon-gdynia-sprint-2026',
            'Pianki dozwolone zależnie od temperatury wody. Drafting zabroniony. Strefa zmian T1 i T2 na Skwerze Kościuszki.',
            $this->profilePhotoBase64,
            'Gdynia, Plaża Miejska, Bulwar Nadmorski',
            ElementStatusEnum::Active,
        );
        $this->em->persist($event3);
        $this->events['triathlon_gdynia'] = $event3;

        $triSwim = new EventDiscipline($event3, DisciplineEnum::Swimming);
        $this->em->persist($triSwim);
        $triSwimDist = new EventDisciplineDistance($triSwim, 750);
        $this->em->persist($triSwimDist);
        $triSwimSub = new EventDisciplineSubDistance($triSwimDist, 750);
        $this->em->persist($triSwimSub);

        $triBike = new EventDiscipline($event3, DisciplineEnum::Cycling);
        $this->em->persist($triBike);
        $triBikeDist = new EventDisciplineDistance($triBike, 20000);
        $this->em->persist($triBikeDist);
        $triBikeSub = new EventDisciplineSubDistance($triBikeDist, 20000);
        $this->em->persist($triBikeSub);

        $triRun = new EventDiscipline($event3, DisciplineEnum::Running);
        $this->em->persist($triRun);
        $triRunDist = new EventDisciplineDistance($triRun, 5000);
        $this->em->persist($triRunDist);
        $triRunSub = new EventDisciplineSubDistance($triRunDist, 5000);
        $this->em->persist($triRunSub);

        // Michal registered for swim
        $triathlete = $this->users['michal.zielinski@sportgram.local'];
        $triFeed = new Feed($triathlete, null, null, ElementStatusEnum::Active);
        $this->em->persist($triFeed);
        $this->allFeeds[] = $triFeed;

        $triList = new EventDisciplineList($triSwimDist, $triFeed, $triathlete, SaveStatusEnum::Accepted);
        $this->em->persist($triList);

        $triResFeed = new Feed($triathlete, null, null, ElementStatusEnum::Active);
        $this->em->persist($triResFeed);
        $this->allFeeds[] = $triResFeed;

        $triRes = new EventDisciplineResult($triList, $triResFeed, $triathlete, 680);
        $this->em->persist($triRes);

        $triSubRes = new EventDisciplineSubResult($triSwimSub, $triRes, $triathlete, 680);
        $this->em->persist($triSubRes);
    }

    private function seedTrainings(): void
    {
        $trainingDefs = [
            [
                'creator' => 'jan.kowalski@sportgram.local',
                'title' => 'Poranny bieg tempowy wzdłuż Wisły',
                'description' => 'Bardzo udany trening tempowy przed pracą. 2 km rozgrzewki, 6 km w tempie docelowym 3:55 min/km i 2 km schłodzenia.',
                'link' => 'poranny-bieg-tempowy-wisla',
                'location' => 'Warszawa, Bulwary Wiślane',
                'startedAt' => new DateTimeImmutable('-2 days 06:30:00'),
                'endedAt' => new DateTimeImmutable('-2 days 07:15:00'),
                'discipline' => DisciplineEnum::Running,
                'distance' => 10000,
                'time' => 2520,
                'participants' => [
                    'jan.kowalski@sportgram.local' => SaveStatusEnum::Accepted,
                    'anna.nowak@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [2000, 520, 52231900, 21011500, 5, 14],
                    [4000, 480, 52233500, 21013200, 4, 15],
                    [6000, 470, 52235000, 21015000, 4, 15],
                    [8000, 490, 52233000, 21013000, 5, 15],
                    [10000, 560, 52231900, 21011500, 5, 13],
                ],
            ],
            [
                'creator' => 'admin@sportgram.local',
                'title' => 'Długie wybieganie w Puszczy Kampinoskiej',
                'description' => 'Solidne 30 km w tlenie na miękkim podłożu leśnym. Pogoda idealna: 12 stopni i bezwietrznie.',
                'link' => 'dlugie-wybieganie-kampinos',
                'location' => 'Izabelin, Puszcza Kampinoska',
                'startedAt' => new DateTimeImmutable('-4 days 08:00:00'),
                'endedAt' => new DateTimeImmutable('-4 days 10:20:00'),
                'discipline' => DisciplineEnum::Running,
                'distance' => 30000,
                'time' => 8400,
                'participants' => [
                    'admin@sportgram.local' => SaveStatusEnum::Accepted,
                    'jan.kowalski@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [10000, 2750, 52285000, 20850000, 6, 13],
                    [20000, 2800, 52295000, 20830000, 6, 13],
                    [30000, 2850, 52285000, 20850000, 5, 12],
                ],
            ],
            [
                'creator' => 'piotr.wisniewski@sportgram.local',
                'title' => 'Szosa po Jurze Krakowsko-Częstochowskiej',
                'description' => 'Świetna runda przez Ogrodzieniec, Mirów i Bobolice. Ponad 800 metrów przewyższenia i dynamiczne podjazdy.',
                'link' => 'szosa-jura-krakowska',
                'location' => 'Zawiercie - Ogrodzieniec - Bobolice',
                'startedAt' => new DateTimeImmutable('-3 days 09:00:00'),
                'endedAt' => new DateTimeImmutable('-3 days 11:45:00'),
                'discipline' => DisciplineEnum::Cycling,
                'distance' => 80000,
                'time' => 9900,
                'participants' => [
                    'piotr.wisniewski@sportgram.local' => SaveStatusEnum::Accepted,
                    'tomasz.kaminski@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [25000, 3050, 50450000, 19550000, 4, 30],
                    [50000, 3200, 50550000, 19450000, 4, 28],
                    [80000, 3650, 50450000, 19550000, 4, 29],
                ],
            ],
            [
                'creator' => 'anna.nowak@sportgram.local',
                'title' => 'Interwały na bieżni lekkoatletycznej AWF',
                'description' => 'Seria 8x 400m z przerwą 200m w truchcie. Nogi pracowały na pełnych obrotach!',
                'link' => 'interwaly-bieznia-awf',
                'location' => 'Warszawa, Stadion AWF Bielany',
                'startedAt' => new DateTimeImmutable('-1 day 17:30:00'),
                'endedAt' => new DateTimeImmutable('-1 day 18:25:00'),
                'discipline' => DisciplineEnum::Running,
                'distance' => 8000,
                'time' => 2100,
                'participants' => [
                    'anna.nowak@sportgram.local' => SaveStatusEnum::Accepted,
                    'katarzyna.wojcik@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [4000, 1050, 52285000, 20975000, 3, 14],
                    [8000, 1050, 52285000, 20975000, 3, 14],
                ],
            ],
            [
                'creator' => 'michal.zielinski@sportgram.local',
                'title' => 'Trening techniki kraula na basenie olimpijskim',
                'description' => 'Praca nad chwytem wody i rotacją bioder. 3 km z użyciem ósemki i łapek.',
                'link' => 'trening-kraula-basen',
                'location' => 'Warszawa, Warszawianka Wodny Park',
                'startedAt' => new DateTimeImmutable('-5 days 07:00:00'),
                'endedAt' => new DateTimeImmutable('-5 days 08:15:00'),
                'discipline' => DisciplineEnum::Swimming,
                'distance' => 3000,
                'time' => 3600,
                'participants' => [
                    'michal.zielinski@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [1500, 1800, null, null, null, null],
                    [3000, 1800, null, null, null, null],
                ],
            ],
            [
                'creator' => 'organizer@sportgram.local',
                'title' => 'Trening wytrzymałościowy na rolkach w Parku Śląskim',
                'description' => 'Dynamiczna jazda na kółkach 110mm. Płynny asfalt, szerokie alejki i świetne tempo.',
                'link' => 'rolki-park-slaski',
                'location' => 'Chorzów, Park Śląski',
                'startedAt' => new DateTimeImmutable('-6 days 18:00:00'),
                'endedAt' => new DateTimeImmutable('-6 days 19:00:00'),
                'discipline' => DisciplineEnum::InlineSkating,
                'distance' => 20000,
                'time' => 3400,
                'participants' => [
                    'organizer@sportgram.local' => SaveStatusEnum::Accepted,
                ],
                'subDistances' => [
                    [10000, 1680, 50280000, 18980000, 5, 22],
                    [20000, 1720, 50280000, 18980000, 5, 21],
                ],
            ],
        ];

        foreach ($trainingDefs as $def) {
            $creator = $this->users[$def['creator']];

            // 1-to-1 feed for training
            $trainingFeed = new Feed($creator, null, null, ElementStatusEnum::Active);
            $this->em->persist($trainingFeed);
            $this->allFeeds[] = $trainingFeed;

            $training = new Training(
                $trainingFeed,
                $creator,
                $def['startedAt'],
                $def['endedAt'],
                $def['title'],
                $def['description'],
                $def['link'],
                $def['location'],
                ElementStatusEnum::Active,
            );
            $this->em->persist($training);
            $this->trainings[$def['link']] = $training;

            // Participants
            foreach ($def['participants'] as $pEmail => $status) {
                $user = $this->users[$pEmail] ?? null;
                if (! $user) {
                    continue;
                }
                $tp = new TrainingParticipant($training, $user, $status);
                $this->em->persist($tp);
            }

            // Discipline
            $td = new TrainingDiscipline($training, $def['discipline']);
            $this->em->persist($td);

            // Distance
            $tdd = new TrainingDisciplineDistance($td, $def['distance'], $def['time']);
            $this->em->persist($tdd);

            // SubDistances
            foreach ($def['subDistances'] as [$subDist, $subTime, $lat, $lng, $accuracy, $speed]) {
                $sub = new TrainingDisciplineSubDistance($tdd, $subDist, $subTime, $lat, $lng, $accuracy, $speed);
                $this->em->persist($sub);
            }
        }
    }

    private function seedGoals(): void
    {
        $goalDefs = [
            [
                'creator' => 'jan.kowalski@sportgram.local',
                'text' => 'Złamać 40 minut na 10 km w oficjalnych zawodach',
                'link' => 'zlamac-40-minut-na-10km',
                'discipline' => DisciplineEnum::Running,
                'distance' => 10000,
                'time' => 2400,
                'status' => GoalStatusEnum::Active,
                'participants' => ['jan.kowalski@sportgram.local', 'admin@sportgram.local'],
                'results' => [
                    ['jan.kowalski@sportgram.local', 10000, 2450],
                    ['admin@sportgram.local', 10000, 2320],
                ],
            ],
            [
                'creator' => 'admin@sportgram.local',
                'text' => 'Przebiec Maraton poniżej 3 godzin i 30 minut',
                'link' => 'maraton-ponizej-3h30m',
                'discipline' => DisciplineEnum::Running,
                'distance' => 42195,
                'time' => 12600,
                'status' => GoalStatusEnum::Active,
                'participants' => ['admin@sportgram.local', 'piotr.wisniewski@sportgram.local'],
                'results' => [
                    ['admin@sportgram.local', 42195, 12450],
                ],
            ],
            [
                'creator' => 'piotr.wisniewski@sportgram.local',
                'text' => '100 km na rowerze szosowym ze średnią minimum 30 km/h',
                'link' => '100km-rower-srednia-30',
                'discipline' => DisciplineEnum::Cycling,
                'distance' => 100000,
                'time' => 12000,
                'status' => GoalStatusEnum::Active,
                'participants' => ['piotr.wisniewski@sportgram.local', 'tomasz.kaminski@sportgram.local'],
                'results' => [
                    ['piotr.wisniewski@sportgram.local', 100000, 11800],
                ],
            ],
            [
                'creator' => 'michal.zielinski@sportgram.local',
                'text' => 'Przepłynąć 1500m stylem dowolnym poniżej 25 minut',
                'link' => 'plywanie-1500m-ponizej-25m',
                'discipline' => DisciplineEnum::Swimming,
                'distance' => 1500,
                'time' => 1500,
                'status' => GoalStatusEnum::Active,
                'participants' => ['michal.zielinski@sportgram.local', 'anna.nowak@sportgram.local'],
                'results' => [
                    ['michal.zielinski@sportgram.local', 1500, 1420],
                ],
            ],
            [
                'creator' => 'anna.nowak@sportgram.local',
                'text' => 'Bieg na 5 km poniżej 22 minut',
                'link' => '5km-ponizej-22-minut',
                'discipline' => DisciplineEnum::Running,
                'distance' => 5000,
                'time' => 1320,
                'status' => GoalStatusEnum::Active,
                'participants' => ['anna.nowak@sportgram.local', 'katarzyna.wojcik@sportgram.local'],
                'results' => [
                    ['anna.nowak@sportgram.local', 5000, 1340],
                ],
            ],
        ];

        foreach ($goalDefs as $def) {
            $creator = $this->users[$def['creator']];

            // 1-to-1 feed for goal
            $goalFeed = new Feed($creator, null, null, ElementStatusEnum::Active);
            $this->em->persist($goalFeed);
            $this->allFeeds[] = $goalFeed;

            $goal = new Goal(
                $goalFeed,
                $creator,
                new DateTimeImmutable('-30 days'),
                new DateTimeImmutable('+60 days'),
                $def['text'],
                $def['link'],
                $def['discipline'],
                $def['distance'],
                $def['time'],
                $def['status'],
            );
            $this->em->persist($goal);
            $this->goals[$def['link']] = $goal;

            $participantsMap = [];
            foreach ($def['participants'] as $pEmail) {
                $pUser = $this->users[$pEmail] ?? null;
                if (! $pUser) {
                    continue;
                }
                $gp = new GoalParticipant($goal, $pUser, SaveStatusEnum::Accepted);
                $this->em->persist($gp);
                $participantsMap[$pEmail] = $gp;
            }

            foreach ($def['results'] as [$rEmail, $dist, $achievedTime]) {
                $gp = $participantsMap[$rEmail] ?? null;
                if (! $gp) {
                    continue;
                }

                $resFeed = new Feed($gp->user, null, null, ElementStatusEnum::Active);
                $this->em->persist($resFeed);
                $this->allFeeds[] = $resFeed;

                $gpr = new GoalParticipantResult($gp, $resFeed, $dist, $achievedTime, SaveStatusEnum::Accepted);
                $this->em->persist($gpr);
            }
        }
    }

    private function seedFeeds(): int
    {
        $standalonePosts = [
            [
                'author' => 'jan.kowalski@sportgram.local',
                'text' => 'Nowy sezon biegowy rozpoczęty z przytupem! Pierwszy akcent tempowy w tym roku wszedł gładko. Kto z Was trenuje dziś na zewnątrz?',
                'photo' => $this->profilePhotoBase64,
                'comments' => [
                    ['anna.nowak@sportgram.local', 'Super forma Janek! Ja robiłam rano basen.'],
                    ['admin@sportgram.local', 'Do zobaczenia na Półmaratonie Warszawskim!'],
                    ['katarzyna.wojcik@sportgram.local', 'Piękne tempo, zazdroszczę!'],
                ],
                'reactions' => [
                    ['anna.nowak@sportgram.local', FeedReactionEnum::Love],
                    ['admin@sportgram.local', FeedReactionEnum::Like],
                    ['piotr.wisniewski@sportgram.local', FeedReactionEnum::Like],
                    ['katarzyna.wojcik@sportgram.local', FeedReactionEnum::Haha],
                ],
            ],
            [
                'author' => 'anna.nowak@sportgram.local',
                'text' => 'Wschód słońca nad Zegrzem i poranny trening pływacki na wodach otwartych. Woda rześka, ale widoki rekompensują wszystko!',
                'photo' => $this->backgroundPhotoBase64,
                'comments' => [
                    ['michal.zielinski@sportgram.local', 'Zegrze o poranku to klasyk! Następnym razem daj znać, popłyniemy razem.'],
                    ['jan.kowalski@sportgram.local', 'Szacunek za wstawanie o świcie!'],
                ],
                'reactions' => [
                    ['michal.zielinski@sportgram.local', FeedReactionEnum::Love],
                    ['jan.kowalski@sportgram.local', FeedReactionEnum::Like],
                    ['admin@sportgram.local', FeedReactionEnum::Love],
                ],
            ],
            [
                'author' => 'piotr.wisniewski@sportgram.local',
                'text' => 'Gravelowy wypad w Jurę zaliczony. 85 km w siodle, mnóstwo piachu, techniczne zjazdy i przepiękne ostańce wapienne.',
                'photo' => $this->profilePhotoBase64,
                'comments' => [
                    ['tomasz.kaminski@sportgram.local', 'Świetna trasa Piotr! Podzielisz się śladem GPX?'],
                    ['krzysztof.wozniak@sportgram.local', 'Też tam byłem w zeszłym tygodniu, zamek w Mirowie robi wrażenie.'],
                ],
                'reactions' => [
                    ['tomasz.kaminski@sportgram.local', FeedReactionEnum::Like],
                    ['krzysztof.wozniak@sportgram.local', FeedReactionEnum::Haha],
                    ['admin@sportgram.local', FeedReactionEnum::Love],
                ],
            ],
            [
                'author' => 'admin@sportgram.local',
                'text' => 'Oficjalnie ruszają zapisy na Półmaraton Warszawski 2026! Zarejestrujcie się przez zakładkę wydarzenia i dołączcie do rywalizacji.',
                'photo' => $this->backgroundPhotoBase64,
                'comments' => [
                    ['jan.kowalski@sportgram.local', 'Już na liście startowej!'],
                    ['organizer@sportgram.local', 'Będziemy kibicować z całą ekipą Velo Silesia.'],
                    ['magdalena.lewandowska@sportgram.local', 'Kraków też wystawia silną reprezentację!'],
                ],
                'reactions' => [
                    ['jan.kowalski@sportgram.local', FeedReactionEnum::Love],
                    ['anna.nowak@sportgram.local', FeedReactionEnum::Like],
                    ['magdalena.lewandowska@sportgram.local', FeedReactionEnum::Haha],
                    ['organizer@sportgram.local', FeedReactionEnum::Love],
                ],
            ],
            [
                'author' => 'katarzyna.wojcik@sportgram.local',
                'text' => 'Regeneracja jest kluczem do postępów. Dzisiaj tylko stretching, rolowanie i spacer po lesie. Dbajcie o swoje mięśnie!',
                'photo' => null,
                'comments' => [
                    ['anna.nowak@sportgram.local', 'Święta prawda! Sen i regeneracja to podstawa.'],
                ],
                'reactions' => [
                    ['anna.nowak@sportgram.local', FeedReactionEnum::Like],
                    ['jan.kowalski@sportgram.local', FeedReactionEnum::Haha],
                ],
            ],
            [
                'author' => 'tomasz.kaminski@sportgram.local',
                'text' => 'Test nowych kół karbonowych w rowerze szosowym. Aerodynamika na bocznych wiatrach bardzo stabilna, średnia wzrosła o 1.5 km/h.',
                'photo' => $this->profilePhotoBase64,
                'comments' => [
                    ['piotr.wisniewski@sportgram.local', 'Jaki stożek wybrałeś? 45 czy 50mm?'],
                ],
                'reactions' => [
                    ['piotr.wisniewski@sportgram.local', FeedReactionEnum::Like],
                    ['admin@sportgram.local', FeedReactionEnum::Like],
                ],
            ],
            [
                'author' => 'magdalena.lewandowska@sportgram.local',
                'text' => 'Wiosenne podbiegi w Lasku Wolskim. 10 powtórzeń po 200 metrów z mocnym akcentem na pracę ramion i kolan. Płuca płoną!',
                'photo' => null,
                'comments' => [
                    ['jan.kowalski@sportgram.local', 'Podbiegi budują charakter i moc w nogach.'],
                ],
                'reactions' => [
                    ['jan.kowalski@sportgram.local', FeedReactionEnum::Love],
                    ['katarzyna.wojcik@sportgram.local', FeedReactionEnum::Haha],
                ],
            ],
        ];

        $count = 0;
        foreach ($standalonePosts as $postData) {
            $author = $this->users[$postData['author']];

            $feed = new Feed($author, $postData['text'], $postData['photo'], ElementStatusEnum::Active);
            $this->em->persist($feed);
            $this->allFeeds[] = $feed;
            $count++;

            foreach ($postData['comments'] as [$commenterEmail, $commentText]) {
                $commenter = $this->users[$commenterEmail] ?? null;
                if (! $commenter) {
                    continue;
                }
                $comment = new FeedComment($feed, $commenter, $commentText, ElementStatusEnum::Active);
                $this->em->persist($comment);
            }

            foreach ($postData['reactions'] as [$reactorEmail, $reactionEnum]) {
                $reactor = $this->users[$reactorEmail] ?? null;
                if (! $reactor) {
                    continue;
                }
                $reaction = new FeedReaction($feed, $reactor, $reactionEnum, ElementStatusEnum::Active);
                $this->em->persist($reaction);
            }
        }

        // Add comments/reactions to some activity feeds as well
        $popularFeeds = array_slice($this->allFeeds, 0, 8);
        $sampleCommenters = ['jan.kowalski@sportgram.local', 'anna.nowak@sportgram.local', 'admin@sportgram.local', 'piotr.wisniewski@sportgram.local'];

        foreach ($popularFeeds as $feed) {
            foreach ($sampleCommenters as $commenterEmail) {
                $commenter = $this->users[$commenterEmail];
                if ($commenter->id->equals($feed->user->id)) {
                    continue;
                }

                $comment = new FeedComment($feed, $commenter, 'Świetny wynik i determinacja, tak trzymać!', ElementStatusEnum::Active);
                $this->em->persist($comment);

                $reaction = new FeedReaction($feed, $commenter, FeedReactionEnum::Like, ElementStatusEnum::Active);
                $this->em->persist($reaction);

                break;
            }
        }

        return $count;
    }

    private function seedStories(): int
    {
        $storyDefs = [
            ['jan.kowalski@sportgram.local', 'Poranny rozruch w Parku Skaryszewskim - dzień dobry!'],
            ['anna.nowak@sportgram.local', 'Nowa życiówka na 5 km - 22:15!'],
            ['piotr.wisniewski@sportgram.local', 'Kierunek Jura Krakowsko-Częstochowska na weekend.'],
            ['admin@sportgram.local', 'Spotkanie organizacyjne z wolontariuszami półmaratonu.'],
            ['katarzyna.wojcik@sportgram.local', 'Zachód słońca po 15 km w lesie kabackim.'],
            ['tomasz.kaminski@sportgram.local', 'Nowy łańcuch i smarowanie, rower gotowy do startu.'],
            ['magdalena.lewandowska@sportgram.local', 'Dzień podbiegów pod Kopiec Kościuszki.'],
            ['michal.zielinski@sportgram.local', '6 rano na basenie - puste tory to raj.'],
            ['organizer@sportgram.local', 'Objazd trasy gravelowej - nawierzchnia sztos.'],
            ['aleksandra.szymanska@sportgram.local', 'Cardio przed śniadaniem zrobione!'],
            ['lukasz.grabowski@sportgram.local', 'Beskidzkie szlaki nigdy nie zawodzą.'],
            ['paulina.mazur@sportgram.local', 'Bieganie w deszczu buduje odporność.'],
        ];

        $count = 0;
        foreach ($storyDefs as [$userEmail, $text]) {
            $user = $this->users[$userEmail] ?? null;
            if (! $user) {
                continue;
            }

            $story = new Story($user, $text, $this->profilePhotoBase64, ElementStatusEnum::Active);
            $this->em->persist($story);
            $count++;
        }

        return $count;
    }

    private function seedConversations(): int
    {
        $dialogs = [
            [
                'user1' => 'jan.kowalski@sportgram.local',
                'user2' => 'anna.nowak@sportgram.local',
                'messages' => [
                    ['jan.kowalski@sportgram.local', 'Cześć Ania! Wybierasz się w sobotę na długie wybieganie z WKB?'],
                    ['anna.nowak@sportgram.local', 'Hej Janek! Tak, planuję 22 kilometry w tempie około 5:15.'],
                    ['jan.kowalski@sportgram.local', 'Idealnie, to chętnie pobiegnę z Tobą. Gdzie się spotykacie?'],
                    ['anna.nowak@sportgram.local', 'Przy pomniku Paderewskiego w Ujazdowie o 8:00 rano.'],
                    ['jan.kowalski@sportgram.local', 'Będę na pewno. Wezmę izotonik na trasę.'],
                    ['anna.nowak@sportgram.local', 'Super, do zobaczenia w sobotę!'],
                ],
            ],
            [
                'user1' => 'admin@sportgram.local',
                'user2' => 'jan.kowalski@sportgram.local',
                'messages' => [
                    ['admin@sportgram.local', 'Cześć Jan, widziałem Twój cel na 10 km poniżej 40 minut. Jak idą przygotowania?'],
                    ['jan.kowalski@sportgram.local', 'Hej Adam! Bardzo dobrze, ostatni sprawdzian wszedł w 40:50, więc brakuje niespełna minuty.'],
                    ['admin@sportgram.local', 'Świetny progres. Półmaraton Warszawski będzie idealną okazją na życiówkę.'],
                    ['jan.kowalski@sportgram.local', 'Dokładnie na to liczę. Dzięki za motywację!'],
                ],
            ],
            [
                'user1' => 'piotr.wisniewski@sportgram.local',
                'user2' => 'tomasz.kaminski@sportgram.local',
                'messages' => [
                    ['piotr.wisniewski@sportgram.local', 'Tomek, masz ochotę na 80 km szosy w niedzielę rano?'],
                    ['tomasz.kaminski@sportgram.local', 'Cześć Piotr! Bardzo chętnie, jaka trasa i średnia prędkość?'],
                    ['piotr.wisniewski@sportgram.local', 'Pętla po Jurze, spokojne tempo regeneracyjne około 29-30 km/h.'],
                    ['tomasz.kaminski@sportgram.local', 'Pasuje mi. O 9:00 na stacji w Zawierciu?'],
                    ['piotr.wisniewski@sportgram.local', 'Tak jest, do zobaczenia.'],
                ],
            ],
            [
                'user1' => 'organizer@sportgram.local',
                'user2' => 'magdalena.lewandowska@sportgram.local',
                'messages' => [
                    ['organizer@sportgram.local', 'Magda, potrzebujemy wsparcia przy oznaczaniu trasy na Silesia Gravel.'],
                    ['magdalena.lewandowska@sportgram.local', 'Jasne Olga, w piątek po południu mam wolny czas i chętnie pomogę.'],
                    ['organizer@sportgram.local', 'Rewelacja, przygotuję taśmy i strzałki kierunkowe. Wielkie dzięki!'],
                ],
            ],
            [
                'user1' => 'michal.zielinski@sportgram.local',
                'user2' => 'anna.nowak@sportgram.local',
                'messages' => [
                    ['michal.zielinski@sportgram.local', 'Ania, masz może wolny tor na Warszawiance we wtorek wieczorem?'],
                    ['anna.nowak@sportgram.local', 'Tak, rezerwowałam tor 3 od 19:00 do 20:00, możesz śmiało dołączyć.'],
                    ['michal.zielinski@sportgram.local', 'Super sprawa, zrobię wtedy trening interwałowy. Dzięki!'],
                ],
            ],
        ];

        $count = 0;
        foreach ($dialogs as $dialog) {
            $u1 = $this->users[$dialog['user1']];
            $u2 = $this->users[$dialog['user2']];

            // ConversationActivity
            $activity1 = new ConversationActivity($u1, $u2);
            $this->em->persist($activity1);
            $activity2 = new ConversationActivity($u2, $u1);
            $this->em->persist($activity2);

            foreach ($dialog['messages'] as $i => [$senderEmail, $msgText]) {
                $sender = $this->users[$senderEmail];
                $receiver = $sender->id->equals($u1->id) ? $u2 : $u1;

                $status = ($i === count($dialog['messages']) - 1)
                    ? ConversationStatusEnum::Sent
                    : ConversationStatusEnum::Read;

                $conversation = new Conversation($sender, $receiver, $msgText, $status);
                $this->em->persist($conversation);
                $count++;
            }
        }

        return $count;
    }

    private function seedNotifications(): int
    {
        $notifications = [
            ['jan.kowalski@sportgram.local', 'Anna Nowak zaakceptowała Twoje zaproszenie do grona znajomych.', '/users/anna-nowak', NotificationStatusEnum::Sent],
            ['jan.kowalski@sportgram.local', 'Nowy komentarz od Adam Adamski do Twojego wpisu.', '/users/jan-kowalski/feeds', NotificationStatusEnum::Sent],
            ['jan.kowalski@sportgram.local', 'Zostałeś dodany do listy startowej wydarzenia Półmaraton Warszawski 2026.', '/events/polmaraton-warszawski-2026', NotificationStatusEnum::Sent],
            ['jan.kowalski@sportgram.local', 'Nowa wiadomość od Anna Nowak.', '/users/jan-kowalski/conversations', NotificationStatusEnum::NotSent],

            ['admin@sportgram.local', 'Jan Kowalski dodał nowy wynik w celu: Złamać 40 minut na 10 km.', '/goals/zlamac-40-minut-na-10km', NotificationStatusEnum::Sent],
            ['admin@sportgram.local', 'Nowy użytkownik zaobserwował stronę Warszawski Klub Biegacza.', '/pages/warszawski-klub-biegacza', NotificationStatusEnum::Sent],
            ['admin@sportgram.local', 'Nowa reakcja na Twój wpis o Półmaratonie Warszawskim.', '/users/adam-adamski/feeds', NotificationStatusEnum::Sent],

            ['anna.nowak@sportgram.local', 'Michał Zieliński skomentował Twój wpis o Zegrzu.', '/users/anna-nowak/feeds', NotificationStatusEnum::Sent],
            ['anna.nowak@sportgram.local', 'Zostałaś zaproszona do uczestnictwa w treningu przez Jan Kowalski.', '/trainings/poranny-bieg-tempowy-wisla', NotificationStatusEnum::Sent],
            ['anna.nowak@sportgram.local', 'Twój wynik w biegu na 5 km został pomyślnie zatwierdzony.', '/events/polmaraton-warszawski-2026', NotificationStatusEnum::Sent],

            ['piotr.wisniewski@sportgram.local', 'Tomasz Kamiński zaakceptował udział w treningu na Jurze.', '/trainings/szosa-jura-krakowska', NotificationStatusEnum::Sent],
            ['piotr.wisniewski@sportgram.local', 'Nowa wiadomość od Tomasz Kamiński.', '/users/piotr-wisniewski/conversations', NotificationStatusEnum::Sent],

            ['organizer@sportgram.local', 'Piotr Wiśniewski dołączył do strony Velo Silesia Cycling Team.', '/pages/velo-silesia-cycling-team', NotificationStatusEnum::Sent],
            ['organizer@sportgram.local', 'Nowe zgłoszenie na zawody Silesia Gravel Classic.', '/events/silesia-gravel-classic-100km', NotificationStatusEnum::Sent],
        ];

        $count = 0;
        foreach ($notifications as [$userEmail, $text, $link, $status]) {
            $user = $this->users[$userEmail] ?? null;
            if (! $user) {
                continue;
            }

            $notification = new Notification($user, $text, $link, $status);
            $this->em->persist($notification);
            $count++;
        }

        return $count;
    }

    private function seedEntries(): int
    {
        $count = 0;

        // View entries on users
        foreach ($this->users as $user) {
            $entry = new Entry($this->users['jan.kowalski@sportgram.local'], $user->id, EntryTypeEnum::User);
            $this->em->persist($entry);
            $count++;
        }

        // View entries on pages
        foreach ($this->pages as $page) {
            $entry = new Entry($this->users['anna.nowak@sportgram.local'], $page->id, EntryTypeEnum::Page);
            $this->em->persist($entry);
            $count++;
        }

        // View entries on events
        foreach ($this->events as $event) {
            $entry = new Entry($this->users['jan.kowalski@sportgram.local'], $event->id, EntryTypeEnum::Event);
            $this->em->persist($entry);
            $count++;
        }

        // View entries on trainings
        foreach ($this->trainings as $training) {
            $entry = new Entry($this->users['admin@sportgram.local'], $training->id, EntryTypeEnum::Training);
            $this->em->persist($entry);
            $count++;
        }

        // View entries on goals
        foreach ($this->goals as $goal) {
            $entry = new Entry($this->users['jan.kowalski@sportgram.local'], $goal->id, EntryTypeEnum::Goal);
            $this->em->persist($entry);
            $count++;
        }

        // View entries on feeds
        foreach (array_slice($this->allFeeds, 0, 10) as $feed) {
            $entry = new Entry($this->users['anna.nowak@sportgram.local'], $feed->id, EntryTypeEnum::Feed);
            $this->em->persist($entry);
            $count++;
        }

        return $count;
    }
}

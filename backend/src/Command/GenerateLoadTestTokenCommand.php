<?php

namespace App\Command;

use App\Entity\{User, UserRole};
use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, RoleEnum, ThemeEnum, UserStatusEnum};
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputInterface, InputOption};
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:load-test-token',
    description: 'Creates a local load-test participant if needed and prints a JWT',
)]
class GenerateLoadTestTokenCommand extends Command
{
    private const string USER_EMAIL = 'load-test@sportgram.local';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        #[Autowire('%kernel.environment%')]
        private readonly string $environment,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('cleanup-only', null, InputOption::VALUE_NONE, 'Remove previous load-test data without generating a token');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ($this->environment !== 'dev') {
            $io->error('Load-test tokens can only be generated in the dev environment.');

            return Command::FAILURE;
        }

        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => self::USER_EMAIL]);

        if ($input->getOption('cleanup-only')) {
            if ($user) {
                $this->removePreviousLoadTestData($user);
            }

            return Command::SUCCESS;
        }

        if (! $user) {
            $user = $this->createLoadTestUser();
        } elseif ($user->status === UserStatusEnum::Banned || ! in_array(RoleEnum::ROLE_PARTICIPANT, $user->getRoles(), true)) {
            $io->error(sprintf(
                'The account %s exists but is not an active participant.',
                self::USER_EMAIL,
            ));

            return Command::FAILURE;
        }

        $this->removePreviousLoadTestData($user);
        $output->writeln($this->jwtManager->create($user));

        return Command::SUCCESS;
    }

    private function removePreviousLoadTestData(User $user): void
    {
        $this->entityManager->getConnection()->executeStatement(
            <<<'SQL'
                DELETE FROM feeds
                WHERE user_id = CAST(:user_id AS UUID)
                  AND (
                    text LIKE :feed_text_pattern
                    OR id IN (
                        SELECT feed_id
                        FROM trainings
                        WHERE user_id = CAST(:user_id AS UUID)
                          AND link LIKE :training_link_pattern
                    )
                  )
                SQL,
            [
                'user_id' => $user->id->toRfc4122(),
                'feed_text_pattern' => 'k6 load test post from VU %',
                'training_link_pattern' => 'load-%',
            ],
        );
    }

    private function createLoadTestUser(): User
    {
        $profilePhoto = base64_encode(file_get_contents($this->projectDir . '/public/profile.webp'));
        $backgroundPhoto = base64_encode(file_get_contents($this->projectDir . '/public/background.webp'));

        $user = new User(
            new DateTimeImmutable('2000-01-01'),
            'Load',
            'Test',
            GenderEnum::Male,
            $this->uniquePhoneNumber(),
            self::USER_EMAIL,
            'load-test-user',
            LanguageEnum::English,
            CountryEnum::Poland,
            ThemeEnum::Light,
            ColorEnum::Blue,
            $profilePhoto,
            $backgroundPhoto,
            'Local k6 load-test account',
            UserStatusEnum::Accepted,
        );
        $user->password = $this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32)));
        $role = new UserRole($user, RoleEnum::Participant);
        $user->roles->add($role);

        $this->entityManager->persist($user);
        $this->entityManager->persist($role);
        $this->entityManager->flush();

        return $user;
    }

    private function uniquePhoneNumber(): int
    {
        do {
            $phone = random_int(100000000, 999999999);
        } while ($this->entityManager->getRepository(User::class)->findOneBy(['phone' => $phone]));

        return $phone;
    }
}

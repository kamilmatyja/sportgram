import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {UserService} from '../api/service/UserService';
import {FeedService} from '../api/service/FeedService';
import {StoryService} from '../api/service/StoryService';
import {FriendService} from '../api/service/FriendService';
import {UserResponse} from '../api/response/UserResponse';
import {FeedResponse} from '../api/response/FeedResponse';
import {StoryResponse} from '../api/response/StoryResponse';
import {FriendResponse} from '../api/response/FriendResponse';
import {useAuth} from '../context/AuthContext';
import {useTranslation} from '../context/TranslationContext';
import {UserIndexDto} from '../api/dto/UserIndexDto';
import {UserFilterDto} from '../api/dto/UserFilterDto';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {formatDate} from '../utils/dateFormat';

export default function UserProfile() {
    const {link} = useParams<{ link: string }>();
    const {signId} = useAuth();
    const {t} = useTranslation();

    const [user, setUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [stories, setStories] = useState<StoryResponse[]>([]);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const userService = new UserService();
    const feedService = new FeedService();
    const storyService = new StoryService();
    const friendService = new FriendService();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);

                // 1. Pobierz aktualnie zalogowanego użytkownika (po signId)
                const currentUsers = await userService.index(new UserIndexDto(1, 1, 'createdAt:desc', new UserFilterDto(null, null, null, null, null, null, null, null, signId)));
                const myUser = currentUsers[0];
                setCurrentUser(myUser);

                // 2. Pobierz użytkownika, którego profil oglądamy (po linku)
                const targetUsers = await userService.index(new UserIndexDto(1, 1, 'createdAt:desc', new UserFilterDto(null, null, null, null, null, null, null, link)));

                if (targetUsers.length === 0) {
                    setError(t('userNotFound'));
                    return;
                }

                const profileUser = targetUsers[0];
                const fullProfileUser = await userService.details(profileUser.id, ['userRoles', 'userDisciplines']);
                setUser(fullProfileUser);

                // 3. Pobierz relację znajomości, jeśli to nie mój profil
                if (myUser && myUser.id !== profileUser.id) {
                    const friends = await friendService.index([profileUser.id]);
                    // Szukamy relacji między mną a tym użytkownikiem
                    const relation = friends.find(f =>
                        (f.senderUserId === myUser.id && f.receiverUserId === profileUser.id) ||
                        (f.senderUserId === profileUser.id && f.receiverUserId === myUser.id)
                    );
                    setFriendship(relation || null);
                }

                // 4. Pobierz Feeds i Stories
                const [fetchedFeeds, fetchedStories] = await Promise.all([
                    feedService.index(profileUser.id),
                    storyService.index(profileUser.id)
                ]);

                setFeeds(fetchedFeeds);
                setStories(fetchedStories);

            } catch (err: any) {
                setError(err.error || 'Wystąpił błąd');
            } finally {
                setLoading(false);
            }
        };

        if (link && signId) {
            fetchProfileData();
        }
    }, [link, signId]);

    const handleAddFriend = async () => {
        if (!user) return;
        try {
            await friendService.create(user.id);
            // Odśwież relacje
            const friends = await friendService.index([user.id]);
            setFriendship(friends[0] || null);
        } catch (e: any) {
            alert(e.error);
        }
    };

    const handleUpdateFriendStatus = async (newStatus: number) => {
        if (!friendship || !user) return;
        try {
            await friendService.updateStatus(friendship.id, newStatus);
            setFriendship({...friendship, status: newStatus});
        } catch (e: any) {
            alert(e.error);
        }
    };

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error}</div>;

    const isMyProfile = currentUser?.id === user.id;

    return (
        <div className="container mt-4 mb-5">
            {/* Nagłówek profilu */}
            <div className="card shadow-sm mb-4">
                <div
                    className="card-img-top bg-secondary"
                    style={{
                        height: '200px',
                        backgroundImage: `url(data:image/webp;base64,${user.backgroundPhoto})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
                <div className="card-body position-relative pt-5">
                    <img
                        src={`data:image/webp;base64,${user.profilePhoto}`}
                        alt="Profile"
                        className="rounded-circle border border-4 border-white position-absolute"
                        style={{width: '120px', height: '120px', top: '-60px', left: '20px', objectFit: 'cover'}}
                    />

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <h2 className="mb-0">{user.firstName} {user.lastName}</h2>
                            <p className="text-muted mb-2">@{user.link}</p>
                            <p className="mb-0">{user.bio}</p>
                        </div>

                        <div>
                            {isMyProfile ? (
                                <button className="btn btn-outline-primary"
                                        onClick={() => window.location.href = `/users/${user.link}/settings`}>
                                    <i className="bi bi-gear me-2"></i>{t('settings')}
                                </button>
                            ) : (
                                <>
                                    {!friendship && (
                                        <button className="btn btn-primary" onClick={handleAddFriend}>
                                            <i className="bi bi-person-plus me-2"></i>{t('addFriend')}
                                        </button>
                                    )}
                                    {friendship?.status === FriendStatusEnum.PENDING && friendship.senderUserId === currentUser?.id && (
                                        <button className="btn btn-secondary" disabled>
                                            <i className="bi bi-hourglass me-2"></i>{t('invitationSent')}
                                        </button>
                                    )}
                                    {friendship?.status === FriendStatusEnum.PENDING && friendship.receiverUserId === currentUser?.id && (
                                        <div className="btn-group">
                                            <button className="btn btn-success"
                                                    onClick={() => handleUpdateFriendStatus(FriendStatusEnum.ACCEPTED)}>
                                                <i className="bi bi-check-lg me-1"></i> {t('accept')}
                                            </button>
                                            <button className="btn btn-danger"
                                                    onClick={() => handleUpdateFriendStatus(FriendStatusEnum.REJECTED)}>
                                                <i className="bi bi-x-lg me-1"></i> {t('reject')}
                                            </button>
                                        </div>
                                    )}
                                    {friendship?.status === FriendStatusEnum.ACCEPTED && (
                                        <button className="btn btn-outline-success" disabled>
                                            <i className="bi bi-people-fill me-2"></i>{t('friends')}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Kolumna Stories */}
                <div className="col-md-4 mb-4">
                    <h4>{t('stories')}</h4>
                    {stories.length === 0 ? <p className="text-muted">{t('noStories')}</p> : (
                        <div className="d-flex flex-wrap gap-2">
                            {stories.map(story => (
                                <div key={story.id} className="card border-0 shadow-sm" style={{width: '140px'}}>
                                    <img src={`data:image/webp;base64,${story.photo}`} className="card-img-top rounded"
                                         alt="Story" style={{height: '200px', objectFit: 'cover'}}/>
                                    <div className="card-img-overlay d-flex align-items-end p-2">
                                        <small
                                            className="text-white text-truncate bg-dark bg-opacity-50 px-1 rounded w-100">{story.text}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Kolumna Feeds */}
                <div className="col-md-8">
                    <h4>{t('feeds')}</h4>
                    {feeds.length === 0 ? <p className="text-muted">{t('noFeeds')}</p> : (
                        feeds.map(feed => (
                            <div key={feed.id} className="card shadow-sm mb-3">
                                <div className="card-header bg-white d-flex align-items-center">
                                    <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="avatar"
                                         className="rounded-circle me-2" width="30" height="30"
                                         style={{objectFit: 'cover'}}/>
                                    <div>
                                        <strong>{user.firstName} {user.lastName}</strong>
                                        <div className="text-muted"
                                             style={{fontSize: '0.8rem'}}>{formatDate(feed.createdAt)}</div>
                                    </div>
                                </div>
                                {feed.photo && (
                                    <img src={`data:image/webp;base64,${feed.photo}`} className="card-img-top rounded-0"
                                         alt="Feed" style={{maxHeight: '400px', objectFit: 'cover'}}/>
                                )}
                                <div className="card-body">
                                    <p className="card-text">{feed.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
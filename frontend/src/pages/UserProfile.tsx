import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {UserResponse} from '../api/responses/UserResponse';
import {FriendResponse} from '../api/responses/FriendResponse';
import {useTranslation} from '../context/TranslationContext';
import {UserIndexQuery} from '../api/queries/UserIndexQuery.ts';
import {UserFilterQuery} from '../api/queries/UserFilterQuery.ts';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {RoleEnum} from '../enums/RoleEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserRoleResponse} from '../api/responses/UserRoleResponse';
import {GenderEnum} from '../enums/GenderEnum';
import {CountryEnum} from '../enums/CountryEnum';
import {UserStatusEnum} from "../enums/UserStatusEnum.ts";
import {UserDisciplineResponse} from "../api/responses/UserDisciplineResponse.ts";
import {DisciplineEnum} from "../enums/DisciplineEnum.ts";
import {useCheckPermission} from '../utils/checkPermission';

export default function UserProfile() {
    const {link} = useParams<{ link: string }>();
    const {t} = useTranslation();
    const {getCurrentUser} = useCheckPermission();

    const [user, setUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for selected friendship status in the dropdown
    const [selectedFriendStatus, setSelectedFriendStatus] = useState<number | null>(null);

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    // Keep selectedFriendStatus in sync with friendship.status
    useEffect(() => {
        if (friendship) {
            setSelectedFriendStatus(friendship.status);
        } else {
            setSelectedFriendStatus(null);
        }
    }, [friendship]);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);

                const currentUser = await getCurrentUser();
                setCurrentUser(currentUser);

                const targetUsers = await userProvider.index(new UserIndexQuery(1, 1, 'createdAt:desc', new UserFilterQuery(null, null, null, null, null, null, null, link)));

                if (targetUsers.length === 0) {
                    setError(t('userNotFound'));
                    return;
                }

                const profileUser = targetUsers[0];
                const fullProfileUser = await userProvider.details(profileUser.id, ['userRoles', 'userDisciplines']);
                setUser(fullProfileUser);

                if (currentUser && currentUser.id !== profileUser.id) {
                    const friends = await friendProvider.index(1, 1, [profileUser.id, currentUser.id]);
                    const relation = friends.find((f: FriendResponse) =>
                        (f.senderUserId === currentUser.id && f.receiverUserId === profileUser.id) ||
                        (f.senderUserId === profileUser.id && f.receiverUserId === currentUser.id)
                    );
                    setFriendship(relation || null);
                } else {
                    setFriendship(null);
                }

            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        if (link) {
            fetchProfileData();
        }
    }, [link]);

    const handleAddFriend = async () => {
        if (!user || !currentUser) return;
        try {
            await friendProvider.create(user.id);
            const friends = await friendProvider.index(1, 1, [user.id, currentUser.id]);
            setFriendship(friends[0] || null);
        } catch (e: any) {
            alert(e.error);
        }
    };

    const handleUpdateFriendStatus = async (newStatus: number) => {
        if (!friendship || !user) return;
        try {
            await friendProvider.updateStatus(friendship.id, newStatus);
            setFriendship({...friendship, status: newStatus});
        } catch (e: any) {
            alert(e.error);
        }
    };

    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

    const handleChangeUserStatus = async () => {
        if (!user || selectedStatus === null) return;
        setStatusLoading(true);
        try {
            await userProvider.updateStatus(user.id, selectedStatus);
            setUser({...user, status: selectedStatus});
        } catch (e: any) {
            alert(e.error);
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error}</div>;

    const isMyProfile = currentUser?.id === user.id;
    const isAdmin = currentUser && Array.isArray(currentUser.roles) && currentUser.roles.some((role: UserRoleResponse) => role.role === RoleEnum.ADMINISTRATOR);

    const accentColor = ColorEnum.getHex(user.color);

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-sm mb-4">
                <div
                    className="card-img-top bg-secondary"
                    style={{
                        height: '200px',
                        backgroundImage: `url(data:image/webp;base64,${user.backgroundPhoto})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderTop: `4px solid ${accentColor}`
                    }}
                ></div>
                <div className="card-body position-relative pt-5">
                    <img
                        src={`data:image/webp;base64,${user.profilePhoto}`}
                        alt="Profile"
                        className="rounded-circle border border-4 position-absolute"
                        style={{width: '120px', height: '120px', top: '-60px', left: '20px', objectFit: 'cover', borderColor: accentColor, background: '#fff'}}
                    />

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <h2 className="mb-0" style={{color: accentColor}}>{user.firstName} {user.lastName}</h2>
                            <p className="text-muted mb-2">@{user.link}</p>
                            <p className="mb-0">{user.bio}</p>
                            <ul className="list-unstyled mt-2 mb-2">
                                {user.email && (
                                    <li><strong>{t('email')}:</strong> {user.email}</li>
                                )}
                                {user.country && (
                                    <li><strong>{t('country')}:</strong> {CountryEnum.getOptions(t).find(opt => opt.value === user.country)?.label || user.country}</li>
                                )}
                                {user.gender && (
                                    <li><strong>{t('gender')}:</strong> {GenderEnum.getOptions(t).find(opt => opt.value === user.gender)?.label || user.gender}</li>
                                )}
                                {user.birthAt && (
                                    <li><strong>{t('age')}:</strong> {(() => {
                                        const dob = new Date(user.birthAt);
                                        const ageDifMs = Date.now() - dob.getTime();
                                        const ageDate = new Date(ageDifMs);
                                        return Math.abs(ageDate.getUTCFullYear() - 1970);
                                    })()}</li>
                                )}
                                <li><strong>{t('status')}:</strong> {UserStatusEnum.getOptions(t).find(opt => opt.value === user.status)?.label || user.status}</li>
                            </ul>
                            <div className="mt-2 d-flex flex-wrap gap-2">
                                {user.roles && user.roles.length > 0 && user.roles.map((role: UserRoleResponse) => (
                                    <span key={role.id} className="badge" style={{background: accentColor, color: '#fff'}}>
                                        {RoleEnum.getOptions(t).find(opt => opt.value === role.role)?.label || role.role}
                                    </span>
                                ))}
                                {user.disciplines && user.disciplines.length > 0 && user.disciplines.map((disc: UserDisciplineResponse) => (
                                    <span key={disc.id} className="badge bg-light text-dark border border-1" style={{borderColor: accentColor}}>
                                        {DisciplineEnum.getOptions(t).find(opt => opt.value === disc.discipline)?.label || disc.discipline}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="text-end">
                            {isAdmin && !isMyProfile && (
                                <div className="mb-2">
                                    <select
                                        className="form-select mb-1"
                                        style={{maxWidth: 200, display: 'inline-block'}}
                                        value={selectedStatus === null ? user.status : selectedStatus}
                                        onChange={e => setSelectedStatus(Number(e.target.value))}
                                        disabled={statusLoading}
                                    >
                                        {UserStatusEnum.getOptions(t).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-warning ms-2"
                                        onClick={handleChangeUserStatus}
                                        disabled={statusLoading || (selectedStatus === null || selectedStatus === user.status)}
                                    >
                                        {statusLoading ? t('loading') : t('changeStatus')}
                                    </button>
                                </div>
                            )}
                            {!isMyProfile && (
                                <>
                                    {!friendship && (
                                        <button className="btn btn-primary" onClick={handleAddFriend}>
                                            <i className="bi bi-person-plus me-2"></i>{t('addFriend')}
                                        </button>
                                    )}
                                    {friendship && (
                                        <div>
                                            <span className="badge bg-info text-dark mb-2">
                                                {t('friendshipStatus')}: {FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label || friendship.status}
                                            </span>
                                            {/* Allow both sender and receiver to change status, show select and button */}
                                            {(currentUser && (friendship.senderUserId === currentUser.id || friendship.receiverUserId === currentUser.id)) && (
                                                <form
                                                    className="d-inline-flex align-items-center ms-2"
                                                    onSubmit={e => {
                                                        e.preventDefault();
                                                        if (selectedFriendStatus !== null && selectedFriendStatus !== friendship.status) {
                                                            handleUpdateFriendStatus(selectedFriendStatus);
                                                        }
                                                    }}
                                                >
                                                    <select
                                                        className="form-select form-select-sm me-2"
                                                        style={{maxWidth: 160}}
                                                        value={typeof selectedFriendStatus === 'number' ? selectedFriendStatus : friendship.status}
                                                        onChange={e => setSelectedFriendStatus(Number(e.target.value))}
                                                    >
                                                        {FriendStatusEnum.getOptions(t).map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-sm btn-warning"
                                                        disabled={selectedFriendStatus === null || selectedFriendStatus === friendship.status}
                                                    >
                                                        {t('changeStatus')}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3" style={{overflowX: 'auto'}}>
                {isMyProfile && (
                    <a href={`/users/${user.link}/settings`} className="btn btn-outline-primary">
                        <i className="bi bi-gear me-1"></i> {t('settings')}
                    </a>
                )}
                <a href={`/users/${user.link}/feeds`} className="btn btn-outline-primary">
                    <i className="bi bi-list-ul me-1"></i> {t('feeds')}
                </a>
                <a href={`/users/${user.link}/stories`} className="btn btn-outline-primary">
                    <i className="bi bi-collection-play me-1"></i> {t('stories')}
                </a>
                <a href={`/users/${user.link}/friends`} className="btn btn-outline-primary">
                    <i className="bi bi-people me-1"></i> {t('friends')}
                </a>
                <a href={`/users/${user.link}/goals`} className="btn btn-outline-primary">
                    <i className="bi bi-bullseye me-1"></i> {t('goals')}
                </a>
                <a href={`/users/${user.link}/pages`} className="btn btn-outline-primary">
                    <i className="bi bi-file-earmark-text me-1"></i> {t('pages')}
                </a>
                <a href={`/users/${user.link}/events`} className="btn btn-outline-primary">
                    <i className="bi bi-calendar-event me-1"></i> {t('events')}
                </a>
                <a href={`/users/${user.link}/trainings`} className="btn btn-outline-primary">
                    <i className="bi bi-bar-chart-steps me-1"></i> {t('trainings')}
                </a>
                {isMyProfile && (
                    <a href={`/users/${user.link}/notifications`} className="btn btn-outline-primary">
                        <i className="bi bi-bell me-1"></i> {t('notifications')}
                    </a>
                )}
                {isMyProfile && (
                    <a href={`/users/${user.link}/push-subscriptions`} className="btn btn-outline-primary">
                        <i className="bi bi-broadcast-pin me-1"></i> {t('pushSubscriptions')}
                    </a>
                )}
                <a href={`/users/${user.link}/conversations`} className="btn btn-outline-primary">
                    <i className="bi bi-chat-dots me-1"></i> {t('conversations')}
                </a>
            </div>
        </div>
    );
}
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { conversationService, type ConversationResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { ConversationStatusEnum } from '../../enums/ConversationStatusEnum';
import UserConversations from './UserConversations';
import { render, screen, userEvent, waitFor, within } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: { id: 'user-1', link: 'ada' },
    isOwner: true,
    canChat: true,
    isAdmin: false,
    conversationData: {} as Record<string, unknown>,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
    useConversationData: vi.fn(),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser, isAdmin: mocks.isAdmin }) };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useConversationData: mocks.useConversationData,
        useMyFriends: () => ({
            collaboratorOptions: [{ value: 'friend-1', label: 'Jan Runner' }],
        }),
    };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        UserSubpageContainer: ({
            children,
        }: {
            children: (context: {
                targetUser: { id: string; link: string; firstName: string; lastName: string };
                isOwner: boolean;
                isAdmin: boolean;
            }) => React.ReactNode;
        }) =>
            children({
                targetUser: {
                    id: 'user-1',
                    link: 'ada',
                    firstName: 'Ada',
                    lastName: 'Runner',
                },
                isOwner: mocks.isOwner,
                isAdmin: mocks.isAdmin,
            }),
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(ConversationStatusEnum.READ)}>Oznacz jako przeczytane</button>
        ),
        UserInfoCell: ({ user }: { user?: { firstName?: string; lastName?: string } }) => (
            <span>{user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'}</span>
        ),
        EntityViewCounter: () => <span>Wyświetlenia: 1</span>,
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return {
        ...utils,
        confirmDelete: mocks.confirmDelete,
    };
});

vi.mock('../../components/common/InteractionModal', () => ({
    InteractionModal: ({ opened, title, children }: { opened: boolean; title: string; children: React.ReactNode }) =>
        opened ? (
            <section role="dialog" aria-label={title}>
                {children}
            </section>
        ) : null,
}));

const ownMessage = {
    id: 'message-1',
    senderUserId: 'user-1',
    receiverUserId: 'friend-1',
    text: 'Cześć, jak trening?',
    status: ConversationStatusEnum.SENT,
    createdAt: '2026-11-10T09:00:00',
    updatedAt: '2026-11-10T09:00:00',
} as ConversationResource;

const incomingMessage = {
    ...ownMessage,
    id: 'message-2',
    senderUserId: 'friend-1',
    receiverUserId: 'user-1',
    text: 'Do zobaczenia!',
    status: ConversationStatusEnum.SENT,
} as ConversationResource;

const messages = [ownMessage, incomingMessage];

const ownerConversationData = {
    canChat: false,
    conversationsResponse: { data: messages, pagination: { page: 1, total: 2, hasNextPage: false } },
    conversationsLoading: false,
    fetchNextChatPage: vi.fn(),
    hasMoreChatMessages: false,
    isFetchingMoreChatMessages: false,
    chatLoading: false,
    messages,
    getUser: () => ({ id: 'friend-1', link: 'jan', firstName: 'Jan', lastName: 'Runner' }),
    isPartnerTyping: false,
    recordActivity: vi.fn(),
    resetActivityThrottle: vi.fn(),
};

function renderConversations(link = 'ada') {
    return render(
        <Routes>
            <Route path="/users/:link/conversations" element={<UserConversations />} />
        </Routes>,
        { initialEntries: [`/users/${link}/conversations`] },
    );
}

describe('UserConversations', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'user-1', link: 'ada' };
        mocks.isOwner = true;
        mocks.isAdmin = false;
        mocks.canChat = true;
        mocks.conversationData = { ...ownerConversationData };
        mocks.useConversationData.mockReset();
        mocks.useConversationData.mockImplementation(() => mocks.conversationData);
        mocks.confirmDelete.mockClear();
        vi.spyOn(conversationService, 'createConversation').mockResolvedValue({} as never);
        vi.spyOn(conversationService, 'updateConversation').mockResolvedValue({} as never);
        vi.spyOn(conversationService, 'updateConversationStatus').mockResolvedValue({} as never);
        vi.spyOn(conversationService, 'deleteConversation').mockResolvedValue({} as never);
    });

    it('shows loading and then lists messages and conversation actions for the owner', async () => {
        mocks.conversationData = {
            ...ownerConversationData,
            conversationsResponse: undefined,
            conversationsLoading: true,
            messages: [],
        };
        const { rerender } = renderConversations();
        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();

        mocks.conversationData = { ...ownerConversationData };
        rerender(
            <Routes>
                <Route path="/users/:link/conversations" element={<UserConversations />} />
            </Routes>,
        );
        expect(await screen.findByText('Cześć, jak trening?')).toBeVisible();
        expect(screen.getAllByText('Jan Runner').length).toBeGreaterThan(0);
        expect(screen.getByText('Do zobaczenia!')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Wyślij wiadomość' })).toBeVisible();
        expect(mocks.useConversationData).toHaveBeenLastCalledWith(
            expect.objectContaining({
                targetUser: expect.objectContaining({ id: 'user-1' }),
                isOwner: true,
                page: 1,
                limit: 10,
                sort: 'createdAt:desc',
                statusFilter: null,
            }),
        );
    });

    it('filters by status, sorts and paginates conversation messages', async () => {
        const user = userEvent.setup();
        mocks.conversationData = {
            ...ownerConversationData,
            conversationsResponse: { data: messages, pagination: { page: 1, total: 25, hasNextPage: true } },
        };
        renderConversations();

        expect(await screen.findByText('Cześć, jak trening?')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.click(await screen.findByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => {
            expect(mocks.useConversationData).toHaveBeenLastCalledWith(
                expect.objectContaining({ statusFilter: ConversationStatusEnum.READ }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.keyboard('{ArrowDown}{Enter}');
        await waitFor(() => {
            expect(mocks.useConversationData).toHaveBeenLastCalledWith(
                expect.objectContaining({ sort: 'createdAt:asc' }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(mocks.useConversationData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
        });
    });

    it('lets the owner edit, delete and change the status of messages', async () => {
        const user = userEvent.setup();
        renderConversations();
        expect(await screen.findByText('Cześć, jak trening?')).toBeVisible();

        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        const editDialog = screen.getByRole('dialog', { name: 'Edytuj wiadomość' });
        const editInput = screen.getByRole('textbox', { name: 'Treść' });
        await user.clear(editInput);
        await user.type(editInput, 'Zmieniona wiadomość');
        await user.click(within(editDialog).getByRole('button', { name: 'Zapisz' }));
        await waitFor(() => {
            expect(conversationService.updateConversation).toHaveBeenCalledWith({
                params: { path: { id: 'message-1' } },
                body: { text: 'Zmieniona wiadomość' },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Oznacz jako przeczytane' })[0]);
        await waitFor(() => {
            expect(conversationService.updateConversationStatus).toHaveBeenCalledWith({
                params: { path: { id: 'message-2' } },
                body: { status: ConversationStatusEnum.READ },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(conversationService.deleteConversation).toHaveBeenCalledWith({
                params: { path: { id: 'message-1' } },
            });
        });
    });

    it('opens the send-message form and submits a message to the selected user', async () => {
        const user = userEvent.setup();
        renderConversations();

        await user.click(await screen.findByRole('button', { name: 'Wyślij wiadomość' }));
        const dialog = screen.getByRole('dialog', { name: 'Wyślij wiadomość' });
        expect(dialog).toBeVisible();

        await user.type(within(dialog).getByRole('textbox', { name: 'Treść' }), '  Do zobaczenia  ');
        await user.click(within(dialog).getByRole('button', { name: 'Wyślij' }));
        await waitFor(() => {
            expect(conversationService.createConversation).toHaveBeenCalledWith({
                params: { path: { id: 'friend-1' } },
                body: { text: 'Do zobaczenia' },
            });
        });
    });

    it('shows chat messages to an accepted friend and allows sending a reply', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'friend-1', link: 'jan' };
        mocks.isOwner = false;
        mocks.conversationData = {
            ...ownerConversationData,
            canChat: true,
            conversationsResponse: undefined,
            messages: [ownMessage],
            chatLoading: false,
        };
        renderConversations();

        expect(await screen.findByText('Cześć, jak trening?')).toBeVisible();
        const messageInput = screen.getByRole('textbox', { name: 'Napisz wiadomość...' });
        await user.type(messageInput, 'Oczywiście');
        await user.click(screen.getByRole('button', { name: 'Wyślij' }));
        await waitFor(() => {
            expect(conversationService.createConversation).toHaveBeenCalledWith({
                params: { path: { id: 'user-1' } },
                body: { text: 'Oczywiście' },
            });
        });
    });

    it('disables chat for a non-friend and shows empty/loading states', async () => {
        mocks.isOwner = false;
        mocks.conversationData = {
            ...ownerConversationData,
            canChat: false,
            conversationsResponse: undefined,
            messages: [],
            chatLoading: true,
        };
        const { rerender } = renderConversations();

        expect(await screen.findByText('Ładowanie...')).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'Musisz być znajomym, aby pisać.' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeDisabled();

        mocks.conversationData = { ...mocks.conversationData, chatLoading: false };
        rerender(
            <Routes>
                <Route path="/users/:link/conversations" element={<UserConversations />} />
            </Routes>,
        );
        expect(await screen.findByText('Brak wiadomości. Przywitaj się!')).toBeVisible();
    });
});

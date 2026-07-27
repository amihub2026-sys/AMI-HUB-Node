import {
  Component,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chats.html',
  styleUrls: ['./chats.css']
})
export class Chats implements OnInit, OnDestroy {

  currentUser: any = null;

  messages = signal<any[]>([]);
  conversations = signal<any[]>([]);
  selectedChat = signal<any | null>(null);

  newMessage = '';
  isLoading = signal(false);

  postId: string | null = null;
  sellerId: string | null = null;

  private refreshInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  async ngOnInit(): Promise<void> {
    let user: any = {};

    try {
      user = JSON.parse(
        localStorage.getItem('user') || '{}'
      );
    } catch (error) {
      console.error('Invalid user data:', error);
    }

    const userId = String(
      user?._id ||
      user?.id ||
      ''
    );

    const token = this.api.getToken();

    if (!token || !userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = {
      id: userId
    };

    this.postId =
      this.route.snapshot.queryParamMap.get('postId');

    this.sellerId =
      this.route.snapshot.queryParamMap.get('sellerId');

    await this.loadConversations();

    if (this.postId) {
      const existingChat = this.conversations().find(
        (chat: any) =>
          String(chat.post_id) === String(this.postId)
      );

      if (existingChat) {
        await this.openChat(existingChat);
      } else {
        await this.createOrGetChat(this.postId);
      }
    }

    this.listenMessages();
  }

  async createOrGetChat(postId: string): Promise<void> {
    try {
      const response: any = await this.api
        .post('/chats', {
          postId
        })
        .toPromise();

      const chatData = response?.data;

      if (!chatData?._id) {
        return;
      }

      await this.loadConversations();

      const createdChat = this.conversations().find(
        (chat: any) =>
          String(chat.chatId) === String(chatData._id)
      );

      if (createdChat) {
        await this.openChat(createdChat);
      }
    } catch (error: any) {
      console.error(
        'Create chat error:',
        error?.error?.message || error
      );

      if (error?.status === 401) {
        this.router.navigate(['/login']);
      }
    }
  }

  openPost(): void {
    const chat = this.selectedChat();

    if (!chat?.post_id) {
      return;
    }

    this.router.navigate([
      '/post-view',
      chat.post_id
    ]);
  }

  async loadConversations(): Promise<void> {
    if (!this.currentUser?.id) {
      return;
    }

    this.isLoading.set(true);

    try {
      const response: any = await this.api
        .get('/chats')
        .toPromise();

      const chats: any[] = response?.data || [];
      const currentUserId = String(this.currentUser.id);

      const mappedChats = chats.map((chat: any) => {
        const buyerId = String(
          chat?.buyerId?._id ||
          chat?.buyerId ||
          ''
        );

        const sellerId = String(
          chat?.sellerId?._id ||
          chat?.sellerId ||
          ''
        );

        const isBuyer =
          buyerId === currentUserId;

        const otherUser =
          isBuyer
            ? chat?.sellerId
            : chat?.buyerId;

        const post = chat?.postId;

        return {
          chatId: String(chat?._id || ''),

          post_id: String(
            post?._id ||
            post ||
            ''
          ),

          otherUserId: String(
            otherUser?._id ||
            otherUser ||
            ''
          ),

          otherUserName:
            otherUser?.fullName ||
            'User',

          postImage:
            Array.isArray(post?.images) &&
            post.images.length > 0
              ? post.images[0]
              : '',

          postTitle:
            post?.title ||
            '',

          lastMessage:
            chat?.lastMessage ||
            'No messages yet',

          created_at:
            chat?.lastMessageAt ||
            chat?.updatedAt ||
            chat?.createdAt ||
            '',

          unreadCount:
            isBuyer
              ? Number(chat?.unreadBuyer || 0)
              : Number(chat?.unreadSeller || 0)
        };
      });

      this.conversations.set(mappedChats);

      const selected = this.selectedChat();

      if (selected?.chatId) {
        const updatedSelected = mappedChats.find(
          (chat: any) =>
            String(chat.chatId) ===
            String(selected.chatId)
        );

        if (updatedSelected) {
          this.selectedChat.set(updatedSelected);
        }
      }
    } catch (error: any) {
      console.error(
        'Error loading conversations:',
        error?.error?.message || error
      );

      this.conversations.set([]);

      if (error?.status === 401) {
        this.router.navigate(['/login']);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async openChat(chat: any): Promise<void> {
    if (!chat?.chatId) {
      return;
    }

    this.selectedChat.set(chat);

    await this.loadMessages(chat);
    await this.markConversationAsRead(chat);
  }

  async loadMessages(chat: any): Promise<void> {
    if (!chat?.chatId || !this.currentUser) {
      return;
    }

    try {
      const response: any = await this.api
        .get(`/chats/${chat.chatId}/messages`)
        .toPromise();

      const data: any[] = response?.data || [];

      const mappedMessages = data.map(
        (message: any) => ({
          ...message,

          sender_id: String(
            message?.senderId?._id ||
            message?.senderId ||
            ''
          ),

          receiver_id: String(
            message?.receiverId?._id ||
            message?.receiverId ||
            ''
          ),

          created_at:
            message?.createdAt ||
            ''
        })
      );

      this.messages.set(mappedMessages);

      setTimeout(() => {
        const element =
          document.querySelector('.messages');

        if (element) {
          element.scrollTo({
            top: (element as HTMLElement).scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    } catch (error: any) {
      console.error(
        'Error loading messages:',
        error?.error?.message || error
      );

      this.messages.set([]);
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    const chat = this.selectedChat();

    if (
      !text ||
      !chat?.chatId ||
      !this.currentUser
    ) {
      return;
    }

    try {
      await this.api
        .post(
          `/chats/${chat.chatId}/messages`,
          {
            message: text
          }
        )
        .toPromise();

      this.newMessage = '';

      await this.loadMessages(chat);
      await this.loadConversations();
    } catch (error: any) {
      console.error(
        'Send message error:',
        error?.error?.message || error
      );
    }
  }

  async markConversationAsRead(
    chat: any
  ): Promise<void> {
    if (!chat?.chatId || !this.currentUser) {
      return;
    }

    try {
      await this.api
        .put(
          `/chats/${chat.chatId}/read`,
          {}
        )
        .toPromise();

      this.conversations.update(
        (list: any[]) =>
          list.map((item: any) =>
            String(item.chatId) ===
            String(chat.chatId)
              ? {
                  ...item,
                  unreadCount: 0
                }
              : item
          )
      );
    } catch (error: any) {
      console.error(
        'Mark read error:',
        error?.error?.message || error
      );
    }
  }

  listenMessages(): void {
    this.stopMessageListener();

    this.refreshInterval = setInterval(
      async () => {
        await this.loadConversations();

        const selected = this.selectedChat();

        if (selected?.chatId) {
          await this.loadMessages(selected);
        }
      },
      3000
    );
  }

  private stopMessageListener(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  getTime(value: string): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  }

  isSelected(chat: any): boolean {
    const selected = this.selectedChat();

    return (
      !!selected &&
      String(selected.chatId) ===
        String(chat.chatId)
    );
  }

  ngOnDestroy(): void {
    this.stopMessageListener();
  }
}
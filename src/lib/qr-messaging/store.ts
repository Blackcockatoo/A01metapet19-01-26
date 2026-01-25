/**
 * MOSS60 QR Messaging Store
 * Zustand state management with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  QRMessagingStore,
  QRMessagingState,
  EncodingFormat,
  ErrorCorrectionLevel,
  EncryptionMode,
  Conversation,
  Message,
  HandshakeState,
  QRMessage,
  QRScanResult,
} from './types';
import {
  generateKeyPair as generateKeyPairCrypto,
  computeSharedSecret,
  deriveKeys,
  encrypt,
  decrypt,
  generateMessageId,
  generateNonce,
} from './crypto';
import { getPreferredIdentity, loadIdentityProfile } from '@/lib/identity/profile';

/** Initial state */
const identityProfile = loadIdentityProfile();
const initialLocalIdentity = getPreferredIdentity(identityProfile);
const initialState: QRMessagingState = {
  localIdentity: initialLocalIdentity,
  localKeyPair: null,
  conversations: {},
  activeConversationId: null,
  generatedQRs: [],
  scannedQRs: [],
  defaultFormat: 'base60',
  defaultErrorCorrection: 'M',
  encryptionMode: 'standard',
};

/**
 * Create a new conversation
 */
function createConversation(
  localIdentity: string,
  remoteIdentity: string
): Conversation {
  return {
    id: `conv-${Date.now().toString(36)}-${generateNonce().substring(0, 8)}`,
    localIdentity,
    remoteIdentity,
    handshakeState: null,
    messages: [],
    createdAt: Date.now(),
    lastMessageAt: null,
  };
}

/**
 * Create handshake state for a conversation
 */
function createHandshakeState(identity: string): HandshakeState {
  const seed = `${identity}-${Date.now()}-${Math.random()}`;
  const keyPair = generateKeyPairCrypto(seed);

  return {
    identity,
    privateSpiral: keyPair.private,
    publicHash: keyPair.public,
    sharedSecret: null,
    encryptionKey: null,
    decryptionKey: null,
    messageCount: 0,
    connected: false,
    createdAt: Date.now(),
  };
}

/** QR Messaging Zustand store */
export const useQRMessagingStore = create<QRMessagingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Identity management
      setLocalIdentity: (identity: string) => {
        set({ localIdentity: identity });
      },

      generateKeyPair: async () => {
        const { localIdentity } = get();
        if (!localIdentity) {
          console.warn('Cannot generate key pair without local identity');
          return;
        }

        const seed = `${localIdentity}-${Date.now()}-${Math.random()}`;
        const keyPair = generateKeyPairCrypto(seed);

        set({ localKeyPair: keyPair });
      },

      // Conversation management
      createConversation: (remoteIdentity: string) => {
        const { localIdentity, conversations } = get();

        if (!localIdentity) {
          console.warn('Cannot create conversation without local identity');
          return '';
        }

        // Check if conversation already exists
        const existing = Object.values(conversations).find(
          c => c.remoteIdentity === remoteIdentity
        );
        if (existing) {
          set({ activeConversationId: existing.id });
          return existing.id;
        }

        const conversation = createConversation(localIdentity, remoteIdentity);

        set({
          conversations: {
            ...conversations,
            [conversation.id]: conversation,
          },
          activeConversationId: conversation.id,
        });

        return conversation.id;
      },

      selectConversation: (id: string) => {
        const { conversations } = get();
        if (conversations[id]) {
          set({ activeConversationId: id });
        }
      },

      deleteConversation: (id: string) => {
        const { conversations, activeConversationId } = get();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: deleted, ...rest } = conversations;

        set({
          conversations: rest,
          activeConversationId:
            activeConversationId === id ? null : activeConversationId,
        });
      },

      // Handshake
      initiateHandshake: async (conversationId: string) => {
        const { conversations, localIdentity } = get();
        const conversation = conversations[conversationId];

        if (!conversation) {
          console.error('Conversation not found:', conversationId);
          return '';
        }

        const handshakeState = createHandshakeState(localIdentity);

        set({
          conversations: {
            ...conversations,
            [conversationId]: {
              ...conversation,
              handshakeState,
            },
          },
        });

        return handshakeState.publicHash;
      },

      completeHandshake: (conversationId: string, remotePublicHash: string) => {
        const { conversations, encryptionMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState) {
          console.error('No handshake in progress');
          return;
        }

        const { handshakeState } = conversation;
        const sharedSecret = computeSharedSecret(
          handshakeState.privateSpiral,
          remotePublicHash
        );
        const { encryptionKey, decryptionKey } = deriveKeys(sharedSecret);

        set({
          conversations: {
            ...conversations,
            [conversationId]: {
              ...conversation,
              handshakeState: {
                ...handshakeState,
                sharedSecret,
                encryptionKey,
                decryptionKey,
                connected: true,
              },
            },
          },
        });
      },

      // Messaging
      sendMessage: (conversationId: string, plaintext: string) => {
        const { conversations, encryptionMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState?.connected) {
          console.error('Not connected');
          return null;
        }

        const { handshakeState } = conversation;
        if (!handshakeState.encryptionKey) {
          console.error('No encryption key');
          return null;
        }

        const ciphertext = encrypt(
          plaintext,
          handshakeState.encryptionKey,
          handshakeState.messageCount,
          encryptionMode
        );

        const message: Message = {
          id: generateMessageId(),
          content: plaintext,
          senderId: handshakeState.identity,
          recipientId: conversation.remoteIdentity,
          timestamp: Date.now(),
          direction: 'sent',
          encrypted: true,
        };

        set({
          conversations: {
            ...conversations,
            [conversationId]: {
              ...conversation,
              messages: [...conversation.messages, message],
              handshakeState: {
                ...handshakeState,
                messageCount: handshakeState.messageCount + 1,
              },
              lastMessageAt: Date.now(),
            },
          },
        });

        return message;
      },

      receiveMessage: (conversationId: string, ciphertext: string) => {
        const { conversations, encryptionMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState?.connected) {
          console.error('Not connected');
          return null;
        }

        const { handshakeState } = conversation;
        if (!handshakeState.decryptionKey) {
          console.error('No decryption key');
          return null;
        }

        try {
          const plaintext = decrypt(
            ciphertext,
            handshakeState.decryptionKey,
            handshakeState.messageCount,
            encryptionMode
          );

          const message: Message = {
            id: generateMessageId(),
            content: plaintext,
            senderId: conversation.remoteIdentity,
            recipientId: handshakeState.identity,
            timestamp: Date.now(),
            direction: 'received',
            encrypted: true,
          };

          set({
            conversations: {
              ...conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, message],
                handshakeState: {
                  ...handshakeState,
                  messageCount: handshakeState.messageCount + 1,
                },
                lastMessageAt: Date.now(),
              },
            },
          });

          return message;
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return null;
        }
      },

      // QR operations
      addGeneratedQR: (qr: QRMessage) => {
        set(state => ({
          generatedQRs: [qr, ...state.generatedQRs].slice(0, 50), // Keep last 50
        }));
      },

      addScannedQR: (result: QRScanResult) => {
        set(state => ({
          scannedQRs: [result, ...state.scannedQRs].slice(0, 50), // Keep last 50
        }));
      },

      clearQRHistory: () => {
        set({
          generatedQRs: [],
          scannedQRs: [],
        });
      },

      // Settings
      setDefaultFormat: (format: EncodingFormat) => {
        set({ defaultFormat: format });
      },

      setDefaultErrorCorrection: (level: ErrorCorrectionLevel) => {
        set({ defaultErrorCorrection: level });
      },

      setEncryptionMode: (mode: EncryptionMode) => {
        set({ encryptionMode: mode });
      },

      // Utilities
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'moss60-qr-messaging',
      version: 1,
      partialize: state => ({
        localIdentity: state.localIdentity,
        localKeyPair: state.localKeyPair,
        conversations: state.conversations,
        generatedQRs: state.generatedQRs.slice(0, 20), // Limit persisted history
        scannedQRs: state.scannedQRs.slice(0, 20),
        defaultFormat: state.defaultFormat,
        defaultErrorCorrection: state.defaultErrorCorrection,
        encryptionMode: state.encryptionMode,
      }),
    }
  )
);

/**
 * Get active conversation from store
 */
export function getActiveConversation(): Conversation | null {
  const state = useQRMessagingStore.getState();
  if (!state.activeConversationId) return null;
  return state.conversations[state.activeConversationId] ?? null;
}

/**
 * Check if connected to a conversation
 */
export function isConnected(conversationId: string): boolean {
  const state = useQRMessagingStore.getState();
  const conversation = state.conversations[conversationId];
  return conversation?.handshakeState?.connected ?? false;
}

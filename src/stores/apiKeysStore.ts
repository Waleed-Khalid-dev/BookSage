import { create } from 'zustand';
import { encryptData, decryptData, initEncryption } from '../utils/encryption';

interface ApiKeysState {
  keys: Record<string, string>;
  isInitialized: boolean;
  
  loadKeys: () => Promise<void>;
  saveKey: (provider: string, key: string) => Promise<void>;
  getKey: (provider: string) => string | undefined;
  hasKey: (provider: string) => boolean;
}

const STORAGE_KEY = 'booksage_encrypted_api_keys';

export const useApiKeys = create<ApiKeysState>((set, get) => ({
  keys: {},
  isInitialized: false,

  loadKeys: async () => {
    try {
      await initEncryption();
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const encryptedRecords = JSON.parse(stored) as Record<string, string>;
        const decryptedKeys: Record<string, string> = {};
        
        for (const [provider, cipher] of Object.entries(encryptedRecords)) {
          const dec = await decryptData(cipher);
          if (dec) decryptedKeys[provider] = dec;
        }
        
        set({ keys: decryptedKeys, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch (e) {
      console.error("Failed to load API keys", e);
      set({ isInitialized: true });
    }
  },

  saveKey: async (provider: string, key: string) => {
    try {
      await initEncryption();
      const { keys } = get();
      const newKeys = { ...keys };
      
      if (key.trim() === '') {
        delete newKeys[provider];
      } else {
        newKeys[provider] = key.trim();
      }
      
      // Encrypt all keys for storage
      const encryptedRecords: Record<string, string> = {};
      for (const [p, k] of Object.entries(newKeys)) {
        encryptedRecords[p] = await encryptData(k);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedRecords));
      set({ keys: newKeys });
    } catch (e) {
      console.error("Failed to save API keys", e);
    }
  },
  
  getKey: (provider: string) => get().keys[provider],
  
  hasKey: (provider: string) => {
    const k = get().keys[provider];
    return !!k && k.trim().length > 0;
  }
}));

// web-app/src/services/friendsStore.ts

import type { FriendsList } from "../utilities/types.ts";

const FRIENDS_STORAGE_KEY = "suimail_friends_list";

/**
 * Load friends list from localStorage
 */
export function loadFriendsList(): FriendsList {
    try {
        const stored = localStorage.getItem(FRIENDS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to load friends list:", error);
        return {};
    }
}

/**
 * Save friends list to localStorage
 */
export function saveFriendsList(friends: FriendsList): void {
    try {
        localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
        // Dispatch event to notify other components
        window.dispatchEvent(new Event("friendsUpdated"));
    } catch (error) {
        console.error("Failed to save friends list:", error);
    }
}

/**
 * Add a new friend
 */
export function addFriend(address: string, alias: string): void {
    const friends = loadFriendsList();
    friends[address] = alias;
    saveFriendsList(friends);
}

/**
 * Remove a friend
 */
export function removeFriend(address: string): void {
    const friends = loadFriendsList();
    delete friends[address];
    saveFriendsList(friends);
}

/**
 * Get friend alias by address
 */
export function getFriendAlias(address: string): string | null {
    const friends = loadFriendsList();
    return friends[address] || null;
}

/**
 * Check if address is a friend
 */
export function isFriend(address: string): boolean {
    const friends = loadFriendsList();
    return address in friends;
}

/**
 * Validate Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address.trim());
}

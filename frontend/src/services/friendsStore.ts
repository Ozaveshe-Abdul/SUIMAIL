const BASE_STORAGE_KEY = "suimail_friends_list";
const EVENT_NAME = "friends-updated";

export interface Friend {
    address: string;
    alias: string;
}

// --- Internal Helpers ---

/**
 * Generates a unique storage key for the specific user
 */
function getStorageKey(ownerAddress: string): string {
    if (!ownerAddress) return BASE_STORAGE_KEY; // Fallback
    return `${BASE_STORAGE_KEY}_${ownerAddress.toLowerCase()}`;
}

function loadFriendsFromStorage(ownerAddress: string): Friend[] {
    try {
        const key = getStorageKey(ownerAddress);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load friends:", e);
        return [];
    }
}

function saveFriendsToStorage(ownerAddress: string, friends: Friend[]) {
    try {
        const key = getStorageKey(ownerAddress);
        localStorage.setItem(key, JSON.stringify(friends));
        // We pass the ownerAddress in the event details so components can filter updates
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ownerAddress } }));
    } catch (e) {
        console.error("Failed to save friends:", e);
    }
}

// --- Public API ---

/**
 * Get the full list of friends for a specific user
 */
export function getFriends(ownerAddress: string): Friend[] {
    if (!ownerAddress) return [];
    return loadFriendsFromStorage(ownerAddress);
}

/**
 * Get a specific friend by address
 */
export function getFriend(ownerAddress: string, friendAddress: string): Friend | undefined {
    if (!ownerAddress) return undefined;
    const friends = loadFriendsFromStorage(ownerAddress);
    return friends.find(f => f.address.toLowerCase() === friendAddress.toLowerCase());
}

/**
 * Get just the alias for a specific address (returns null if not found)
 */
export function getFriendAlias(ownerAddress: string, friendAddress: string): string | null {
    const friend = getFriend(ownerAddress, friendAddress);
    return friend ? friend.alias : null;
}

/**
 * Check if an address is in the friends list
 */
export function isFriend(ownerAddress: string, friendAddress: string): boolean {
    return !!getFriend(ownerAddress, friendAddress);
}

/**
 * Add a new friend for the current user
 */
export function addFriend(ownerAddress: string, friendAddress: string, alias: string) {
    if (!ownerAddress) return;
    const friends = loadFriendsFromStorage(ownerAddress);

    const exists = friends.some(f => f.address.toLowerCase() === friendAddress.toLowerCase());

    if (exists) {
        console.warn(`Friend with address ${friendAddress} already exists. Use editFriendAlias to update.`);
        return;
    }

    friends.push({ address: friendAddress, alias });
    saveFriendsToStorage(ownerAddress, friends);
}

/**
 * Edit the alias of an existing friend
 */
export function editFriendAlias(ownerAddress: string, friendAddress: string, newAlias: string) {
    if (!ownerAddress) return;
    const friends = loadFriendsFromStorage(ownerAddress);

    const friendIndex = friends.findIndex(f => f.address.toLowerCase() === friendAddress.toLowerCase());

    if (friendIndex === -1) {
        console.warn(`Cannot edit alias: Friend with address ${friendAddress} not found.`);
        return;
    }

    // Update the alias
    friends[friendIndex].alias = newAlias;
    saveFriendsToStorage(ownerAddress, friends);
}

/**
 * Remove a friend by address
 */
export function removeFriend(ownerAddress: string, friendAddress: string) {
    if (!ownerAddress) return;
    let friends = loadFriendsFromStorage(ownerAddress);

    const initialLength = friends.length;
    friends = friends.filter(f => f.address.toLowerCase() !== friendAddress.toLowerCase());

    if (friends.length !== initialLength) {
        saveFriendsToStorage(ownerAddress, friends);
    }
}

/**
 * Validate Sui address format (Stateless, works globally)
 */
export function isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address.trim());
}

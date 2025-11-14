// web-app/src/store.ts
export type FriendsList = Record<string, string>; // Maps: address -> alias

const FRIENDS_KEY = "suimail_friends_list";

export function loadFriendsList(): FriendsList {
    const stored = localStorage.getItem(FRIENDS_KEY);
    return stored ? JSON.parse(stored) : {};
}

export function saveFriendsList(friends: FriendsList) {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
}

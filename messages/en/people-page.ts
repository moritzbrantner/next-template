export const peoplePage = {
  title: 'Friends',
  description: 'Manage mutual follows and add new friends from search.',
  search: {
    title: 'Add friends',
    description:
      'Search by display name or email to find discoverable profiles.',
    placeholder: 'Search profiles',
    close: 'Close friend search',
    loading: 'Searching…',
    idle: 'Start typing to search for someone to add.',
    empty: 'No discoverable users matched your search.',
    error: 'Unable to search for profiles right now. Please try again.',
  },
  following: {
    title: 'Following',
    description: 'You are currently following {count} people.',
    empty: 'You are not following anyone yet.',
  },
  friends: {
    title: 'Friends',
    description: 'You have {count} mutual follows.',
    empty: 'You do not have any friends yet. Add someone who follows you back.',
  },
  actions: {
    addFriend: 'Add friend',
    follow: 'Follow',
    unfollow: 'Unfollow',
    following: 'Following…',
    unfollowing: 'Unfollowing…',
    block: 'Block',
    blocking: 'Blocking…',
    friendAdded: '{name} is now a friend.',
    followAdded:
      'You are following {name}. They will appear here when they follow you back.',
    error: 'Unable to update follow status right now. Please try again.',
    blockError: 'Unable to update block status right now. Please try again.',
  },
};

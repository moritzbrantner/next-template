export const peoplePage = {
  title: 'People',
  description: 'See who you already follow and search for more people to add to your network.',
  search: {
    title: 'Find people to follow',
    description: 'Search by display name or email to find profiles that are discoverable.',
    placeholder: 'Search people',
    loading: 'Searching…',
    idle: 'Start typing to search for people you can follow.',
    empty: 'No discoverable users matched your search.',
    error: 'Unable to search for people right now. Please try again.',
  },
  following: {
    title: 'Following',
    description: 'You are currently following {count} people.',
    empty: 'You are not following anyone yet.',
  },
  friends: {
    title: 'Friends',
    description: 'You have {count} mutual follows.',
    empty: 'You do not have any friends yet. Follow someone who follows you back.',
  },
  actions: {
    follow: 'Follow',
    unfollow: 'Unfollow',
    following: 'Following…',
    unfollowing: 'Unfollowing…',
    block: 'Block',
    blocking: 'Blocking…',
    error: 'Unable to update follow status right now. Please try again.',
    blockError: 'Unable to update block status right now. Please try again.',
  },
};

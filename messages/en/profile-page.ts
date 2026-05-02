export const profilePage = {
  title: 'Profile',
  description: 'View your profile as other people see it.',
  view: {
    title: 'Profile',
    description: 'View this user and keep up with their activity.',
    followers: 'followers',
    followingCount: 'following',
    friends: 'friends',
    addFriend: 'Add friend',
    follow: 'Follow',
    unfollow: 'Unfollow',
    following: 'Following…',
    unfollowing: 'Unfollowing…',
    block: 'Block',
    unblock: 'Unblock',
    blocking: 'Blocking…',
    unblocking: 'Unblocking…',
    blockedDescription:
      'You blocked this user. They can no longer follow you or appear in your directory.',
    editProfile: 'Edit profile',
    error:
      'Unable to update this user relationship right now. Please try again.',
  },
  followersPage: {
    title: 'Followers',
    description: '{name} has {count} followers.',
    backToProfile: 'Back to profile',
    summary: 'Showing {visibleCount} of {totalCount} followers.',
    hiddenSummary: '{count} followers are hidden by visibility permissions.',
    empty: 'No one is following this profile yet.',
    hiddenEmpty:
      'Followers exist, but their visibility roles do not allow them to appear here.',
    roles: {
      PUBLIC: 'Public',
      MEMBERS: 'Members',
      PRIVATE: 'Private',
    },
  },
  form: {
    displayName: {
      label: 'Display name',
      placeholder: 'Your display name',
      save: 'Save name',
      saving: 'Saving…',
      success: 'Display name updated.',
    },
    tag: {
      label: 'Public tag',
      placeholder: 'your-tag',
      hint: 'Your public profile URL updates immediately:',
      save: 'Save tag',
      saving: 'Saving…',
      success: 'Public tag updated.',
      viewProfile: 'View public profile',
    },
  },
};

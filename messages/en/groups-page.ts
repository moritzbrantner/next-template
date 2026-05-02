export const groupsPage = {
  title: 'Groups',
  description:
    'Create shared groups, invite people, and decide who can administer each group.',
  overview: {
    groupsLabel: 'Groups',
    invitationsLabel: 'Pending invitations',
    membershipsLabel: 'Total members',
  },
  roles: {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MEMBER: 'Member',
  },
  create: {
    title: 'Create group',
    description:
      'Owners can invite members and promote admins after the group is created.',
    nameLabel: 'Group name',
    namePlaceholder: 'Group name',
    descriptionLabel: 'Group description',
    descriptionPlaceholder: 'Description',
    submit: 'Create group',
    creating: 'Creating...',
  },
  invitations: {
    title: 'Invitations',
    description: 'You have {count} pending group invitations.',
    empty: 'No pending invitations.',
    emptyDescription:
      'New invitations will appear here when someone invites you.',
    invitedBy: 'Invited by {name}',
    accept: 'Accept',
    accepting: 'Accepting...',
    decline: 'Decline',
    declining: 'Declining...',
  },
  groups: {
    title: 'Your groups',
    description: 'You are a member of {count} groups.',
    empty: 'You are not a member of any groups yet.',
    emptyDescription:
      'Create a group to coordinate members, invitations, and admin roles.',
    meta: '{members} members, {invitations} pending invitations',
  },
  detail: {
    back: 'Back to groups',
    meta: '{members} members, {invitations} pending invitations',
    inviteTitle: 'Invite members',
    inviteDescription:
      'Search discoverable users and send them an invitation to join this group.',
    searchPlaceholder: 'Search people',
    searching: 'Searching...',
    noCandidates: 'No available users matched your search.',
    invite: 'Invite',
    inviting: 'Inviting...',
    membersTitle: 'Members',
    membersDescription: '{count} people belong to this group.',
    pendingTitle: 'Pending invitations',
    pendingDescription: '{count} invitations have not been answered yet.',
    pendingEmpty: 'No pending invitations.',
    pendingBadge: 'Pending',
    roleLabel: 'Role for {name}',
    remove: 'Remove',
    leave: 'Leave',
  },
  errors: {
    create: 'Unable to create the group right now. Please try again.',
    invitation: 'Unable to update the invitation right now. Please try again.',
    search: 'Unable to search invite candidates right now. Please try again.',
    invite: 'Unable to invite this user right now. Please try again.',
    member: 'Unable to update this member right now. Please try again.',
  },
};

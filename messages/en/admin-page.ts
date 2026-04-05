export const adminPage = {
  accessBadge: 'ADMIN only',
  navigation: {
    overview: 'Overview',
    reports: 'Reports',
    users: 'Users',
    systemSettings: 'System settings',
    dataStudio: 'Data studio',
  },
  overview: {
    title: 'Admin overview',
    description: 'Use these workspaces for privileged reporting, user operations, platform configuration, and schema-driven tools.',
    openWorkspace: 'Open workspace',
  },
  reports: {
    title: 'Reports',
    description: 'Review platform health, security posture, and adoption signals from one place.',
    ready: 'Ready for review',
    columns: {
      report: 'Report',
      owner: 'Owner',
      cadence: 'Cadence',
      status: 'Status',
      actions: 'Actions',
    },
    actions: {
      open: 'Open',
      export: 'Export',
    },
    metrics: {
      coverage: {
        label: 'Authorization coverage',
        value: '100%',
        detail: 'All privileged admin routes now require the ADMIN role.',
      },
      auditTrail: {
        label: 'Audit trail window',
        value: '24h',
        detail: 'Security-sensitive activity can be reviewed quickly after changes or incidents.',
      },
      refreshCadence: {
        label: 'Refresh cadence',
        value: '5 min',
        detail: 'Operational summaries are staged frequently for rapid decision-making.',
      },
    },
    catalogTitle: 'Report catalog',
    catalogDescription: 'Each report below has a clear owner, refresh cadence, and action path for admins.',
    catalog: {
      securityAccess: {
        title: 'Security access review',
        description: 'Track privileged role changes, recent denials, and sign-in anomalies.',
        owner: 'Security operations',
        cadence: 'Every 4 hours',
      },
      auditActivity: {
        title: 'Audit activity log',
        description: 'Inspect admin actions, account changes, and high-risk endpoints in one stream.',
        owner: 'Platform team',
        cadence: 'Live feed',
      },
      workspaceAdoption: {
        title: 'Workspace adoption',
        description: 'Measure active teams, repeat visits, and drop-offs across admin workspaces.',
        owner: 'Operations',
        cadence: 'Daily at 06:00',
      },
      schemaHealth: {
        title: 'Schema health',
        description: 'Review validation failures, ingestion mismatches, and write integrity issues.',
        owner: 'Data engineering',
        cadence: 'On every deployment',
      },
    },
    alertsTitle: 'Scheduled alerts',
    alertsDescription: 'Admins can keep the most important report outputs pushed to the right audience.',
    alerts: {
      dailyDigest: {
        title: 'Daily admin digest',
        description: 'Sends the latest platform and security summaries to the admin rotation.',
        channel: 'Email',
      },
      weeklyExecutive: {
        title: 'Weekly executive snapshot',
        description: 'Bundles adoption, risk, and operational highlights into a leadership brief.',
        channel: 'PDF',
      },
      failedIngestion: {
        title: 'Failed ingestion warning',
        description: 'Escalates schema or record write failures as soon as they cross the threshold.',
        channel: 'Slack',
      },
    },
  },
  users: {
    title: 'User management',
    description: 'Monitor role distribution and the operational playbooks admins use when access changes.',
    metrics: {
      privileged: {
        label: 'Privileged users',
        value: '6',
        detail: 'Accounts with direct access to admin-only workspaces and approvals.',
      },
      operational: {
        label: 'Managers',
        value: '18',
        detail: 'Operational users coordinating teams without full admin privileges.',
      },
      member: {
        label: 'Members',
        value: '124',
        detail: 'Standard workspace users currently assigned to product workflows.',
      },
    },
    tableTitle: 'User directory',
    tableDescription: 'Use the live user list to review access, identify pending invites, and take direct action.',
    columns: {
      user: 'User',
      role: 'Role',
      status: 'Status',
      lastSeen: 'Last activity',
      actions: 'Manage',
    },
    status: {
      active: 'Active',
      pending: 'Pending invite',
      suspended: 'Suspended',
    },
    actions: {
      active: {
        primary: 'Edit role',
        secondary: 'Reset password',
        danger: 'Suspend',
      },
      pending: {
        primary: 'Resend invite',
        secondary: 'Change role',
      },
      suspended: {
        primary: 'Restore access',
        secondary: 'Review logs',
      },
    },
    workflowTitle: 'Admin workflows',
    workflowDescription: 'Common user-management actions that should remain in the hands of administrators.',
    workflows: {
      invite: {
        title: 'Invite',
        description: 'Onboard staff into the correct starting role and access footprint.',
      },
      promote: {
        title: 'Promote',
        description: 'Elevate trusted operators only after role and risk review.',
      },
      suspend: {
        title: 'Suspend',
        description: 'Pause access immediately when an account should be investigated or archived.',
      },
    },
  },
  systemSettings: {
    title: 'System settings',
    description: 'Control platform-wide policies that should stay in admin hands, not personal user preferences.',
    actions: {
      edit: 'Edit',
      audit: 'Audit log',
    },
    groups: {
      sessions: {
        title: 'Session controls',
        description: 'Define session lifetime, rotation cadence, and forced re-authentication windows.',
      },
      notifications: {
        title: 'Notification defaults',
        description: 'Set digest cadence, escalation routing, and admin broadcast expectations.',
      },
      storage: {
        title: 'Storage and retention',
        description: 'Review upload limits, local asset handling, and cleanup windows.',
      },
    },
    settings: {
      sessionLifetime: {
        label: 'Session lifetime',
        value: '8 hours with forced token rotation on privileged actions.',
        scope: 'Authentication',
      },
      idleTimeout: {
        label: 'Idle timeout',
        value: '20 minutes before automatic sign-out on admin routes.',
        scope: 'Security',
      },
      mfaPolicy: {
        label: 'MFA policy',
        value: 'Required for ADMIN accounts and optional for all others.',
        scope: 'Access',
      },
      digestCadence: {
        label: 'Digest cadence',
        value: 'Two daily summaries for admin notifications and report digests.',
        scope: 'Communication',
      },
      incidentRouting: {
        label: 'Incident routing',
        value: 'Critical issues fan out to the security channel and on-call alias.',
        scope: 'Escalation',
      },
      maintenanceWindow: {
        label: 'Maintenance notice',
        value: 'Changes are announced 72 hours before scheduled downtime.',
        scope: 'Operations',
      },
      uploadLimit: {
        label: 'Upload limit',
        value: '25 MB per asset with image validation before storage.',
        scope: 'Storage',
      },
      retentionWindow: {
        label: 'Retention window',
        value: '365 days for logs, uploads, and recoverable admin records.',
        scope: 'Compliance',
      },
      auditExports: {
        label: 'Audit exports',
        value: 'Nightly archival export to the reporting storage bucket.',
        scope: 'Backups',
      },
    },
    checklistTitle: 'Change checklist',
    checklistDescription: 'Use the same review pattern whenever a platform-level setting is changed.',
    checklist: {
      review: 'Review the operational impact before making a platform-wide change.',
      announce: 'Communicate setting changes to affected teams when behavior will shift.',
      verify: 'Verify audit logs, error rates, and user impact after rollout.',
    },
  },
  dataStudio: {
    title: 'Data studio',
    description: 'Insert records through schema-driven forms generated from db-schema.json. Access is restricted to ADMIN users.',
    summary: {
      tables: 'Writable tables',
      fields: 'Available fields',
      required: 'Required fields in selected table',
    },
    explorerTitle: 'Schema explorer',
    explorerDescription: 'Select a table to inspect its shape and compose a record from the generated form.',
    emptyState: 'No table selected',
    noDescription: 'No description available for this table.',
    details: {
      tableName: 'Table name',
      fieldCount: 'Field count',
      endpoint: 'Write endpoint',
    },
    formTitle: 'Generated form',
    formDescription: 'Submit the generated form to create a record in the selected database table.',
    fieldListTitle: 'Field inventory',
    fieldType: 'Field type',
    fieldRequired: 'Required',
    fieldOptional: 'Optional',
    guideTitle: 'Studio guide',
    guideDescription: 'Pick a table, complete the required fields, and submit the generated form to create a new record through the admin API.',
  },
};

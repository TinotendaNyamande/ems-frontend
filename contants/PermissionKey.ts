export const PermissionKeys={
         UsersView : "users.view",
         UsersCreate : "users.create",
         UsersEdit : "users.edit",
         UsersDelete : "users.delete",

         OrganisationView : "organisation.view",
         OrganisationEdit : "organisation.edit",
         OrganisationDelete : "organisation.delete",

         JoinRequestsView : "joinRequests.view",
         JoinRequestsApprove : "joinRequests.approve",

         TasksView : "tasks.view",
         TasksCreate : "tasks.create",
         TasksEdit : "tasks.edit",
         TasksDelete : "tasks.delete",

         PermissionsView : "permissions.view",
         PermissionsEdit : "permissions.edit",

         MailBoxesView : "mailBoxes.view",
         MailBoxesCreate : "mailBoxes.create",
         MailBoxesEdit : "mailBoxes.edit",
         MailBoxesDelete : "mailBoxes.delete",
}

export const UiPermissionKeys = {
  Allow: "allow",
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys] |
  (typeof UiPermissionKeys)[keyof typeof UiPermissionKeys];

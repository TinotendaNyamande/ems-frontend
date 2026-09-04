import { BASE_URL } from "./helper";

export enum EmailType {
  Gmail = 1,
  Outlook = 2,
  Office365 = 3,
}

export type EmailAccountDto = {
  id?: string;
  emailAddress?: string;
  emailType?: EmailType | number | string;
  password?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  tenantId?: string | null;
  createdAt?: string;
  lastUpdatedAt?: string;
  isValidated?: boolean;
};

export type CreateEmailAccountPayload = {
  emailAddress: string;
  emailType: EmailType;
  password?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  tenantId?: string | null;
};

export type TestEmailAccountPayload = {
  toEmail: string;
};
export type ChangePasswordDto ={
  newPassword: string;
  oldPassword: string;
  emailId: string;
}

export type ChangeSecretDto ={
  newSecret: string;
  oldSecret: string;
  emailId: string;
}

export async function getEmailAccounts( 
  token: string | null
): Promise<EmailAccountDto[]> {


  const response = await fetch(
    `${BASE_URL}/emailaccount`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errors = await response.json();

    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to fetch email accounts.");
    }

  }
  return await response.json();
}

export async function createEmailAccount(
  payload: CreateEmailAccountPayload,
  token: string
): Promise<EmailAccountDto> {
  const response = await fetch(`${BASE_URL}/emailaccount`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errors = await response.json();

    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to fetch email accounts.");
    }

  }
  const data = await response.json();
  return data;
}

export async function testEmailAccount(
  id: string,
  payload: TestEmailAccountPayload,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/${id}/test-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errors = await response.json();

    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to send test email");
    }

  }
}

export async function validateEmailAccount(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/${id}/validate-email`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

  });
  if (!response.ok) {
    const errors = await response.json();

    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to validate email account ");
    }
  }
  const data = await response.json();
  if (data == false) {
    throw new Error("Email account is invalid. Please check the details and try again.");
  }
  return data;
}
export async function deleteEmailAccount(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

  });
  if (!response.ok) {
    const errors = await response.json();

    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to delete email account");
    }

  }
}

export async function updateEmailAccount(
  id: string,
  payload: Partial<CreateEmailAccountPayload>,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errors = await response.json();
    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to update email account");
    }
  }
}

export async function getEmailAccountById(id: string, token: string): Promise<EmailAccountDto> {
  const response = await fetch(`${BASE_URL}/emailaccount/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

  });
  if (!response.ok) {
    const errors = await response.json();
    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to fetch email account");
    }
  }
  const data = await response.json();
  return data;
}


export async function changeEmailAccountPassword(
  id: string,
  payload: Partial<ChangePasswordDto>,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/change-password/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errors = await response.json();
    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to update email account");
    }
  }
}

export async function changeEmailAccountClientSecret(
  id: string,
  payload: Partial<ChangeSecretDto>,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailaccount/change-client-secret/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errors = await response.json();
    if (errors.errors) {
      const message = Object.values(errors.errors)
        .flat()
        .join(", ");
      throw new Error(message)
    } else {
      throw new Error(errors.detail || "Failed to update email account");
    }
  }
}
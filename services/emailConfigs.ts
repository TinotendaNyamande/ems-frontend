import { BASE_URL } from "./helper";

export enum EmailType {
  Gmail = 1,
  Outlook = 2,
  Office365 = 3,
}

export type EmailConfigDto = {
  id?: string;
  emailAddress?: string;
  emailType?: EmailType | number | string;
  password?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  tenantId?: string | null;
  organisationId?: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  isValidated?: boolean;
};

export type CreateEmailConfigPayload = {
  emailAddress: string;
  emailType: EmailType;
  password?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  tenantId?: string | null;
  organisationId: string;
};

export type TestEmailConfigPayload = {
  toEmail: string;
};


export async function getEmailConfigs(
  organisationId: string,
  token: string | null
): Promise<EmailConfigDto[]> {


  const response = await fetch(
    `${BASE_URL}/emailconfiguration/organisation/${organisationId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
if(!response.ok) {
  const data = await response.json();
  throw new Error(data.detail || "Failed to fetch email configurations.");
}
  return await response.json();
}

export async function createEmailConfig(
  payload: CreateEmailConfigPayload,
  token: string
): Promise<EmailConfigDto> {
  const response = await fetch(`${BASE_URL}/emailconfiguration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

export async function testEmailConfig(
  id: string,
  payload: TestEmailConfigPayload,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailconfiguration/${id}/test-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to send test email");
  }
}

export async function validateEmailConfig(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailconfiguration/${id}/validate-email`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  
  });
  const data = await response.json();
  return data;
}
export async function deleteEmailConfig(id: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailconfiguration/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to update email configuration");
  }
}

export async function updateEmailConfig(
  id: string,
  payload: Partial<CreateEmailConfigPayload>,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/emailconfiguration/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to delete email configuration");
  }
}

export async function getEmailConfigById(id: string, token: string): Promise<EmailConfigDto> {
  const response = await fetch(`${BASE_URL}/emailconfiguration/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  
  });
  const data = await response.json();
  return data;
}

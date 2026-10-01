import { BASE_URL } from "./helper";

export type TaskDto = {
    id: string;
    fromEmail?: string;
    subject?: string;
    assignedToUserId?: string;
    assignedToUserFirstName?: string;
    assignedToUserLastName?: string;
    status: string;
    category?: string;
    createdAt: string;

};
export type TaskAttachmentsDto = {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
};
export type TaskDetailsDto = {
    id: string;
    fromEmail?: string;
    subject?: string;
    emailBody?: string;
    emailAccountAddress?: string;
    assignedToUserId?: string;
    assignedToUserFirstName?: string;
    assignedToUserLastName?: string;
    createdAt: string;
    updatedAt?: string;
    assignedToUserDate?: string;
    closedDate?: string;
    status: string;
    additionalInformation?: string;
    category?: string;
    attachments?: TaskAttachmentsDto[];
};
export type TaskAuditTrailDto = {
    id: string;
    userName: string;
    comment: string;
    createdAt: string;
    emailTaskId: string;
};
export type SLADto = {
    id: string;
    startTime: Date;
    endTime?: Date;
    comments: string;
    status: string;
    userName: string;
}
export enum TaskStatusList {
    Assigned = "Assigned",
    Hold = "Hold",
    Escalated = "Escalated",
    Closed = "Closed",
}

export const parseUtc = (value?: string | Date | null): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    let s = String(value).trim();
    // If it already has a timezone (Z or ±hh:mm), leave it alone.
    const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
    if (!hasTz) {
        // Replace space with "T" if needed, then append Z
        s = s.replace(" ", "T") + "Z";
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

export const GetAllTasks = async (): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/all-tasks`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};
export const GetOpenTasks = async (): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/all-tasks/open`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};
export const GetTasksByUser = async (userId: string | undefined): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/by-user/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};
export const GetOpenTasksByUser = async (userId: string): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/by-user/${userId}/open`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};

export const GetTaskById = async (taskId: string): Promise<TaskDetailsDto> => {
    const response = await fetch(`${BASE_URL}/emailtasks/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch task");
        }
    }
    const data = await response.json();
    return data;
};

export const addTaskNotes = async (taskId: string, notes: string, userId: string | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/add-notes/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalInfo: notes, id: taskId, userId }),
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to add task notes");
        }
    }
};


export const closeTask = async (taskId: string, notes: string, userId: string | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/close-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalInfo: notes, id: taskId, userId }),
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to add task notes");
        }
    }

};

export const reassignedTask = async (taskId: string, newUserId: string, userId: string | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/reassign-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUserId: newUserId, id: taskId, userId }),
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to reassign task");
        }
    }

};

export const deleteTask = async (taskId: string, userId: string | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/${taskId}/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to delete task");
        }
    }

};
export const changeTaskStatus = async (taskId: string, userId: string | undefined, newStatus: string, additionalInformation?: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/update-status/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus: newStatus, userId, additionalInformation: additionalInformation, id: taskId }),
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to reassign task");
        }
    }

};

export const ReOpenTask = async (taskId: string, userId: string | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/reopen-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, userId }),
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        } else {
            throw new Error(errors.detail || "Failed to reopen task");
        }
    }

};

export const UserTasksSummary = async (userId: string | null | undefined) => {
    const response = await fetch(`${BASE_URL}/emailtasks/summary/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to reopen task");
        }
    }
    let data = await response.json();
    return data;

};

export const GetSLAForTask = async (taskId: string): Promise<SLADto[]> => {
    const response = await fetch(`${BASE_URL}/SLATracking/emailtask/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};

export const GetAuditTrailForTask = async (taskId: string): Promise<TaskAuditTrailDto[]> => {
    const response = await fetch(`${BASE_URL}/TaskAudit/by-task/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
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
            throw new Error(errors.detail || "Failed to fetch tasks");
        }
    }
    const data = await response.json();
    return data;
};
export const getAttachment = async (attachmentId: string): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/attachments/${attachmentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errors = await response.json();
        if (errors.errors) {
            const message = Object.values(errors.errors)
                .flat()
                .join(", ");
            throw new Error(message)
        }
        else {
            throw new Error(errors.detail || "Failed to download attachment");
        }
    }
    const blob = await response.blob();
    return blob;
}



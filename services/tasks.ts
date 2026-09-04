import { BASE_URL } from "./helper";

export type TaskDto = {
    id: string;
    fromEmail?: string;
    subject?: string;
    emailBody?: string;
    emailAccountAddress?: string;
    assignedToUser?: string;
    assignedToUserFirstName?: string;
    assignedToUserLastName?: string;
    createdAt: string;
    updatedAt?: string;
    assignedToUserDate?: string;
    closedDate?: string;
    status: string;
    additionalInformation?: string;
    category?: string;
};

export const GetTasksByOrganisation = async (organisationId: string, status: string | null): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/by-organisation/${organisationId}?status=${status}`, {
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

export const GetTasksByUser = async (userId: string, status: string | null): Promise<TaskDto[]> => {
    const response = await fetch(`${BASE_URL}/emailtasks/by-user/${userId}?status=${status}`, {
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

export const GetTaskById = async (taskId: string): Promise<TaskDto> => {
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

export const addTaskNotes = async (taskId: string, notes: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/add-notes/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalInfo: notes, id: taskId }),
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


export const closeTask = async (taskId: string, notes: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/close-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalInfo: notes, id: taskId }),
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

export const reassignedTask = async (taskId: string, newUserId: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/reassign-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUserId: newUserId, id: taskId }),
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

export const deleteTask = async (taskId: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/${taskId}`, {
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
export const changeTaskStatus = async (taskId: string, newStatus: string, additionalInformation?: string,organisationId?:string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/update-status/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus: newStatus, additionalInformation: additionalInformation, id: taskId,organisationId:organisationId }),
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

export const ReOpenTask = async (taskId: string) => {
    const response = await fetch(`${BASE_URL}/emailtasks/reopen-task/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: taskId }),
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

export const UserTasksSummary = async (userId: string|null|undefined) => {
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

